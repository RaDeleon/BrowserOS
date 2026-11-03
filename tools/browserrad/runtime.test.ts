import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
const source = readFileSync(new URL('../../packages/browseros-agent/crates/browseros-mcp/src/tools/rad-runtime.js', import.meta.url), 'utf8')
const factory = new Function(`globalThis.__browserosFeatures = {browserrad: true}; ${source}; return globalThis.__browserradMethods`)()
function fixture() {
  let captures = 0, clicks = 0, text = 'not saved', origin = 'https://example.com'
  const refs = [{ role: 'textbox', name: 'Name', ref: 'e1' }, { role: 'button', name: 'Save', ref: 'e2' }]
  const page: any = {
    info: async () => ({ url: origin + '/form' }),
    snapshot: async () => { captures++; return { text: 'Name\nSave\nstatus: saved', refs: refs.map(r => ({...r, ref: r.ref + captures})), partial: false, url: origin + '/form' } },
    read: async () => text,
    fill: async (ref: string, value: string) => { expect(ref).toBe('e1' + captures); text = value },
    click: async (ref: string) => { expect(ref).toBe('e2' + captures); clicks++; text = 'saved' },
    waitForText: async (value: string) => ({ matched: text === value }),
    waitForSelector: async () => ({ matched: true }),
  }
  return { page, api: factory(page), refs, counts: () => ({ captures, clicks }), setOrigin: (value: string) => origin = value }
}
const plan = () => ({ origin: 'https://example.com', steps: [
  { kind: 'fill', target: { role: 'textbox', name: 'Name' }, value: 'RAD', authorized: true },
  { kind: 'click', target: { role: 'button', name: 'Save' }, authorized: true, expect: { kind: 'text', value: 'saved' } },
], expect: { kind: 'text', value: 'saved' } })
describe('BrowserRAD guarded deterministic helpers', () => {
  test('several evidence queries acquire only once', async () => {
    const f = fixture(); const result = await f.api.evidence({ queries: ['Name', 'Save', 'missing'] })
    expect(f.counts().captures).toBe(1); expect(result.results.map((x: any) => x.count)).toEqual([1, 2, 0]); expect(result.untrusted).toBe(true)
  })
  test('partial capture is reported, never called complete', async () => {
    const f = fixture(); f.page.snapshot = async () => ({ text: '', refs: [], partial: true, frameErrors: ['unavailable'] })
    expect((await f.api.evidence({ queries: ['missing'] })).partial).toBe(true)
    expect((await f.api.executePlan(plan())).status).toBe('stopped'); expect(f.counts().clicks).toBe(0)
  })
  test('content scope does not claim frame completeness', async () => {
    const f = fixture(); const r = await f.api.evidence({ queries: ['saved'], over: 'content', selector: '#result' })
    expect(r.partial).toBeNull(); expect(f.counts().captures).toBe(0)
  })
  test('invalid whole plan fails before any action', async () => {
    const f = fixture(); const p: any = plan(); p.steps.push({ kind: 'unknown' })
    await expect(f.api.executePlan(p)).rejects.toThrow('unsupported'); expect(f.counts().captures).toBe(0)
  })
  test('each action resolves fresh refs, then checks a postcondition', async () => {
    const f = fixture(); expect((await f.api.executePlan(plan())).status).toBe('verified'); expect(f.counts()).toEqual({ captures: 2, clicks: 1 })
  })
  test('duplicate target names stop instead of guessing', async () => {
    const f = fixture(); f.refs.push({ role: 'button', name: 'Save', ref: 'e3' }); const r = await f.api.executePlan(plan())
    expect(r.status).toBe('stopped'); expect(r.completed).toBe(1); expect(f.counts().clicks).toBe(0)
  })
  test('failed postcondition after write returns uncertain and never retries', async () => {
    const f = fixture(); const p = plan(); p.steps[1].expect = { kind: 'text', value: 'wrong' }; const r = await f.api.executePlan(p)
    expect(r.status).toBe('uncertain'); expect(r.actionMayHaveOccurred).toBe(true); expect(r.retry).toBe(false); expect(f.counts().clicks).toBe(1)
  })
  test('unexpected origin stops before acting', async () => {
    const f = fixture(); f.setOrigin('https://other.example'); expect((await f.api.executePlan(plan())).status).toBe('stopped'); expect(f.counts().captures).toBe(0)
  })
  test('origin changing in the capture stops before acting', async () => {
    const f = fixture(); const capture = f.page.snapshot; f.page.snapshot = async () => ({...await capture(), url: 'https://other.example/'})
    expect((await f.api.executePlan(plan())).status).toBe('stopped'); expect(f.counts().clicks).toBe(0)
  })
  test('oversized and unauthorized plans fail before capture', async () => {
    const f = fixture(); const p: any = plan(); p.steps[0].authorized = false
    await expect(f.api.executePlan(p)).rejects.toThrow('authorized'); p.steps = Array(9).fill(p.steps[0]); await expect(f.api.executePlan(p)).rejects.toThrow('1..8')
    expect(f.counts().captures).toBe(0)
  })
  test('no automatic vision or inference on missing targets', async () => {
    const f = fixture(); f.refs.length = 0; const r = await f.api.executePlan(plan()); expect(r.reason).toContain('planner/vision'); expect(r.retry).toBe(false)
  })
  test('read-only fetch and site calls require explicit caller authorization', async () => {
    const f = fixture(); await expect(f.api.fetchRead({url:'/x',origin:'https://example.com'})).rejects.toThrow('authorization'); await expect(f.api.callSiteTool({name:'buy'})).rejects.toThrow('authorization')
  })
})

