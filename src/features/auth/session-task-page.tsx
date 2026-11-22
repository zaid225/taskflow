import { useAuth } from '@clerk/react'
import { Navigate } from 'react-router'
import { AuthLayout } from './auth-layout'
import { SignOutButton } from './sign-out-button'

export function SessionTaskPage() {
  const auth = useAuth()
  const includingPending = useAuth({ treatPendingAsSignedOut: false })
  if (!auth.isLoaded) return null
  if (auth.isSignedIn) return <Navigate to="/dashboard" replace />
  if (!includingPending.isSignedIn) return <Navigate to="/sign-in" replace />

  return (
    <AuthLayout title="Your session needs another step" description="TaskFlow cannot complete this required account step here. Sign out and contact your workspace administrator for help finishing setup.">
      <SignOutButton />
    </AuthLayout>
  )
}
