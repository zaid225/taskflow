import { and, asc, desc, eq, ilike, or, sql } from 'drizzle-orm'
import type { CreateTask, ReorderTask, TaskQuery, TaskStats, TaskStatus, UpdateTask } from '../../shared/schemas/tasks'
import type { TaskTransaction } from '../db/authenticated-transaction'
import { tasks } from '../db/schema'
import { RequestError, taskNotFound } from '../lib/api-error'

export type TaskRow = typeof tasks.$inferSelect

const sortColumns = {
  position: tasks.position,
  createdAt: tasks.createdAt,
  updatedAt: tasks.updatedAt,
  dueDate: tasks.dueDate,
  priority: tasks.priority,
  title: tasks.title,
}

export function createTaskRepository(tx: TaskTransaction, userId: string) {
  const owner = eq(tasks.userId, userId)
  const ownedId = (id: string) => and(owner, eq(tasks.id, id))
  const orderedBoard = [asc(tasks.status), asc(tasks.position), asc(tasks.id)]

  function lockOwnerWrites() {
    // Serialize ordering and CRUD for this owner, even across Worker instances.
    return tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${userId}, 0))`)
  }

  async function nextPosition(status: TaskStatus) {
    const [last] = await tx.select({ position: tasks.position }).from(tasks)
      .where(and(owner, eq(tasks.status, status))).orderBy(desc(tasks.position)).limit(1)
    return last ? last.position + 1 : 0
  }

  return {
    list(query: TaskQuery) {
      const needle = query.search?.replace(/[\\%_]/g, '\\$&')
      const direction = query.direction === 'desc' ? desc : asc
      const sorted = direction(sortColumns[query.sort])
      return tx.select().from(tasks)
        .where(and(
          owner,
          query.status ? eq(tasks.status, query.status) : undefined,
          query.priority ? eq(tasks.priority, query.priority) : undefined,
          needle ? or(ilike(tasks.title, `%${needle}%`), ilike(tasks.description, `%${needle}%`)) : undefined,
        ))
        .orderBy(
          ...(query.sort === 'position' ? [asc(tasks.status)] : []),
          sql`${sorted} nulls last`,
          asc(tasks.id),
        )
    },

    async stats(): Promise<TaskStats> {
      const [result] = await tx.select({
        total: sql<number>`count(*)`.mapWith(Number),
        inProgress: sql<number>`count(*) filter (where ${tasks.status} = 'in_progress')`.mapWith(Number),
        completed: sql<number>`count(*) filter (where ${tasks.status} = 'done')`.mapWith(Number),
        highPriority: sql<number>`count(*) filter (where ${tasks.priority} = 'high')`.mapWith(Number),
      }).from(tasks).where(owner)
      return result
    },

    async find(id: string) {
      const [task] = await tx.select().from(tasks).where(ownedId(id)).limit(1)
      return task
    },

    async create(input: CreateTask) {
      await lockOwnerWrites()
      const status = input.status ?? 'todo'
      const [task] = await tx.insert(tasks).values({
        ...input, userId, status,
        position: await nextPosition(status),
        completedAt: status === 'done' ? new Date() : null,
      }).returning()
      return task
    },

    async update(id: string, input: UpdateTask) {
      await lockOwnerWrites()
      const [current] = await tx.select().from(tasks).where(ownedId(id)).limit(1)
      if (!current) return undefined
      const now = new Date()
      const statusChange = input.status && input.status !== current.status ? {
        position: await nextPosition(input.status),
        completedAt: input.status === 'done' ? now : null,
      } : {}
      const [task] = await tx.update(tasks).set({ ...input, ...statusChange, updatedAt: now })
        .where(ownedId(id)).returning()
      return task
    },

    async remove(id: string) {
      await lockOwnerWrites()
      const [task] = await tx.delete(tasks).where(ownedId(id)).returning({ id: tasks.id })
      return Boolean(task)
    },

    async reorder(input: ReorderTask) {
      await lockOwnerWrites()
      const board = await tx.select().from(tasks).where(owner).orderBy(...orderedBoard)
      const moved = board.find((task) => task.id === input.id)
      if (!moved) throw taskNotFound()

      const target = board.filter((task) => task.status === input.status && task.id !== moved.id)
      if (input.position > target.length) {
        throw new RequestError(400, 'INVALID_POSITION', 'Position is outside the destination column.')
      }
      target.splice(input.position, 0, moved)

      const now = new Date()
      async function writeColumn(column: TaskRow[], status: TaskStatus) {
        for (const [position, task] of column.entries()) {
          if (task.position === position && task.status === status) continue
          await tx.update(tasks).set({
            status, position, updatedAt: now,
            completedAt: status === 'done' ? task.completedAt ?? now : null,
          }).where(ownedId(task.id))
        }
      }
      await writeColumn(target, input.status)
      if (moved.status !== input.status) {
        const source = board.filter((task) => task.status === moved.status && task.id !== moved.id)
        await writeColumn(source, moved.status)
      }
      return tx.select().from(tasks).where(owner).orderBy(...orderedBoard)
    },
  }
}

export type TaskRepository = ReturnType<typeof createTaskRepository>
