import { Plus } from 'lucide-react'
import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import type { ReorderTask } from '../../../../shared/schemas/tasks'
import { boardQuery, useTaskList, useTaskMutation, useTaskMutationPending } from '../api/task-queries'
import { TaskBoard } from '../components/task-board'
import { TaskDialogs } from '../components/task-dialogs'
import { useTaskDialogs } from '../components/task-dialog-state'
import { TaskError, TaskLoading } from '../components/task-feedback'

export function BoardPage() {
  const tasks = useTaskList(boardQuery)
  const mutation = useTaskMutation()
  const busy = useTaskMutationPending()
  const lock = useRef(false)
  const { dialog, setDialog } = useTaskDialogs()

  function move(operation: ReorderTask) {
    if (lock.current || busy) return
    lock.current = true
    void mutation.mutateAsync({ type: 'reorder', move: operation }).catch(() => {}).finally(() => { lock.current = false })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Board</h1>
          <p className="text-muted-foreground">Drag tasks between columns or use each task’s Move menu.</p>
        </div>
        <Button type="button" onClick={() => setDialog({ type: 'create' })}><Plus /> New task</Button>
      </div>
      {tasks.isPending && <TaskLoading label="Loading board" />}
      {tasks.isError && <TaskError error={tasks.error} retry={() => void tasks.refetch()} />}
      {tasks.data && <TaskBoard tasks={tasks.data} busy={busy} onMove={move}
          onDetails={(id) => setDialog({ type: 'details', id })}
          onCreate={(status) => setDialog({ type: 'create', status })} />}
      <TaskDialogs dialog={dialog} onChange={setDialog} />
    </div>
  )
}
