import { expect, it } from 'vitest'
import type { Task } from '../../../../shared/schemas/tasks'
import { parseSavedTaskFilters } from './saved-task-filters'
import { tasksToCsv } from './task-csv'

it('restores valid saved filters while discarding malformed entries', () => {
  expect(parseSavedTaskFilters(JSON.stringify([
    { name: 'Urgent', query: { search: 'a', priority: 'high' } },
    { name: 'Invalid', query: { sort: 'unknown' } },
  ]))).toEqual([{ name: 'Urgent', query: { search: 'a', priority: 'high', sort: 'position', direction: 'asc' } }])
  expect(parseSavedTaskFilters('{')).toEqual([])
})

it('quotes commas, quotes, and newlines and neutralizes spreadsheet formulas', () => {
  const task: Task = {
    id: 'internal-id', title: '  =SUM(1,2)', description: 'notes "here"\nnext line', status: 'todo',
    priority: 'high', position: 0, dueDate: null, createdAt: '2026-11-21T00:00:00Z', updatedAt: '2026-11-21T00:00:00Z', completedAt: null,
  }
  expect(tasksToCsv([task])).toContain('"' + "'  =SUM(1,2)" + '","notes ""here""\nnext line"')
  expect(tasksToCsv([{ ...task, title: '\tcommand' }])).toContain('"' + "'\tcommand" + '"')
  expect(tasksToCsv([task])).not.toContain(task.id)
})
