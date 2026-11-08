/**
 * @license
 * Copyright 2026 BrowserOS
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { describe, expect, it } from 'bun:test'
import type { CockpitStats } from '@browseros/claw-api'
import { renderToStaticMarkup } from 'react-dom/server'
import { SavingsCard } from './SavingsCard'

const period = {
  browserClawTokenEstimate: 100,
  screenshotFirstTokenEstimate: 400,
  rawTokenSavingsEstimate: 300,
  humanTimeSavedMs: 60_000,
  sessionCount: 2,
  toolCallCount: 4,
}
const stats: CockpitStats = {
  hasMeasuredStats: true,
  allTime: period,
  last30Days: period,
  last7Days: period,
}
function text(value: CockpitStats) {
  return renderToStaticMarkup(<SavingsCard stats={value} />)
    .replace(/<!-- -->/g, '')
    .replace(/<[^>]+>/g, ' ')
}
describe('SavingsCard evidence labels', () => {
  it('labels modeled savings and missing Neo calibration honestly', () => {
    const markup = renderToStaticMarkup(<SavingsCard stats={stats} />)
    expect(markup).toContain('role="img"')
    expect(markup).toContain('width:75%')
    const output = text(stats)
    expect(output).toContain('Human hours saved')
    expect(output).toContain('0 tasks logged')
    expect(output).toContain('browser work')
    expect(output).toContain('estimated tokens avoided')
    expect(output).toContain('75.0% fewer')
    expect(output).toContain('BrowserOS Neo baseline:')
    expect(output).toContain('not calibrated')
    expect(output).not.toContain('would have used')
    expect(renderToStaticMarkup(<SavingsCard stats={stats} />)).toContain(
      'href="#/savings"',
    )
  })
  it('keeps regressions and unknowns visible', () => {
    expect(
      text({ ...stats, allTime: { ...period, browserClawTokenEstimate: 500 } }),
    ).toContain('25.0% more')
    expect(text({ ...stats, hasMeasuredStats: false })).toContain(
      'Usage not yet measured',
    )
  })
})