import { runInNewContext } from 'node:vm'
function pageWorld(extra: Record<string, unknown> = {}) {
  const world: any = { location: { origin: 'https://example.com', href: 'https://example.com/' }, document: {}, window: {}, URL, AbortController, TextDecoder, setTimeout, clearTimeout, ...extra }
  const page: any = {
    evaluateInPage: async (fn: Function, args: unknown) => ({ value: await runInNewContext(`(${fn.toString()})(${JSON.stringify(args)})`, world) }),
    waitForText: async () => ({matched: true}),
    info: async () => ({url: 'https://example.com/'}),
  }
  return { world, page, api: factory(page) }
}
describe('optional browser-context fast paths', () => {
  test('fetch keeps credentials local and rejects redirects at the network API', async () => {
    let calls = 0
    const f = pageWorld({ fetch: async (url: string, options: any) => {
      calls++; expect(url).toBe('https://example.com/data'); expect(options.method).toBe('GET'); expect(options.redirect).toBe('error'); expect(options.credentials).toBe('same-origin'); expect(options.cache).toBe('no-store')
      return new Response('current synthetic content', {headers: {'content-type': 'text/plain'}})
    } })
    const r = await f.api.fetchRead({url:'/data',origin:'https://example.com',authorized:true})
    expect(r.value.text).toBe('current synthetic content'); expect(r.value.rendered).toBe(false); expect(calls).toBe(1)
  })
  test('cross-origin fetch is rejected before network access', async () => {
    let calls = 0; const f = pageWorld({fetch: async () => {calls++; throw new Error('must not fetch')}})
    await expect(f.api.fetchRead({url:'https://other.example/',origin:'https://example.com',authorized:true})).rejects.toThrow('same-origin'); expect(calls).toBe(0)
  })
  test('fetch output is capped and not treated as rendered content', async () => {
    const f = pageWorld({fetch: async () => new Response('x'.repeat(70000))})
    const r = await f.api.fetchRead({url:'/data',origin:'https://example.com',authorized:true})
    expect(r.value.truncated).toBe(true); expect(r.value.text.length).toBeLessThanOrEqual(65536)
  })
  test('unsupported WebMCP does not wait for a misleading pre-existing success condition', async () => {
    const f = pageWorld(); let waits = 0; f.page.waitForText = async () => {waits++; return {matched:true}}
    const r = await f.api.callSiteTool({origin:'https://example.com',name:'test',authorized:true,expect:{kind:'text',value:'done'}})
    expect(r.status).toBe('stopped'); expect(waits).toBe(0)
  })
  test('WebMCP ignores foreign-frame and foreign-origin names', async () => {
    const f = pageWorld(); let invoked = 0
    f.world.document.modelContext = {getTools:async()=>[{name:'test',origin:'https://other.example',window:f.world.window}],executeTool:async()=>{invoked++}}
    const r=await f.api.callSiteTool({origin:'https://example.com',name:'test',authorized:true,expect:{kind:'text',value:'done'}})
    expect(r.status).toBe('stopped');expect(invoked).toBe(0)
  })
  test('site execution failure is uncertain and never retried', async () => {
    const f=pageWorld();let invoked=0
    f.world.document.modelContext={getTools:async()=>[{name:'test',origin:'https://example.com',window:f.world.window}],executeTool:async()=>{invoked++;throw new Error('connection lost after write')}}
    const r=await f.api.callSiteTool({origin:'https://example.com',name:'test',authorized:true,expect:{kind:'text',value:'done'}})
    expect(r.status).toBe('uncertain');expect(r.retry).toBe(false);expect(invoked).toBe(1)
  })
  test('factory refuses stale helper use when fast path is disabled', () => {
    const disabledFactory = new Function('globalThis', `${source}; return globalThis.__browserradMethods`)({__browserosFeatures:{browserrad:false}})
    expect(()=>disabledFactory({})).toThrow('disabled')
  })
})


describe('compact output budgets', () => {
  test('broad queries share a bounded, fair evidence budget', async () => {
    const f = fixture()
    f.page.snapshot = async () => ({text: 'match ' + 'x'.repeat(2000), partial: false})
    const r = await f.api.evidence({queries: Array(8).fill('match')})
    expect(r.results.every((x: any) => x.truncated && x.lines[0].length === 750)).toBe(true)
    expect(r.results.flatMap((x: any) => x.lines).join('').length).toBe(6000)
    await expect(f.api.evidence({queries: ['match'], maxChars: 20000})).rejects.toThrow('maxChars')
  })
  test('oversized fetch preserves its bounded prefix instead of discarding a large chunk', async () => {
    const f = pageWorld({fetch: async () => new Response('prefix-' + 'x'.repeat(70000))})
    const r = await f.api.fetchRead({url:'/data',origin:'https://example.com',authorized:true})
    expect(r.value.truncated).toBe(true)
    expect(r.value.text.startsWith('prefix-')).toBe(true)
    expect(r.value.text.length).toBe(65536)
  })
})
