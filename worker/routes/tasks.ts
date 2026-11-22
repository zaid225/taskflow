import { Hono, type Context } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import type { ZodType } from 'zod'
import {
  createTaskSchema, reorderTaskSchema, taskIdSchema, taskQuerySchema, updateTaskSchema,
} from '../../shared/schemas/tasks'
import type { WorkerBindings } from '../db/client'
import { RequestError, invalidInput, unauthenticated } from '../lib/api-error'
import type { ApiEnv } from '../middleware/clerk-session'
import type { TaskService } from '../services/task-service'

export type WithTasks = <Result>(
  env: WorkerBindings,
  userId: string,
  action: (tasks: TaskService) => Promise<Result>,
) => Promise<Result>

function parse<T>(schema: ZodType<T>, input: unknown) {
  const result = schema.safeParse(input)
  if (!result.success) throw invalidInput(result.error)
  return result.data
}

async function readJson(c: Context<ApiEnv>) {
  if (c.req.header('Content-Type')?.split(';')[0]?.trim().toLowerCase() !== 'application/json') {
    throw new RequestError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Send a JSON request body.')
  }
  try {
    return await c.req.json<unknown>()
  } catch {
    throw new RequestError(400, 'INVALID_JSON', 'The request body is not valid JSON.')
  }
}

export function createTaskRoutes(withTasks: WithTasks) {
  const routes = new Hono<ApiEnv>()
  function useTasks<T>(c: Context<ApiEnv>, action: (tasks: TaskService) => Promise<T>) {
    const userId = c.get('userId')
    if (!userId?.trim()) throw unauthenticated()
    return withTasks(c.env, userId, action)
  }

  routes.use('*', bodyLimit({
    maxSize: 32 * 1024,
    onError: () => { throw new RequestError(413, 'BODY_TOO_LARGE', 'The request body is too large.') },
  }))

  return routes
    .get('/', async (c) => {
      if (Object.values(c.req.queries()).some((values) => values.length > 1)) {
        throw new RequestError(400, 'INVALID_INPUT', 'List filters may only appear once.')
      }
      const query = parse(taskQuerySchema, c.req.query())
      return c.json({ data: await useTasks(c, (tasks) => tasks.list(query)) })
    })
    .get('/stats', async (c) => c.json({ data: await useTasks(c, (tasks) => tasks.stats()) }))
    .post('/', async (c) => {
      const input = parse(createTaskSchema, await readJson(c))
      const task = await useTasks(c, (tasks) => tasks.create(input))
      c.header('Location', `/api/v1/tasks/${task.id}`)
      return c.json({ data: task }, 201)
    })
    .patch('/reorder', async (c) => {
      const input = parse(reorderTaskSchema, await readJson(c))
      return c.json({ data: await useTasks(c, (tasks) => tasks.reorder(input)) })
    })
    .get('/:id', async (c) => {
      const id = parse(taskIdSchema, c.req.param('id'))
      return c.json({ data: await useTasks(c, (tasks) => tasks.find(id)) })
    })
    .patch('/:id', async (c) => {
      const id = parse(taskIdSchema, c.req.param('id'))
      const input = parse(updateTaskSchema, await readJson(c))
      return c.json({ data: await useTasks(c, (tasks) => tasks.update(id, input)) })
    })
    .delete('/:id', async (c) => {
      const id = parse(taskIdSchema, c.req.param('id'))
      await useTasks(c, (tasks) => tasks.remove(id))
      return c.body(null, 204)
    })
}
