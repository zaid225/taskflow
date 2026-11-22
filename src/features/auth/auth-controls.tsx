import { useState, type ComponentProps, type ReactNode } from 'react'
import { Eye, EyeOff, LoaderCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function AuthError({ message }: { message: string | undefined }) {
  return message ? <p role="alert" className="rounded-lg border border-destructive/45 bg-destructive/10 px-3 py-2 text-sm text-foreground">{message}</p> : null
}

export function AuthSubmit({ busy, disabled = false, children }: { busy: boolean; disabled?: boolean; children: ReactNode }) {
  return (
    <Button type="submit" disabled={busy || disabled} className="h-10 w-full bg-[color-mix(in_oklab,var(--primary)_85%,black)] hover:bg-[color-mix(in_oklab,var(--primary)_78%,black)]">
      {busy && <LoaderCircle className="motion-safe:animate-spin" aria-hidden="true" />}
      {busy ? 'Working…' : children}
    </Button>
  )
}

type AuthFieldProps = Omit<ComponentProps<typeof Input>, 'id'> & {
  id: string
  label: string
  issue?: string
  hint?: string
}

export function AuthField({ id, label, issue, hint, type, className, disabled, ...props }: AuthFieldProps) {
  const [visible, setVisible] = useState(false)
  const isPassword = type === 'password'
  const description = [hint && id + '-hint', issue && id + '-error'].filter(Boolean).join(' ')

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          {...props}
          id={id}
          type={isPassword && visible ? 'text' : type}
          disabled={disabled}
          aria-invalid={Boolean(issue)}
          aria-describedby={description || undefined}
          className={`h-10 border-muted-foreground ${isPassword ? 'pr-12' : ''} ${className ?? ''}`}
        />
        {isPassword && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-1/2 right-1 -translate-y-1/2"
            aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
            disabled={disabled}
            onClick={() => setVisible(!visible)}
          >
            {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
          </Button>
        )}
      </div>
      {hint && <p id={id + '-hint'} className="text-xs text-muted-foreground">{hint}</p>}
      {issue && <p id={id + '-error'} role="alert" className="text-sm font-medium">{issue}</p>}
    </div>
  )
}
