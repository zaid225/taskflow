import { useUser } from '@clerk/react'
import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProfileAvatar } from './profile-avatar'
import { profileIdentity, profilePhotoError } from './profile-identity'

export function ProfilePhotoEditor({ displayName }: { displayName?: string | null }) {
  const { user } = useUser()
  const { hash } = useLocation()
  const picker = useRef<HTMLInputElement>(null)
  const lock = useRef(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const { initials } = profileIdentity(displayName, user)

  useEffect(() => {
    if (hash === '#profile-photo' || hash === '#remove-photo') {
      document.getElementById(hash.slice(1))?.focus()
    }
  }, [hash])

  async function changePhoto(file: File | null) {
    if (!user || lock.current) return
    setError('')
    if (file) {
      const validation = profilePhotoError(file)
      if (validation) { setError(validation); return }
    }
    lock.current = true
    setBusy(true)
    try {
      await user.setProfileImage({ file })
      try {
        await user.reload()
        toast.success(file ? 'Profile photo saved.' : 'Profile photo removed.')
      } catch {
        setError('Your photo was saved, but the account could not refresh. Reload to see the change.')
      }
    } catch {
      setError(file ? 'The photo could not be uploaded. Try again.' : 'The photo could not be removed. Try again.')
    } finally {
      lock.current = false
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle>Profile photo</CardTitle><CardDescription>PNG, JPEG, or WebP up to 5 MB.</CardDescription></CardHeader>
      <CardContent className="space-y-3" aria-busy={busy}>
        <div className="flex flex-wrap items-center gap-3">
          <ProfileAvatar className="size-16 text-xl" initials={initials} user={user} />
          <input hidden type="file" ref={picker} accept="image/png,image/jpeg,image/webp" onChange={(event) => {
            const file = event.currentTarget.files?.[0]
            event.currentTarget.value = ''
            if (file) void changePhoto(file)
          }} />
          <Button id="profile-photo" type="button" variant="outline" disabled={!user || busy} onClick={() => picker.current?.click()}>
            {user?.hasImage ? 'Change photo' : 'Upload photo'}
          </Button>
          {user?.hasImage && <Button id="remove-photo" type="button" variant="ghost" disabled={busy} onClick={() => void changePhoto(null)}>Remove photo</Button>}
        </div>
        {busy && <p role="status" className="text-sm">Updating photo…</p>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  )
}
