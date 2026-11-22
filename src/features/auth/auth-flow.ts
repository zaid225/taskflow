import { useNavigate, useSearchParams } from 'react-router'

const destinations = new Set(['/dashboard', '/tasks', '/board', '/profile', '/calendar'])

export function safeDestination(value: string | null) {
  if (!value?.startsWith('/') || value.startsWith('//')) return '/dashboard'
  try {
    const url = new URL(value, window.location.origin)
    if (url.origin === window.location.origin && destinations.has(url.pathname)) {
      return url.pathname + url.search + url.hash
    }
  } catch {
    // Treat malformed destinations the same as other unsupported paths.
  }
  return '/dashboard'
}

export function useAuthDestination() {
  const [params] = useSearchParams()
  const destination = safeDestination(params.get('next'))
  return { destination, next: '?' + new URLSearchParams({ next: destination }) }
}

export function useFinalizeNavigation() {
  const navigate = useNavigate()
  const { destination } = useAuthDestination()

  return ({
    session, decorateUrl,
  }: {
    session: { currentTask?: unknown; status: string }
    decorateUrl: (url: string) => string
  }) => {
    const url = decorateUrl(session.currentTask || session.status === 'pending' ? '/auth/session-task' : destination)
    if (url.startsWith('http')) window.location.assign(url)
    else void navigate(url, { replace: true })
  }
}

export function needsEmailFactor(signIn: {
  status: string | null
  supportedSecondFactors: readonly { strategy: string }[]
}) {
  return (signIn.status === 'needs_client_trust' || signIn.status === 'needs_second_factor') &&
    signIn.supportedSecondFactors.some(({ strategy }) => strategy === 'email_code')
}

export function clerkMessage(error: unknown, fallback: string) {
  const entry = error && typeof error === 'object' && 'errors' in error && Array.isArray(error.errors)
    ? error.errors[0]
    : error
  const code = entry && typeof entry === 'object' && 'code' in entry ? entry.code : undefined

  switch (code) {
    case 'form_password_incorrect':
    case 'form_identifier_not_found':
      return 'The email or password is incorrect.'
    case 'form_password_pwned':
      return 'This password appeared in a data breach. Choose a different password.'
    case 'form_password_length_too_short':
    case 'form_password_validation_failed':
      return 'Choose a stronger password with at least 15 characters.'
    case 'form_identifier_exists':
      return 'This email may already have an account. Try signing in.'
    case 'form_code_incorrect':
      return 'That code is incorrect. Check the code and try again.'
    case 'verification_expired':
    case 'form_code_expired':
      return 'That code has expired. Request a new one.'
    case 'verification_failed':
    case 'verification_attempts_exceeded':
      return 'Verification could not be completed. Request a new code or start over.'
    case 'protect_check_script_load_failed':
      return 'The security check could not load. Allow Clerk and Turnstile in your browser and try again.'
    case 'protect_check_failed':
      return 'Clerk could not complete the security check. Try again in a browser that supports it.'
    case 'external_account_not_found':
    case 'oauth_access_denied':
      return 'Google sign-in was not completed. Try again or continue with email.'
    case 'too_many_requests':
      return 'Too many attempts. Wait a moment and try again.'
    default:
      return fallback
  }
}

const cooldownMs = 30_000

export function rememberCodeSent(scope: string) {
  const end = Date.now() + cooldownMs
  try {
    sessionStorage.setItem('taskflow-code-' + scope, String(end))
  } catch {
    // The current screen can still enforce its cooldown.
  }
  return end
}

export function codeCooldown(scope: string) {
  try {
    return Number(sessionStorage.getItem('taskflow-code-' + scope)) || 0
  } catch {
    return 0
  }
}
