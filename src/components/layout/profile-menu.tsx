import { useUser } from '@clerk/react'
import { ChevronDown, ImagePlus, ImageOff, LogOut, UserRound } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSignOut } from '@/features/auth/use-sign-out'
import { ProfileAvatar } from '@/features/profile/profile-avatar'
import { profileIdentity } from '@/features/profile/profile-identity'
import { useProfile } from '@/features/profile/use-profile'

export function ProfileMenu() {
  const { user } = useUser()
  const profile = useProfile()
  const { signOut, busy, error } = useSignOut()
  const { name, accountName, email, initials } = profileIdentity(profile.data?.displayName, user)

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" className="h-10 max-w-52 gap-2 rounded-full px-1.5 sm:pr-3" aria-label="Account menu">
            <ProfileAvatar user={user} initials={initials} />
            <span className="hidden truncate sm:inline">{name}</span>
            <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <div className="flex items-center gap-3 p-2">
            <ProfileAvatar user={user} initials={initials} className="size-10" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{accountName}</p>
              {email && <p className="break-all text-xs text-muted-foreground">{email}</p>}
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild><Link to="/profile"><UserRound aria-hidden="true" /> My profile</Link></DropdownMenuItem>
          <DropdownMenuItem asChild><Link to="/profile#profile-photo"><ImagePlus aria-hidden="true" /> {user?.hasImage ? 'Change photo' : 'Upload photo'}</Link></DropdownMenuItem>
          {user?.hasImage && <DropdownMenuItem asChild><Link to="/profile#remove-photo"><ImageOff aria-hidden="true" /> Remove photo</Link></DropdownMenuItem>}
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={busy} onSelect={() => void signOut()}><LogOut aria-hidden="true" /> Sign out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {error && <span role="alert" className="text-xs text-destructive">Sign-out failed. Try again.</span>}
    </div>
  )
}
