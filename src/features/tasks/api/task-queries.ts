import { useAuth } from '@clerk/react'
import { useIsMutating, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { CreateTask, ReorderTask, Task, TaskQuery, UpdateTask } from '../../../../shared/schemas/tasks'
import { previewTaskMove } from '../data/task-order'
import { createTaskApi, taskErrorMessage } from './task-api'

export const boardQuery: TaskQuery = { sort: 'position', direction: 'asc' }
const root = ['tasks'] as const
export const taskKeys = {
  list: (query: TaskQuery) => [...root, 'list', query] as const,
  item: (id: string) => [...root, 'item', id] as const,
  stats: [...root, 'stats'] as const,
  mutation: [...root, 'mutation'] as const,
}

function useTaskApi() {
  const { getToken } = useAuth()
  return createTaskApi(getToken)
}

export function useTaskList(query: TaskQuery, enabled = true) {
  const api = useTaskApi()
  return useQuery({ queryKey: taskKeys.list(query), enabled, queryFn: ({ signal }) => api.list(query, signal) })
}

export function useTaskStats() {
  const api = useTaskApi()
  return useQuery({ queryKey: taskKeys.stats, queryFn: ({ signal }) => api.stats(signal) })
}

export function useTaskDetails(id: string) {
  const api = useTaskApi()
  return useQuery({ queryKey: taskKeys.item(id), queryFn: ({ signal }) => api.find(id, signal) })
}

type TaskCommand =
  | { type: 'create'; task: CreateTask }
  | { type: 'update'; id: string; task: UpdateTask }
  | { type: 'delete'; id: string }
  | { type: 'reorder'; move: ReorderTask }

export function useTaskMutation() {
  const api = useTaskApi()
  const client = useQueryClient()
  const boardKey = taskKeys.list(boardQuery)
  return useMutation({
    mutationKey: taskKeys.mutation,
    mutationFn: async (command: TaskCommand) => {
      switch (command.type) {
        case 'create': return { task: await api.create(command.task), message: 'Task created' }
        case 'update': return { task: await api.update(command.id, command.task), message: 'Task updated' }
        case 'delete': await api.remove(command.id); return { message: 'Task deleted' }
        case 'reorder': return { board: await api.reorder(command.move), message: 'Task moved' }
      }
    },
    onMutate: async (command) => {
      if (command.type !== 'reorder') return
      await client.cancelQueries({ queryKey: boardKey, exact: true })
      const snapshot = client.getQueryData<Task[]>(boardKey)
      if (snapshot) client.setQueryData(boardKey, previewTaskMove(snapshot, command.move))
      return { snapshot }
    },
    onError: (error, command, context) => {
      if (command.type === 'reorder' && context?.snapshot) client.setQueryData(boardKey, context.snapshot)
      toast.error(taskErrorMessage(error))
    },
    onSuccess: ({ task, board, message }, command) => {
      if (board) client.setQueryData(boardKey, board)
      if (task) client.setQueryData(taskKeys.item(task.id), task)
      if (command.type === 'delete') client.removeQueries({ queryKey: taskKeys.item(command.id), exact: true })
      toast.success(message)
    },
    onSettled: (_data, _error, command) => {
      if (_data || command.type === 'reorder') return client.invalidateQueries({ queryKey: root })
    },
  })
}

export function useTaskMutationPending() {
  return useIsMutating({ mutationKey: taskKeys.mutation }) > 0
}

export type BulkTaskAction = { type: 'delete' } | { type: 'update'; task: UpdateTask }

export function useBulkTaskMutation() {
  const { getToken } = useAuth()
  const client = useQueryClient()
  return useMutation({
    mutationKey: taskKeys.mutation,
    mutationFn: async ({ ids, action }: { ids: readonly string[]; action: BulkTaskAction }) => {
      const token = await getToken()
      const api = createTaskApi(async () => token)
      const pending = [...new Set(ids)]
      const succeeded: string[] = []
      const failed: string[] = []
      async function processPending() {
        for (let id = pending.shift(); id; id = pending.shift()) {
          try {
            if (action.type === 'delete') await api.remove(id)
            else await api.update(id, action.task)
            succeeded.push(id)
          } catch {
            failed.push(id)
          }
        }
      }
      await Promise.all(Array.from({ length: Math.min(3, pending.length) }, processPending))
      return { succeeded, failed }
    },
    onSuccess: async ({ succeeded, failed }, { action }) => {
      if (action.type === 'delete') {
        for (const id of succeeded) client.removeQueries({ queryKey: taskKeys.item(id), exact: true })
      }
      await client.invalidateQueries({ queryKey: root })
      const verb = action.type === 'delete' ? 'Deleted' : 'Updated'
      if (failed.length) {
        toast.error(`${verb} ${succeeded.length} of ${succeeded.length + failed.length} tasks. ${failed.length} could not be ${verb.toLowerCase()}.`)
      } else {
        toast.success(`${verb} ${succeeded.length} ${succeeded.length === 1 ? 'task' : 'tasks'}.`)
      }
    },
    onError: (error) => toast.error(taskErrorMessage(error)),
  })
}
