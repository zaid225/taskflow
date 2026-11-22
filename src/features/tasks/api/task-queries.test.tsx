// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import type { ReorderTask, Task } from '../../../../shared/schemas/tasks'
import { boardQuery, taskKeys, useTaskMutation } from './task-queries'

vi.mock('@clerk/react', () => ({ useAuth: () => ({ getToken: async () => 'test-session' }) }))
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('sonner', () => ({ toast }))

const task: Task = {
  id: '6ecb86a5-9bc7-41f8-a3a7-e9c588062faf', title: 'First task', status: 'todo', priority: 'medium',
  position: 0, description: null, dueDate: null, createdAt: '', updatedAt: '', completedAt: null,
}
const move: ReorderTask = { id: task.id, status: 'done', position: 0 }
const key = taskKeys.list(boardQuery)

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

function mount() {
  const client = new QueryClient()
  client.setQueryData(key, [task])
  client.setQueryData(taskKeys.stats, { total: 1, completed: 0 })
  const wrapper = ({ children }: { children: ReactNode }) =>
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  return { client, ...renderHook(useTaskMutation, { wrapper }) }
}

it('sends the existing reorder contract, uses the server board, and invalidates statistics', async () => {
  const saved = { ...task, status: 'done', completedAt: '2026-11-22T00:00:00.000Z' }
  const request = vi.fn().mockResolvedValue(Response.json({ data: [saved] }))
  vi.stubGlobal('fetch', request)
  const { client, result } = mount()
  await act(async () => { await result.current.mutateAsync({ type: 'reorder', move }) })
  expect(request).toHaveBeenCalledWith('/api/v1/tasks/reorder', expect.objectContaining({
    method: 'PATCH', body: JSON.stringify(move),
  }))
  expect(client.getQueryData(key)).toEqual([saved])
  expect(client.getQueryState(taskKeys.stats)?.isInvalidated).toBe(true)
  expect(toast.success).toHaveBeenCalledWith('Task moved')
})

it('shows an optimistic move, restores the snapshot on error, and emits no success toast', async () => {
  let resolveResponse: (response: Response) => void = () => { throw new Error('Request did not start') }
  vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>((resolve) => { resolveResponse = resolve })))
  const { client, result } = mount()
  act(() => { result.current.mutate({ type: 'reorder', move }) })
  await waitFor(() => expect(client.getQueryData(key)).toMatchObject([{ status: 'done' }]))
  await act(async () => { resolveResponse(Response.json({ error: { code: 'INVALID_POSITION' } }, { status: 400 })) })
  await waitFor(() => expect(client.getQueryData(key)).toEqual([task]))
  expect(toast.error).toHaveBeenCalled()
  expect(toast.success).not.toHaveBeenCalled()
})
