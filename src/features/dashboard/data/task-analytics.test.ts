import { expect, it } from 'vitest'
import type { Task } from '../../../../shared/schemas/tasks'
import { taskAnalytics } from './task-analytics'

const task: Task = {
  id: 'task', title: 'Task', description: null, dueDate: null, status: 'todo', priority: 'medium',
  position: 0, completedAt: null, createdAt: '', updatedAt: '',
}

it('counts real completions, priority, overdue and upcoming tasks including today', () => {
  const now = new Date(2026, 10, 22, 18)
  const result = taskAnalytics([
    { ...task, status: 'done', priority: 'high', dueDate: '2026-11-01', completedAt: new Date(2026, 10, 22, 7).toISOString() },
    { ...task, dueDate: '2026-11-21' },
    { ...task, dueDate: '2026-11-22' },
    { ...task, dueDate: '2026-11-29' },
    { ...task, dueDate: '2026-11-30' },
  ], now)
  expect(result.week.at(-1)).toEqual({ date: '2026-11-22', count: 1 })
  expect(result.priority).toEqual({ high: 1, medium: 4, low: 0 })
  expect(result.overdue).toBe(1)
  expect(result.upcoming.map(t => t.dueDate)).toEqual(['2026-11-22', '2026-11-29'])
  expect(result.percentage).toBe(20)
  expect(taskAnalytics([], now).percentage).toBe(0)
})
