import { CalendarDays } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { TaskPriority, TaskStatus } from '../../../../shared/schemas/tasks'
import { statusLabels } from '../data/task-order'

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
})

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <Badge variant={priority === 'high' ? 'secondary' : 'outline'} className="capitalize">
      {priority} priority
    </Badge>
  )
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <Badge variant="outline" className={status === 'in_progress' ? 'bg-accent text-accent-foreground' : undefined}>
      {statusLabels[status]}
    </Badge>
  )
}

export function TaskDueDate({ date }: { date: string | null }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <CalendarDays className="size-3.5" aria-hidden="true" />
      {date ? <>Due <time dateTime={date}>{dateFormatter.format(new Date(date))}</time></> : 'No due date'}
    </span>
  )
}
