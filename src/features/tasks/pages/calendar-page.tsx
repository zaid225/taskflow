import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import type { Task } from '../../../../shared/schemas/tasks'
import { useTaskList } from '../api/task-queries'
import { PriorityBadge } from '../components/task-badges'
import { useTaskDialogs } from '../components/task-dialog-state'
import { TaskDialogs } from '../components/task-dialogs'
import { TaskError, TaskLoading } from '../components/task-feedback'
import { TaskViewSwitcher } from '../components/task-view-switcher'
import { dateFromKey, localDateKey, monthDays, shiftMonth } from '../data/calendar-dates'

const monthFormat = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' })
const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'full', timeZone: 'UTC' })
const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const dateOffset = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }

export function CalendarPage() {
  const today = localDateKey(new Date())
  const [selected, setSelected] = useState(today)
  const month = selected.slice(0, 7)
  const dayButtons = useRef(new Map<string, HTMLButtonElement>())
  const tasks = useTaskList({ sort: 'updatedAt', direction: 'desc' })
  const { dialog, setDialog } = useTaskDialogs()
  const byDay = new Map<string, Task[]>()
  for (const task of tasks.data ?? []) {
    if (!task.dueDate) continue
    const day = byDay.get(task.dueDate)
    if (day) day.push(task)
    else byDay.set(task.dueDate, [task])
  }
  const dayTasks = byDay.get(selected) ?? []

  return (
    <div className="space-y-5">
      <header><h1 className="text-3xl font-semibold tracking-tight">Calendar</h1>
        <p className="mt-2 text-muted-foreground">See tasks by due date.</p>
      </header>
      <TaskViewSwitcher view="calendar" />
      <section aria-label="Monthly calendar" className="space-y-3 rounded-xl border bg-card p-3 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold" aria-live="polite">{monthFormat.format(dateFromKey(month + '-01'))}</h2>
          <div className="flex gap-1">
            <Button variant="outline" size="icon-lg" aria-label="Previous month" onClick={() => setSelected(shiftMonth(month, -1) + '-01')}><ChevronLeft /></Button>
            <Button variant="outline" size="lg" onClick={() => setSelected(today)}>Today</Button>
            <Button variant="outline" size="icon-lg" aria-label="Next month" onClick={() => setSelected(shiftMonth(month, 1) + '-01')}><ChevronRight /></Button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {weekdays.map(day => <span key={day} className="text-center text-xs text-muted-foreground">{day}</span>)}
          {monthDays(month).map((day, index) => {
            if (!day) return <span key={'empty-' + index} />
            const count = byDay.get(day)?.length ?? 0
            return (
              <button key={day} type="button" ref={(node) => { if (node) dayButtons.current.set(day, node); else dayButtons.current.delete(day) }}
                aria-label={dateFormat.format(dateFromKey(day)) + (count ? `, ${count} due` : '')}
                aria-pressed={selected === day} aria-current={today === day ? 'date' : undefined}
                tabIndex={selected === day ? 0 : -1}
                onKeyDown={(event) => {
                  if (!(event.key in dateOffset)) return
                  event.preventDefault()
                  const next = dateFromKey(day)
                  next.setUTCDate(next.getUTCDate() + dateOffset[event.key as keyof typeof dateOffset])
                  const key = next.toISOString().slice(0, 10)
                  setSelected(key)
                  requestAnimationFrame(() => dayButtons.current.get(key)?.focus())
                }}
                onClick={() => setSelected(day)}
                className="control-focus relative min-h-10 min-w-0 rounded-md border border-border p-1 text-sm hover:bg-accent aria-pressed:border-primary aria-pressed:bg-accent aria-pressed:text-accent-foreground sm:min-h-14">
                <span className={today === day ? 'font-bold text-primary' : undefined}>{Number(day.slice(-2))}</span>
                {count > 0 && <span aria-hidden="true" className="ml-1 text-[10px] text-muted-foreground">{count}</span>}
              </button>
            )
          })}
        </div>
      </section>
      <section aria-labelledby="calendar-day" className="space-y-3">
        <h2 id="calendar-day" className="font-semibold">{dateFormat.format(dateFromKey(selected))}</h2>
        {tasks.isPending ? <TaskLoading label="Loading scheduled tasks" /> : tasks.isError
          ? <TaskError error={tasks.error} retry={() => void tasks.refetch()} />
          : !dayTasks.length ? <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No tasks due on this date.</p>
          : <ul className="divide-y rounded-lg border bg-card">
            {dayTasks.map(task => <li key={task.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
              <button type="button" className="control-focus rounded-sm text-left font-medium hover:underline"
                onClick={() => setDialog({ type: 'details', id: task.id })}>{task.title}</button>
              <PriorityBadge priority={task.priority} />
            </li>)}
          </ul>}
      </section>
      <TaskDialogs dialog={dialog} onChange={setDialog} />
    </div>
  )
}
