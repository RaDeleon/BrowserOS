/**
 * @license
 * Copyright 2026 BrowserRAD contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { useSyncExternalStore } from 'react'
import type { SavingsWindowKey } from '@/components/cockpit/savings.helpers'

const STORAGE_KEY = 'browserrad-verified-human-time-v1'
const CHANGE_EVENT = 'browserrad-human-time-changed'
const MAX_RECORDS = 1000

export interface HumanTask {
  id: string
  completedDate: string
  manualMinutes: number
  supervisionMinutes: number
}

function validDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
}

function validTask(value: unknown): value is HumanTask {
  if (!value || typeof value !== 'object') return false
  const task = value as Partial<HumanTask>
  return (
    typeof task.id === 'string' &&
    task.id.length > 0 &&
    task.id.length <= 100 &&
    validDate(task.completedDate) &&
    typeof task.manualMinutes === 'number' &&
    Number.isFinite(task.manualMinutes) &&
    task.manualMinutes > 0 &&
    task.manualMinutes <= 1440 &&
    typeof task.supervisionMinutes === 'number' &&
    Number.isFinite(task.supervisionMinutes) &&
    task.supervisionMinutes >= 0 &&
    task.supervisionMinutes <= 1440
  )
}

export function parseHumanTasks(raw: string | null): HumanTask[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(validTask).slice(-MAX_RECORDS)
  } catch {
    return []
  }
}

function readRaw(): string | null {
  try {
    return typeof localStorage === 'undefined'
      ? null
      : localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') return () => {}
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) callback()
  }
  window.addEventListener('storage', onStorage)
  window.addEventListener(CHANGE_EVENT, callback)
  return () => {
    window.removeEventListener('storage', onStorage)
    window.removeEventListener(CHANGE_EVENT, callback)
  }
}

export function useHumanTasks(): HumanTask[] {
  const raw = useSyncExternalStore(subscribe, readRaw, () => null)
  return parseHumanTasks(raw)
}

function writeTasks(tasks: HumanTask[]) {
  if (typeof localStorage === 'undefined')
    throw Error('Local storage unavailable')
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks.slice(-MAX_RECORDS)))
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function addHumanTask(input: Omit<HumanTask, 'id'>): HumanTask {
  const task = {
    ...input,
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
  }
  if (!validTask(task)) throw Error('Enter a valid date and minutes (0–1440)')
  writeTasks([...parseHumanTasks(readRaw()), task])
  return task
}

export function removeHumanTask(id: string) {
  writeTasks(parseHumanTasks(readRaw()).filter((task) => task.id !== id))
}

function localDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function todayLocalDate(): string {
  return localDate(new Date())
}

export function humanTimeForWindow(
  tasks: HumanTask[],
  windowKey: SavingsWindowKey,
  now = new Date(),
) {
  const days =
    windowKey === 'last7Days' ? 7 : windowKey === 'last30Days' ? 30 : null
  const cutoff =
    days === null
      ? null
      : localDate(
          new Date(now.getFullYear(), now.getMonth(), now.getDate() - days + 1),
        )
  const today = localDate(now)
  const included = tasks.filter(
    (task) =>
      task.completedDate <= today &&
      (cutoff === null || task.completedDate >= cutoff),
  )
  return {
    taskCount: included.length,
    manualMinutes: included.reduce((sum, task) => sum + task.manualMinutes, 0),
    supervisionMinutes: included.reduce(
      (sum, task) => sum + task.supervisionMinutes,
      0,
    ),
    savedMinutes: included.reduce(
      (sum, task) => sum + task.manualMinutes - task.supervisionMinutes,
      0,
    ),
  }
}

export function humanHoursLabel(minutes: number, count: number): string {
  if (count === 0) return '—'
  const hours = minutes / 60
  return `${hours < 0 ? '−' : ''}${Math.abs(hours).toFixed(1)} hr`
}
