import { taskStatuses, type ReorderTask, type Task, type TaskStatus } from '../../../../shared/schemas/tasks'

export const statusLabels: Record<TaskStatus, string> = { todo: 'To do', in_progress: 'In progress', done: 'Done' }

export function tasksInColumn(tasks: readonly Task[], status: TaskStatus) {
  return tasks.filter((task) => task.status === status).sort((a, b) => a.position - b.position || a.id.localeCompare(b.id))
}

export function planTaskMove(tasks: readonly Task[], id: string, status: TaskStatus, position: number): ReorderTask | null {
  const task = tasks.find((item) => item.id === id)
  if (!task) return null
  const target = tasksInColumn(tasks, status)
  const length = target.length - Number(task.status === status)
  if (!Number.isInteger(position) || position < 0 || position > length) return null
  if (task.status === status && target.findIndex((item) => item.id === id) === position) return null
  return { id, status, position }
}

export function previewTaskMove(tasks: readonly Task[], move: ReorderTask): Task[] {
  const task = tasks.find((item) => item.id === move.id)
  if (!task || !planTaskMove(tasks, move.id, move.status, move.position)) return [...tasks]
  return taskStatuses.flatMap((status) => {
    const column = tasksInColumn(tasks, status)
    if (status !== task.status && status !== move.status) return column
    const rest = column.filter((item) => item.id !== move.id)
    if (status === move.status) rest.splice(move.position, 0, { ...task, status })
    return rest.map((item, position) => ({ ...item, position }))
  })
}
