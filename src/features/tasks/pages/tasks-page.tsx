import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { taskPriorities, taskStatuses, type TaskQuery } from '../../../../shared/schemas/tasks'
import { useTaskList } from '../api/task-queries'
import { TaskDialogs } from '../components/task-dialogs'
import { useTaskDialogs } from '../components/task-dialog-state'
import { TaskEmpty, TaskError, TaskLoading } from '../components/task-feedback'
import { TaskField, TaskSelect } from '../components/task-fields'
import { TaskList } from '../components/task-list'
import { statusLabels } from '../data/task-order'

const defaults: TaskQuery = { sort: 'updatedAt', direction: 'desc' }
const sorts: Record<TaskQuery['sort'], string> = {
  updatedAt: 'Last updated', createdAt: 'Date created', dueDate: 'Due date',
  priority: 'Priority', title: 'Title', position: 'Board order',
}

export function TasksPage() {
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<TaskQuery>(defaults)
  const { dialog, setDialog } = useTaskDialogs()
  const tasks = useTaskList(filters)
  const filtered = Boolean(search || filters.status || filters.priority)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setFilters((current) => ({ ...current, search: search.trim() || undefined }))
    }, 250)
    return () => window.clearTimeout(timer)
  }, [search])

  function clearFilters() {
    setSearch('')
    setFilters(defaults)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">My Tasks</h1>
          <p className="text-muted-foreground">Find, organize, and update your tasks.</p>
        </div>
        <Button type="button" onClick={() => setDialog({ type: 'create' })}><Plus /> New task</Button>
      </div>
      <div className="grid grid-cols-2 gap-3 rounded-xl border bg-card p-4 md:grid-cols-3 xl:grid-cols-[2fr_repeat(4,minmax(0,1fr))_auto] xl:items-end">
        <div className="col-span-2 md:col-span-1">
          <TaskField label="Search tasks">{(id) => (
            <Input id={id} type="search" className="h-10" placeholder="Search titles and descriptions" maxLength={160}
              value={search} onChange={(event) => setSearch(event.currentTarget.value)} />
          )}</TaskField>
        </div>
        <TaskField label="Status">{(id) => (
          <TaskSelect id={id} value={filters.status ?? ''} onChange={(event) =>
            setFilters({ ...filters, status: taskStatuses.find((status) => status === event.target.value) })}>
            <option value="">All statuses</option>
            {taskStatuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
          </TaskSelect>
        )}</TaskField>
        <TaskField label="Priority">{(id) => (
          <TaskSelect id={id} value={filters.priority ?? ''} onChange={(event) =>
            setFilters({ ...filters, priority: taskPriorities.find((priority) => priority === event.target.value) })}>
            <option value="">All priorities</option>
            {taskPriorities.map((priority) => <option key={priority} value={priority}>{priority[0].toUpperCase() + priority.slice(1)}</option>)}
          </TaskSelect>
        )}</TaskField>
        <TaskField label="Sort by">{(id) => (
          <TaskSelect id={id} value={filters.sort} onChange={(event) => setFilters({ ...filters, sort: event.currentTarget.value as TaskQuery['sort'] })}>
            {Object.entries(sorts).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </TaskSelect>
        )}</TaskField>
        <TaskField label="Direction">{(id) => (
          <TaskSelect id={id} value={filters.direction} onChange={(event) => setFilters({ ...filters, direction: event.currentTarget.value === 'asc' ? 'asc' : 'desc' })}>
            <option value="asc">Ascending</option><option value="desc">Descending</option>
          </TaskSelect>
        )}</TaskField>
        <Button type="button" variant="outline" className="h-10 self-end" disabled={!filtered && filters.sort === defaults.sort && filters.direction === defaults.direction}
          onClick={clearFilters}>Clear filters</Button>
      </div>

      {tasks.isPending ? <TaskLoading /> : tasks.isError ? <TaskError error={tasks.error} retry={() => void tasks.refetch()} />
        : tasks.data.length ? <TaskList tasks={tasks.data} onDetails={(id) => setDialog({ type: 'details', id })} />
          : <TaskEmpty title={filtered ? 'No matching tasks' : 'No tasks yet'}>
            <Button type="button" variant="outline" onClick={filtered ? clearFilters : () => setDialog({ type: 'create' })}>
              {filtered ? 'Clear filters' : 'Create your first task'}
            </Button>
          </TaskEmpty>}
      <TaskDialogs dialog={dialog} onChange={setDialog} />
    </div>
  )
}
