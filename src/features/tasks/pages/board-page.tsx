import { Card, CardContent } from '@/components/ui/card'
import { PriorityBadge } from '../components/task-badges'
import { formatDueDate, previewTasks, taskStatuses } from '../data/preview-tasks'

export function BoardPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Board</h1>
        <p className="text-muted-foreground">Demonstration tasks grouped by status.</p>
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-3">
        {taskStatuses.map((status, index) => {
          const tasks = previewTasks.filter((task) => task.status === status)
          const headingId = `board-column-${index}`

          return (
            <section key={status} aria-labelledby={headingId} className="min-w-0 space-y-4 rounded-xl border bg-muted p-4">
              <div className="flex items-center justify-between gap-2">
                <h2 id={headingId} className="font-semibold">{status}</h2>
                <span className="text-sm tabular-nums text-muted-foreground">{tasks.length}</span>
              </div>
              <ul className="space-y-3">
                {tasks.map((task) => (
                  <li key={task.id}>
                    <Card className="gap-0 py-3">
                      <CardContent className="space-y-3">
                        <h3 className="font-medium wrap-break-word">{task.title}</h3>
                        <div className="flex flex-wrap items-center gap-2">
                          <PriorityBadge priority={task.priority} />
                          <span className="text-xs text-muted-foreground">
                            Due <time dateTime={task.dueDate}>{formatDueDate(task.dueDate)}</time>
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}
