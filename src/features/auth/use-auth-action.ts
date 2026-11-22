import { useEffect, useRef, useState } from 'react'
import { clerkMessage } from './auth-flow'

export function useAuthAction() {
  const lock = useRef(false)
  const [pending, setPending] = useState(false)
  const [failure, setFailure] = useState('')

  async function run(action: () => Promise<void>, fallback: string) {
    if (lock.current) return
    lock.current = true
    setPending(true)
    setFailure('')
    try {
      await action()
    } catch (error) {
      setFailure(clerkMessage(error, fallback))
    } finally {
      lock.current = false
      setPending(false)
    }
  }

  return { run, pending, failure, setFailure }
}

export function useSlowAuthAction(pending: boolean) {
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    if (!pending) return
    const started = window.setTimeout(() => setSlow(true), 8_000)
    return () => {
      window.clearTimeout(started)
      setSlow(false)
    }
  }, [pending])
  return pending && slow
}
