import { useState } from 'react'
import type { Task, TaskStatus } from '../../../../shared/schemas/tasks'

export type TaskDialogState =
  | { type: 'create'; status?: TaskStatus }
  | { type: 'details'; id: string }
  | { type: 'edit' | 'delete'; task: Task }

export function useTaskDialogs() {
  const [dialog, setDialog] = useState<TaskDialogState | null>(null)
  return { dialog, setDialog }
}
