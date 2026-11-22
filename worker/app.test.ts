import { drizzle } from 'drizzle-orm/node-postgres'
import type { ApiError, ApiSuccess, Task, TaskStats } from '../shared/schemas/tasks'
import type { Client } from 'pg'
import { describe, expect, it, vi } from 'vitest'
import { createApp } from './app'
import type { TaskRow } from './repositories/task-repository'
import { withClerkTransaction } from './db/authenticated-transaction'

const firstId = '10000000-0000-4000-8000-000000000001'
const secondId = '10000000-0000-4000-8000-000000000002'
const owner = 'user_example_alice'
const otherOwner = 'user_example_bob'
const timestamp = '2026-11-22T00:00:00Z'

type QueryStep = {
  sql: RegExp
  params?: unknown[]
  rows?: unknown[][]
  fail?: boolean
  errorCode?: string
}

function row(id = firstId, status: TaskRow['status'] = 'todo', position = 0) {
  return [id, owner, 'Sample task', null, status, 'medium', null, position, timestamp, timestamp,
    status === 'done' ? timestamp : null]
}

const begin = { sql: /^begin$/i }
const identity = (userId = owner) => ({ sql: /^select set_config\('taskflow\.clerk_user_id', \$1, true\)$/, params: [userId] })
const lock = { sql: /pg_advisory_xact_lock/, params: [owner] }
const commit = { sql: /^commit$/i }
const rollback = { sql: /^rollback$/i }

function setup(steps: QueryStep[] = [], verifiedIdentity: string | null = owner, sessions?: Record<string, string>) {
  let inTransaction = false
  let transactionIdentity: unknown
  const query = vi.fn(async ({ text }: { text: string }, params: unknown[]) => {
    const step = steps.shift()
    expect(step, 'unexpected SQL: ' + text).toBeDefined()
    if (!step) throw new Error('Unexpected SQL')
    expect(text).toMatch(step.sql)
    if (step.params) expect(params).toEqual(step.params)
    if (text === 'begin') {
      expect(inTransaction).toBe(false)
      expect(transactionIdentity).toBeUndefined()
      inTransaction = true
    } else if (text === 'commit' || text === 'rollback') {
      expect(inTransaction).toBe(true)
      inTransaction = false
      transactionIdentity = undefined
    } else if (identity().sql.test(text)) {
      expect(inTransaction).toBe(true)
      expect(transactionIdentity).toBeUndefined()
      if (!step.fail) transactionIdentity = params[0]
    } else {
      expect(inTransaction).toBe(true)
      expect(transactionIdentity).toBeDefined()
      expect(params).toContain(transactionIdentity)
    }
    if (step.errorCode) throw Object.assign(new Error('Simulated database error'), { code: step.errorCode })
    if (step.fail) throw new Error('simulated database failure with sensitive details')
    return { rows: step.rows ?? [] }
  })
  const db = drizzle({ client: { query } as unknown as Client })
  const close = vi.fn(async () => {})
  const app = createApp({
    // An explicit test-only identity. The real middleware is exercised separately below.
    authenticate: async (c, next) => {
      const userId = sessions
        ? sessions[c.req.header('Authorization') ?? '']
        : verifiedIdentity === null ? null : c.req.header('X-Test-Owner') ?? verifiedIdentity
      if (userId) c.set('userId', userId)
      await next()
    },
    connect: () => ({ db, close }),
  })
  return { app, db, query, close, complete: () => {
    expect(steps).toHaveLength(0)
    expect(inTransaction).toBe(false)
    expect(transactionIdentity).toBeUndefined()
  } }
}

function readResponse<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>
}

function json(method: string, body: unknown, extraHeaders: Record<string, string> = {}) {
  return { method, headers: { 'Content-Type': 'application/json', ...extraHeaders }, body: JSON.stringify(body) }
}

