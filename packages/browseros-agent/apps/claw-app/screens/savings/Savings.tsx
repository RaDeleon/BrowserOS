/**
 * @license
 * Copyright 2026 BrowserRAD contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { CockpitStats } from '@browseros/claw-api'
import { ArrowDownToLine, ArrowUpRight, RefreshCw } from 'lucide-react'
import { type FormEvent, type ReactNode, useState } from 'react'
import {
  formatTokens,
  SAVINGS_WINDOWS,
  type SavingsWindowKey,
} from '@/components/cockpit/savings.helpers'
import { Page } from '@/components/layout/Page'
import { PageHeader } from '@/components/layout/PageHeader'
import { useSessions } from '@/modules/api/audit.hooks'
import { useCockpitStats } from '@/modules/api/cockpit.hooks'
import {
  addHumanTask,
  type HumanTask,
  humanHoursLabel,
  humanTimeForWindow,
  removeHumanTask,
  todayLocalDate,
  useHumanTasks,
} from './human-time'
import { durationLabel, savingsMetrics } from './savings.model'

const control =
  'rounded-lg border border-border-2 bg-card px-3 py-2 font-medium text-sm text-ink hover:bg-bg-canvas disabled:opacity-50'
const panel = 'rounded-2xl border border-border-2 bg-card p-5 md:p-6'
const tokens = (value: number | null) =>
  value === null ? '—' : formatTokens(value)

export function Savings() {
  const query = useCockpitStats({ refetchInterval: 60_000 })
  return (
    <Page>
      <PageHeader
        title="Your savings"
        back={{ to: '/', label: 'Home' }}
        eyebrow={
          <span className="rounded-full bg-bg-canvas px-3 py-1 font-semibold text-accent-ink text-xs">
            BROWSERRAD · EVIDENCE & EFFICIENCY
          </span>
        }
        lede="See what your browser work costs in tool traffic, where it compares well, and what we still need to measure."
        actions={
          <button
            type="button"
            className={control}
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            <RefreshCw aria-hidden className="mr-2 inline size-4" />
            Refresh
          </button>
        }
      />
      {query.isPending ? <p role="status">Loading your savings…</p> : null}
      {query.isError ? (
        <div role="alert" className={panel}>
          Savings could not be loaded. Your records are still local.{' '}
          <button
            className={control}
            type="button"
            onClick={() => void query.refetch()}
          >
            Try again
          </button>
        </div>
      ) : null}
      {query.data ? <SavingsReport stats={query.data} /> : null}
    </Page>
  )
}

export function SavingsReport({ stats }: { stats: CockpitStats }) {
  const [periodKey, setPeriodKey] = useState<SavingsWindowKey>('allTime')
  const humanTasks = useHumanTasks()
  const human = humanTimeForWindow(humanTasks, periodKey)
  const period = stats[periodKey]
  const metrics = savingsMetrics(stats, period)
  const hasData = stats.hasMeasuredStats && period.sessionCount > 0
  const lower = metrics.delta === null || metrics.delta >= 0
  function exportReport() {
    const report = {
      schema: 1,
      exportedAt: new Date().toISOString(),
      period: periodKey,
      source: 'BrowserRAD cockpit aggregates',
      stats: period,
      derived: metrics,
      humanTime: human,
      neoEstimate: null,
      actualClientTokens: null,
      measuredCostSavings: null,
      limitations: [
        'Screenshot baseline is a model, not measured Claude/Codex usage.',
        'Human time is self-reported for logged completed tasks: estimated manual minutes minus active supervision minutes. Agent runtime is separate.',
        'Recorded duration is browser activity, not verified human time saved. Historical estimators may include idle time.',
        'Sessions are not independently verified tasks. No calibrated Neo estimate is available.',
      ],
    }
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }),
    )
    const a = document.createElement('a')
    a.href = url
    a.download = `browserrad-savings-${periodKey}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <fieldset
          aria-label="Savings period"
          className="flex gap-1 rounded-xl bg-bg-canvas p-1"
        >
          {SAVINGS_WINDOWS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              aria-pressed={key === periodKey}
              onClick={() => setPeriodKey(key)}
              className={`${control} ${key === periodKey ? 'border-primary shadow-sm' : 'border-transparent bg-transparent'}`}
            >
              {label}
            </button>
          ))}
        </fieldset>
        <button type="button" className={control} onClick={exportReport}>
          <ArrowDownToLine aria-hidden className="mr-2 inline size-4" />
          Export summary
        </button>
      </div>
      {!hasData ? (
        <div role="status" className={panel}>
          <h2 className="font-semibold text-lg">Your evidence starts here</h2>
          <p className="mt-2 text-ink-2">
            No measured completed sessions in this period yet. Finish a browser
            session, then refresh. Unknown values stay blank.
          </p>
        </div>
      ) : null}
      <section
        aria-label="Savings overview"
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Metric
          label={lower ? 'Estimated tokens avoided' : 'Estimated extra tokens'}
          value={tokens(
            metrics.delta === null ? null : Math.abs(metrics.delta),
          )}
          note="Compared with the screenshot model"
          accent
        />
        <Metric
          label="Relative tool usage"
          value={
            metrics.percent === null
              ? '—'
              : `${Math.abs(metrics.percent).toFixed(1)}% ${lower ? 'less' : 'more'}`
          }
          note="Reductions and regressions both count"
        />
        <Metric
          label="Tool tokens used"
          value={tokens(metrics.used)}
          note="Estimated input + output payloads"
        />
        <Metric
          label="Human hours saved"
          value={humanHoursLabel(human.savedMinutes, human.taskCount)}
          note={
            human.taskCount === 0
              ? 'Log completed tasks below to calculate this'
              : `Self-reported from ${human.taskCount} completed tasks`
          }
          accent
        />
        <Metric
          label="Browser work recorded"
          value={hasData ? durationLabel(period.humanTimeSavedMs) : '—'}
          note="Browser activity duration, measured separately"
        />
        <Metric
          label="Recorded sessions"
          value={period.sessionCount.toLocaleString()}
          note="A session can contain multiple tasks"
        />
        <Metric
          label="Recorded calls"
          value={period.toolCallCount.toLocaleString()}
          note="Historical versions may include nested calls"
        />
        <Metric
          label="Tokens per session"
          value={tokens(metrics.perSession)}
          note="Estimated tool traffic, period average"
        />
        <Metric
          label="Tokens per recorded call"
          value={tokens(metrics.perCall)}
          note="Diagnostic average, not client billing"
        />
      </section>
      <HumanTimeLog tasks={humanTasks} human={human} />
      <div className="grid gap-5 lg:grid-cols-2">
        <section className={panel} aria-labelledby="comparison-heading">
          <h2
            id="comparison-heading"
            className="font-bold text-cyanotype-ink text-xl"
          >
            Three ways to browse
          </h2>
          <p className="mt-2 mb-6 text-ink-2 text-sm">
            Same units, different evidence. Only BrowserRAD tool traffic is
            observed here.
          </p>
          <ComparisonBar
            label="BrowserRAD"
            value={metrics.used}
            maximum={Math.max(metrics.used ?? 0, metrics.baseline ?? 0)}
            note="Estimated from recorded tool payloads"
          />
          <ComparisonBar
            label="Claude / Codex screenshot model"
            value={metrics.baseline}
            maximum={Math.max(metrics.used ?? 0, metrics.baseline ?? 0)}
            note="Modeled input plus 3,000 visual tokens per recorded call"
          />
          <div
            id="neo"
            className="mt-5 rounded-xl border border-border-2 border-dashed p-4"
          >
            <div className="flex justify-between gap-3">
              <h3 className="font-semibold">BrowserOS Neo</h3>
              <span className="text-ink-3 text-sm">Not calibrated</span>
            </div>
            <p className="mt-2 text-ink-2 text-sm">
              We cannot infer what Neo would have used from BrowserRAD activity
              alone. A screenshot baseline is not a Neo baseline.
            </p>
            <p className="mt-2 text-ink-3 text-xs">
              No Neo token, time, or cost saving is included in these totals.
            </p>
          </div>
        </section>
        <section className={panel} aria-labelledby="confidence-heading">
          <h2
            id="confidence-heading"
            className="font-bold text-cyanotype-ink text-xl"
          >
            How much can you trust it?
          </h2>
          <dl className="mt-5 divide-y divide-border-2 text-sm">
            <Evidence label="Calls and session records" status="Observed">
              Recorded by the browser. Session completion does not independently
              establish task success.
            </Evidence>
            <Evidence
              label="Tool tokens and screenshot savings"
              status="Estimated"
            >
              Payload estimates and a fixed screenshot model. Claude reasoning,
              cached context, images and billing can differ.
            </Evidence>
            <Evidence label="Neo comparison" status="Not calibrated">
              Requires equivalent tasks, the same model and effort, comparable
              browser state, and repeated verified outcomes.
            </Evidence>
            <Evidence label="Human hours saved" status="Self-reported">
              Each logged completed task uses your manual-time estimate minus
              your active supervision time. Unlogged tasks are excluded.
            </Evidence>
            <Evidence label="Actual AI bill" status="Unknown">
              Provider/client usage and cost data are needed. Missing data is
              never counted as zero.
            </Evidence>
          </dl>
        </section>
      </div>
      <section className={panel} aria-labelledby="periods-heading">
        <h2
          id="periods-heading"
          className="font-bold text-cyanotype-ink text-xl"
        >
          Your periods at a glance
        </h2>
        <p className="mt-2 text-ink-2 text-sm">
          Overlapping windows, not a daily trend. Recent sessions may still be
          finalizing.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-ink-3">
              <tr>
                {[
                  'Period',
                  'Sessions',
                  'Tool tokens',
                  'Screenshot model',
                  'Difference',
                ].map((label) => (
                  <th
                    key={label}
                    className="whitespace-nowrap px-3 py-3 font-medium"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SAVINGS_WINDOWS.map(({ key, label }) => {
                const m = savingsMetrics(stats, stats[key])
                return (
                  <tr key={key} className="border-border-2 border-t">
                    <th className="px-3 py-3 font-semibold">{label}</th>
                    <td className="px-3 py-3">
                      {stats[key].sessionCount.toLocaleString()}
                    </td>
                    <td className="px-3 py-3">{tokens(m.used)}</td>
                    <td className="px-3 py-3">{tokens(m.baseline)}</td>
                    <td className="px-3 py-3">
                      {m.delta === null
                        ? '—'
                        : `${formatTokens(Math.abs(m.delta))} ${m.delta >= 0 ? 'fewer' : 'more'}`}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
      <RecentEvidence />
      <section className={panel} aria-labelledby="method-heading">
        <h2
          id="method-heading"
          className="font-bold text-cyanotype-ink text-xl"
        >
          Behind the numbers
        </h2>
        <details className="mt-4 border-border-2 border-b pb-4" open>
          <summary className="cursor-pointer font-semibold">
            How the screenshot comparison works
          </summary>
          <p className="mt-3 text-ink-2 text-sm leading-6">
            The baseline keeps estimated tool input and substitutes 3,000 visual
            tokens per recorded call for tool output. The difference is the
            modeled baseline minus BrowserRAD's estimated input and output. It
            does not prove how many screenshots another agent would take.
            Negative savings are shown as extra tokens.
          </p>
        </details>
        <details className="mt-4 border-border-2 border-b pb-4">
          <summary className="cursor-pointer font-semibold">
            What would make a Neo estimate credible?
          </summary>
          <p className="mt-3 text-ink-2 text-sm leading-6">
            Match tasks, model, effort, profile state and verification. Retain
            failures, recovery and first versus repeat runs. Use at least 30
            observations per comparison group before treating timing
            distributions as meaningful; sample count alone is not a guarantee.
            Any future forecast must apply only to comparable workloads and
            disclose its range and measurement coverage. A single observed ratio
            cannot be applied to your entire history.
          </p>
        </details>
        <details className="mt-4 border-border-2 border-b pb-4">
          <summary className="cursor-pointer font-semibold">
            How human hours saved is calculated
          </summary>
          <p className="mt-3 text-ink-2 text-sm leading-6">
            Log a task only after you confirm it was completed. Enter how many
            minutes you estimate the same task would take you manually and how
            many minutes you actively spent supervising the agent. The
            difference is human time freed. Agent runtime is separate because
            unattended agent work does not consume your active time. This
            self-reported figure is not a measured speed comparison against Neo.
            Tasks without estimates are not counted.
          </p>
        </details>
        <details className="mt-4">
          <summary className="cursor-pointer font-semibold">
            Timing, historical data and privacy
          </summary>
          <p className="mt-3 text-ink-2 text-sm leading-6">
            New estimator version 5 removes the shutdown idle tail and avoids
            counting nested payloads twice. Older stored projections remain
            unchanged, so mixed historical totals need care. Browser activity
            spans include pauses between calls and exclude final-answer
            generation. Export contains aggregate figures only; page contents
            and session titles are omitted. Savings data is stored locally,
            while diagnostics and analytics follow your app settings.
          </p>
        </details>
      </section>
    </>
  )
}

function HumanTimeLog({
  tasks,
  human,
}: {
  tasks: HumanTask[]
  human: ReturnType<typeof humanTimeForWindow>
}) {
  const [date, setDate] = useState(todayLocalDate)
  const [manual, setManual] = useState('')
  const [supervision, setSupervision] = useState('0')
  const [error, setError] = useState('')
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      addHumanTask({
        completedDate: date,
        manualMinutes: Number(manual),
        supervisionMinutes: Number(supervision),
      })
      setManual('')
      setSupervision('0')
      setError('')
    } catch {
      setError('Enter a valid date and minutes between 0 and 1,440.')
    }
  }
  return (
    <section
      className={`${panel} ph-no-capture`}
      aria-labelledby="human-time-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2
            id="human-time-heading"
            className="font-bold text-cyanotype-ink text-xl"
          >
            Human hours saved
          </h2>
          <p className="mt-2 max-w-2xl text-ink-2 text-sm leading-6">
            Log a task after you verify the result. Your estimate of manual work
            minus your active supervision gives the human time freed.
          </p>
        </div>
        <p className="text-right text-ink-2 text-sm">
          <strong className="block text-2xl text-cyanotype-ink">
            {humanHoursLabel(human.savedMinutes, human.taskCount)}
          </strong>
          {human.taskCount} tasks in this period
        </p>
      </div>
      <form onSubmit={submit} className="mt-5 grid gap-3 sm:grid-cols-4">
        <label className="text-ink-2 text-sm">
          Date completed
          <input
            className={`${control} mt-1 w-full`}
            type="date"
            max={todayLocalDate()}
            value={date}
            onChange={(event) => setDate(event.target.value)}
            required
          />
        </label>
        <label className="text-ink-2 text-sm">
          Manual estimate · min
          <input
            className={`${control} mt-1 w-full`}
            type="number"
            min="1"
            max="1440"
            step="1"
            value={manual}
            onChange={(event) => setManual(event.target.value)}
            placeholder="e.g. 45"
            required
          />
        </label>
        <label className="text-ink-2 text-sm">
          Your supervision · min
          <input
            className={`${control} mt-1 w-full`}
            type="number"
            min="0"
            max="1440"
            step="1"
            value={supervision}
            onChange={(event) => setSupervision(event.target.value)}
            required
          />
        </label>
        <button type="submit" className={`${control} self-end`}>
          Log completed task
        </button>
      </form>
      {error ? (
        <p role="alert" className="mt-2 text-red-600 text-sm">
          {error}
        </p>
      ) : null}
      <p className="mt-3 text-ink-3 text-xs">
        Stored locally in this BrowserRAD profile. No task names, sites or page
        contents are saved. Agent runtime and browser work recorded are shown
        separately.
      </p>
      {tasks.length > 0 ? (
        <details className="mt-5 border-border-2 border-t pt-4">
          <summary className="cursor-pointer font-semibold text-sm">
            Review {tasks.length} logged tasks
          </summary>
          <ul className="mt-3 max-h-56 space-y-2 overflow-y-auto text-sm">
            {[...tasks].reverse().map((task) => (
              <li
                key={task.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-bg-canvas px-3 py-2"
              >
                <span>
                  {task.completedDate} · {task.manualMinutes} min manual ·{' '}
                  {task.supervisionMinutes} min supervision
                </span>
                <button
                  type="button"
                  className="font-medium text-primary"
                  aria-label={`Remove task from ${task.completedDate}`}
                  onClick={() => removeHumanTask(task.id)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  )
}

function Metric({
  label,
  value,
  note,
  accent = false,
}: {
  label: string
  value: string
  note: string
  accent?: boolean
}) {
  return (
    <div
      className={`${panel} ${accent ? 'border-primary/40 bg-primary/5' : ''}`}
    >
      <p className="font-medium text-ink-2 text-sm">{label}</p>
      <p className="mt-3 font-extrabold text-3xl text-cyanotype-ink tracking-tight">
        {value}
      </p>
      <p className="mt-3 text-ink-3 text-xs leading-5">{note}</p>
    </div>
  )
}
function ComparisonBar({
  label,
  value,
  maximum,
  note,
}: {
  label: string
  value: number | null
  maximum: number
  note: string
}) {
  return (
    <div className="mt-5">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold">{label}</span>
        <span>{tokens(value)}</span>
      </div>
      <div
        aria-hidden
        className="mt-2 h-2 overflow-hidden rounded-full bg-bg-canvas"
      >
        <div
          className="h-full rounded-full bg-primary"
          style={{
            width: `${value === null || maximum <= 0 ? 0 : Math.min(100, (value / maximum) * 100)}%`,
          }}
        />
      </div>
      <p className="mt-2 text-ink-3 text-xs">{note}</p>
    </div>
  )
}
function Evidence({
  label,
  status,
  children,
}: {
  label: string
  status: string
  children: ReactNode
}) {
  return (
    <div className="py-4">
      <dt className="flex flex-wrap justify-between gap-2 font-semibold">
        {label}
        <span className="rounded-full bg-bg-canvas px-2 py-0.5 text-ink-2 text-xs">
          {status}
        </span>
      </dt>
      <dd className="mt-2 text-ink-2 leading-5">{children}</dd>
    </div>
  )
}
function RecentEvidence() {
  const query = useSessions({ variables: { limit: 10 } })
  const sessions = query.data?.pages.flatMap((page) => page.items) ?? []
  return (
    <section
      className={`${panel} ph-no-capture`}
      aria-labelledby="evidence-heading"
    >
      <div className="flex justify-between gap-3">
        <h2
          id="evidence-heading"
          className="font-bold text-cyanotype-ink text-xl"
        >
          Inspect the evidence
        </h2>
        <a className="text-primary text-sm" href="#/audit">
          Full history <ArrowUpRight aria-hidden className="inline size-4" />
        </a>
      </div>
      <p className="mt-2 text-ink-2 text-sm">
        Recent sessions across all periods. Includes failures and live sessions;
        these rows are not the completed-session aggregate above.
      </p>
      {query.isPending ? (
        <p role="status" className="mt-4">
          Loading activity…
        </p>
      ) : null}
      {query.isError ? (
        <p role="alert" className="mt-4">
          Activity could not be loaded.{' '}
          <button
            type="button"
            className={control}
            onClick={() => void query.refetch()}
          >
            Retry
          </button>
        </p>
      ) : null}
      {!query.isPending && !query.isError && sessions.length === 0 ? (
        <p className="mt-4 text-ink-3">No recorded activity yet.</p>
      ) : null}
      {sessions.length > 0 ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                {[
                  'Session',
                  'Status',
                  'Recorded span',
                  'Est. tool tokens',
                  'Tool errors',
                ].map((label) => (
                  <th
                    key={label}
                    className="whitespace-nowrap px-3 py-3 font-medium text-ink-3"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr
                  key={session.sessionId}
                  className="border-border-2 border-t"
                >
                  <td className="max-w-64 px-3 py-3">
                    <a
                      href={`#/audit/${encodeURIComponent(session.sessionId)}`}
                      className="font-medium text-primary underline-offset-2 hover:underline"
                    >
                      {session.name || session.label || 'Session'}
                    </a>
                  </td>
                  <td className="px-3 py-3">{session.status}</td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {durationLabel(session.durationMs)}
                  </td>
                  <td className="px-3 py-3">
                    {session.tokenUsage
                      ? formatTokens(
                          session.tokenUsage.inputTokenEstimate +
                            session.tokenUsage.outputTokenEstimate,
                        )
                      : 'Unknown'}
                  </td>
                  <td className="px-3 py-3">{session.errorCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      {query.hasNextPage ? (
        <button
          type="button"
          disabled={query.isFetchingNextPage}
          className={`${control} mt-4`}
          onClick={() => void query.fetchNextPage()}
        >
          {query.isFetchingNextPage ? 'Loading…' : 'Load more sessions'}
        </button>
      ) : null}
      <p className="mt-4 text-ink-3 text-xs">
        A successful tool response can still contain an unmatched wait or a
        failed page component. Inspect the session before declaring task
        success.
      </p>
    </section>
  )
}
