import { expect, it } from 'vitest'
import type { Task } from '../../../../shared/schemas/tasks'
import { planTaskMove, previewTaskMove } from './task-order'

const first: Task = {
  id: 'a', title: 'First', status: 'todo', priority: 'low', position: 6, description: null,
  dueDate: null, completedAt: null, createdAt: '', updatedAt: '',
}
const second: Task = { ...first, id: 'b', title: 'Second', position: 20 }
const third: Task = { ...first, id: 'c', title: 'Third', status: 'in_progress', position: 2 }
const board = [first, second, third]

it('maps a same-column drag to a zero-based destination index even with stored position gaps', () => {
  const move = planTaskMove(board, 'b', 'todo', 0)
  expect(move).toEqual({ id: 'b', status: 'todo', position: 0 })
  if (!move) throw new Error('Missing move')
  expect(previewTaskMove(board, move).map(({ id, position }) => [id, position]))
    .toEqual([['b', 0], ['a', 1], ['c', 2]])
})

it('moves to an empty column and preserves the original snapshot for rollback', () => {
  const move = planTaskMove(board, 'a', 'done', 0)
  if (!move) throw new Error('Missing move')
  expect(previewTaskMove(board, move).map(({ id, status, position }) => [id, status, position]))
    .toEqual([['b', 'todo', 0], ['c', 'in_progress', 2], ['a', 'done', 0]])
  expect(first).toMatchObject({ status: 'todo', position: 6 })
})

it('ignores no-ops, missing task IDs and invalid indices', () => {
  expect(planTaskMove(board, 'a', 'todo', 0)).toBeNull()
  expect(planTaskMove(board, 'unknown', 'done', 0)).toBeNull()
  expect(planTaskMove(board, 'a', 'done', 1)).toBeNull()
  expect(planTaskMove(board, 'a', 'todo', -1)).toBeNull()
})
