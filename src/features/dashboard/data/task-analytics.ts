import type { Task } from '../../../../shared/schemas/tasks'
import { localDateKey } from '@/features/tasks/data/calendar-dates'

export function taskAnalytics(tasks: readonly Task[], now: Date) {
  const today = localDateKey(now)
  const dayAt = (offset: number) => localDateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset))
  const week = Array.from({ length: 7 }, (_, index) => ({ date: dayAt(index - 6), count: 0 }))
  const counts = new Map(week.map(day => [day.date, day]))
  const nextWeek = dayAt(7)
  const priority = { low: 0, medium: 0, high: 0 }
  const upcoming: (Task & { dueDate: string })[] = []
  let overdue = 0
  let completed = 0
  for (const task of tasks) {
    priority[task.priority]++
    if (task.status === 'done') {
      completed++
      if (task.completedAt) {
        const day = counts.get(localDateKey(new Date(task.completedAt)))
        if (day) day.count++
      }
    } else if (task.dueDate) {
      if (task.dueDate < today) overdue++
      else if (task.dueDate <= nextWeek) upcoming.push({ ...task, dueDate: task.dueDate })
    }
  }
  upcoming.sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  return { week, priority, overdue, upcoming, percentage: tasks.length ? Math.round(completed * 100 / tasks.length) : 0 }
}
