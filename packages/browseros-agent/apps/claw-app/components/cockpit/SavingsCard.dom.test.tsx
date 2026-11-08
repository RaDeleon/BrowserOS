/**
 * @license
 * Copyright 2026 BrowserOS
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
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

const { SavingsCard } = await import('./SavingsCard')

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
  last7Days: window(0, 0),
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
  await act(async () => root.render(<SavingsCard stats={stats} />))
})

afterEach(async () => {
  await act(async () => root.unmount())
  for (const [name, descriptor] of globalDescriptors) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor)
    else Reflect.deleteProperty(globalThis, name)
  }
  Reflect.deleteProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT')
})

describe('Savings navigation', () => {
  it('opens the full savings route instead of the old dialog', () => {
    const link = body.querySelector('a[href="#/savings"]')
    expect(link?.textContent).toContain('Details')
    expect(body.querySelector('[role="dialog"]')).toBeNull()
    expect(body.textContent).toContain('BrowserOS Neo baseline:')
  })
})
