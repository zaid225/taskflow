export const taskStatuses = ['To Do', 'In Progress', 'Done'] as const

export type PreviewTask = {
  id: string
  title: string
  status: (typeof taskStatuses)[number]
  priority: 'High' | 'Medium' | 'Low'
  dueDate: string
}

export const previewTasks: readonly PreviewTask[] = [
  { id: '1', title: 'Review the onboarding flow', status: 'In Progress', priority: 'High', dueDate: '2026-11-24' },
  { id: '2', title: 'Draft the release notes', status: 'To Do', priority: 'Medium', dueDate: '2026-11-27' },
  { id: '3', title: 'Update the component inventory', status: 'Done', priority: 'Low', dueDate: '2026-11-20' },
  { id: '4', title: 'Check mobile navigation', status: 'In Progress', priority: 'High', dueDate: '2026-11-25' },
  { id: '5', title: 'Outline the next sprint', status: 'To Do', priority: 'Low', dueDate: '2026-11-30' },
  { id: '6', title: 'Organize dashboard feedback', status: 'Done', priority: 'Medium', dueDate: '2026-11-21' },
]

const dueDateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
})

export function formatDueDate(date: string) {
  return dueDateFormatter.format(new Date(date))
}
