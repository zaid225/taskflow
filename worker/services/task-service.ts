import type { CreateTask, ReorderTask, Task, TaskQuery, UpdateTask } from '../../shared/schemas/tasks'
import { taskNotFound } from '../lib/api-error'
import type { TaskRepository, TaskRow } from '../repositories/task-repository'

function serializeTask(row: TaskRow | undefined): Task {
  if (!row) throw taskNotFound()

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    dueDate: row.dueDate,
    position: row.position,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
  }
}

export function createTaskService(repository: TaskRepository) {
  return {
    list: async (query: TaskQuery) => (await repository.list(query)).map(serializeTask),
    stats: () => repository.stats(),
    find: async (id: string) => serializeTask(await repository.find(id)),
    create: async (input: CreateTask) => serializeTask(await repository.create(input)),
    update: async (id: string, input: UpdateTask) => serializeTask(await repository.update(id, input)),
    async remove(id: string) {
      if (!await repository.remove(id)) throw taskNotFound()
    },
    reorder: async (input: ReorderTask) => (await repository.reorder(input)).map(serializeTask),
  }
}

export type TaskService = ReturnType<typeof createTaskService>
