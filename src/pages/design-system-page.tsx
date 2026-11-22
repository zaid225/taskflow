import { useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function DesignSystemPage() {
  const titleInput = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState('Review design system')

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Design system</h1>
          <p className="text-muted-foreground">
            Preview the buttons, fields, and badges used to organize tasks.
          </p>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle><h2>Sample task</h2></CardTitle>
          <CardDescription>Try editing the title in this preview.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-2">
            <Label htmlFor="sample-title">Task title</Label>
            <Input
              className="border-muted-foreground"
              id="sample-title"
              ref={titleInput}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">High priority</Badge>
            <Badge variant="outline">In progress</Badge>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              className="bg-[color-mix(in_oklab,var(--primary)_85%,black)] hover:bg-[color-mix(in_oklab,var(--primary)_78%,black)]"
              onClick={() => titleInput.current?.focus()}
            >
              Edit title
            </Button>
            <Button type="button" variant="outline" onClick={() => setTitle('')}>
              Clear title
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
