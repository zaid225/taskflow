import { useRef, useState } from 'react'
import { AlertDialog } from 'radix-ui'
import { Button } from '@/components/ui/button'
import type { Task } from '../../../../shared/schemas/tasks'
import { useBulkDeleteTasks } from '../api/task-queries'
import { PriorityBadge, StatusBadge, TaskDueDate } from './task-badges'
import type { TaskDialogState } from './task-dialog-state'

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })

export function TaskTable({ tasks, onAction }: { tasks: readonly Task[]; onAction: (dialog: TaskDialogState) => void }) {
  const [selection, setSelection] = useState<string[]>([])
  const [confirm, setConfirm] = useState<readonly string[] | null>(null)
  const bulk = useBulkDeleteTasks()
  const lock = useRef(false)
  const selected = tasks.filter(({ id }) => selection.includes(id)).map(({ id }) => id)
  const allSelected = selected.length === tasks.length

  async function removeSelected() {
    if (!confirm?.length || lock.current) return
    lock.current = true
    try {
      const { failed } = await bulk.mutateAsync(confirm)
      setSelection(failed)
      setConfirm(null)
    } catch {
      // The mutation reports the error and the confirmation remains available for retry.
    } finally {
      lock.current = false
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <p role="status" className="mr-2 text-sm text-muted-foreground">{selected.length} selected</p>
        <Button variant="ghost" type="button" disabled={!selected.length || bulk.isPending} onClick={() => setSelection([])}>Clear selection</Button>
        <AlertDialog.Root open={confirm !== null} onOpenChange={(open) => {
          if (!open && !lock.current) setConfirm(null)
        }}>
          <AlertDialog.Trigger asChild>
            <Button variant="destructive" type="button" disabled={!selected.length || bulk.isPending} onClick={() => setConfirm(selected)}>
              Delete selected
            </Button>
          </AlertDialog.Trigger>
          <AlertDialog.Portal>
            <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
            <AlertDialog.Content className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 space-y-4 rounded-xl border bg-popover p-5 text-popover-foreground shadow-lg">
              <AlertDialog.Title className="text-lg font-semibold">Delete {confirm?.length} {confirm?.length === 1 ? 'task' : 'tasks'}?</AlertDialog.Title>
              <AlertDialog.Description className="text-sm text-muted-foreground">The selected tasks will be permanently deleted.</AlertDialog.Description>
              <div className="flex justify-end gap-2">
                <AlertDialog.Cancel asChild><Button type="button" variant="outline" disabled={bulk.isPending}>Cancel</Button></AlertDialog.Cancel>
                <Button type="button" variant="destructive" disabled={bulk.isPending} onClick={() => void removeSelected()}>
                  {bulk.isPending ? 'Deleting…' : 'Delete tasks'}
                </Button>
              </div>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        </AlertDialog.Root>
      </div>
      <div className="control-focus max-w-full overflow-x-auto rounded-xl border bg-card" role="region" aria-label="Task table" tabIndex={0}>
        <table className="w-full min-w-180 text-left text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th scope="col" className="px-3 py-2">
                <input type="checkbox" className="control-focus accent-primary" aria-label="Select all visible tasks"
                  checked={allSelected} ref={(input) => { if (input) input.indeterminate = selected.length > 0 && !allSelected }}
                  disabled={bulk.isPending} onChange={() => setSelection(allSelected ? [] : tasks.map(({ id }) => id))} />
              </th>
              {['Title', 'Status', 'Priority', 'Due date', 'Created', 'Actions'].map((title) => <th key={title} scope="col" className="px-3 py-2 font-medium">{title}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tasks.map((task) => (
              <tr key={task.id} className="hover:bg-muted/50">
                <td className="px-3 py-2">
                  <input type="checkbox" className="control-focus accent-primary" aria-label={`Select ${task.title}`}
                    checked={selected.includes(task.id)} disabled={bulk.isPending}
                    onChange={(event) => {
                      const checked = event.currentTarget.checked
                      setSelection((previous) => checked ? [...previous, task.id] : previous.filter((id) => id !== task.id))
                    }} />
                </td>
                <th scope="row" className="max-w-72 px-3 py-2 font-medium wrap-break-word">
                  <button type="button" className="control-focus rounded-sm text-left hover:underline" disabled={bulk.isPending}
                    onClick={() => onAction({ type: 'details', id: task.id })}>{task.title}</button>
                </th>
                <td className="px-3 py-2"><StatusBadge status={task.status} /></td>
                <td className="px-3 py-2"><PriorityBadge priority={task.priority} /></td>
                <td className="px-3 py-2 whitespace-nowrap"><TaskDueDate date={task.dueDate} /></td>
                <td className="px-3 py-2 whitespace-nowrap"><time dateTime={task.createdAt}>{dateFormat.format(new Date(task.createdAt))}</time></td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" type="button" disabled={bulk.isPending} aria-label={`Edit ${task.title}`} onClick={() => onAction({ type: 'edit', task })}>Edit</Button>
                    <Button size="sm" variant="ghost" type="button" disabled={bulk.isPending} aria-label={`Delete ${task.title}`} onClick={() => onAction({ type: 'delete', task })}>Delete</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
