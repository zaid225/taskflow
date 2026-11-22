import { DragDropProvider, useDroppable, type DragEndEvent } from '@dnd-kit/react'
import { isSortable, useSortable } from '@dnd-kit/react/sortable'
import { Ellipsis, GripVertical, Plus } from 'lucide-react'
import { DropdownMenu } from 'radix-ui'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { taskStatuses, type ReorderTask, type Task, type TaskStatus } from '../../../../shared/schemas/tasks'
import { planTaskMove, statusLabels, tasksInColumn } from '../data/task-order'
import { PriorityBadge, TaskDueDate } from './task-badges'

const columnId = (status: TaskStatus) => 'column:' + status

type Move = (id: string, status: TaskStatus, position: number) => void

function BoardCard({ task, index, count, busy, details, move, columnCounts }: {
  task: Task
  index: number
  count: number
  busy: boolean
  details: () => void
  move: Move
  columnCounts: Record<TaskStatus, number>
}) {
  const { ref, handleRef, isDragging } = useSortable({
    id: task.id, index, group: task.status, type: 'task', accept: 'task', disabled: busy,
  })
  return (
    <li ref={ref} className={cn('rounded-xl', isDragging && 'opacity-60 ring-2 ring-ring')}>
      <Card className="gap-0 py-3">
        <CardContent className="space-y-3">
          <div className="flex items-start gap-1">
            <Button ref={handleRef} variant="ghost" size="icon-sm" type="button"
              aria-label={'Drag ' + task.title} disabled={busy} className="shrink-0 cursor-grab touch-none active:cursor-grabbing">
              <GripVertical />
            </Button>
            <button type="button" onClick={details}
              className="control-focus min-w-0 flex-1 rounded-sm py-1 text-left font-medium wrap-break-word hover:underline">
              {task.title}
            </button>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <Button type="button" variant="ghost" size="icon-sm" disabled={busy} aria-label={'Move ' + task.title}>
                  <Ellipsis />
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content align="end" sideOffset={5}
                  className="z-30 min-w-40 rounded-lg border bg-popover p-1 text-sm text-popover-foreground shadow-lg">
                  <DropdownMenu.Item className={menuItem} disabled={index === 0}
                    onSelect={() => move(task.id, task.status, index - 1)}>Move up</DropdownMenu.Item>
                  <DropdownMenu.Item className={menuItem} disabled={index + 1 === count}
                    onSelect={() => move(task.id, task.status, index + 1)}>Move down</DropdownMenu.Item>
                  <DropdownMenu.Separator className="my-1 border-b" />
                  {taskStatuses.filter((status) => status !== task.status).map((status) => (
                    <DropdownMenu.Item className={menuItem} key={status}
                      onSelect={() => move(task.id, status, columnCounts[status])}>Move to {statusLabels[status]}</DropdownMenu.Item>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PriorityBadge priority={task.priority} />
            <TaskDueDate date={task.dueDate} />
          </div>
        </CardContent>
      </Card>
    </li>
  )
}

const menuItem = 'cursor-default rounded px-2 py-1.5 outline-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:opacity-45'

function BoardColumn({ status, tasks, busy, details, create, move, columnCounts }: {
  status: TaskStatus
  tasks: Task[]
  busy: boolean
  details: (id: string) => void
  create: (status: TaskStatus) => void
  move: Move
  columnCounts: Record<TaskStatus, number>
}) {
  const { ref, isDropTarget } = useDroppable({ id: columnId(status), accept: 'task', disabled: busy, collisionPriority: -1 })
  const headingId = 'board-heading-' + status
  return (
    <section ref={ref} aria-labelledby={headingId}
      className={cn('min-h-40 min-w-0 space-y-4 rounded-xl border bg-muted p-3', isDropTarget && 'border-ring ring-2 ring-ring/35')}>
      <div className="flex items-center justify-between gap-2">
        <h2 id={headingId} className="font-semibold">{statusLabels[status]} <span className="ml-1 text-sm text-muted-foreground">{tasks.length}</span></h2>
        <Button type="button" variant="ghost" size="icon-sm" aria-label={'Add task to ' + statusLabels[status]}
          onClick={() => create(status)}><Plus /></Button>
      </div>
      {tasks.length ? (
        <ul className="space-y-3">
          {tasks.map((task, index) => (
            <BoardCard key={task.id} task={task} index={index} count={tasks.length} busy={busy}
              details={() => details(task.id)} move={move} columnCounts={columnCounts} />
          ))}
        </ul>
      ) : <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No tasks in this column.</p>}
    </section>
  )
}

export function TaskBoard({ tasks, busy, onMove, onDetails, onCreate }: {
  tasks: Task[]
  busy: boolean
  onMove: (move: ReorderTask) => void
  onDetails: (id: string) => void
  onCreate: (status: TaskStatus) => void
}) {
  const [dragSnapshot, setDragSnapshot] = useState<Task[] | null>(null)
  const visibleTasks = dragSnapshot ?? tasks
  const columns = {
    todo: tasksInColumn(visibleTasks, 'todo'),
    in_progress: tasksInColumn(visibleTasks, 'in_progress'),
    done: tasksInColumn(visibleTasks, 'done'),
  }
  const columnCounts = { todo: columns.todo.length, in_progress: columns.in_progress.length, done: columns.done.length }

  function move(id: string, status: TaskStatus, position: number) {
    const operation = planTaskMove(visibleTasks, id, status, position)
    if (!busy && operation) onMove(operation)
  }

  function endDrag(event: DragEndEvent) {
    setDragSnapshot(null)
    if (event.canceled) return
    const { source, target } = event.operation
    if (!source || !target || !isSortable(source)) return
    const task = visibleTasks.find((item) => item.id === source.id)
    if (!task) return
    const column = taskStatuses.find((status) => target.id === columnId(status))
    if (column) {
      move(task.id, column, columnCounts[column] - Number(task.status === column))
      return
    }
    const status = taskStatuses.find((value) => value === source.group)
    if (status) move(task.id, status, source.index)
  }

  return (
    <DragDropProvider onDragStart={() => setDragSnapshot(tasks)} onDragEnd={endDrag}>
      <div className="grid items-start gap-4 lg:grid-cols-3">
        {taskStatuses.map((status) => (
          <BoardColumn key={status} status={status} tasks={columns[status]} busy={busy}
            details={onDetails} create={onCreate} move={move} columnCounts={columnCounts} />
        ))}
      </div>
    </DragDropProvider>
  )
}
