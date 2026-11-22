import { ClerkDegraded, ClerkFailed, ClerkLoaded, ClerkLoading, useAuth, useClerk } from '@clerk/react'
import { Link, Navigate, Outlet, useLocation } from 'react-router'
import { Button } from '@/components/ui/button'
import { AuthLayout } from './auth-layout'
import { useAuthDestination } from './auth-flow'

function Unavailable({ configured }: { configured: boolean }) {
  return (
    <AuthLayout title="Authentication unavailable" description={configured
      ? 'Clerk could not connect. Check your connection and reload to try again.'
      : 'Set VITE_CLERK_PUBLISHABLE_KEY in the local environment and restart the app.'}>
      {import.meta.env.DEV && <Button asChild variant="outline"><Link to="/design-system">Open design system</Link></Button>}
    </AuthLayout>
  )
}

export function AuthBoundary({ configured }: { configured: boolean }) {
  if (!configured) return <Unavailable configured={false} />

  return (
    <>
      <ClerkLoading><AuthLayout title="Connecting to TaskFlow" description="Checking your session…" /></ClerkLoading>
      <ClerkFailed><Unavailable configured /></ClerkFailed>
      <ClerkDegraded><Unavailable configured /></ClerkDegraded>
      <ClerkLoaded><ReadyRoutes /></ClerkLoaded>
    </>
  )
}

function ReadyRoutes() {
  const clerk = useClerk()
  return clerk.status === 'ready' ? <Outlet /> : null
}

export function RequireSession() {
  const auth = useAuth()
  const includingPending = useAuth({ treatPendingAsSignedOut: false })
  const { pathname, search, hash } = useLocation()
  if (!auth.isLoaded) return null
  if (auth.isSignedIn) return <Outlet />
  if (includingPending.isSignedIn) return <Navigate to="/auth/session-task" replace />
  const next = new URLSearchParams({ next: pathname + search + hash })
  return <Navigate to={'/sign-in?' + next} replace />
}

export function SignedOutOnly() {
  const auth = useAuth()
  const includingPending = useAuth({ treatPendingAsSignedOut: false })
  const { destination } = useAuthDestination()
  if (!auth.isLoaded) return null
  if (auth.isSignedIn) return <Navigate to={destination} replace />
  if (includingPending.isSignedIn) return <Navigate to="/auth/session-task" replace />
  return <Outlet />
}
