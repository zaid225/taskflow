import { sql } from 'drizzle-orm'
import { check, date, index, integer, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { taskPriorities, taskStatuses } from '../../shared/schemas/tasks'

export const taskStatus = pgEnum('task_status', taskStatuses)
export const taskPriority = pgEnum('task_priority', taskPriorities)

export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  title: varchar('title', { length: 160 }).notNull(),
  description: text('description'),
  status: taskStatus('status').default('todo').notNull(),
  priority: taskPriority('priority').default('medium').notNull(),
  dueDate: date('due_date', { mode: 'string' }),
  position: integer('position').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
}, (table) => [
  index('tasks_owner_status_position_idx').on(table.userId, table.status, table.position, table.id),
  index('tasks_owner_updated_idx').on(table.userId, table.updatedAt),
  check('tasks_title_nonblank', sql`length(btrim(${table.title})) > 0`),
  check('tasks_owner_nonblank', sql`length(btrim(${table.userId})) > 0`),
  check('tasks_position_nonnegative', sql`${table.position} >= 0`),
  check('tasks_completed_consistency', sql`(${table.status} = 'done') = (${table.completedAt} IS NOT NULL)`),
]).enableRLS()

export const userProfiles = pgTable('user_profiles', {
  userId: varchar('user_id', { length: 255 }).primaryKey(),
  displayName: varchar('display_name', { length: 80 }),
}, (table) => [
  check('user_profiles_owner_nonblank', sql`length(btrim(${table.userId})) > 0`),
  check('user_profiles_display_name_nonblank', sql`length(btrim(${table.displayName})) > 0`),
]).enableRLS()
