import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSignOut } from './use-sign-out'

export function SignOutButton() {
  const { signOut, busy, error } = useSignOut()
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" disabled={busy} onClick={signOut}>
        <LogOut aria-hidden="true" /> {busy ? 'Signing out…' : 'Sign out'}
      </Button>
      {error && <span role="alert" className="text-xs">Sign-out failed. Try again.</span>}
    </div>
  )
}
