/**
 * @license
 * Copyright 2026 BrowserOS
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import type { CockpitStats, CockpitStatsWindow } from '@browseros/claw-api'
import { parseHTML } from 'linkedom'
import { act } from 'react'
import type { Root } from 'react-dom/client'

const globalNames = [
  'window',
  'document',
  'navigator',
  'HTMLElement',
  'Node',
  'Event',
  'requestAnimationFrame',
  'cancelAnimationFrame',
  'ResizeObserver',
  'getComputedStyle',
] as const
const globalDescriptors = new Map(
  globalNames.map((name) => [
    name,
    Object.getOwnPropertyDescriptor(globalThis, name),
  ]),
)

mock.module('@/modules/api/audit.hooks', () => ({
  useSessions: () => ({
    data: { pages: [{ items: [] }] },
    isPending: false,
    isError: false,
  }),
}))
const { SavingsReport } = await import('./Savings')

function window(withNeo: number, withoutNeo: number): CockpitStatsWindow {
  return {
    browserClawTokenEstimate: withNeo,
    screenshotFirstTokenEstimate: withoutNeo,
    rawTokenSavingsEstimate: withoutNeo - withNeo,
    humanTimeSavedMs: 1_029 * 3_600_000,
    sessionCount: 3_576,
    toolCallCount: 183_180,
  }
}

const stats: CockpitStats = {
  hasMeasuredStats: true,
  allTime: window(313_700_000, 569_400_000),
  last30Days: window(31_000_000, 62_000_000),
  last7Days: { ...window(0, 0), sessionCount: 0, toolCallCount: 0 },
}

let root: Root
let body: HTMLElement

function define(name: string, value: unknown) {
  Object.defineProperty(globalThis, name, {
    configurable: true,
    writable: true,
    value,
  })
}

beforeEach(async () => {
  const dom = parseHTML(
    '<!doctype html><html><body><div id="root"></div></body></html>',
  )
  Object.defineProperty(dom.window, 'matchMedia', {
    configurable: true,
    value: () => ({ matches: true }),
  })
  define('window', dom.window)
  define('document', dom.document)
  define('navigator', dom.window.navigator)
  define('HTMLElement', dom.window.HTMLElement)
  define('Node', dom.window.Node)
  define('Event', dom.window.Event)
  define('requestAnimationFrame', (cb: FrameRequestCallback) =>
    setTimeout(() => cb(performance.now()), 16),
  )
  define('cancelAnimationFrame', (id: number) => clearTimeout(id))
  define(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  )
  define('getComputedStyle', () => ({ direction: 'ltr' }))
  define('IS_REACT_ACT_ENVIRONMENT', true)
  body = dom.document.body as unknown as HTMLElement
  const container = dom.document.getElementById(
    'root',
  ) as unknown as HTMLElement
  const { createRoot } = await import('react-dom/client')
  root = createRoot(container)
  await act(async () => root.render(<SavingsReport stats={stats} />))
})

afterEach(async () => {
  await act(async () => root.unmount())
  for (const [name, descriptor] of globalDescriptors) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor)
    else Reflect.deleteProperty(globalThis, name)
  }
  Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT')
})

async function click(label: string) {
  const button = Array.from(body.querySelectorAll('button')).find(
    (node) => node.textContent === label,
  )
  expect(button).toBeDefined()
  await act(async () => button?.click())
}

describe('Savings report controls', () => {
  it('changes period metrics and shows missing evidence without inventing savings', async () => {
    expect(
      body.querySelector('[aria-label="Savings overview"]')?.textContent,
    ).toContain('255.7M')
    await click('30 days')
    expect(
      body.querySelector('[aria-label="Savings overview"]')?.textContent,
    ).toContain('50.0% less')
    await click('7 days')
    expect(body.textContent).toContain('Your evidence starts here')
    expect(
      body.querySelector('[aria-label="Savings overview"]')?.textContent,
    ).not.toContain('100.0%')
    expect(body.textContent).toContain('Not calibrated')
    expect(body.textContent).toContain('No recorded activity yet.')
  })

  it('exports the selected period with unknown baselines and no session records', async () => {
    const original = URL.createObjectURL
    let exported: Blob | undefined
    URL.createObjectURL = (blob: Blob) => {
      exported = blob
      return 'blob:synthetic-savings'
    }
    try {
      await click('30 days')
      await click('Export summary')
      expect(exported).toBeDefined()
      if (!exported) throw new Error('No exported report')
      const report = JSON.parse(await exported.text())
      expect(report.period).toBe('last30Days')
      expect(report.derived.percent).toBe(50)
      expect(report.neoEstimate).toBeNull()
      expect(report.actualClientTokens).toBeNull()
      expect(report.measuredCostSavings).toBeNull()
      expect(report.humanTime.taskCount).toBe(0)
      expect(report.sessions).toBeUndefined()
      expect(report.limitations.length).toBeGreaterThan(0)
    } finally {
      URL.createObjectURL = original
    }
  })
})
