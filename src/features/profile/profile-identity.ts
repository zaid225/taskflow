type Account = {
  fullName?: string | null
  firstName?: string | null
  lastName?: string | null
  primaryEmailAddress?: { emailAddress: string } | null
}

export function profileIdentity(displayName?: string | null, user?: Account | null) {
  const accountName = user?.fullName?.trim() || [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim()
  const email = user?.primaryEmailAddress?.emailAddress ?? ''
  const name = displayName?.trim() || accountName || email.split('@')[0] || 'User'
  const letters = (email && name === email.split('@')[0] && !accountName && !displayName?.trim())
    ? [name] : name.split(/\s+/)
  const initials = Array.from(letters.slice(0, 2).map((word) => word.match(/[\p{L}\p{N}]/u)?.[0] ?? '').join('').toUpperCase())
    .slice(0, 2).join('') || 'U'
  return { name, accountName: accountName || name, email, initials }
}

export function profilePhotoError(file: File) {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) return 'Choose a PNG, JPEG, or WebP image.'
  if (file.size > 5 * 1024 * 1024) return 'Choose an image no larger than 5 MB.'
  if (file.size === 0) return 'Choose a nonempty image.'
}
