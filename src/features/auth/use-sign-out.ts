import { useClerk } from '@clerk/react'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'

export function useSignOut() {
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

  return { signOut, busy, error }
}
