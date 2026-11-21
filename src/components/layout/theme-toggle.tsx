import { useLayoutEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

const themeStorageKey = 'taskflow-theme'

export function ThemeToggle() {
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
    <Button type="button" variant="outline" size="icon" aria-label="Dark mode" aria-pressed={dark} onClick={toggleTheme}>
      {dark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
    </Button>
  )
}
