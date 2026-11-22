import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

const views = [
  { id: 'list', label: 'List', to: '/tasks?view=list' },
  { id: 'table', label: 'Table', to: '/tasks?view=table' },
  { id: 'board', label: 'Board', to: '/board' },
] as const

export function TaskViewSwitcher({ view }: { view: (typeof views)[number]['id'] }) {
  return (
    <nav aria-label="Task view" className="flex w-fit gap-1 rounded-lg border bg-card p-1">
      {views.map(({ id, label, to }) => (
        <Button key={id} asChild variant={view === id ? 'secondary' : 'ghost'}>
          <Link to={to} aria-current={view === id ? 'page' : undefined}>{label}</Link>
        </Button>
      ))}
    </nav>
  )
}