describe('TaskFlow API', () => {
  it('exposes public health and rejects unauthenticated task requests', async () => {
    const app = createApp()
    expect(await (await app.request('/api/v1/health')).json()).toEqual({ data: { status: 'ok' } })
    for (const path of ['/api/v1/tasks', '/api/v1/tasks/stats', '/api/v1/tasks/' + firstId]) {
      const response = await app.request(path)
      expect(response.status).toBe(401)
      expect(response.headers.get('WWW-Authenticate')).toBe('Bearer')
      expect((await readResponse<ApiError>(response)).error.code).toBe('UNAUTHENTICATED')
    }
    expect((await app.request('/api/v1/tasks/reorder', { method: 'PATCH' })).status).toBe(401)
    expect((await app.request('/api/v1/unknown')).status).toBe(404)
  })

  it('denies a request if authentication does not provide a verified identity', async () => {
    const { app, query, close } = setup([], null)
    const response = await app.request('/api/v1/tasks', {
      headers: { Authorization: 'Bearer fake-session', 'X-Test-Owner': owner },
    })
    expect(response.status).toBe(401)
    expect(query).not.toHaveBeenCalled()
    expect(close).not.toHaveBeenCalled()
  })

  it('refuses to begin a transaction with an absent or empty identity', () => {
    const { db, query } = setup()
    const action = vi.fn(async () => [])
    for (const invalid of [undefined, '', ' ']) {
      expect(() => withClerkTransaction(db, invalid, action)).toThrow('Sign in to access your tasks.')
    }
    expect(query).not.toHaveBeenCalled()
    expect(action).not.toHaveBeenCalled()
  })

  it('rolls back and never queries tasks if establishing transaction identity fails', async () => {
    const { app, complete, close } = setup([begin, { ...identity(), fail: true }, rollback])
    const logger = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const result = await app.request('/api/v1/tasks')
      expect(result.status).toBe(500)
      expect((await readResponse<ApiError>(result)).error.code).toBe('INTERNAL_ERROR')
      expect(close).toHaveBeenCalledOnce()
      complete()
    } finally {
      logger.mockRestore()
    }
  })

  it('starts each request with its own bound identity on a reused mock connection', async () => {
    const read = { sql: /where .*"user_id" = \$1 order by/, params: [owner], rows: [row()] }
    const { app, complete } = setup([
      begin, identity(), read, commit,
      begin, identity(otherOwner), { ...read, params: [otherOwner], rows: [] }, commit,
      begin, identity(), read, commit,
    ])
    for (const [id, count] of [[owner, 1], [otherOwner, 0], [owner, 1]] as const) {
      const response = await app.request('/api/v1/tasks', { headers: { 'X-Test-Owner': id } })
      expect(response.status).toBe(200)
      expect((await readResponse<ApiSuccess<Task[]>>(response)).data).toHaveLength(count)
    }
    complete()
  })

  it('rejects invalid IDs, bodies, media types and filters before calling the database', async () => {
    const { app, query } = setup()
    const path = '/api/v1/tasks'
    for (const [suffix, options] of [
      ['/bad-id', undefined],
      ['?direction=random', undefined],
      ['?status=todo&status=done', undefined],
      ['', json('POST', { title: '   ' })],
      ['', json('POST', { title: 'Task', user_id: otherOwner })],
      ['', json('POST', { title: 'Task', dueDate: '2026-02-30' })],
      ['/' + firstId, json('PATCH', {})],
      ['/reorder', json('PATCH', { id: firstId, status: 'done', position: -1 })],
    ] as const) {
      const response = await app.request(path + suffix, options)
      expect(response.status).toBe(400)
      expect((await readResponse<ApiError>(response)).error.code).toBe('INVALID_INPUT')
    }
    expect((await app.request(path, { method: 'POST', body: 'text' })).status).toBe(415)
    expect((await app.request(path, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{',
    })).status).toBe(400)
    expect((await app.request(path, json('POST', { title: 'x'.repeat(33_000) }))).status).toBe(413)
    expect(query).not.toHaveBeenCalled()
  })

  it('queries by owner and keeps search data in bound parameters', async () => {
    const { app, complete } = setup([begin, identity(), {
      sql: /where .*"user_id" = \$1.*ilike .*order by .*"due_date" desc nulls last/,
      params: [owner, 'done', 'high', '%50\\%%', '%50\\%%'],
      rows: [row(firstId, 'done')],
    }, commit])
    const response = await app.request('/api/v1/tasks?status=done&priority=high&search=50%25&sort=dueDate&direction=desc')
    expect(response.status).toBe(200)
    expect((await readResponse<ApiSuccess<Task[]>>(response)).data[0]).toMatchObject({ id: firstId, status: 'done' })
    complete()
  })

  it('creates, reads, updates, counts and deletes an owned task', async () => {
    const { app, complete } = setup([
      begin, identity(), lock,
      { sql: /^select "position".*"user_id".*"status".*limit/, params: [owner, 'todo', 1] },
      { sql: /^insert into "tasks"/, params: [owner, 'Sample task', 'todo', 0, null], rows: [row()] }, commit,
      begin, identity(),
      { sql: /where .*"user_id" = \$1.*"id" = \$2/, params: [owner, firstId, 1], rows: [row()] }, commit,
      begin, identity(), lock,
      { sql: /where .*"user_id" = \$1.*"id" = \$2/, params: [owner, firstId, 1], rows: [row()] },
      { sql: /^select "position".*"user_id".*"status".*limit/, params: [owner, 'done', 1] },
      { sql: /^update "tasks" set .*"completed_at".*where .*"user_id"/, params: ['done', 0, expect.any(String), expect.any(String), owner, firstId], rows: [row(firstId, 'done')] },
      commit,
      begin, identity(), { sql: /^select count.*where .*"user_id"/, params: [owner], rows: [['1', '0', '1', '0']] }, commit,
      begin, identity(), lock,
      { sql: /^delete.*"user_id".*"id"/, params: [owner, firstId], rows: [[firstId]] },
      commit,
    ])
    const path = '/api/v1/tasks'
    const created = await app.request(path, json('POST', { title: ' Sample task ' }))
    expect(created.status).toBe(201)
    expect(created.headers.get('location')).toBe(path + '/' + firstId)
    expect((await readResponse<ApiSuccess<Task>>(created)).data).not.toHaveProperty('userId')
    const read = await app.request(path + '/' + firstId)
    expect(read.status).toBe(200)
    const updated = await app.request(path + '/' + firstId, json('PATCH', { status: 'done' }))
    expect(updated.status).toBe(200)
    expect((await readResponse<ApiSuccess<Task>>(updated)).data.completedAt).toBe('2026-11-22T00:00:00.000Z')
    expect((await readResponse<ApiSuccess<TaskStats>>(await app.request(path + '/stats'))).data)
      .toEqual({ total: 1, inProgress: 0, completed: 1, highPriority: 0 })
    const deleted = await app.request(path + '/' + firstId, { method: 'DELETE' })
    expect(deleted.status).toBe(204)
    expect(await deleted.text()).toBe('')
    complete()
  })

  it('returns the same 404 for missing or foreign tasks on read, update, delete and reorder', async () => {
    const otherLock = { ...lock, params: [otherOwner] }
    const { app, complete } = setup([
      begin, identity(), { sql: /where .*"user_id".*"id"/, params: [owner, secondId, 1] }, rollback,
      begin, identity(otherOwner), { sql: /where .*"user_id".*"id"/, params: [otherOwner, firstId, 1] }, rollback,
      begin, identity(otherOwner), otherLock,
      { sql: /where .*"user_id".*"id"/, params: [otherOwner, firstId, 1] }, rollback,
      begin, identity(otherOwner), otherLock,
      { sql: /^delete.*"user_id".*"id"/, params: [otherOwner, firstId] }, rollback,
      begin, identity(otherOwner), otherLock,
      { sql: /where .*"user_id" = \$1 order by/, params: [otherOwner] }, rollback,
    ])
    const headers = { 'X-Test-Owner': otherOwner }
    const path = '/api/v1/tasks'
    for (const response of [
      await app.request(path + '/' + secondId),
      await app.request(path + '/' + firstId, { headers }),
      await app.request(path + '/' + firstId, json('PATCH', { title: 'Denied' }, headers)),
      await app.request(path + '/' + firstId, { method: 'DELETE', headers }),
      await app.request(path + '/reorder', json('PATCH', { id: firstId, status: 'done', position: 0 }, headers)),
    ]) {
      expect(response.status).toBe(404)
      expect(await response.json()).toEqual({ error: { code: 'TASK_NOT_FOUND', message: 'Task not found.' } })
    }
    complete()
  })

  it('reorders both columns in a transaction and returns the authoritative board', async () => {
    const { app, complete } = setup([
      begin, identity(), lock,
      { sql: /where .*"user_id" = \$1 order by/, params: [owner], rows: [row(), row(secondId, 'todo', 1)] },
      { sql: /^update.*"user_id".*"id"/, params: ['done', 0, expect.any(String), expect.any(String), owner, firstId] },
      { sql: /^update.*"user_id".*"id"/, params: ['todo', 0, expect.any(String), null, owner, secondId] },
      { sql: /where .*"user_id" = \$1 order by/, params: [owner], rows: [row(secondId), row(firstId, 'done')] },
      commit,
    ])
    const response = await app.request('/api/v1/tasks/reorder', json('PATCH', { id: firstId, status: 'done', position: 0 }))
    expect(response.status).toBe(200)
    expect((await readResponse<ApiSuccess<Task[]>>(response)).data.map((task) => [task.id, task.status, task.position]))
      .toEqual([[secondId, 'todo', 0], [firstId, 'done', 0]])
    complete()
  })

  it('rejects an out-of-range reorder before writing', async () => {
    const { app, complete } = setup([
      begin, identity(), lock, { sql: /^select/, params: [owner], rows: [row()] }, rollback,
    ])
    const response = await app.request('/api/v1/tasks/reorder', json('PATCH', { id: firstId, status: 'done', position: 1 }))
    expect(response.status).toBe(400)
    expect((await readResponse<ApiError>(response)).error.code).toBe('INVALID_POSITION')
    complete()
  })

  it('issues rollback after a mid-reorder write fails and hides internal details', async () => {
    const { app, complete } = setup([
      begin, identity(), lock, { sql: /^select/, params: [owner], rows: [row(), row(secondId, 'todo', 1)] },
      { sql: /^update/, params: ['done', 0, expect.any(String), expect.any(String), owner, firstId] },
      { sql: /^update/, params: ['todo', 0, expect.any(String), null, owner, secondId], fail: true }, rollback,
    ])
    const logger = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const response = await app.request('/api/v1/tasks/reorder', json('PATCH', { id: firstId, status: 'done', position: 0 }))
      expect(response.status).toBe(500)
      expect((await readResponse<ApiError>(response)).error).toEqual({ code: 'INTERNAL_ERROR', message: 'The request could not be completed.' })
      expect(logger).toHaveBeenCalledWith('TaskFlow API request failed unexpectedly.')
      complete()
    } finally {
      logger.mockRestore()
    }
  })
})

