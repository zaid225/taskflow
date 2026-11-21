import { ArrowRight, CircleAlert, CircleCheck, Clock3, ListTodo } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TaskList } from '@/features/tasks/components/task-list'
import { previewTasks } from '@/features/tasks/data/preview-tasks'

const stats = [
  { label: 'Total Tasks', count: previewTasks.length, icon: ListTodo },
  { label: 'In Progress', count: previewTasks.filter((task) => task.status === 'In Progress').length, icon: Clock3 },
  { label: 'Completed', count: previewTasks.filter((task) => task.status === 'Done').length, icon: CircleCheck },
  { label: 'High Priority', count: previewTasks.filter((task) => task.priority === 'High').length, icon: CircleAlert },
]

export function DashboardPage() {
  return (
    <div className="space-y-8">
      <section className="space-y-2 rounded-xl border bg-card px-5 py-7 sm:px-7">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Workspace overview</h1>
        <p className="max-w-xl text-muted-foreground">
          See how work is progressing across your workspace. This overview uses demonstration data.
        </p>
      </section>
      <section aria-label="Task statistics" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {stats.map(({ label, count, icon: Icon }) => (
          <Card key={label} className="gap-3">
            <CardHeader className="flex items-center justify-between gap-2">
              <CardTitle className="text-sm">{label}</CardTitle>
              <span className="hidden rounded-lg bg-accent p-1.5 text-accent-foreground sm:inline-flex">
                <Icon className="size-4" aria-hidden="true" />
              </span>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tabular-nums">{count}</p>
            </CardContent>
          </Card>
        ))}
      </section>
      <section aria-labelledby="recent-tasks-heading" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="recent-tasks-heading" className="text-lg font-semibold">Recent tasks</h2>
          <Button variant="outline" asChild>
            <Link to="/tasks">View all tasks <ArrowRight aria-hidden="true" /></Link>
          </Button>
        </div>
        <TaskList tasks={previewTasks.slice(0, 3)} />
      </section>
    </div>
  )
}
