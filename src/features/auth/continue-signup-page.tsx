import { useSignUp } from '@clerk/react'
import { Link, useNavigate } from 'react-router'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { AuthError, AuthField, AuthSubmit } from './auth-controls'
import { AuthLayout } from './auth-layout'
import { clerkMessage, rememberCodeSent, useAuthDestination, useFinalizeNavigation } from './auth-flow'
import { useAuthAction } from './use-auth-action'

const profileFields = [
  { requirement: 'first_name', key: 'firstName', label: 'First name', placeholder: 'Enter your first name', autocomplete: 'given-name' },
  { requirement: 'last_name', key: 'lastName', label: 'Last name', placeholder: 'Enter your last name', autocomplete: 'family-name' },
  { requirement: 'username', key: 'username', label: 'Username', placeholder: 'Choose a username', autocomplete: 'username' },
  { requirement: 'email_address', key: 'emailAddress', label: 'Email address', placeholder: 'you@example.com', autocomplete: 'email' },
] as const

export function ContinueSignupPage() {
  const { signUp, fetchStatus } = useSignUp()
  const { next } = useAuthDestination()
  const navigate = useNavigate()
  const finalizeNavigation = useFinalizeNavigation()
  const { failure, setFailure, pending, run } = useAuthAction()
  const busy = pending || fetchStatus === 'fetching'
  const fields = profileFields.filter(({ requirement }) => signUp.missingFields.some((field) => field === requirement))
  const unsupported = signUp.missingFields.some((field) => !profileFields.some(({ requirement }) => field === requirement))
  const unsupportedVerification = signUp.unverifiedFields.some((field) => field !== 'email_address')
  const active = Boolean(signUp.id) && !signUp.canBeDiscarded
  const canContinue = active && !unsupported && !unsupportedVerification
  const restart = '/sign-up' + next

  function complete(data: FormData) {
    return run(async () => {
      if (!canContinue) return
      if (fields.length) {
        const updates: Record<string, string> = {}
        for (const { key, label } of fields) {
          const value = String(data.get(key) ?? '').trim()
          if (!value || (key === 'emailAddress' && !z.email().safeParse(value).success)) {
            setFailure(`Enter a valid ${label.toLowerCase()}.`)
            return
          }
          updates[key] = value
        }
        const { error } = await signUp.update(updates)
        if (error) {
          setFailure(clerkMessage(error, 'Clerk could not save your account details. Check the fields and try again.'))
          return
        }
      }
      if (signUp.status === 'complete') {
        const { error } = await signUp.finalize({ navigate: finalizeNavigation })
        if (error) setFailure(clerkMessage(error, 'Could not start your session. Try again.'))
      } else if (signUp.unverifiedFields.includes('email_address') && !signUp.missingFields.length) {
        const { error } = await signUp.verifications.sendEmailCode()
        if (error) {
          setFailure(clerkMessage(error, 'The code could not be sent. Try again.'))
          return
        }
        rememberCodeSent('signup')
        void navigate('/sign-up/verify-email' + next, { replace: true })
      } else {
        setFailure('Clerk still needs more information. Complete the required fields or contact your workspace administrator.')
      }
    }, 'Clerk could not continue signup. Check your connection and try again.')
  }

  return (
    <AuthLayout title="Finish creating your account" description={!active
      ? 'There is no active signup to continue. Start again from TaskFlow.'
      : canContinue ? 'Complete the remaining steps to open your workspace.'
        : 'This signup needs a step TaskFlow cannot complete here. Contact your workspace administrator or start again.'}>
      {canContinue && (
        <form className="space-y-4" aria-busy={busy} onSubmit={(event) => {
          event.preventDefault()
          void complete(new FormData(event.currentTarget))
        }}>
          {fields.map(({ key, label, placeholder, autocomplete }) => (
            <AuthField key={key} name={key} id={key} label={label} placeholder={placeholder} autoComplete={autocomplete}
              type={key === 'emailAddress' ? 'email' : 'text'} required disabled={busy} />
          ))}
          <AuthError message={failure} />
          <AuthSubmit busy={busy}>{fields.length || signUp.status === 'complete' ? 'Continue' : 'Send verification code'}</AuthSubmit>
        </form>
      )}
      <Button asChild variant="outline" className={canContinue ? 'mt-4' : ''}><Link to={restart}>Back to signup</Link></Button>
    </AuthLayout>
  )
}
