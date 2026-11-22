// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, expect, it, vi } from 'vitest'
import { ProfilePhotoEditor } from './profile-photo-editor'

const { user, notify } = vi.hoisted(() => ({
  user: { hasImage: false, imageUrl: 'https://images.example.test/default', setProfileImage: vi.fn(), reload: vi.fn() },
  notify: vi.fn(),
}))
vi.mock('@clerk/react', () => ({ useUser: () => ({ user }) }))
vi.mock('sonner', () => ({ toast: { success: notify } }))

afterEach(() => { cleanup(); vi.resetAllMocks(); user.hasImage = false })

it('rejects unsupported uploads and uses Clerk to upload and remove a photo', async () => {
  user.setProfileImage.mockImplementation(async ({ file }) => { user.hasImage = Boolean(file) })
  user.reload.mockResolvedValue(user)
  const { container } = render(<MemoryRouter><ProfilePhotoEditor displayName="Ada Lovelace" /></MemoryRouter>)
  expect(screen.getByText('AL')).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Remove photo' })).toBeNull()
  const input = container.querySelector('input[type=file]')!
  fireEvent.change(input, { target: { files: [new File(['bad'], 'file.svg', { type: 'image/svg+xml' })] } })
  expect((await screen.findByRole('alert')).textContent).toContain('PNG')
  expect(user.setProfileImage).not.toHaveBeenCalled()
  const png = new File(['photo'], 'photo.png', { type: 'image/png' })
  fireEvent.change(input, { target: { files: [png] } })
  const remove = await screen.findByRole('button', { name: 'Remove photo' })
  expect(user.setProfileImage).toHaveBeenCalledWith({ file: png })
  fireEvent.click(remove)
  await waitFor(() => expect(notify).toHaveBeenCalledWith('Profile photo removed.'))
  expect(user.setProfileImage).toHaveBeenLastCalledWith({ file: null })
  expect(user.reload).toHaveBeenCalledTimes(2)
  expect(screen.queryByRole('button', { name: 'Remove photo' })).toBeNull()
  expect(screen.getByText('AL')).toBeTruthy()
})
