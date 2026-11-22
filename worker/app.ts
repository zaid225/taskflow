import { Hono, type MiddlewareHandler } from 'hono'
import { withClerkTransaction } from './db/authenticated-transaction'
import { openDatabase } from './db/client'
import { RequestError } from './lib/api-error'
import { requireClerkSession, type ApiEnv } from './middleware/clerk-session'
import { createTaskRepository } from './repositories/task-repository'
import { createProfileRoutes } from './routes/profile'
import { createTaskRoutes, type WithTasks } from './routes/tasks'
import { createTaskService } from './services/task-service'

export function createApp({
  authenticate = requireClerkSession,
  connect = openDatabase,
}: {
  authenticate?: MiddlewareHandler<ApiEnv>
  connect?: typeof openDatabase
} = {}) {
  const withTasks: WithTasks = async (env, userId, action) => {
    const { db, close } = connect(env)
    try {
      return await withClerkTransaction(db, userId, (tx) => action(createTaskService(createTaskRepository(tx, userId))))
    } finally {
      await close()
    }
  }

  const app = new Hono<ApiEnv>()

  app.use('*', async (c, next) => {
    c.header('Cache-Control', 'no-store')
    c.header('X-Content-Type-Options', 'nosniff')
    await next()
  })
  app.onError((error, c) => {
    if (error instanceof RequestError) {
      if (error.status === 401) c.header('WWW-Authenticate', 'Bearer')
      return c.json(error.toJSON(), error.status)
    }
    // Do not log raw database/SDK errors or request details.
    console.error('TaskFlow API request failed unexpectedly.')
    return c.json({ error: { code: 'INTERNAL_ERROR', message: 'The request could not be completed.' } }, 500)
  })
  app.notFound((c) => c.json({ error: { code: 'NOT_FOUND', message: 'Endpoint not found.' } }, 404))

  app.get('/api/v1/health', (c) => c.json({ data: { status: 'ok' } }))
  app.use('/api/v1/tasks/*', authenticate)
  app.use('/api/v1/profile', authenticate)
  app.route('/api/v1/profile', createProfileRoutes(connect))
  return app.route('/api/v1/tasks', createTaskRoutes(withTasks))
}
