import { ClipboardList } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { taskErrorMessage } from '../api/task-api'

export function TaskLoading({ label = 'Loading tasks' }: { label?: string }) {
  return (
    <div role="status" aria-label={label} className="grid gap-3">
      {Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-16 w-full" />)}
    </div>
  )
}

export function TaskError({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <Card className="items-start gap-3 px-4">
      <p role="alert" className="text-sm">{taskErrorMessage(error)}</p>
      <Button type="button" variant="outline" onClick={retry}>Try again</Button>
    </Card>
  )
}

export function TaskEmpty({ title = 'No tasks yet', children }: { title?: string; children?: ReactNode }) {
  return (
    <Card className="items-center px-5 py-10 text-center">
      <ClipboardList className="size-6 text-muted-foreground" aria-hidden="true" />
      <p className="font-medium">{title}</p>
      {children}
    </Card>
  )
}
