import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
      <p className="text-muted-foreground">This address doesn’t match a TaskFlow page.</p>
      <Button variant="outline" asChild><Link to="/dashboard">Back to overview</Link></Button>
    </div>
  )
}
