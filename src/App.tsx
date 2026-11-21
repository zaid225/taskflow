import { useLayoutEffect, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const themeStorageKey = 'taskflow-theme'

export function App() {
  const titleInput = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState('Review design system')
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem(themeStorageKey) === 'dark'
    } catch {
      return false
    }
  })

  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  function toggleTheme() {
    const nextDark = !dark
    setDark(nextDark)

    try {
      localStorage.setItem(themeStorageKey, nextDark ? 'dark' : 'light')
    } catch {
      // The current page still switches appearance when storage is unavailable.
    }
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-2xl flex-col justify-center gap-8 px-5 py-12 sm:px-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">TaskFlow</h1>
          <p className="text-muted-foreground">
            Preview the buttons, fields, and badges used to organize tasks.
          </p>
        </div>
        <Button type="button" variant="outline" aria-pressed={dark} onClick={toggleTheme}>
          Dark mode
        </Button>
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
              className="border-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-foreground"
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
    </main>
  )
}
