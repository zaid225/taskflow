// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, expect, it, vi } from 'vitest'
import { ProfileMenu } from './profile-menu'

const clerk = vi.hoisted(() => ({
  user: { hasImage: false, imageUrl: 'https://images.example.test/clerk-default', fullName: 'Ada Lovelace', primaryEmailAddress: { emailAddress: 'ada@example.test' } },
  signOut: vi.fn(),
}))
vi.mock('@clerk/react', () => ({ useUser: () => ({ user: clerk.user }), useClerk: () => clerk }))
vi.mock('@/features/profile/use-profile', () => ({ useProfile: () => ({ data: { displayName: 'Ada Test' } }) }))
afterEach(() => { cleanup(); clerk.user.hasImage = false })

it('opens by keyboard with profile actions and initials, and only offers removal for a reported image', async () => {
  const { rerender } = render(<MemoryRouter><ProfileMenu /></MemoryRouter>)
  const trigger = screen.getByRole('button', { name: 'Account menu' })
  expect(within(trigger).getByText('AT')).toBeTruthy()
  expect(trigger.querySelector('img')).toBeNull()
  fireEvent.keyDown(trigger, { key: 'ArrowDown' })
  const menu = within(await screen.findByRole('menu'))
  expect(menu.getByRole('menuitem', { name: 'My profile' }).getAttribute('href')).toBe('/profile')
  expect(menu.getByRole('menuitem', { name: 'Upload photo' }).getAttribute('href')).toBe('/profile#profile-photo')
  expect(menu.queryByRole('menuitem', { name: 'Remove photo' })).toBeNull()
  clerk.user.hasImage = true
  rerender(<MemoryRouter><ProfileMenu /></MemoryRouter>)
  expect(menu.getByRole('menuitem', { name: 'Remove photo' }).getAttribute('href')).toBe('/profile#remove-photo')
})
