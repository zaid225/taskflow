import { Card } from '@/components/ui/card'
import type { Task } from '../../../../shared/schemas/tasks'
import { PriorityBadge, StatusBadge, TaskDueDate } from './task-badges'

export function TaskList({ tasks, onDetails }: { tasks: readonly Task[]; onDetails: (id: string) => void }) {
  return (
    <Card className="gap-0 py-0">
      <ul className="divide-y divide-border">
        {tasks.map((task) => (
          <li key={task.id} className="grid gap-2 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <button type="button" className="control-focus w-fit max-w-full rounded-sm text-left font-medium wrap-break-word hover:underline" onClick={() => onDetails(task.id)}>
              {task.title}
            </button>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
              <TaskDueDate date={task.dueDate} />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}
