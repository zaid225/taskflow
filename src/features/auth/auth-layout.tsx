import type { ReactNode } from 'react'
import { ListChecks } from 'lucide-react'
import { Link } from 'react-router'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function AuthLayout({ title, description, children }: {
  title: string
  description: string
  children?: ReactNode
}) {
  return (
    <main className="flex min-h-svh flex-col bg-muted">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Link to="/" className="inline-flex items-center gap-2 rounded-md font-semibold focus-visible:outline-2 focus-visible:outline-offset-4">
          <span className="grid size-8 place-items-center rounded-lg bg-accent text-accent-foreground">
            <ListChecks className="size-5" aria-hidden="true" />
          </span>
          TaskFlow
        </Link>
        <ThemeToggle />
      </header>
      <div className="grid flex-1 place-items-center px-4 py-8 sm:px-6">
        <Card className="w-full max-w-md gap-6 shadow-sm [--card-spacing:--spacing(6)]">
          <CardHeader className="gap-2">
            <CardTitle><h1 className="text-2xl font-semibold tracking-tight">{title}</h1></CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          {children && <CardContent>{children}</CardContent>}
        </Card>
      </div>
    </main>
  )
}
