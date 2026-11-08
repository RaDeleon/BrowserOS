/**
 * @license
 * Copyright 2026 BrowserRAD contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { CockpitStats, CockpitStatsWindow } from '@browseros/claw-api'

/** Tool-payload estimates only. Keep negative savings and unknowns visible. */
export function savingsMetrics(
  stats: CockpitStats,
  period: CockpitStatsWindow,
) {
  const measured = stats.hasMeasuredStats && period.sessionCount > 0
  const used = measured ? Math.max(0, period.browserClawTokenEstimate) : null
  const baseline = measured
    ? Math.max(0, period.screenshotFirstTokenEstimate)
    : null
  const delta = used !== null && baseline !== null ? baseline - used : null
  return {
    used,
    baseline,
    delta,
    percent:
      delta !== null && baseline !== null && baseline > 0
        ? (delta / baseline) * 100
        : null,
    perSession:
      used !== null && period.sessionCount > 0
        ? used / period.sessionCount
        : null,
    perCall:
      used !== null && period.toolCallCount > 0
        ? used / period.toolCallCount
        : null,
  }
}

export function durationLabel(ms: number) {
  if (!Number.isFinite(ms) || ms <= 0) return '0 sec'
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)} sec`
  if (ms < 3_600_000) return `${(ms / 60_000).toFixed(1)} min`
  return `${(ms / 3_600_000).toFixed(1)} hr`
}
