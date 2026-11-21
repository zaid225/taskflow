import { CalendarDays, ListTodo } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { formatDueDate, type PreviewTask } from '../data/preview-tasks'
import { PriorityBadge, StatusBadge } from './task-badges'

export function TaskList({ tasks }: { tasks: readonly PreviewTask[] }) {
  if (!tasks.length) {
    return (
      <Card className="items-center px-5 py-10 text-center">
        <ListTodo className="size-6 text-muted-foreground" aria-hidden="true" />
        <div>
          <p className="font-medium">No tasks yet</p>
          <p className="text-muted-foreground">Tasks will appear here when they’re added.</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="gap-0 py-0">
      <ul className="divide-y divide-border">
        {tasks.map((task) => (
          <li key={task.id} className="grid gap-2 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <span className="font-medium wrap-break-word">{task.title}</span>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="size-3.5" aria-hidden="true" />
                Due <time dateTime={task.dueDate}>{formatDueDate(task.dueDate)}</time>
              </span>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}
