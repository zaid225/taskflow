// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ForgotPasswordPage } from './forgot-password-page'

const signIn = vi.hoisted(() => ({
  status: 'needs_first_factor',
  create: vi.fn(),
  reset: vi.fn(),
  finalize: vi.fn(),
  supportedSecondFactors: [],
  resetPasswordEmailCode: { sendCode: vi.fn(), verifyCode: vi.fn(), submitPassword: vi.fn() },
}))

vi.mock('@clerk/react', () => ({ useSignIn: () => ({ signIn, fetchStatus: 'idle' }) }))

beforeEach(() => {
  sessionStorage.clear()
  signIn.status = 'needs_first_factor'
  signIn.create.mockResolvedValue({ error: null })
  signIn.reset.mockResolvedValue({ error: null })
  signIn.resetPasswordEmailCode.sendCode.mockResolvedValue({ error: null })
  signIn.finalize.mockResolvedValue({ error: null })
})

afterEach(() => {
  cleanup()
  vi.resetAllMocks()
  vi.restoreAllMocks()
})

function beginReset() {
  render(<MemoryRouter><ForgotPasswordPage /></MemoryRouter>)
  fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'test@example.com' } })
  fireEvent.click(screen.getByRole('button', { name: 'Send reset code' }))
}

it('keeps the email form available when Clerk rejects sending a reset code', async () => {
  signIn.resetPasswordEmailCode.sendCode.mockResolvedValue({ error: { code: 'too_many_attempts' } })
  beginReset()
  expect((await screen.findByRole('alert')).textContent).toContain('A password reset code could not be requested')
  expect(screen.getByRole('button', { name: 'Send reset code' })).not.toHaveProperty('disabled', true)
  expect(signIn.resetPasswordEmailCode.verifyCode).not.toHaveBeenCalled()
})

it('enforces cooldown, recovers from an expired code, and finalizes a successful reset', async () => {
  let time = Date.now()
  vi.spyOn(Date, 'now').mockImplementation(() => time)
  const reset = signIn.resetPasswordEmailCode
  reset.verifyCode.mockResolvedValueOnce({ error: { code: 'form_code_expired' } }).mockImplementation(async () => {
    signIn.status = 'needs_new_password'
    return { error: null }
  })
  reset.submitPassword.mockImplementation(async () => {
    signIn.status = 'complete'
    return { error: null }
  })
  beginReset()
  const code = await screen.findByLabelText('Verification code')
  const resend = screen.getByRole('button', { name: /Resend in/ })
  expect(resend).toHaveProperty('disabled', true)
  fireEvent.change(code, { target: { value: '123456' } })
  fireEvent.click(screen.getByRole('button', { name: 'Verify code' }))
  expect((await screen.findByRole('alert')).textContent).toContain('That code has expired')
  time += 31_000
  fireEvent.click(await screen.findByRole('button', { name: 'Resend code' }))
  await waitFor(() => expect(reset.sendCode).toHaveBeenCalledTimes(2))
  await waitFor(() => expect(screen.getByRole('button', { name: 'Verify code' })).not.toHaveProperty('disabled', true))
  fireEvent.change(code, { target: { value: '654321' } })
  fireEvent.click(screen.getByRole('button', { name: 'Verify code' }))
  const newPassword = await screen.findByLabelText('New password')
  fireEvent.change(newPassword, { target: { value: 'test-password-example' } })
  fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'test-password-example' } })
  fireEvent.click(screen.getByRole('button', { name: 'Reset password' }))
  await waitFor(() => expect(signIn.finalize).toHaveBeenCalledOnce())
  expect(reset.submitPassword).toHaveBeenCalledWith({ password: 'test-password-example', signOutOfOtherSessions: true })
})
