import { ArrowRight, CircleAlert, CircleCheck, Clock3, ListTodo, Plus } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useTaskList, useTaskStats } from '@/features/tasks/api/task-queries'
import { TaskDialogs } from '@/features/tasks/components/task-dialogs'
import { useTaskDialogs } from '@/features/tasks/components/task-dialog-state'
import { TaskEmpty, TaskError, TaskLoading } from '@/features/tasks/components/task-feedback'
import { TaskList } from '@/features/tasks/components/task-list'

const metrics = [
  { key: 'total', label: 'Total Tasks', icon: ListTodo },
  { key: 'inProgress', label: 'In Progress', icon: Clock3 },
  { key: 'completed', label: 'Completed', icon: CircleCheck },
  { key: 'highPriority', label: 'High Priority', icon: CircleAlert },
] as const

export function DashboardPage() {
  const stats = useTaskStats()
  const recent = useTaskList({ sort: 'updatedAt', direction: 'desc' })
  const { dialog, setDialog } = useTaskDialogs()
  const create = () => setDialog({ type: 'create' })
  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-start justify-between gap-4 rounded-xl border bg-card px-5 py-7 sm:px-7">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Workspace overview</h1>
          <p className="max-w-xl text-muted-foreground">Track progress and pick up where you left off.</p>
        </div>
        <Button type="button" onClick={create}><Plus /> New task</Button>
      </section>
      {stats.isError ? <TaskError error={stats.error} retry={() => void stats.refetch()} /> : (
        <section aria-label="Task statistics" aria-busy={stats.isPending} className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {metrics.map(({ key, label, icon: Icon }) => (
            <Card key={key} className="gap-3">
              <CardHeader className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm">{label}</CardTitle>
                <span className="hidden rounded-lg bg-accent p-1.5 text-accent-foreground sm:inline-flex">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
              </CardHeader>
              <CardContent>
                {stats.data ? <p className="text-3xl font-semibold tabular-nums">{stats.data[key]}</p>
                  : <Skeleton className="h-9 w-10" />}
              </CardContent>
            </Card>
          ))}
        </section>
      )}
      <section aria-labelledby="recent-tasks-heading" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="recent-tasks-heading" className="text-lg font-semibold">Recent tasks</h2>
          <Button variant="outline" asChild>
            <Link to="/tasks">View all tasks <ArrowRight aria-hidden="true" /></Link>
          </Button>
        </div>
        {recent.isPending ? <TaskLoading label="Loading recent tasks" /> : recent.isError
          ? <TaskError error={recent.error} retry={() => void recent.refetch()} />
          : recent.data.length ? <TaskList tasks={recent.data.slice(0, 5)} onDetails={(id) => setDialog({ type: 'details', id })} />
            : <TaskEmpty><Button type="button" variant="outline" onClick={create}>Create your first task</Button></TaskEmpty>}
      </section>
      <TaskDialogs dialog={dialog} onChange={setDialog} />
    </div>
  )
}
