import { useClerk } from '@clerk/react'
import { LogOut } from 'lucide-react'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'

export function SignOutButton() {
  const clerk = useClerk()
  const navigate = useNavigate()
  const lock = useRef(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)

  async function signOut() {
    if (lock.current) return
    lock.current = true
    setBusy(true)
    setError(false)
    try {
      await clerk.signOut(() => navigate('/sign-in', { replace: true }))
    } catch {
      setError(true)
    } finally {
      lock.current = false
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" disabled={busy} onClick={signOut}>
        <LogOut aria-hidden="true" /> {busy ? 'Signing out…' : 'Sign out'}
      </Button>
      {error && <span role="alert" className="text-xs">Sign-out failed. Try again.</span>}
    </div>
  )
}
