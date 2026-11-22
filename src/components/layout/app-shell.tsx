import { useEffect, useRef } from 'react'
import { matchPath, Outlet, useLocation } from 'react-router'
import { navigation } from '@/app/navigation'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppHeader } from './app-header'
import { AppSidebar } from './app-sidebar'

export function AppShell({ authenticated = false }: { authenticated?: boolean }) {
  const { pathname } = useLocation()
  const sidebarTrigger = useRef<HTMLButtonElement>(null)
  const title = navigation.find(({ to }) => matchPath(to, pathname))?.title
    ?? (pathname === '/' ? 'Overview' : pathname === '/profile' ? 'Profile' : 'Page not found')

  useEffect(() => {
    document.title = `${title} | TaskFlow`
  }, [title])

  return (
    <TooltipProvider>
      <SidebarProvider>
        <a href="#workspace" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:p-2">
          Skip to content
        </a>
        <AppSidebar onMobileClose={() => sidebarTrigger.current?.focus()} />
        <SidebarInset id="workspace" tabIndex={-1} className="min-w-0">
          <AppHeader title={title} sidebarTrigger={sidebarTrigger} authenticated={authenticated} />
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
