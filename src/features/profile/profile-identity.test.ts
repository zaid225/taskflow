import { expect, it } from 'vitest'
import { profileIdentity, profilePhotoError } from './profile-identity'

it('derives initials in display name, Clerk name, email, and fallback order', () => {
  const user = { fullName: 'Mohammed Zaid', primaryEmailAddress: { emailAddress: 'user@example.com' } }
  expect(profileIdentity(null, user).initials).toBe('MZ')
  expect(profileIdentity('Zaid', user).initials).toBe('Z')
  expect(profileIdentity(null, { firstName: 'Asha', lastName: 'Rao' }).initials).toBe('AR')
  expect(profileIdentity(null, { primaryEmailAddress: user.primaryEmailAddress }).initials).toBe('U')
  expect(profileIdentity().initials).toBe('U')
})

it('enforces supported formats and the photo size limit', () => {
  expect(profilePhotoError(new File(['image'], 'photo.webp', { type: 'image/webp' }))).toBeUndefined()
  expect(profilePhotoError(new File(['image'], 'photo.svg', { type: 'image/svg+xml' }))).toContain('PNG')
  expect(profilePhotoError(new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'photo.png', { type: 'image/png' }))).toContain('5 MB')
})
