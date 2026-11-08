/**
 * @license
 * Copyright 2026 BrowserRAD contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { describe, expect, it } from 'bun:test'
import type { CockpitStats } from '@browseros/claw-api'
import { durationLabel, savingsMetrics } from './savings.model'

const period = {
  browserClawTokenEstimate: 500,
  screenshotFirstTokenEstimate: 400,
  rawTokenSavingsEstimate: -100,
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
describe('Savings measurement boundaries', () => {
  it('retains negative savings instead of suppressing regressions', () => {
    expect(savingsMetrics(stats, period)).toEqual({
      used: 500,
      baseline: 400,
      delta: -100,
      percent: -25,
      perSession: 250,
      perCall: 125,
    })
  })
  it('distinguishes unknown, unmeasured, empty and zero denominator periods', () => {
    expect(
      savingsMetrics({ ...stats, hasMeasuredStats: false }, period).used,
    ).toBeNull()
    expect(
      savingsMetrics(stats, { ...period, sessionCount: 0 }).used,
    ).toBeNull()
    expect(
      savingsMetrics(stats, { ...period, screenshotFirstTokenEstimate: 0 })
        .percent,
    ).toBeNull()
    expect(
      savingsMetrics(stats, { ...period, toolCallCount: 0 }).perCall,
    ).toBeNull()
    expect(durationLabel(0)).toBe('0 sec')
  })
})
