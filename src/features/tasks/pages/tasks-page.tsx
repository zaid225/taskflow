import { TaskList } from '../components/task-list'
import { previewTasks } from '../data/preview-tasks'

export function TasksPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">My Tasks</h1>
        <p className="text-muted-foreground">Demonstration tasks with their status, priority, and due dates.</p>
      </div>
      <TaskList tasks={previewTasks} />
    </div>
  )
}
