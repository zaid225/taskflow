import { useSignIn, useSignUp } from '@clerk/react'
import { REGEXP_ONLY_DIGITS } from 'input-otp'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Label } from '@/components/ui/label'
import { AuthError, AuthSubmit } from './auth-controls'
import { AuthLayout } from './auth-layout'
import { clerkMessage, codeCooldown, rememberCodeSent, useAuthDestination, useFinalizeNavigation } from './auth-flow'

export function VerifyEmailPage({ mode }: { mode: 'signin' | 'signup' }) {
  const creating = mode === 'signup'
  const { signUp, fetchStatus: signupFetch } = useSignUp()
  const { signIn, fetchStatus: signinFetch } = useSignIn()
  const { next } = useAuthDestination()
  const location = useLocation()
  const navigate = useNavigate()
  const finalizeNavigation = useFinalizeNavigation()
  const [needsCode, setNeedsCode] = useState(Boolean(location.state?.requestCode || location.state?.sendFailed))
  const returnUrl = (creating ? '/sign-up' : '/sign-in') + next
  const [code, setCode] = useState('')
  const [failure, setFailure] = useState(location.state?.sendFailed ? 'The code could not be sent. Request a new code to continue.' : '')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [cooldown, setCooldown] = useState(() => codeCooldown(mode))
  const [now, setNow] = useState(Date.now)
  const lock = useRef(false)
  const sdkBusy = (creating ? signupFetch : signinFetch) === 'fetching'
  const waiting = busy || sdkBusy
  const secondsLeft = Math.max(0, Math.ceil((cooldown - now) / 1000))
  const attempt = creating ? signUp : signIn
  const complete = attempt.status === 'complete' && !attempt.canBeDiscarded
  const signupReady = signUp.status === 'missing_requirements' &&
    signUp.unverifiedFields.includes('email_address') && !signUp.missingFields.length
  const additionalFactor = signIn.status === 'needs_client_trust' || signIn.status === 'needs_second_factor'
  const signinReady = additionalFactor && signIn.supportedSecondFactors.some(({ strategy }) => strategy === 'email_code')
  const usable = !attempt.canBeDiscarded && (creating ? signupReady : signinReady)

  useEffect(() => {
    if (secondsLeft === 0) return
    const timer = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(timer)
  }, [secondsLeft])

  async function perform(action: () => Promise<void>) {
    if (lock.current || sdkBusy) return
    lock.current = true
    setBusy(true)
    setFailure('')
    setNotice('')
    try {
      await action()
    } catch {
      setFailure('Clerk could not complete the request. Check your connection and try again.')
    } finally {
      lock.current = false
      setBusy(false)
    }
  }

  function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!complete && !/^\d{6}$/.test(code)) {
      setFailure('Enter the six-digit code.')
      return
    }
    void perform(async () => {
      if (!complete) {
        const { error } = creating
          ? await signUp.verifications.verifyEmailCode({ code })
          : await signIn.mfa.verifyEmailCode({ code })
        if (error) {
          setFailure(clerkMessage(error, 'The code could not be verified. Check the code or request a new one.'))
          return
        }
      }
      if (attempt.status !== 'complete') {
        setFailure('An additional account step is required. Start over or contact your workspace administrator.')
        return
      }
      const { error } = await attempt.finalize({ navigate: finalizeNavigation })
      if (error) setFailure(clerkMessage(error, 'Could not start your session. Try continuing again.'))
    })
  }

  function resend() {
    if (Date.now() < cooldown) return
    void perform(async () => {
      const { error } = creating
        ? await signUp.verifications.sendEmailCode()
        : await signIn.mfa.sendEmailCode()
      if (error) {
        setFailure(clerkMessage(error, 'The code could not be sent. Wait a moment and try again.'))
        return
      }
      setNeedsCode(false)
      setCode('')
      setNow(Date.now())
      setCooldown(rememberCodeSent(mode))
      setNotice('A new code was requested.')
    })
  }

  function restart() {
    void perform(async () => {
      const { error } = await attempt.reset()
      if (error) setFailure('Could not restart verification. Try again.')
      else void navigate(returnUrl, { replace: true })
    })
  }

  if (!usable && !complete && !waiting) {
    return (
      <AuthLayout title="Verification unavailable" description={!creating && additionalFactor
        ? 'Your account requires a verification method that TaskFlow does not support yet. Ask your workspace administrator for help.'
        : 'There is no active email verification attempt. Start again to request a new code.'}>
        <div className="space-y-4">
          <AuthError message={failure} />
          {attempt.id ? <Button type="button" variant="outline" onClick={restart}>Start over</Button>
            : <Button asChild variant="outline"><Link to={returnUrl}>Start over</Link></Button>}
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title={creating ? 'Verify your email' : 'Verify this sign-in'}
      description={complete ? 'Verification is complete. Continue to your workspace.'
        : needsCode ? 'Request a six-digit code to verify your email address.' : 'Enter the six-digit code sent to your email address.'}>
      <form className="space-y-4" onSubmit={verify} aria-busy={waiting} noValidate>
        {!complete && (
          <div className="space-y-2">
            <Label htmlFor="auth-code">Verification code</Label>
            <InputOTP id="auth-code" placeholder="------" autoComplete="one-time-code" inputMode="numeric" pattern={REGEXP_ONLY_DIGITS}
              maxLength={6} value={code} onChange={setCode} disabled={waiting} aria-invalid={Boolean(failure)}
              aria-describedby={failure ? 'verification-error' : undefined}>
              <InputOTPGroup className="w-full">
                {Array.from({ length: 6 }, (_, index) => (
                  <InputOTPSlot index={index} key={index} className="h-11 flex-1 border-muted-foreground" />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
        )}
        {failure && <div id="verification-error"><AuthError message={failure} /></div>}
        <p role="status" className={notice ? 'text-sm text-muted-foreground' : 'sr-only'}>{notice}</p>
        <AuthSubmit busy={waiting}>{complete ? 'Continue' : 'Verify code'}</AuthSubmit>
      </form>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        {!complete && <Button type="button" variant="outline" disabled={waiting || secondsLeft > 0} onClick={resend}>
          {secondsLeft > 0 ? `Resend in ${secondsLeft}s` : needsCode ? 'Send code' : 'Resend code'}
        </Button>}
        <Button type="button" variant="ghost" disabled={waiting} onClick={restart}>Start over</Button>
      </div>
    </AuthLayout>
  )
}
