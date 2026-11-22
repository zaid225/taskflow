import { z } from 'zod'

export const taskStatuses = ['todo', 'in_progress', 'done'] as const
export const taskPriorities = ['low', 'medium', 'high'] as const

export const taskIdSchema = z.uuid().transform((value) => value.toLowerCase())
export const taskStatusSchema = z.enum(taskStatuses)
export const taskPrioritySchema = z.enum(taskPriorities)

const taskFields = z.strictObject({
  title: z.string().trim().min(3, 'Enter at least 3 characters.').max(160),
  description: z.string().max(10_000).nullable(),
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  dueDate: z.iso.date().nullable(),
})

export const createTaskSchema = taskFields.partial().required({ title: true })
export const updateTaskSchema = taskFields.partial().refine(
  (fields) => Object.keys(fields).length > 0,
  { message: 'Provide at least one task field.' },
)
export const taskQuerySchema = z.strictObject({
  search: z.string().trim().min(1).max(160).optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  sort: z.enum(['position', 'createdAt', 'updatedAt', 'dueDate', 'priority', 'title']).default('position'),
  direction: z.enum(['asc', 'desc']).default('asc'),
})
export const reorderTaskSchema = z.strictObject({
  id: taskIdSchema,
  status: taskStatusSchema,
  position: z.int().min(0).max(2_147_483_647),
})

export type CreateTask = z.infer<typeof createTaskSchema>
export type UpdateTask = z.infer<typeof updateTaskSchema>
export type TaskQuery = z.infer<typeof taskQuerySchema>
export type ReorderTask = z.infer<typeof reorderTaskSchema>
export type TaskStatus = z.infer<typeof taskStatusSchema>
export type TaskPriority = z.infer<typeof taskPrioritySchema>

export type Task = {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  dueDate: string | null
  position: number
  createdAt: string
  updatedAt: string
  completedAt: string | null
}

export type TaskStats = {
  total: number
  inProgress: number
  completed: number
  highPriority: number
}

export type ApiSuccess<T> = { data: T }
export type ApiError = {
  error: { code: string; message: string; issues?: { field: string; message: string }[] }
}
