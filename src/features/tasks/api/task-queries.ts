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

export function useTaskList(query: TaskQuery) {
  const api = useTaskApi()
  return useQuery({ queryKey: taskKeys.list(query), queryFn: ({ signal }) => api.list(query, signal) })
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
