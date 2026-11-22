import { ClerkProvider } from '@clerk/react'
import { BrowserRouter, useNavigate } from 'react-router'
import { AppRoutes } from './router'

const publishableKey = (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined)?.trim()

function isConfiguredKey(key: string | undefined): key is string {
  if (!key || !/^pk_(test|live)_[A-Za-z0-9+/=]+$/.test(key)) return false
  try {
    return /^[A-Za-z0-9.-]+\$$/.test(atob(key.split('_')[2]))
  } catch {
    return false
  }
}

function AppWithAuth() {
  const navigate = useNavigate()
  if (!isConfiguredKey(publishableKey)) {
    return <AppRoutes configured={false} />
  }
  return (
    <ClerkProvider
      publishableKey={publishableKey}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
    >
      <AppRoutes configured />
    </ClerkProvider>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <AppWithAuth />
    </BrowserRouter>
  )
}
