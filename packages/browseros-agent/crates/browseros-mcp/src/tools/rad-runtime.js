// BrowserRAD's deterministic helpers. Every primitive still crosses the guarded SDK.
// No planner, provider, network service, cross-call page cache, or automatic write retry.
;(() => {
  const requireString = (v, name, max = 2048) => {
    if (typeof v !== 'string' || !v.trim() || v.length > max)
      throw new Error(`${name}: expected nonempty string <= ${max} characters`)
    return v
  }
  const originOf = (url) =>
    String(url)
      .match(/^https?:\/\/[^/?#]+/i)?.[0]
      .toLowerCase()
  const condition = (c) => {
    if (!c || !['text', 'selector'].includes(c.kind))
      throw new Error('condition: expected text or selector')
    requireString(c.value, 'condition.value')
    return c
  }
  const wait = async (page, c) => {
    const result =
      c.kind === 'text'
        ? await page.waitForText(c.value, { timeout: 3000 })
        : await page.waitForSelector(c.value, { timeout: 3000 })
    if (!result.matched) throw new Error(`condition not met: ${c.kind}`)
  }
  globalThis.__browserradMethods = (page) => {
    if (!globalThis.__browserosFeatures?.browserrad)
      throw new Error('BrowserRAD fast path is disabled')
    return {
      // One fresh acquisition answers several questions. Refs are never reused across calls.
      async evidence({
        queries,
        over = 'snapshot',
        selector,
        limit = 8,
        maxChars = 6000,
      } = {}) {
        if (!Array.isArray(queries) || queries.length < 1 || queries.length > 8)
          throw new Error('evidence: 1..8 queries required')
        if (!['snapshot', 'content'].includes(over))
          throw new Error('evidence: over must be snapshot or content')
        if (selector !== undefined && over !== 'content')
          throw new Error(
            'evidence: selector only scopes content, not accessibility capture',
          )
        if (!Number.isInteger(limit) || limit < 1 || limit > 50)
          throw new Error('evidence: limit must be 1..50')
        if (!Number.isInteger(maxChars) || maxChars < 256 || maxChars > 16000)
          throw new Error('evidence: maxChars must be 256..16000')
        for (const q of queries) requireString(q, 'query', 256)
        if (selector !== undefined) requireString(selector, 'selector')
        const capture =
          over === 'snapshot'
            ? await page.snapshot()
            : { text: await page.read(selector), partial: null }
        const lines = capture.text.split('\n')
        return {
          untrusted: true,
          coverage: over === 'snapshot' ? 'accessibility' : 'content-subtree',
          partial: capture.partial,
          frameErrors: capture.frameErrors,
          results: queries.map((query) => {
            const matching = lines.filter((line) =>
              line.toLowerCase().includes(query.toLowerCase()),
            )
            // Divide the text budget fairly so a broad first query cannot starve later ones.
            let remaining = Math.floor(maxChars / queries.length)
            const selected = []
            let clipped = false
            for (const line of matching.slice(0, limit)) {
              if (remaining === 0) break
              const excerpt = line.slice(0, Math.min(1000, remaining))
              selected.push(excerpt)
              remaining -= excerpt.length
              clipped ||= excerpt.length < line.length
            }
            return {
              query,
              count: matching.length,
              truncated: clipped || selected.length < matching.length,
              lines: selected,
            }
          }),
        }
      },
      // Replay a caller-owned procedure against fresh targets. Never retry a possible write.
      async executePlan(plan) {
        if (
          !plan ||
          !/^https?:\/\/[a-z0-9.-]+(?::[0-9]{1,5})?$/i.test(plan.origin || '')
        )
          throw new Error('plan: explicit http(s) origin required')
        if (
          !Array.isArray(plan.steps) ||
          plan.steps.length < 1 ||
          plan.steps.length > 8
        )
          throw new Error('plan: 1..8 steps required')
        condition(plan.expect)
        for (const step of plan.steps) {
          if (
            !['click', 'fill', 'selectOption', 'read', 'wait'].includes(
              step.kind,
            )
          )
            throw new Error('plan: unsupported step kind')
          if (step.kind === 'wait') condition(step.expect)
          else if (step.kind === 'read') {
            if (step.selector !== undefined)
              requireString(step.selector, 'selector')
          } else {
            requireString(step.target?.role, 'target.role', 80)
            requireString(step.target?.name, 'target.name', 256)
            if (step.kind !== 'click') requireString(step.value, 'value', 4096)
            // Callers describe authorized actions; this flag is not a permission grant.
            if (step.authorized !== true)
              throw new Error(
                'plan: action must be explicitly authorized by caller',
              )
          }
          if (step.expect) condition(step.expect)
        }
        let completed = 0,
          actionMayHaveOccurred = false
        const evidence = []
        const checkOrigin = async () => {
          if (originOf((await page.info()).url) !== plan.origin.toLowerCase())
            throw new Error('origin changed; stop and re-plan')
        }
        try {
          for (const step of plan.steps) {
            actionMayHaveOccurred = false
            await checkOrigin()
            if (step.kind === 'wait') await wait(page, step.expect)
            else if (step.kind === 'read') {
              const text = await page.read(step.selector)
              evidence.push({
                untrusted: true,
                text: text.slice(0, 2000),
                truncated: text.length > 2000,
              })
            } else {
              const snapshot = await page.snapshot()
              if (snapshot.partial)
                throw new Error(
                  'partial capture; resolve missing frames before acting',
                )
              if (originOf(snapshot.url) !== plan.origin.toLowerCase())
                throw new Error('origin changed during capture')
              const matches = snapshot.refs.filter(
                (ref) =>
                  ref.role === step.target.role &&
                  ref.name === step.target.name,
              )
              if (matches.length !== 1)
                throw new Error(
                  `target match count ${matches.length}; re-observe or request planner/vision help`,
                )
              actionMayHaveOccurred = true
              const result = await page[step.kind](matches[0].ref, step.value)
              if (result?.dialogOpen || result?.fileChooserOpen)
                throw new Error(
                  'dialog or file chooser requires caller handling',
                )
              if (step.expect) await wait(page, step.expect)
            }
            await checkOrigin()
            completed += 1
          }
          await wait(page, plan.expect)
          await checkOrigin()
          return {
            status: 'verified',
            completed,
            evidence,
            verification:
              'caller-specified page condition; independent task verification still required',
          }
        } catch (error) {
          return {
            status: actionMayHaveOccurred ? 'uncertain' : 'stopped',
            completed,
            actionMayHaveOccurred,
            reason: String(error),
            evidence,
            retry: false,
          }
        }
      },
      // Uses the live browser context: no cookie export and no additional browser session.
      // Opt-in because page-world fetch is observable by the page and GET is not a safety proof.
      async fetchRead({ url, origin, authorized = false } = {}) {
        if (!authorized)
          throw new Error(
            'fetchRead requires explicit authorization for this URL',
          )
        requireString(url, 'url')
        requireString(origin, 'origin')
        return page.evaluateInPage(
          async ({ url, origin }) => {
            if (location.origin !== origin) throw new Error('origin changed')
            const target = new URL(url, location.href)
            if (
              target.origin !== origin ||
              !['http:', 'https:'].includes(target.protocol) ||
              target.username ||
              target.password
            )
              throw new Error('same-origin URL required')
            const controller = new AbortController()
            const deadline = setTimeout(() => controller.abort(), 5000)
            try {
              const response = await fetch(target.href, {
                method: 'GET',
                credentials: 'same-origin',
                redirect: 'error',
                cache: 'no-store',
                signal: controller.signal,
              })
              const reader = response.body?.getReader()
              if (!reader) throw new Error('no response body')
              const decoder = new TextDecoder()
              let text = '',
                bytes = 0,
                truncated = false
              try {
                for (;;) {
                  const chunk = await reader.read()
                  if (chunk.done) break
                  const remaining = 65536 - bytes
                  const accepted = chunk.value.subarray(0, remaining)
                  bytes += accepted.byteLength
                  text += decoder.decode(accepted, { stream: true })
                  if (accepted.byteLength < chunk.value.byteLength) {
                    truncated = true
                    break
                  }
                }
                text += decoder.decode()
              } finally {
                await reader.cancel()
              }
              return {
                untrusted: true,
                status: response.status,
                url: response.url,
                contentType: response.headers.get('content-type'),
                text,
                truncated,
                rendered: false,
              }
            } finally {
              clearTimeout(deadline)
            }
          },
          { url, origin },
        )
      },
      // Current WebMCP API only; feature detection never changes browser flags.
      async siteTools({ origin } = {}) {
        requireString(origin, 'origin')
        return page.evaluateInPage(
          async ({ origin }) => {
            if (location.origin !== origin) throw new Error('origin changed')
            const api = document.modelContext
            if (typeof api?.getTools !== 'function')
              return { supported: false, tools: [] }
            const all = await api.getTools()
            const tools = all.filter(
              (t) => t.origin === origin && t.window === window,
            )
            return {
              supported: true,
              untrusted: true,
              truncated: tools.length > 20,
              tools: tools.slice(0, 20).map((t) => ({
                name: t.name,
                description: t.description,
                inputSchema: t.inputSchema,
                annotations: t.annotations,
                origin: t.origin,
              })),
            }
          },
          { origin },
        )
      },
      async callSiteTool({
        origin,
        name,
        args = {},
        authorized = false,
        expect,
      } = {}) {
        if (!authorized)
          throw new Error(
            'callSiteTool requires caller authorization; site annotations do not grant it',
          )
        requireString(origin, 'origin')
        requireString(name, 'name', 256)
        condition(expect)
        let result
        try {
          result = await page.evaluateInPage(
            async ({ origin, name, args }) => {
              if (location.origin !== origin) throw new Error('origin changed')
              const api = document.modelContext
              if (
                typeof api?.getTools !== 'function' ||
                typeof api.executeTool !== 'function'
              )
                return { status: 'unsupported', invoked: false }
              const tools = (await api.getTools()).filter(
                (t) =>
                  t.origin === origin && t.window === window && t.name === name,
              )
              if (tools.length !== 1)
                return { status: 'missing-or-ambiguous', invoked: false }
              const controller = new AbortController()
              const deadline = setTimeout(() => controller.abort(), 5000)
              try {
                return {
                  status: 'returned',
                  invoked: true,
                  untrusted: true,
                  result: await api.executeTool(tools[0], args, {
                    signal: controller.signal,
                  }),
                }
              } finally {
                clearTimeout(deadline)
              }
            },
            { origin, name, args },
            { timeout: 6000 },
          )
          if (result.value?.invoked === false)
            return { status: 'stopped', result, retry: false }
          if (result.value?.invoked !== true)
            return { status: 'uncertain', result, retry: false }
          // Evaluation result is deliberately returned intact, preserving its trust envelope.
          await wait(page, expect)
          if (originOf((await page.info()).url) !== origin)
            throw new Error('origin changed')
          return {
            status: 'condition-matched',
            result,
            independentVerificationRequired: true,
          }
        } catch (error) {
          return {
            status: 'uncertain',
            reason: String(error),
            result,
            retry: false,
          }
        }
      },
    }
  }
})()
