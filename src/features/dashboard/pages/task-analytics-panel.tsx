import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Task } from '../../../../shared/schemas/tasks'
import { dateFromKey } from '@/features/tasks/data/calendar-dates'
import { TaskDueDate } from '@/features/tasks/components/task-badges'
import { taskAnalytics } from '../data/task-analytics'

const weekday = new Intl.DateTimeFormat(undefined, { weekday: 'short', timeZone: 'UTC' })

export function TaskAnalyticsPanel({ tasks, onOpen }: { tasks: readonly Task[]; onOpen: (id: string) => void }) {
  const { week, priority, overdue, upcoming, percentage } = taskAnalytics(tasks, new Date())
  const weekTotal = week.reduce((total, day) => total + day.count, 0)
  const peak = Math.max(1, ...week.map(day => day.count))
  if (!tasks.length) return <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">Create a task to see productivity trends.</p>

  return (
    <section aria-label="Productivity analytics" className="grid gap-3 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Completed in the last 7 days</CardTitle></CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{weekTotal}</p>
          <ul className="mt-3 grid grid-cols-7 gap-1">
            {week.map(day => <li key={day.date} className="grid justify-items-center gap-1 text-xs">
              <span className="font-medium tabular-nums">{day.count}</span>
              <meter min={0} max={peak} value={day.count} aria-label={weekday.format(dateFromKey(day.date)) + ' completions'}
                className="h-3 w-full accent-primary" />
              <time dateTime={day.date} className="text-muted-foreground">{weekday.format(dateFromKey(day.date))}</time>
            </li>)}
          </ul>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Task breakdown</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <div><dt className="text-muted-foreground">Completion</dt><dd className="text-xl font-semibold">{percentage}%</dd></div>
            <div><dt className="text-muted-foreground">Overdue</dt><dd className="text-xl font-semibold">{overdue}</dd></div>
            {Object.entries(priority).map(([level, count]) => <div key={level}>
              <dt className="capitalize text-muted-foreground">{level} priority</dt><dd className="font-semibold">{count}</dd>
            </div>)}
          </dl>
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle>Upcoming tasks</CardTitle></CardHeader>
        <CardContent>{upcoming.length ? <ul className="divide-y">
          {upcoming.slice(0, 5).map(task => <li key={task.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
            <button type="button" className="control-focus rounded-sm text-left text-sm font-medium hover:underline" onClick={() => onOpen(task.id)}>{task.title}</button>
            <TaskDueDate date={task.dueDate} />
          </li>)}
        </ul> : <p className="text-sm text-muted-foreground">No open tasks due through the next 7 days.</p>}</CardContent>
      </Card>
    </section>
  )
}
