import { useSignIn } from '@clerk/react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { AuthError, AuthField, AuthSubmit } from './auth-controls'
import { AuthLayout } from './auth-layout'
import { clerkMessage, codeCooldown, needsEmailFactor, rememberCodeSent, useAuthDestination, useFinalizeNavigation } from './auth-flow'
import { useAuthAction } from './use-auth-action'

export function ForgotPasswordPage() {
  const { signIn, fetchStatus } = useSignIn()
  const navigate = useNavigate()
  const { next } = useAuthDestination()
  const finalizeNavigation = useFinalizeNavigation()
  const { failure, setFailure, pending, run } = useAuthAction()
  const [cooldown, setCooldown] = useState(() => codeCooldown('password-reset'))
  const [now, setNow] = useState(Date.now)
  const [step, setStep] = useState<'email' | 'code' | 'password'>(() => (
    signIn.status === 'needs_new_password' ? 'password' : 'email'
  ))
  const busy = pending || fetchStatus === 'fetching'

  const secondsLeft = Math.max(0, Math.ceil((cooldown - now) / 1000))
  const coolingDown = secondsLeft > 0

  useEffect(() => {
    if (!coolingDown) return
    const timer = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(timer)
  }, [coolingDown])

  function markCodeSent() {
    setNow(Date.now())
    setCooldown(rememberCodeSent('password-reset'))
  }

  function resend() {
    if (busy || Date.now() < cooldown) return
    void run(async () => {
      const { error } = await signIn.resetPasswordEmailCode.sendCode()
      if (error) {
        setFailure(clerkMessage(error, 'Could not resend the reset code. Try again or start again.'))
        return
      }
      markCodeSent()
    }, 'Could not resend the reset code. Try again or start again.')
  }

  function submit(data: FormData) {
    return run(async () => {
      if (step === 'email') {
        if (Date.now() < cooldown) return
        const email = String(data.get('email') ?? '').trim()
        if (!z.email().safeParse(email).success) {
          setFailure('Enter a valid email address.')
          return
        }
        const { error } = await signIn.create({ identifier: email })
        const result = error ? { error } : await signIn.resetPasswordEmailCode.sendCode()
        if (result.error) {
          setFailure('A password reset code could not be requested. Check your email address or try again later.')
          return
        }
        markCodeSent()
        setStep('code')
        return
      }
      if (step === 'code') {
        const code = String(data.get('code') ?? '').trim()
        if (!/^\d{6}$/.test(code)) {
          setFailure('Enter the six-digit code.')
          return
        }
        const { error } = await signIn.resetPasswordEmailCode.verifyCode({ code })
        if (error) {
          setFailure(clerkMessage(error, 'The code could not be verified. Check it or start again.'))
          return
        }
        setStep('password')
        return
      }
      const password = String(data.get('password') ?? '')
      if (password.length < 15 || password !== data.get('confirmation')) {
        setFailure('Use at least 15 characters and enter the same password twice.')
        return
      }
      if (signIn.status === 'needs_new_password') {
        const { error } = await signIn.resetPasswordEmailCode.submitPassword({ password, signOutOfOtherSessions: true })
        if (error) {
          setFailure(clerkMessage(error, 'Clerk could not reset your password. Try again.'))
          return
        }
      }
      if (signIn.status === 'complete') {
        const { error } = await signIn.finalize({ navigate: finalizeNavigation })
        if (error) setFailure(clerkMessage(error, 'Could not start your session. Try signing in with your new password.'))
      } else if (needsEmailFactor(signIn)) {
        void navigate('/sign-in/verify-email' + next, { replace: true, state: { requestCode: true } })
      } else {
        setFailure('Clerk requires another account step. Return to sign-in or contact your workspace administrator.')
      }
    }, 'Clerk could not complete the password reset. Check your connection and try again.')
  }

  return (
    <AuthLayout title="Reset your password" description={step === 'email'
      ? 'Enter your email address to request a reset code.'
      : step === 'code' ? 'Enter the six-digit code sent to your email.' : 'Choose and confirm a new password.'}>
      <form key={step} className="space-y-4" aria-busy={busy} onSubmit={(event) => {
        event.preventDefault()
        void submit(new FormData(event.currentTarget))
      }}>
        {step === 'email' && <AuthField id="reset-email" name="email" label="Email address" placeholder="you@example.com" type="email" autoComplete="email" disabled={busy} required />}
        {step === 'code' && <AuthField id="reset-code" name="code" label="Verification code" placeholder="Enter the 6-digit code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} disabled={busy} required />}
        {step === 'password' && (
          <>
            <AuthField id="reset-password" name="password" label="New password" placeholder="Create a new password" type="password" autoComplete="new-password" hint="Use at least 15 characters." disabled={busy} required />
            <AuthField id="reset-confirmation" name="confirmation" label="Confirm password" placeholder="Re-enter your new password" type="password" autoComplete="new-password" disabled={busy} required />
          </>
        )}
        <AuthError message={failure} />
        <AuthSubmit busy={busy} disabled={step === 'email' && coolingDown}>{step === 'email' ? (coolingDown ? `Send reset code in ${secondsLeft}s` : 'Send reset code') : step === 'code' ? 'Verify code' : 'Reset password'}</AuthSubmit>
      </form>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" asChild><Link to={'/sign-in' + next}>Back to sign-in</Link></Button>
        {step === 'code' && <Button type="button" variant="outline" disabled={busy || coolingDown} onClick={resend}>
          {coolingDown ? `Resend in ${secondsLeft}s` : 'Resend code'}
        </Button>}
        {step !== 'email' && <Button type="button" variant="ghost" disabled={busy} onClick={() => {
          void run(async () => {
            const { error } = await signIn.reset()
            if (error) {
              setFailure(clerkMessage(error, 'Could not restart the password reset.'))
              return
            }
            setStep('email')
          }, 'Could not restart the password reset.')
        }}>Start again</Button>}
      </div>
    </AuthLayout>
  )
}
