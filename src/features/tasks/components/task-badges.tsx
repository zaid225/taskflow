import { Badge } from '@/components/ui/badge'
import type { PreviewTask } from '../data/preview-tasks'

export function PriorityBadge({ priority }: { priority: PreviewTask['priority'] }) {
  return (
    <Badge variant={priority === 'High' ? 'secondary' : 'outline'}>
      {priority} priority
    </Badge>
  )
}

export function StatusBadge({ status }: { status: PreviewTask['status'] }) {
  return (
    <Badge variant="outline" className={status === 'In Progress' ? 'bg-accent text-accent-foreground' : undefined}>
      {status}
    </Badge>
  )
}
