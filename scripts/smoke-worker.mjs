import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { preview } from 'vite'

// These requests must finish before opening a database connection.
process.env.CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE = `postgres://smoke:${randomUUID()}@127.0.0.1:1/taskflow_smoke`
const host = '127.0.0.1'
const server = await preview({ preview: { host, port: 4187, strictPort: true } })
const origin = `http://${host}:4187`

try {
  const health = await fetch(origin + '/api/v1/health')
  assert.equal(health.status, 200)
  assert.deepEqual(await health.json(), { data: { status: 'ok' } })
  assert.equal(health.headers.get('cache-control'), 'no-store')

  const id = '10000000-0000-4000-8000-000000000001'
  for (const [method, path] of [
    ['GET', '/tasks'], ['GET', '/tasks/stats'], ['GET', '/tasks/' + id],
    ['POST', '/tasks'], ['PATCH', '/tasks/reorder'],
    ['PATCH', '/tasks/' + id], ['DELETE', '/tasks/' + id],
    ['POST', '/profile'], ['PUT', '/profile'],
  ]) {
    const response = await fetch(origin + '/api/v1' + path, { method, redirect: 'manual' })
    assert.equal(response.status, 401, method + ' ' + path)
    assert.equal(response.headers.get('www-authenticate'), 'Bearer')
    assert.equal((await response.json()).error.code, 'UNAUTHENTICATED')
  }

  for (const path of ['/api', '/api/v1/unknown']) {
    const response = await fetch(origin + path)
    assert.equal(response.status, 404)
    assert.equal((await response.json()).error.code, 'NOT_FOUND')
  }

  for (const path of ['/', '/dashboard', '/tasks', '/board', '/calendar', '/profile', '/sign-in', '/sign-up', '/forgot-password', '/reset-password', '/sso-callback']) {
    const response = await fetch(origin + path, { headers: { Accept: 'text/html' } })
    assert.equal(response.status, 200, path)
    assert.match(response.headers.get('content-type') ?? '', /text\/html/)
    assert.match(await response.text(), /<div id="root">/)
  }

  console.log('Workerd preview passed: health, protected task and profile operations, API 404s, and SPA deep links.')
} finally {
  await server.close()
}
