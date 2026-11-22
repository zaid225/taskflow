import { useId, type ComponentProps, type ReactNode } from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export function TaskField({ label, error, children }: {
  label: string
  error?: string
  children: (id: string, errorId: string | undefined) => ReactNode
}) {
  const id = useId()
  const errorId = error ? id + '-error' : undefined
  return (
    <div className="min-w-0 space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children(id, errorId)}
      {error && <p id={errorId} role="alert" className="text-sm font-medium">{error}</p>}
    </div>
  )
}

export function TaskSelect({ className, ...props }: ComponentProps<'select'>) {
  return <select {...props} className={cn('control-focus h-10 w-full min-w-0 rounded-lg border border-input bg-background px-2.5 text-base disabled:opacity-50 md:text-sm', className)} />
}

export function TaskTextarea({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea {...props} className={cn('control-focus min-h-24 w-full resize-y rounded-lg border border-input bg-background px-2.5 py-2 text-base placeholder:text-muted-foreground placeholder:opacity-100 disabled:opacity-50 md:text-sm', className)} />
}
