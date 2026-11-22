// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, expect, it, vi } from 'vitest'
import type { Task } from '../../../../shared/schemas/tasks'
import { BoardPage } from './board-page'
import { TasksPage } from './tasks-page'

vi.mock('@clerk/react', () => ({ useAuth: () => ({ getToken: async () => 'test-session' }) }))
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('sonner', () => ({ toast }))

const id = '6ecb86a5-9bc7-41f8-a3a7-e9c588062faf'
const timestamp = '2026-11-22T00:00:00.000Z'
const original: Task = {
  id, title: 'Write application notes', description: null, priority: 'medium', status: 'todo',
  position: 0, dueDate: null, createdAt: timestamp, updatedAt: timestamp, completedAt: null,
}

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

function mount(initial: Task[] = [], failCreate = false, failDelete?: string, initialPath = '/tasks') {
  let rows = [...initial]
  const fetchMock = vi.fn(async (path: string, options: RequestInit) => {
    expect(new Headers(options.headers).get('Authorization')).toBe('Bearer test-session')
    const method = options.method ?? 'GET'
    const single = path.endsWith('/' + id)
    if (method === 'POST') {
      const fields = JSON.parse(String(options.body))
      expect(fields).toMatchObject({ title: 'Write application notes', status: 'todo', priority: 'medium', dueDate: null })
      if (failCreate) return Response.json({ error: { code: 'INTERNAL_ERROR', message: 'PRIVATE' } }, { status: 500 })
      const result = { ...original, ...fields }
      rows.push(result)
      return Response.json({ data: result }, { status: 201 })
    }
    if (method === 'PATCH') {
      expect(single).toBe(true)
      const result = { ...rows[0], ...JSON.parse(String(options.body)) }
      rows = [result]
      return Response.json({ data: result })
    }
    if (method === 'DELETE') {
      const target = path.split('/').at(-1)
      if (target === failDelete) return Response.json({ error: { code: 'INTERNAL_ERROR' } }, { status: 500 })
      rows = rows.filter((task) => task.id !== target)
      return new Response(null, { status: 204 })
    }
    return Response.json({ data: single ? rows[0] : rows })
  })
  vi.stubGlobal('fetch', fetchMock)
  const query = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(<QueryClientProvider client={query}><MemoryRouter initialEntries={[initialPath]}><Routes><Route path="/tasks" element={<TasksPage />} /><Route path="/board" element={<BoardPage />} /></Routes></MemoryRouter></QueryClientProvider>)
  return fetchMock
}

async function createTask() {
  fireEvent.click(screen.getByRole('button', { name: 'New task' }))
  const modal = within(await screen.findByRole('dialog', { name: 'Create task' }))
  expect(modal.getByLabelText('Title')).toBe(modal.getByPlaceholderText('e.g. Review project notes'))
  expect(modal.getByLabelText('Description')).toBe(modal.getByPlaceholderText('Add details or next steps'))
  const date = modal.getByLabelText('Due date') as HTMLInputElement
  expect(date.type).toBe('date')
  expect(date.hasAttribute('placeholder')).toBe(false)
  expect(date.getAttribute('aria-describedby')).toBe(modal.getByText('Use the calendar to pick a date, or leave it blank.').id)
  fireEvent.click(modal.getByRole('button', { name: 'Create task' }))
  await modal.findByRole('alert')
  fireEvent.change(modal.getByLabelText('Title'), { target: { value: 'Write application notes' } })
  fireEvent.click(modal.getByRole('button', { name: 'Create task' }))
  return modal
}

