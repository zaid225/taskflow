import { Columns3, LayoutDashboard, ListTodo, PanelsTopLeft } from 'lucide-react'

export const navigation = [
  { to: '/dashboard', title: 'Overview', icon: LayoutDashboard },
  { to: '/tasks', title: 'My Tasks', icon: ListTodo },
  { to: '/board', title: 'Board', icon: Columns3 },
  ...(import.meta.env.DEV ? [{ to: '/design-system', title: 'Design system', icon: PanelsTopLeft }] : []),
]
