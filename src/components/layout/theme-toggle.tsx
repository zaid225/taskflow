import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from './use-theme'

export function ThemeButton({ dark, toggleTheme }: ReturnType<typeof useTheme>) {
  return (
    <Button type="button" variant="outline" size="icon" aria-label="Dark mode" aria-pressed={dark} onClick={toggleTheme}>
      {dark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
    </Button>
  )
}

export function ThemeToggle() {
  return <ThemeButton {...useTheme()} />
}
