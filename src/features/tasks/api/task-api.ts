import {
  createTaskSchema, reorderTaskSchema, updateTaskSchema,
  type ApiError, type ApiSuccess, type CreateTask, type ReorderTask, type Task, type TaskQuery, type TaskStats, type UpdateTask,
} from '../../../../shared/schemas/tasks'

export class TaskApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function messageFor(status: number, body: Partial<ApiError> | null) {
  if (status === 401) return 'Your session has expired. Sign in again and retry.'
  if (status === 403) return 'You do not have access to this task.'
  if (status === 404) return 'This task is no longer available.'
  if (status === 400 && body?.error?.code === 'INVALID_POSITION') return 'The board has changed. Refresh and try the move again.'
  if (status === 400 || status === 415) return 'TaskFlow could not save those fields. Check your entries.'
  if (status === 503) return 'The task service is unavailable. Try again in a moment.'
  return 'TaskFlow could not complete the request. Try again.'
}

export function createTaskApi(getToken: () => Promise<string | null>) {
  async function request<Result>(path: string, options: RequestInit = {}): Promise<Result> {
    const token = await getToken()
    if (!token) throw new TaskApiError(401, messageFor(401, null))
    const headers = new Headers(options.headers)
    headers.set('Authorization', `Bearer ${token}`)
    headers.set('Accept', 'application/json')
    if (options.body) headers.set('Content-Type', 'application/json')
    const response = await fetch('/api/v1/tasks' + path, { ...options, headers })
    if (!response.ok) {
      const error = await response.json().catch(() => null) as Partial<ApiError> | null
      throw new TaskApiError(response.status, messageFor(response.status, error))
    }
    if (response.status === 204) return undefined as Result
    const payload = await response.json() as ApiSuccess<Result>
    if (!payload || !('data' in payload)) throw new TaskApiError(502, 'The task service returned an unexpected response.')
    return payload.data
  }

  const item = (id: string) => '/' + encodeURIComponent(id)
  return {
    list(query: TaskQuery, signal?: AbortSignal) {
      const search = new URLSearchParams()
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) search.set(key, value)
      }
      return request<Task[]>('?' + search, { signal })
    },
    stats: (signal?: AbortSignal) => request<TaskStats>('/stats', { signal }),
    find: (id: string, signal?: AbortSignal) => request<Task>(item(id), { signal }),
    create: (task: CreateTask) => request<Task>('', { method: 'POST', body: JSON.stringify(createTaskSchema.parse(task)) }),
    update: (id: string, task: UpdateTask) => request<Task>(item(id), { method: 'PATCH', body: JSON.stringify(updateTaskSchema.parse(task)) }),
    remove: (id: string) => request<void>(item(id), { method: 'DELETE' }),
    reorder: (move: ReorderTask) => request<Task[]>('/reorder', { method: 'PATCH', body: JSON.stringify(reorderTaskSchema.parse(move)) }),
  }
}

export function taskErrorMessage(error: unknown) {
  return error instanceof TaskApiError ? error.message : 'Unable to reach the task service. Check your connection and try again.'
}