it('creates, reads, completes, reopens, edits and deletes tasks through the API', async () => {
  const fetchMock = mount()
  await screen.findByText('No tasks yet')
  await createTask()
  fireEvent.click(await screen.findByRole('button', { name: original.title }))
  let modal = within(await screen.findByRole('dialog', { name: 'Task details' }))
  fireEvent.click(await modal.findByRole('button', { name: 'Mark complete' }))
  fireEvent.click(await modal.findByRole('button', { name: 'Reopen' }))
  await modal.findByRole('button', { name: 'Mark complete' })
  fireEvent.click(modal.getByRole('button', { name: 'Edit task' }))
  modal = within(await screen.findByRole('dialog', { name: 'Edit task' }))
  expect((modal.getByLabelText('Title') as HTMLInputElement).value).toBe(original.title)
  fireEvent.change(modal.getByLabelText('Title'), { target: { value: 'Updated notes' } })
  fireEvent.click(modal.getByRole('button', { name: 'Save changes' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Updated notes' }))
  modal = within(await screen.findByRole('dialog', { name: 'Task details' }))
  fireEvent.click(await modal.findByRole('button', { name: 'Delete task' }))
  modal = within(await screen.findByRole('dialog', { name: 'Delete task?' }))
  fireEvent.click(modal.getByRole('button', { name: 'Delete task' }))
  await screen.findByText('No tasks yet')
  expect(fetchMock.mock.calls.filter(([, options]) => options.method).map(([, options]) => options.method))
    .toEqual(['POST', 'PATCH', 'PATCH', 'PATCH', 'DELETE'])
  expect(toast.success).toHaveBeenCalledWith('Task deleted')
})

it('keeps the create dialog open and never shows success after an API failure', async () => {
  const fetchMock = mount([], true)
  const modal = await createTask()
  await modal.findByText('TaskFlow could not complete the request. Try again.')
  expect(screen.queryByText('PRIVATE')).toBeNull()
  expect(toast.success).not.toHaveBeenCalled()
  expect(fetchMock.mock.calls.filter(([, opts]) => opts.method === 'POST')).toHaveLength(1)
})

it('sends search, status, priority and sort to the task list endpoint and clears filters', async () => {
  const fetchMock = mount([original])
  await screen.findByRole('button', { name: original.title })
  fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'todo' } })
  fireEvent.change(screen.getByLabelText('Priority'), { target: { value: 'high' } })
  fireEvent.change(screen.getByLabelText('Sort by'), { target: { value: 'dueDate' } })
  fireEvent.change(screen.getByLabelText('Direction'), { target: { value: 'asc' } })
  fireEvent.change(screen.getByLabelText('Search tasks'), { target: { value: 'work & notes' } })
  await waitFor(() => {
    const path = fetchMock.mock.calls.at(-1)?.[0] ?? ''
    expect(Object.fromEntries(new URL(path, 'https://test.invalid').searchParams)).toEqual({
      search: 'work & notes', priority: 'high', status: 'todo', sort: 'dueDate', direction: 'asc',
    })
  })
  fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
  expect((screen.getByLabelText('Search tasks') as HTMLInputElement).value).toBe('')
  expect((screen.getByLabelText('Status') as HTMLSelectElement).value).toBe('')
})


it('remembers table view and requires confirmation before deleting selected tasks', async () => {
  const failed = { ...original, id: '6ecb86a5-9bc7-41f8-a3a7-e9c588062fab', title: 'Review the release' }
  const untouched = { ...original, id: '6ecb86a5-9bc7-41f8-a3a7-e9c588062fac', title: 'Keep this task' }
  const fetchMock = mount([original, failed, untouched], false, failed.id)
  fireEvent.click(screen.getByRole('link', { name: 'Table' }))
  expect(localStorage.getItem('taskflow-task-view')).toBe('table')
  expect(screen.getByRole('link', { name: 'Board' }).getAttribute('href')).toBe('/board')
  await screen.findByRole('table')
  fireEvent.click(screen.getByRole('checkbox', { name: 'Select all visible tasks' }))
  expect(screen.getByText('3 selected')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }))
  fireEvent.click(screen.getByRole('checkbox', { name: 'Select ' + original.title }))
  fireEvent.click(screen.getByRole('checkbox', { name: 'Select ' + failed.title }))
  fireEvent.click(screen.getByRole('button', { name: 'Delete selected' }))
  const confirmation = within(await screen.findByRole('alertdialog', { name: 'Delete 2 tasks?' }))
  expect(fetchMock.mock.calls.filter(([, options]) => options.method === 'DELETE')).toHaveLength(0)
  fireEvent.click(confirmation.getByRole('button', { name: 'Delete tasks' }))
  await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Deleted 1 of 2 tasks. 1 could not be deleted.'))
  expect(toast.success).not.toHaveBeenCalled()
  expect(fetchMock.mock.calls.filter(([, options]) => options.method === 'DELETE').map(([path]) => path)).toEqual([
    '/api/v1/tasks/' + original.id, '/api/v1/tasks/' + failed.id,
  ])
  expect(screen.queryByRole('button', { name: original.title })).toBeNull()
  expect(screen.getByRole('button', { name: untouched.title })).toBeTruthy()
  expect((screen.getByRole('checkbox', { name: 'Select ' + failed.title }) as HTMLInputElement).checked).toBe(true)
})


it('opens Table directly from Board and keeps the three view links available', async () => {
  mount([original], false, undefined, '/board')
  const navigation = within(screen.getByRole('navigation', { name: 'Task view' }))
  expect(navigation.getByRole('link', { name: 'Board' }).getAttribute('aria-current')).toBe('page')
  fireEvent.click(navigation.getByRole('link', { name: 'Table' }))
  await screen.findByRole('table')
  expect(screen.getByRole('link', { name: 'Table' }).getAttribute('aria-current')).toBe('page')
  fireEvent.click(screen.getByRole('link', { name: 'List' }))
  expect(screen.queryByRole('table')).toBeNull()
  expect(screen.getByRole('link', { name: 'List' }).getAttribute('aria-current')).toBe('page')
})
