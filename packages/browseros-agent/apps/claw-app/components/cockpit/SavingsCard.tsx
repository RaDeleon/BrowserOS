/**
 * @license
 * Copyright 2026 BrowserOS
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { CockpitStats } from '@browseros/claw-api'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  humanHoursLabel,
  humanTimeForWindow,
  useHumanTasks,
} from '@/screens/savings/human-time'
import { durationLabel, savingsMetrics } from '@/screens/savings/savings.model'
import { formatTokens } from './savings.helpers'

export function SavingsCard({
  stats,
  className,
}: {
  stats: CockpitStats
  className?: string
}) {
  const period = stats.allTime
  const metrics = savingsMetrics(stats, period)
  const human = humanTimeForWindow(useHumanTasks(), 'allTime')
  return (
    <section
      aria-label="Savings"
      className={cn('flex flex-col gap-3', className)}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-ink-2 text-sm">
          <span>
            <strong className="text-cyanotype-ink text-xl">
              {humanHoursLabel(human.savedMinutes, human.taskCount)}
            </strong>{' '}
            Human hours saved
          </span>
          <span className="border-border-2 sm:border-l sm:pl-5">
            <strong className="text-cyanotype-ink text-xl">
              {durationLabel(period.humanTimeSavedMs)}
            </strong>{' '}
            browser work
          </span>
          <span className="border-border-2 sm:border-l sm:pl-5">
            <strong className="text-cyanotype-ink text-xl">
              {metrics.delta === null
                ? '—'
                : formatTokens(Math.abs(metrics.delta))}
            </strong>{' '}
            estimated tokens{' '}
            {metrics.delta !== null && metrics.delta < 0 ? 'more' : 'avoided'}
            {' · '}
            {metrics.percent !== null ? (
              <span
                className={
                  metrics.percent >= 0
                    ? 'font-semibold text-accent-ink'
                    : 'font-semibold text-ink'
                }
              >
                {Math.abs(metrics.percent).toFixed(1)}%{' '}
                {metrics.percent >= 0 ? 'fewer' : 'more'}
              </span>
            ) : null}
          </span>
        </div>
        <a
          href="#/savings"
          className="inline-flex items-center gap-2 font-semibold text-primary text-sm"
        >
          Details <ArrowRight aria-hidden className="size-4" />
        </a>
      </div>
      <div
        role="img"
        aria-label={
          metrics.percent === null
            ? 'Savings comparison unavailable'
            : `${Math.abs(metrics.percent).toFixed(1)}% ${metrics.percent >= 0 ? 'fewer' : 'more'} estimated tokens versus the screenshot model`
        }
        className="flex h-1.5 w-full gap-0.5 overflow-hidden rounded-sm bg-border-2"
      >
        {metrics.percent !== null && metrics.percent > 0 ? (
          <div
            className="h-full shrink-0 rounded-sm bg-primary"
            style={{ width: `${Math.min(100, metrics.percent)}%` }}
          />
        ) : null}
      </div>
      <div className="flex flex-col gap-2 text-ink-3 text-xs sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <p className="flex shrink-0 flex-wrap gap-x-3 gap-y-1 tabular-nums">
          <span>{human.taskCount.toLocaleString()} tasks logged</span>
          <span aria-hidden>·</span>
          <span>{period.sessionCount.toLocaleString()} sessions</span>
          <span aria-hidden>·</span>
          <span>{period.toolCallCount.toLocaleString()} calls</span>
          <span aria-hidden>·</span>
          <span>
            {metrics.used === null
              ? 'Usage not yet measured'
              : `${formatTokens(metrics.used)} est. tokens used`}
          </span>
        </p>
        <div className="space-y-1 sm:text-right">
          <p>
            Claude / Codex screenshot model:{' '}
            <span className="tabular-nums">
              {metrics.baseline === null
                ? 'not available yet'
                : `${formatTokens(metrics.baseline)} est. tokens`}
            </span>
          </p>
          <p>
            BrowserOS Neo baseline: <span>not calibrated</span>
          </p>
        </div>
      </div>
    </section>
  )
}
