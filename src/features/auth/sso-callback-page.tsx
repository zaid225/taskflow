import { HandleSSOCallback, useAuth, useSignIn, useSignUp } from '@clerk/react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { AuthLayout } from './auth-layout'
import { needsEmailFactor, useAuthDestination, useFinalizeNavigation } from './auth-flow'
import { useSlowAuthAction } from './use-auth-action'

export function SsoCallbackPage() {
  const { signIn } = useSignIn()
  const { signUp } = useSignUp()
  const auth = useAuth()
  const includingPending = useAuth({ treatPendingAsSignedOut: false })
  const navigate = useNavigate()
  const finalizeNavigation = useFinalizeNavigation()
  const { next, destination } = useAuthDestination()
  const [params] = useSearchParams()
  const start = (params.get('from') === 'sign-up' ? '/sign-up' : '/sign-in') + next
  const cancelled = params.get('error') === 'access_denied'
  const providerFailed = params.has('error') || params.has('error_description')
  const slow = useSlowAuthAction(!providerFailed)
  const needsFactor = needsEmailFactor(signIn)

  if (auth.isSignedIn) return <Navigate to={destination} replace />
  if (includingPending.isSignedIn) return <Navigate to="/auth/session-task" replace />

  function continueSignIn() {
    if (needsEmailFactor(signIn)) {
      void navigate('/sign-in/verify-email' + next, { replace: true, state: { requestCode: true } })
    } else if (signIn.status === 'needs_new_password') {
      void navigate('/forgot-password' + next, { replace: true })
    } else {
      const oauthMessage = signIn.status === 'needs_second_factor' || signIn.status === 'needs_client_trust'
        ? 'This account requires a factor TaskFlow does not support. Ask your workspace administrator for help.'
        : 'Google sign-in did not finish. Try again or continue with email.'
      void navigate(start, { replace: true, state: { oauthMessage } })
    }
  }

  return (
    <AuthLayout title={providerFailed ? 'Google sign-in did not complete' : 'Finishing Google sign-in'}
      description={cancelled ? 'You cancelled Google sign-in. You can try again or use email.'
        : providerFailed ? 'Google returned an error. Try again or continue with email.'
          : 'TaskFlow is checking the result from Google.'}>
      {!providerFailed && (
        <HandleSSOCallback navigateToApp={finalizeNavigation} navigateToSignIn={continueSignIn}
          navigateToSignUp={() => void navigate('/sign-up/continue' + next, { replace: true })} />
      )}
      <div className="space-y-3">
        {!providerFailed && needsFactor && (
          <Button type="button" className="w-full" onClick={continueSignIn}>Continue email verification</Button>
        )}
        {!providerFailed && slow && !needsFactor && (
          <p role="status" className="text-sm text-muted-foreground">
            If Google did not finish, return to TaskFlow and try again.
          </p>
        )}
        {/* The current Clerk callback helper can return without calling a navigation callback. */}
        {!providerFailed && slow && signUp.status === 'missing_requirements' && (
          <Button variant="outline" asChild className="w-full">
            <Link to={'/sign-up/continue' + next}>Continue account setup</Link>
          </Button>
        )}
        <Button asChild variant="outline" className="w-full"><Link to={start}>Return to TaskFlow sign-in</Link></Button>
      </div>
    </AuthLayout>
  )
}
