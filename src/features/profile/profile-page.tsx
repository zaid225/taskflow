import { useUser } from '@clerk/react'
import { useState } from 'react'
import { updateProfileSchema } from '../../../shared/schemas/profile'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ProfilePhotoEditor } from './profile-photo-editor'
import { useProfile, useSaveProfile } from './use-profile'

export function ProfilePage() {
  const { user } = useUser()
  const profile = useProfile()
  const save = useSaveProfile()
  const [nameError, setNameError] = useState<string>()

  return (
    <section className="mx-auto max-w-xl space-y-6" aria-labelledby="profile-heading">
      <h1 id="profile-heading" className="text-2xl font-semibold">Profile</h1>
      <ProfilePhotoEditor displayName={profile.data?.displayName} />
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>These details come from your Clerk account.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3 text-sm">
            <div><dt className="font-medium">Name</dt><dd className="break-words text-muted-foreground">{user?.fullName || 'No name added'}</dd></div>
            <div><dt className="font-medium">Primary email</dt><dd className="break-all text-muted-foreground">{user?.primaryEmailAddress?.emailAddress || 'No primary email'}</dd></div>
          </dl>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>TaskFlow preferences</CardTitle>
          <CardDescription>Choose a display name for your TaskFlow profile.</CardDescription>
        </CardHeader>
        <CardContent>
          {profile.isPending && <p role="status">Loading profile…</p>}
          {profile.isError && (
            <div className="space-y-3">
              <p role="alert">{profile.error.message}</p>
              <Button variant="outline" onClick={() => void profile.refetch()}>Retry</Button>
            </div>
          )}
          {profile.data && (
            <form key={profile.data.displayName ?? ''} className="space-y-4" onSubmit={(event) => {
              event.preventDefault()
              const name = new FormData(event.currentTarget).get('displayName')
              const result = updateProfileSchema.safeParse({ displayName: typeof name === 'string' ? name.trim() || null : null })
              if (!result.success) {
                setNameError(result.error.issues[0]?.message)
                return
              }
              setNameError(undefined)
              save.mutate(result.data, {
                onSuccess: () => toast.success('Profile saved.'),
              })
            }}>
              <div className="space-y-2">
                <Label htmlFor="display-name">Display name</Label>
                <Input id="display-name" name="displayName" autoComplete="nickname" maxLength={80}
                  placeholder="Enter a display name" defaultValue={profile.data.displayName ?? ''} disabled={save.isPending}
                  aria-invalid={Boolean(nameError)} aria-describedby={nameError ? 'display-name-error' : undefined}
                  onChange={() => setNameError(undefined)} />
                {nameError && <p id="display-name-error" role="alert" className="text-sm text-destructive">{nameError}</p>}
              </div>
              {save.isError && <p role="alert" className="text-sm text-destructive">{save.error.message}</p>}
              <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save profile'}</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
