/**
 * @license
 * Copyright 2026 BrowserRAD contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { describe, expect, it } from 'bun:test'
import {
  type HumanTask,
  humanHoursLabel,
  humanTimeForWindow,
  parseHumanTasks,
} from './human-time'

const tasks: HumanTask[] = [
  {
    id: 'today',
    completedDate: '2026-11-05',
    manualMinutes: 90,
    supervisionMinutes: 15,
  },
  {
    id: 'week-ago',
    completedDate: '2026-10-30',
    manualMinutes: 30,
    supervisionMinutes: 5,
  },
  {
    id: 'older',
    completedDate: '2026-10-01',
    manualMinutes: 60,
    supervisionMinutes: 10,
  },
]

describe('self-reported human time', () => {
  it('uses completed tasks and active supervision, with independent period windows', () => {
    const now = new Date(2026, 10, 5, 12)
    expect(humanTimeForWindow(tasks, 'last7Days', now)).toEqual({
      taskCount: 2,
      manualMinutes: 120,
      supervisionMinutes: 20,
      savedMinutes: 100,
    })
    expect(humanTimeForWindow(tasks, 'last30Days', now).taskCount).toBe(2)
    expect(humanTimeForWindow(tasks, 'allTime', now).savedMinutes).toBe(150)
    expect(humanHoursLabel(0, 0)).toBe('—')
    expect(humanHoursLabel(100, 2)).toBe('1.7 hr')
    expect(humanHoursLabel(-30, 1)).toBe('−0.5 hr')
  })

  it('rejects corrupt, impossible and out-of-range local records', () => {
    expect(parseHumanTasks('{bad')).toEqual([])
    expect(
      parseHumanTasks(
        JSON.stringify([
          tasks[0],
          { ...tasks[0], id: 'bad-date', completedDate: '2026-02-31' },
          { ...tasks[0], id: 'bad-minute', manualMinutes: -1 },
          { ...tasks[0], id: 'bad-supervision', supervisionMinutes: '0' },
        ]),
      ),
    ).toEqual([tasks[0]])
  })
})
