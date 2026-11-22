// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, expect, it, vi } from 'vitest'
import { localDateKey } from '../data/calendar-dates'
import { CalendarPage } from './calendar-page'

vi.mock('@clerk/react', () => ({ useAuth: () => ({ getToken: async () => 'test-session' }) }))
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

it('groups tasks by date and opens the existing editor through task details', async () => {
  const today = localDateKey(new Date())
  const task = { id: 'a', title: 'Review the calendar', dueDate: today, priority: 'high', status: 'todo', description: null, position: 0 }
  vi.stubGlobal('fetch', vi.fn(async (url: string) => Response.json({ data: url.endsWith('/a') ? task : [task] })))
  render(<QueryClientProvider client={new QueryClient()}><MemoryRouter><CalendarPage /></MemoryRouter></QueryClientProvider>)
  expect(await screen.findByText('high priority')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Next month' }))
  expect(screen.getByText('No tasks due on this date.')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Today' }))
  fireEvent.click(screen.getByRole('button', { name: task.title }))
  const detail = within(await screen.findByRole('dialog', { name: 'Task details' }))
  fireEvent.click(await detail.findByRole('button', { name: 'Edit task' }))
  expect(await screen.findByRole('dialog', { name: 'Edit task' })).toBeTruthy()
})
