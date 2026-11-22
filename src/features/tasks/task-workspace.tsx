import { useAuth } from '@clerk/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type CSSProperties, type ReactNode } from 'react'
import { Toaster } from 'sonner'
import { ProfileBootstrap } from '@/features/profile/use-profile'
import { TaskApiError } from './api/task-api'

const toastStyle = {
  '--normal-bg': 'var(--popover)',
  '--normal-text': 'var(--popover-foreground)',
  '--normal-border': 'var(--border)',
} as CSSProperties

function SessionQueries({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 10_000,
        retry: (attempt, error) => attempt < 1 && (!(error instanceof TaskApiError) || error.status >= 500),
      },
    },
  }))
  return (
    <QueryClientProvider client={client}>
      <ProfileBootstrap />
      {children}
      <Toaster position="bottom-center" closeButton style={toastStyle} />
    </QueryClientProvider>
  )
}

export function TaskWorkspace({ children }: { children: ReactNode }) {
  const { sessionId, userId } = useAuth()
  return <SessionQueries key={`${sessionId}:${userId}`}>{children}</SessionQueries>
}