describe('Profile API', () => {
  it('rejects signed-out requests and rejects client-supplied ownership', async () => {
    const app = createApp()
    for (const method of ['POST', 'PUT']) {
      expect((await app.request('/api/v1/profile', { method })).status).toBe(401)
    }
    const authenticated = setup()
    const response = await authenticated.app.request('/api/v1/profile', json('PUT', {
      userId: otherOwner,
      displayName: 'Example',
    }))
    expect(response.status).toBe(400)
    expect(authenticated.query).not.toHaveBeenCalled()
  })

  it('initializes and saves profiles within the verified owner’s transaction', async () => {
    const { app, complete } = setup([
      begin, identity(),
      { sql: /insert into "user_profiles".*on conflict do nothing/, params: [owner] },
      { sql: /select .* from "user_profiles" where/, params: [owner], rows: [[null]] },
      commit,
      begin, identity(),
      { sql: /insert into "user_profiles".*on conflict .* do update/, params: [owner, 'Sample name', 'Sample name'], rows: [['Sample name']] },
      commit,
    ])
    const initialized = await app.request('/api/v1/profile', { method: 'POST' })
    expect(initialized.status).toBe(200)
    expect(await initialized.json()).toEqual({ data: { displayName: null } })
    const saved = await app.request('/api/v1/profile', json('PUT', { displayName: ' Sample name ' }))
    expect(saved.status).toBe(200)
    expect(await saved.json()).toEqual({ data: { displayName: 'Sample name' } })
    complete()
  })
})

