import { useSignIn, useSignUp } from '@clerk/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { z } from 'zod'
import { AuthError, AuthField, AuthSubmit } from './auth-controls'
import { Button } from '@/components/ui/button'
import { GoogleAuthButton } from './google-auth-button'
import { useAuthAction, useSlowAuthAction } from './use-auth-action'
import { AuthLayout } from './auth-layout'
import { clerkMessage, needsEmailFactor, rememberCodeSent, useAuthDestination, useFinalizeNavigation } from './auth-flow'

const credentials = z.object({
  email: z.email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
  confirmation: z.string(),
})
const newCredentials = credentials.extend({
  password: z.string().min(15, 'Use at least 15 characters.'),
}).refine(({ password, confirmation }) => password === confirmation, {
  path: ['confirmation'], message: 'Passwords do not match.',
})

export function CredentialsPage({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const creating = mode === 'sign-up'
  const { signIn, fetchStatus: signInFetch } = useSignIn()
  const { signUp, fetchStatus: signUpFetch } = useSignUp()
  const navigate = useNavigate()
  const finalizeNavigation = useFinalizeNavigation()
  const { next, destination } = useAuthDestination()
  const location = useLocation()
  const { failure, setFailure, pending, run } = useAuthAction()
  const form = useForm<z.infer<typeof credentials>>({
    resolver: zodResolver(creating ? newCredentials : credentials),
    defaultValues: { email: '', password: '', confirmation: '' },
  })
  const { errors, isSubmitting } = form.formState
  const busy = pending || isSubmitting || (creating ? signUpFetch : signInFetch) === 'fetching'
  const signupVerify = '/sign-up/verify-email' + next
  const signinVerify = '/sign-in/verify-email' + next

  const slow = useSlowAuthAction(creating && busy)
  const signupReady = signUp.status === 'missing_requirements' &&
    signUp.unverifiedFields.includes('email_address') && !signUp.missingFields.length

  async function sendSignupCode() {
    const verification = signUp.verifications.emailAddress
    if (verification?.strategy === 'email_code' && verification.expireAt &&
      verification.expireAt.getTime() > Date.now() && verification.status === 'unverified') {
      void navigate(signupVerify, { replace: true })
      return
    }
    const { error } = await signUp.verifications.sendEmailCode()
    if (error) {
      setFailure(clerkMessage(error, 'The code could not be sent. Try sending it again.'))
      return
    }
    rememberCodeSent('signup')
    void navigate(signupVerify, { replace: true })
  }

  function startGoogle() {
    return run(async () => {
      const options = {
        strategy: 'oauth_google' as const,
        redirectUrl: new URL(destination, window.location.origin).href,
        redirectCallbackUrl: new URL('/sso-callback' + next + '&from=' + mode, window.location.origin).href,
      }
      const { error } = creating ? await signUp.sso(options) : await signIn.sso(options)
      if (error) setFailure(clerkMessage(error, 'Google sign-in could not start. Try again or continue with email.'))
    }, 'Google sign-in could not start. Try again or continue with email.')
  }

  function submit({ email, password }: z.infer<typeof credentials>) {
    return run(async () => {
      if (creating) {
        const { error } = await signUp.password({ emailAddress: email, password })
        if (error) {
          setFailure(clerkMessage(error, 'We could not create your account. Try again.'))
          return
        }
        if (signUp.unverifiedFields.includes('email_address') && !signUp.missingFields.length) {
          await sendSignupCode()
        } else if (signUp.status === 'complete') {
          const { error: finalizeError } = await signUp.finalize({ navigate: finalizeNavigation })
          if (finalizeError) setFailure(clerkMessage(finalizeError, 'Could not start your session. Try continuing again.'))
        } else {
          void navigate('/sign-up/continue' + next, { replace: true })
        }
        return
      }

      const { error } = await signIn.password({ emailAddress: email, password })
      if (error) {
        setFailure(clerkMessage(error, 'Sign-in failed. Check your email and password and try again.'))
        return
      }
      if (signIn.status === 'complete') {
        const { error: finalizeError } = await signIn.finalize({ navigate: finalizeNavigation })
        if (finalizeError) setFailure(clerkMessage(finalizeError, 'Could not start your session. Try signing in again.'))
      } else if (signIn.status === 'needs_client_trust' || signIn.status === 'needs_second_factor') {
        const supported = needsEmailFactor(signIn)
        if (supported) {
          const { error: sendError } = await signIn.mfa.sendEmailCode()
          if (!sendError) rememberCodeSent('signin')
          void navigate(signinVerify, { replace: true, state: { sendFailed: Boolean(sendError) } })
        } else {
          setFailure('This account requires a verification method TaskFlow does not support yet. Contact your workspace administrator for help.')
        }
      } else {
        setFailure('An additional account step is required. Contact your workspace administrator for help signing in.')
      }
    }, 'Clerk could not complete the request. Check your connection and try again.')
  }

  if (!busy && !failure && !creating && needsEmailFactor(signIn)) {
    return <Navigate to={signinVerify} replace />
  }

  return (
    <AuthLayout title={creating ? 'Create your account' : 'Sign in to TaskFlow'}
      description={creating ? 'Use your email to set up your workspace account.' : 'Enter your email and password to open your workspace.'}>
      <GoogleAuthButton disabled={busy} onClick={() => void startGoogle()} />
      <form noValidate onSubmit={(event) => void form.handleSubmit(submit)(event)} className="space-y-4" aria-busy={busy}>
        <AuthField id="auth-email" label="Email address" placeholder="you@example.com" type="email" autoComplete="email" required disabled={busy}
          issue={errors.email?.message} {...form.register('email', { setValueAs: (value: string) => value.trim() })} />
        <AuthField id="auth-password" label="Password" placeholder={creating ? 'Create a password' : 'Enter your password'} type="password" autoComplete={creating ? 'new-password' : 'current-password'}
          required disabled={busy} issue={errors.password?.message} hint={creating ? 'Use at least 15 characters.' : undefined}
          {...form.register('password')} />
        {creating && (
          <AuthField id="auth-confirmation" label="Confirm password" placeholder="Re-enter your password" type="password" autoComplete="new-password"
            required disabled={busy} issue={errors.confirmation?.message} {...form.register('confirmation')} />
        )}
        {!creating && <Link className="inline-block text-sm underline underline-offset-4" to={'/forgot-password' + next}>Forgot password?</Link>}
        <AuthError message={failure || location.state?.oauthMessage} />
        {slow && <p role="status" className="text-sm text-muted-foreground">
          This is taking longer than usual. Complete Clerk’s security check if it appears and keep this page open while it finishes.
        </p>}
        <AuthSubmit busy={busy}>{creating ? 'Create account' : 'Sign in'}</AuthSubmit>

      </form>
      {creating && signupReady && !busy && (
        <Button type="button" variant="outline" className="mt-4"
          onClick={() => void run(sendSignupCode, 'The code could not be sent. Try again.')}>
          Continue email verification
        </Button>
      )}
      {creating && signUp.status === 'complete' && !signUp.canBeDiscarded && !busy && (
        <Link className="mt-4 inline-block text-sm underline underline-offset-4" to={signupVerify}>Finish signup</Link>
      )}
      <p className="mt-5 text-sm text-muted-foreground">
        {creating ? 'Already have an account? ' : 'New to TaskFlow? '}
        <Link className="font-medium text-foreground underline underline-offset-4" to={(creating ? '/sign-in' : '/sign-up') + next}>
          {creating ? 'Sign in' : 'Create an account'}
        </Link>
      </p>
    </AuthLayout>
  )
}
