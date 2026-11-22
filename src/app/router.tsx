import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { AppShell } from '@/components/layout/app-shell'
import { AuthBoundary, RequireSession, SignedOutOnly } from '@/features/auth/auth-boundary'
import { ContinueSignupPage } from '@/features/auth/continue-signup-page'
import { SsoCallbackPage } from '@/features/auth/sso-callback-page'
import { ForgotPasswordPage } from '@/features/auth/forgot-password-page'
import { CredentialsPage } from '@/features/auth/credentials-page'
import { SessionTaskPage } from '@/features/auth/session-task-page'
import { VerifyEmailPage } from '@/features/auth/verify-email-page'
import { ProfilePage } from '@/features/profile/profile-page'
import { DashboardPage } from '@/features/dashboard/pages/dashboard-page'
import { TaskLoading } from '@/features/tasks/components/task-feedback'
import { TaskWorkspace } from '@/features/tasks/task-workspace'
import { TasksPage } from '@/features/tasks/pages/tasks-page'
import { DesignSystemPage } from '@/pages/design-system-page'
import { NotFoundPage } from '@/pages/not-found-page'

const BoardPage = lazy(async () => ({ default: (await import('@/features/tasks/pages/board-page')).BoardPage }))

export function AppRoutes({ configured }: { configured: boolean }) {
  return (
    <Routes>
      <Route index element={<Navigate to="/dashboard" replace />} />
      <Route element={<AuthBoundary configured={configured} />}>
        <Route element={<SignedOutOnly />}>
          <Route path="sign-in" element={<CredentialsPage key="signin" mode="sign-in" />} />
          <Route path="sign-up" element={<CredentialsPage key="signup" mode="sign-up" />} />
          <Route path="sign-in/verify-email" element={<VerifyEmailPage key="signin" mode="signin" />} />
          <Route path="sign-up/verify-email" element={<VerifyEmailPage key="signup" mode="signup" />} />
          <Route path="sign-up/continue" element={<ContinueSignupPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password" element={<ForgotPasswordPage />} />
        </Route>
        <Route path="sso-callback" element={<SsoCallbackPage />} />
        <Route path="auth/session-task" element={<SessionTaskPage />} />
        <Route element={<RequireSession />}>
          <Route element={<TaskWorkspace><AppShell authenticated /></TaskWorkspace>}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="board" element={<Suspense fallback={<TaskLoading label="Loading board" />}><BoardPage /></Suspense>} />
          </Route>
        </Route>
      </Route>
      <Route element={<AppShell />}>
        <Route path="design-system" element={<DesignSystemPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
