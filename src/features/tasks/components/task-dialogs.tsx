import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { Dialog } from 'radix-ui'
import { useRef, useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createTaskSchema, taskPriorities, taskStatuses, type CreateTask, type Task, type TaskStatus } from '../../../../shared/schemas/tasks'
import { taskErrorMessage } from '../api/task-api'
import { useTaskDetails, useTaskMutation, useTaskMutationPending } from '../api/task-queries'
import { statusLabels } from '../data/task-order'
import { PriorityBadge, StatusBadge, TaskDueDate } from './task-badges'
import { TaskError, TaskLoading } from './task-feedback'
import { TaskField, TaskSelect, TaskTextarea } from './task-fields'

import type { TaskDialogState } from './task-dialog-state'

function TaskModal({ title, description, children, onClose, busy }: {
  title: string
  description: string
  children: ReactNode
  onClose: () => void
  busy: boolean
}) {
  // The opener is outside this controlled dialog. Restore its focus on close.
  const [opener] = useState(() => document.activeElement)
  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open && !busy) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/45" />
        <Dialog.Content
          className="fixed inset-x-0 bottom-0 z-50 max-h-[90dvh] overflow-y-auto rounded-t-2xl border bg-popover p-5 text-popover-foreground shadow-xl outline-none sm:inset-auto sm:top-1/2 sm:left-1/2 sm:w-full sm:max-w-lg sm:-translate-1/2 sm:rounded-xl sm:p-6"
          onCloseAutoFocus={(event) => {
            if (opener instanceof HTMLElement && opener.isConnected) {
              event.preventDefault()
              opener.focus()
            } else {
              document.getElementById('workspace')?.focus()
            }
          }}
          onEscapeKeyDown={(event) => { if (busy) event.preventDefault() }}
          onInteractOutside={(event) => { if (busy) event.preventDefault() }}
        >
          <div className="pr-8">
            <Dialog.Title className="text-xl font-semibold tracking-tight">{title}</Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-muted-foreground">{description}</Dialog.Description>
          </div>
          <Dialog.Close asChild>
            <Button type="button" variant="ghost" size="icon" className="absolute top-4 right-4" aria-label="Close dialog" disabled={busy}><X /></Button>
          </Dialog.Close>
          <div className="mt-5">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function TaskEditor({ task, status, busy, onSave, onClose }: {
  task?: Task
  status?: TaskStatus
  busy: boolean
  onSave: (fields: CreateTask) => Promise<void>
  onClose: () => void
}) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateTask>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: task?.title ?? '', description: task?.description ?? null, status: task?.status ?? status ?? 'todo',
      priority: task?.priority ?? 'medium', dueDate: task?.dueDate ?? null,
    },
  })
  const saving = busy || isSubmitting
  const optional = (value: string | null) => value?.trim() ? value.trim() : null
  return (
    <form noValidate className="space-y-4" onSubmit={handleSubmit(onSave)}>
      <TaskField label="Title" error={errors.title?.message}>{(id, error) => (
        <Input id={id} aria-invalid={Boolean(error)} aria-describedby={error}
          className="h-10" placeholder="e.g. Review project notes" required maxLength={160} disabled={saving} {...register('title')} />
      )}</TaskField>
      <TaskField label="Description" error={errors.description?.message}>{(id, error) => (
        <TaskTextarea id={id} aria-invalid={Boolean(error)} aria-describedby={error}
          placeholder="Add details or next steps" maxLength={10_000} disabled={saving} {...register('description', { setValueAs: optional })} />
      )}</TaskField>
      <div className="grid grid-cols-2 gap-3">
        <TaskField label="Status" error={errors.status?.message}>{(id, error) => (
          <TaskSelect id={id} aria-invalid={Boolean(error)} aria-describedby={error} disabled={saving} {...register('status')}>
            {taskStatuses.map((value) => <option key={value} value={value}>{statusLabels[value]}</option>)}
          </TaskSelect>
        )}</TaskField>
        <TaskField label="Priority" error={errors.priority?.message}>{(id, error) => (
          <TaskSelect id={id} aria-invalid={Boolean(error)} aria-describedby={error} disabled={saving} {...register('priority')}>
            {taskPriorities.map((value) => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}
          </TaskSelect>
        )}</TaskField>
      </div>
      <TaskField label="Due date" error={errors.dueDate?.message}>{(id, error) => (
        <>
          <Input id={id} type="date" className="h-10" aria-invalid={Boolean(error)}
            aria-describedby={error ? `${id}-hint ${error}` : `${id}-hint`}
            disabled={saving} {...register('dueDate', { setValueAs: optional })} />
          <p id={`${id}-hint`} className="text-xs text-muted-foreground">Use the calendar to pick a date, or leave it blank.</p>
        </>
      )}</TaskField>
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" disabled={saving} onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={saving}>{saving ? 'Saving…' : task ? 'Save changes' : 'Create task'}</Button>
      </div>
    </form>
  )
}