describe('Profile ownership and validation', () => {
  const path = '/api/v1/profile'
  const initialize = (userId: string, displayName: string | null): QueryStep[] => [
    begin, identity(userId),
    { sql: /insert into "user_profiles".*on conflict do nothing/, params: [userId] },
    { sql: /select .* from "user_profiles" where "user_profiles"."user_id" = /, params: [userId], rows: [[displayName]] },
    commit,
  ]
  const save = (userId: string, displayName: string): QueryStep[] => [
    begin, identity(userId),
    { sql: /on conflict \("user_id"\) do update set "display_name" = /, params: [userId, displayName, displayName], rows: [[displayName]] },
    commit,
  ]

  it('can save before initialization and reads the same owner profile across distinct sessions', async () => {
    const { app, complete } = setup([
      ...save(owner, 'Alice'),
      ...initialize(owner, 'Alice'),
      ...initialize(owner, 'Alice'),
      ...initialize(otherOwner, null),
      ...save(otherOwner, 'Bob'),
      ...initialize(owner, 'Alice'),
    ], null, { 'Bearer original-session': owner, 'Bearer new-session': owner, 'Bearer other-session': otherOwner })
    const request = (session: string, name?: string) => {
      const headers = { Authorization: 'Bearer ' + session }
      return app.request(path, name === undefined ? { method: 'POST', headers } : json('PUT', { displayName: name }, headers))
    }
    for (const [session, name, expected] of [
      ['original-session', 'Alice', 'Alice'],
      ['original-session', undefined, 'Alice'],
      ['new-session', undefined, 'Alice'],
      ['other-session', undefined, null],
      ['other-session', 'Bob', 'Bob'],
      ['new-session', undefined, 'Alice'],
    ] as const) {
      const response = await request(session, name)
      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ data: { displayName: expected } })
    }
    complete()
  })

  it('rejects missing verified identity and invalid display names before any SQL', async () => {
    const unverified = setup([], null)
    expect((await unverified.app.request(path, { method: 'POST' })).status).toBe(401)
    expect((await unverified.app.request(path, json('PUT', { displayName: 'Valid' }))).status).toBe(401)
    expect(unverified.query).not.toHaveBeenCalled()

    const { app, query } = setup()
    for (const body of [{}, { displayName: '   ' }, { displayName: 'x'.repeat(81) }, { displayName: 23 }]) {
      expect((await app.request(path, json('PUT', body))).status).toBe(400)
    }
    expect(query).not.toHaveBeenCalled()
  })

  it('keeps task fetching independent of a failing profile transaction', async () => {
    const { app, complete } = setup([
      begin, identity(), { sql: /insert into "user_profiles"/, params: [owner], errorCode: '42P01' }, rollback,
      begin, identity(), { sql: /select .* from "tasks" where/, params: [owner] }, commit,
    ])
    const profile = await app.request(path, { method: 'POST' })
    expect(profile.status).toBe(503)
    expect((await readResponse<ApiError>(profile)).error.code).toBe('PROFILE_UNAVAILABLE')
    const tasks = await app.request('/api/v1/tasks')
    expect(tasks.status).toBe(200)
    expect(await tasks.json()).toEqual({ data: [] })
    complete()
  })
})
