import type { ComponentProps } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export function ProfileAvatar({ initials, user, ...props }: ComponentProps<typeof Avatar> & {
  initials: string
  user?: { hasImage: boolean; imageUrl: string } | null
}) {
  return (
    <Avatar aria-hidden="true" {...props}>
      {user?.hasImage && <AvatarImage src={user.imageUrl} alt="" />}
      <AvatarFallback className="bg-indigo-600 text-white dark:bg-indigo-900 dark:text-indigo-100">{initials}</AvatarFallback>
    </Avatar>
  )
}