function TaskDetails({ id, busy, onChange, onToggle }: {
  id: string
  busy: boolean
  onChange: (state: TaskDialogState) => void
  onToggle: (task: Task) => void
}) {
  const details = useTaskDetails(id)
  if (details.isPending) return <TaskLoading label="Loading task details" />
  if (details.isError) return <TaskError error={details.error} retry={() => void details.refetch()} />
  const task = details.data
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold wrap-break-word">{task.title}</h3>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={task.status} /><PriorityBadge priority={task.priority} /><TaskDueDate date={task.dueDate} />
      </div>
      <p className="whitespace-pre-wrap wrap-break-word text-sm">{task.description || 'No description'}</p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={busy} onClick={() => onToggle(task)}>{task.status === 'done' ? 'Reopen' : 'Mark complete'}</Button>
        <Button type="button" variant="outline" disabled={busy} onClick={() => onChange({ type: 'edit', task })}>Edit task</Button>
        <Button type="button" variant="destructive" disabled={busy} onClick={() => onChange({ type: 'delete', task })}>Delete task</Button>
      </div>
    </div>
  )
}

export function TaskDialogs({ dialog, onChange }: {
  dialog: TaskDialogState | null
  onChange: (state: TaskDialogState | null) => void
}) {
  const mutation = useTaskMutation()
  const anyPending = useTaskMutationPending()
  const lock = useRef(false)
  if (!dialog) return null

  function close() {
    mutation.reset()
    onChange(null)
  }

  async function run(command: Parameters<typeof mutation.mutateAsync>[0], closeAfter: boolean) {
    if (lock.current || anyPending) return
    lock.current = true
    try {
      await mutation.mutateAsync(command)
      if (closeAfter) close()
    } catch {
      // The dialog and toast both use the sanitized mutation error.
    } finally {
      lock.current = false
    }
  }

  const title = { create: 'Create task', edit: 'Edit task', delete: 'Delete task?', details: 'Task details' }[dialog.type]
  return (
    <TaskModal title={title} busy={mutation.isPending} onClose={close}
      description={dialog.type === 'delete' ? 'Deleting a task is permanent.' : 'Manage this task in your workspace.'}>
      {dialog.type === 'details' && (
        <TaskDetails id={dialog.id} busy={anyPending} onChange={(state) => {
          mutation.reset()
          onChange(state)
        }} onToggle={(task) => void run({
          type: 'update', id: task.id, task: { status: task.status === 'done' ? 'todo' : 'done' },
        }, false)} />
      )}
      {(dialog.type === 'create' || dialog.type === 'edit') && (
        <TaskEditor key={dialog.type === 'edit' ? dialog.task.id : 'new'}
          task={dialog.type === 'edit' ? dialog.task : undefined} status={dialog.type === 'create' ? dialog.status : undefined}
          busy={anyPending} onClose={close} onSave={(task) => dialog.type === 'edit'
            ? run({ type: 'update', id: dialog.task.id, task }, true)
            : run({ type: 'create', task }, true)} />
      )}
      {dialog.type === 'delete' && (
        <div className="space-y-4">
          <p className="wrap-break-word text-sm">{dialog.task.title}</p>
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" disabled={mutation.isPending} onClick={close} autoFocus>Cancel</Button>
            <Button type="button" variant="destructive" disabled={anyPending}
              onClick={() => void run({ type: 'delete', id: dialog.task.id }, true)}>
              {mutation.isPending ? 'Deleting…' : 'Delete task'}
            </Button>
          </div>
        </div>
      )}
      {mutation.isError && <p role="alert" className="mt-4 text-sm font-medium">{taskErrorMessage(mutation.error)}</p>}
    </TaskModal>
  )
}
