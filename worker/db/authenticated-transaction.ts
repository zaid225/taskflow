import { sql } from 'drizzle-orm'
import type { TaskDatabase } from './client'
import { unauthenticated } from '../lib/api-error'

export type TaskTransaction = Parameters<Parameters<TaskDatabase['transaction']>[0]>[0]

export function withClerkTransaction<Result>(
  db: TaskDatabase,
  userId: string | undefined,
  action: (tx: TaskTransaction) => Promise<Result>,
): Promise<Result> {
  if (!userId?.trim()) throw unauthenticated()

  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('taskflow.clerk_user_id', ${userId}, true)`)
    return action(tx)
  })
}
