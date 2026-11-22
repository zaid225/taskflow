import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { updateProfileSchema } from '../../shared/schemas/profile'
import { withClerkTransaction } from '../db/authenticated-transaction'
import type { openDatabase, WorkerBindings } from '../db/client'
import { invalidInput, RequestError } from '../lib/api-error'
import type { ApiEnv } from '../middleware/clerk-session'
import { createProfileRepository } from '../repositories/profile-repository'

export function createProfileRoutes(connect: typeof openDatabase) {
  async function withProfile<Result>(env: WorkerBindings, userId: string, action: (repo: ReturnType<typeof createProfileRepository>) => Promise<Result>) {
    const { db, close } = connect(env)
    try {
      return await withClerkTransaction(db, userId, (tx) => action(createProfileRepository(tx, userId)))
    } catch (error) {
      const cause = error instanceof Error && error.cause ? error.cause : error
      if (typeof cause === 'object' && cause !== null && 'code' in cause && cause.code === '42P01') {
        throw new RequestError(503, 'PROFILE_UNAVAILABLE', 'Profile storage is not available yet.')
      }
      throw error
    } finally {
      await close()
    }
  }

  return new Hono<ApiEnv>()
    .post('/', async (c) => c.json({ data: await withProfile(c.env, c.get('userId'), (repo) => repo.initialize()) }))
    .put('/', bodyLimit({
      maxSize: 4096,
      onError: () => { throw new RequestError(413, 'PAYLOAD_TOO_LARGE', 'The profile request is too large.') },
    }), async (c) => {
      if (c.req.header('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
        throw new RequestError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Send a JSON profile.')
      }
      const result = updateProfileSchema.safeParse(await c.req.json().catch(() => undefined))
      if (!result.success) throw invalidInput(result.error)
      return c.json({ data: await withProfile(c.env, c.get('userId'), (repo) => repo.save(result.data)) })
    })
}
