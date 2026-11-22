import type { Task } from '../../../../shared/schemas/tasks'

function csvCell(value: string | null) {
  let text = value ?? ''
  if (/^[\t\r\n]|^[\s\u200b\uFEFF]*[=+\-@＝＋－＠]/u.test(text)) text = "'" + text
  return '"' + text.replaceAll('"', '""') + '"'
}

export function tasksToCsv(tasks: readonly Task[]) {
  return [
    ['Title', 'Description', 'Status', 'Priority', 'Due date', 'Created at', 'Completed at'],
    ...tasks.map(task => [task.title, task.description, task.status, task.priority, task.dueDate, task.createdAt, task.completedAt]),
  ].map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n'
}
