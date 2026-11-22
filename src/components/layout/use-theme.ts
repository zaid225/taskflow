import { useLayoutEffect, useState } from 'react'

const themeStorageKey = 'taskflow-theme'

export function useTheme() {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem(themeStorageKey) === 'dark' }
    catch { return false }
  })

  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  function toggleTheme() {
    const next = !dark
    setDark(next)
    try { localStorage.setItem(themeStorageKey, next ? 'dark' : 'light') }
    catch { /* Storage is optional. */ }
  }
  return { dark, toggleTheme }
}
