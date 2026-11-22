import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { RequestError } from '../lib/api-error'

export interface WorkerBindings {
  CLERK_PUBLISHABLE_KEY?: string
  CLERK_SECRET_KEY?: string
  CLERK_AUTHORIZED_PARTIES?: string
  HYPERDRIVE?: Hyperdrive
  DATABASE_URL?: string
  APP_ENV?: string
}

export type TaskDatabase = NodePgDatabase<Record<string, never>>

export type DatabaseConnection = { db: TaskDatabase; close: () => Promise<void> }

export function openDatabase(env: WorkerBindings): DatabaseConnection {
  const connectionString = env.HYPERDRIVE?.connectionString ??
    (env.APP_ENV === 'development' ? env.DATABASE_URL : undefined)
  if (!connectionString) {
    throw new RequestError(503, 'DATABASE_UNAVAILABLE', 'The task database is unavailable.')
  }

  let poolUrl = connectionString
  if (!env.HYPERDRIVE) {
    const url = new URL(connectionString)
    if (url.searchParams.get('sslmode') !== 'verify-full') {
      throw new RequestError(503, 'DATABASE_UNAVAILABLE', 'The task database is unavailable.')
    }

    // Local Workerd trusts the CA loaded by the dev command, outside its filesystem.
    url.searchParams.delete('sslrootcert')
    poolUrl = url.href
  }

  // Worker sockets belong to one request. Hyperdrive pools connections upstream.
  const pool = new Pool({ connectionString: poolUrl, max: 1, connectionTimeoutMillis: 5_000 })
  return { db: drizzle(pool), close: () => pool.end() }
}
