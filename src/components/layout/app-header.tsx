import type { Ref } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { SignOutButton } from '@/features/auth/sign-out-button'
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar'
import { ThemeToggle } from './theme-toggle'

export function AppHeader({ title, sidebarTrigger, authenticated }: { title: string; sidebarTrigger: Ref<HTMLButtonElement>; authenticated: boolean }) {
  const { isMobile, open, openMobile } = useSidebar()

  return (
    <header className="flex min-h-14 items-center justify-between gap-3 border-b bg-background px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger ref={sidebarTrigger} aria-expanded={isMobile ? openMobile : open} />
        <span className="truncate text-sm font-medium">{title}</span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <ThemeToggle />
        {authenticated ? <>
          <Button variant="ghost" asChild><Link to="/profile">Profile</Link></Button>
          <SignOutButton />
        </> : <Button variant="outline" asChild><Link to="/sign-in">Sign in</Link></Button>}
      </div>
    </header>
  )
}
