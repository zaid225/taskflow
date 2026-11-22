import { Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Dialog } from 'radix-ui'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTaskList } from '@/features/tasks/api/task-queries'
import { TaskDialogs } from '@/features/tasks/components/task-dialogs'
import { useTaskDialogs } from '@/features/tasks/components/task-dialog-state'

const destinations = [
  ['Go to Dashboard', '/dashboard'], ['Go to My Tasks', '/tasks'], ['Go to Kanban', '/board'],
  ['Go to Calendar', '/calendar'], ['Go to Profile', '/profile'],
] as const

export function TaskCommandPalette({ onToggleTheme }: { onToggleTheme: () => void }) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const trigger = useRef<HTMLButtonElement>(null)
  const { dialog, setDialog } = useTaskDialogs()
  const tasks = useTaskList({ search, sort: 'updatedAt', direction: 'desc' }, open && Boolean(search))
  const term = input.trim().toLowerCase()

  useEffect(() => {
    if (!open) return
    const timeout = window.setTimeout(() => setSearch(input.trim()), 250)
    return () => window.clearTimeout(timeout)
  }, [input, open])

  useEffect(() => {
    function onShortcut(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey || event.key.toLowerCase() !== 'k') return
      if (event.defaultPrevented || event.repeat || event.isComposing || open || dialog || document.querySelector('[role="dialog"], [role="alertdialog"], [role="menu"]')) return
      if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])')) return
      event.preventDefault()
      setOpen(true)
    }
    window.addEventListener('keydown', onShortcut)
    return () => window.removeEventListener('keydown', onShortcut)
  }, [dialog, open])

  function close() {
    setOpen(false)
    setInput('')
    setSearch('')
  }

  function run(action: () => void) {
    close()
    action()
  }

  return (
    <>
      <Dialog.Root open={open} onOpenChange={(next) => next ? setOpen(true) : close()}>
        <Dialog.Trigger asChild>
          <Button ref={trigger} type="button" size="icon" variant="outline" aria-label="Open command palette" aria-keyshortcuts="Control+K Meta+K"><Search /></Button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/55" />
          <Dialog.Content onCloseAutoFocus={event => {
            event.preventDefault()
            if (!dialog) trigger.current?.focus()
          }} className="fixed top-[12vh] left-1/2 z-50 flex max-h-[76dvh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 flex-col gap-2 rounded-xl border bg-popover p-4 text-popover-foreground shadow-lg">
            <Dialog.Title className="font-semibold">Command palette</Dialog.Title>
            <Dialog.Description className="sr-only">Search your tasks or choose a workspace command.</Dialog.Description>
            <Input aria-label="Search tasks or commands" placeholder="Search tasks or commands" maxLength={160} value={input} onChange={event => setInput(event.target.value)} />
            <div className="min-h-0 space-y-1 overflow-y-auto">
              {([
                ['Create task', () => setDialog({ type: 'create' })],
                ...destinations.map(([label, path]) => [label, () => void navigate(path)] as const),
                ['Switch light/dark theme', onToggleTheme],
              ] as const).filter(([label]) => label.toLowerCase().includes(term)).map(([label, action]) => (
                <Button key={label} type="button" variant="ghost" className="h-10 w-full justify-start" onClick={() => run(action)}>{label}</Button>
              ))}
              {input.trim() && (search !== input.trim() || tasks.isPending ? <p role="status" className="p-2 text-sm">Searching tasks…</p>
                : tasks.isError ? <Button type="button" variant="outline" onClick={() => void tasks.refetch()}>Retry task search</Button>
                  : !tasks.data?.length ? <p className="p-2 text-sm text-muted-foreground">No matching tasks.</p>
                    : tasks.data.slice(0, 10).map(task => (
                      <Button key={task.id} type="button" variant="ghost" className="h-10 w-full justify-start" onClick={() => run(() => setDialog({ type: 'details', id: task.id }))}>
                        <span className="truncate">{task.title}</span>
                      </Button>
                    )))}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <TaskDialogs dialog={dialog} onChange={setDialog} />
    </>
  )
}
