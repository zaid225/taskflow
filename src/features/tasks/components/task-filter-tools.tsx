import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Task, TaskQuery } from '../../../../shared/schemas/tasks'
import { parseSavedTaskFilters, savedFilterLimit, type SavedTaskFilter } from '../data/saved-task-filters'
import { tasksToCsv } from '../data/task-csv'
import { TaskSelect } from './task-fields'

export function TaskFilterTools({ userId, filters, onRestore, tasks }: {
  userId: string
  filters: TaskQuery
  onRestore: (filters: TaskQuery) => void
  tasks?: readonly Task[]
}) {
  const key = 'taskflow-saved-filters:' + userId
  const [saved, setSaved] = useState(() => {
    try { return parseSavedTaskFilters(localStorage.getItem(key)) }
    catch { return [] }
  })
  const [name, setName] = useState('')
  const [selected, setSelected] = useState('')
  const [message, setMessage] = useState('')

  function persist(next: SavedTaskFilter[], feedback: string) {
    try {
      localStorage.setItem(key, JSON.stringify(next))
      setSaved(next)
      setMessage(feedback)
    } catch { setMessage('This browser could not save your filter preferences.') }
  }

  function save() {
    const label = name.trim()
    if (!label) return
    if (saved.length >= savedFilterLimit && !saved.some(item => item.name === label)) {
      setMessage('Remove a saved filter before adding another.')
      return
    }
    persist([...saved.filter(item => item.name !== label), { name: label, query: filters }], 'Filter saved.')
    setName('')
  }

  function download() {
    if (!tasks?.length) return
    const url = URL.createObjectURL(new Blob(['\uFEFF', tasksToCsv(tasks)], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'taskflow-tasks.csv'
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <section aria-label="Saved filters and export" className="flex flex-wrap items-end gap-2">
      <form className="flex flex-wrap items-end gap-2" onSubmit={event => { event.preventDefault(); save() }}>
        <Input aria-label="Filter name" placeholder="Filter name" className="w-36" value={name} maxLength={40} onChange={event => setName(event.target.value)} />
        <Button type="submit" variant="outline" disabled={!name.trim()}>Save filter</Button>
      </form>
      <TaskSelect aria-label="Saved filters" className="h-8 w-auto max-w-48" value={selected} onChange={event => setSelected(event.target.value)}>
        <option value="">Saved filters</option>
        {saved.map(item => <option key={item.name}>{item.name}</option>)}
      </TaskSelect>
      <Button type="button" variant="outline" disabled={!selected} onClick={() => {
        const item = saved.find(item => item.name === selected)
        if (item) { onRestore(item.query); setMessage('Filter restored.') }
      }}>Restore</Button>
      <Button type="button" variant="ghost" disabled={!selected} onClick={() => {
        persist(saved.filter(item => item.name !== selected), 'Saved filter removed.')
        setSelected('')
      }}>Remove saved filter</Button>
      <Button type="button" variant="outline" disabled={!tasks?.length} onClick={download}>Export CSV</Button>
      {message && <p role="status" className="basis-full text-sm text-muted-foreground">{message}</p>}
    </section>
  )
}
