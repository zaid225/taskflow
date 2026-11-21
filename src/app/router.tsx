import { Navigate, Route, Routes } from 'react-router'
import { AppShell } from '@/components/layout/app-shell'
import { DashboardPage } from '@/features/dashboard/pages/dashboard-page'
import { BoardPage } from '@/features/tasks/pages/board-page'
import { TasksPage } from '@/features/tasks/pages/tasks-page'
import { DesignSystemPage } from '@/pages/design-system-page'
import { NotFoundPage } from '@/pages/not-found-page'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="board" element={<BoardPage />} />
        <Route path="design-system" element={<DesignSystemPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
