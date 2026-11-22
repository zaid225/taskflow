import { clerkMiddleware, getAuth } from '@clerk/hono'
import type { MiddlewareHandler } from 'hono'
import type { WorkerBindings } from '../db/client'
import { RequestError, unauthenticated } from '../lib/api-error'

export type ApiEnv = {
  Bindings: WorkerBindings
  Variables: { userId: string }
}

export const requireClerkSession: MiddlewareHandler<ApiEnv> = async (c, next) => {
  if (!/^Bearer\s+\S+$/i.test(c.req.header('Authorization') ?? '')) throw unauthenticated()
  const { CLERK_SECRET_KEY, CLERK_PUBLISHABLE_KEY, CLERK_AUTHORIZED_PARTIES } = c.env
  const authorizedParties = CLERK_AUTHORIZED_PARTIES?.split(',').map((part) => part.trim()).filter(Boolean)
  if (!CLERK_SECRET_KEY || !CLERK_PUBLISHABLE_KEY || !authorizedParties?.length) {
    throw new RequestError(503, 'AUTH_UNAVAILABLE', 'Authentication is unavailable.')
  }

  let verifiedUserId: string | null = null
  await clerkMiddleware({
    secretKey: CLERK_SECRET_KEY,
    publishableKey: CLERK_PUBLISHABLE_KEY,
    authorizedParties,
  })(c, async () => {
    const auth = getAuth(c, { acceptsToken: 'session_token', treatPendingAsSignedOut: true })
    if (auth.isAuthenticated && auth.userId) verifiedUserId = auth.userId
  })
  // The API uses bearer sessions and never forwards Clerk handshake redirects or cookies.
  for (const name of ['Location', 'Set-Cookie', 'X-Clerk-Auth-Reason', 'X-Clerk-Auth-Message', 'X-Clerk-Auth-Status']) {
    c.header(name, undefined)
  }
  if (!verifiedUserId) throw unauthenticated()
  c.set('userId', verifiedUserId)
  await next()
}
