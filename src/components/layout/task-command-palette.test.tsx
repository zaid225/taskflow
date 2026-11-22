// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, expect, it, vi } from 'vitest'
import { TaskCommandPalette } from './task-command-palette'

vi.mock('@clerk/react', () => ({ useAuth: () => ({ getToken: async () => 'test-session' }) }))
afterEach(cleanup)

it('leaves text entry alone, opens and dismisses with the keyboard, and runs workspace commands', async () => {
  const theme = vi.fn()
  render(<QueryClientProvider client={new QueryClient()}><MemoryRouter>
    <input aria-label="Existing input" />
    <TaskCommandPalette onToggleTheme={theme} />
    <Routes><Route index element={<p>Start page</p>} /><Route path="/calendar" element={<h1>Calendar route</h1>} /></Routes>
  </MemoryRouter></QueryClientProvider>)
  fireEvent.keyDown(screen.getByLabelText('Existing input'), { key: 'k', ctrlKey: true })
  expect(screen.queryByRole('dialog')).toBeNull()
  fireEvent.keyDown(window, { key: 'k', metaKey: true })
  await screen.findByRole('dialog', { name: 'Command palette' })
  fireEvent.keyDown(screen.getByLabelText('Search tasks or commands'), { key: 'Escape' })
  expect(screen.queryByRole('dialog')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Open command palette' }))
  fireEvent.click(screen.getByRole('button', { name: 'Switch light/dark theme' }))
  expect(theme).toHaveBeenCalledOnce()
  fireEvent.click(screen.getByRole('button', { name: 'Open command palette' }))
  fireEvent.click(screen.getByRole('button', { name: 'Go to Calendar' }))
  expect(await screen.findByRole('heading', { name: 'Calendar route' })).toBeTruthy()
})
