
# TaskFlow — Codex Engineering Instructions

## 1. Project Overview

TaskFlow is a full-stack task management assessment.

The goal is to build a secure, maintainable,
responsive application with persistent task data.

Assessment deliverables:
1. Working application and source code.
2. On-camera video explaining three engineering decisions.
3. Three deliberately excluded features with reasons.
4. One implementation limitation to address with another day.

## 2. Mandatory Technology Stack

Frontend:
- React with Vite
- TypeScript (strict mode)
- React Router
- Tailwind CSS v4
- shadcn/ui
- tweakcn theme
- TanStack Query
- React Hook Form
- Zod
- Lucide React
- Sonner

Authentication:
- Clerk React SDK
- Custom authentication UI only
- Clerk authentication middleware for Hono

Backend:
- Hono
- TypeScript
- Cloudflare Workers

Database:
- Supabase PostgreSQL
- Drizzle ORM and Drizzle Kit
- node-postgres (pg)
- Cloudflare Hyperdrive for production

Testing:
- Vitest
- React Testing Library
- Playwright
- API tests

## 3. Authentication Rules — Critical

Use Clerk as the authentication provider.

DO NOT use Clerk's prebuilt SignIn, SignUp,
or other prebuilt authentication forms.

Build custom React authentication screens using
shadcn/ui and the tweakcn theme.

Required flows:
- Email/password login
- Email/password signup
- Google login
- Google signup
- Email OTP verification for signup
- Forgot password using email OTP
- Password reset after OTP verification
- Resend OTP with cooldown
- Logout
- Protected routes
- Session loading and error states

Use supported Clerk custom authentication APIs.

Never implement custom password hashing or
store passwords or OTP codes in our database.

Never expose Clerk secret keys in the frontend.

All protected backend routes must verify
Clerk authentication.

Use the verified Clerk user ID for task ownership.
Clerk user IDs are strings, not UUIDs.

## 4. Project Architecture

Use one repository and one Cloudflare deployment.

Frontend:
src/app/
src/components/ui/
src/components/layout/
src/features/auth/
src/features/tasks/
src/features/dashboard/
src/lib/
src/styles/

Backend:
worker/routes/
worker/middleware/
worker/services/
worker/repositories/
worker/db/
worker/lib/

Shared:
shared/schemas/

Documentation:
docs/

Follow a feature-based frontend architecture.

Follow route -> service -> repository layering
in the backend.

Do not put SQL or database operations in
React components.

Do not put business logic directly in API routes.

Do not introduce unnecessary abstractions.

## 5. UI and Design Rules

Use shadcn/ui as the component foundation.
Use tweakcn for theme customization.

Prefer a clean, premium SaaS dashboard.
Support responsive desktop and mobile layouts.

Use a sidebar dashboard shell on desktop.
Use responsive navigation on mobile.

Required states:
- Loading
- Empty
- Error
- Success
- Disabled

Use accessible forms, labels, keyboard navigation
and semantic HTML.

Avoid unnecessary animation and UI clutter.

## 6. Task Features

Required:
- Create task
- Read tasks
- Update task
- Delete task
- Mark complete
- Status management
- Priority management
- Due date
- Search
- Filter
- Sort
- Dashboard statistics
- List view
- Kanban view

Prioritize reliable CRUD and persistence
before advanced UI features.

## 7. API Standards

Use REST endpoints under /api/v1.

Validate all inputs with Zod.
Use typed request and response definitions.
Return appropriate HTTP status codes.
Use consistent error responses.

Do not expose internal errors, SQL details,
tokens or sensitive information.

Always restrict task queries to the
authenticated Clerk user ID.

Do not trust user IDs submitted by the browser.

## 8. Database Rules

Use Drizzle migrations for schema changes.

Tasks must belong to a Clerk user ID stored
in a string column.

Do not reference Supabase auth.users.

Use database constraints and suitable indexes.
Use parameterized ORM queries.
Never construct SQL from untrusted input.

Keep database credentials server-side.

Do not run destructive migrations without
explicit approval.

## 9. Coding Standards

Use TypeScript strict mode.

Avoid any unless justified and documented.

Prefer named exports for reusable modules.

Use meaningful names and small functions.

Keep components focused on presentation
and interaction.

Use custom hooks where they improve clarity.

Do not add Redux or other state libraries
without a demonstrated need.

Do not introduce Next.js, NestJS,
Docker or Kubernetes for this assessment.

## 10. Testing Rules

Test important functionality and edge cases.

Frontend:
- Form validation
- Component behavior
- Loading and error handling

Backend:
- Authentication
- Input validation
- Task ownership
- CRUD operations
- Missing and invalid task IDs

End-to-end:
- Login and task workflow
- Task persistence
- Logout and route protection

After changes, run relevant tests,
linting, type checks and builds.

Report failures clearly.

## 11. Security Rules

Never hardcode secrets.

Never commit .env or .dev.vars files.

Never expose database credentials in Vite.

Use least-privilege database access.

Do not log passwords, OTPs or access tokens.

Require explicit approval before:
- Deployment
- Destructive operations
- Large dependency changes
- Database migration execution

## 12. Codex Workflow Rules

Work in small, reviewable phases.

Before implementing a phase:
1. Inspect the relevant existing files.
2. Explain the proposed changes.
3. Identify required dependencies.
4. Identify potential risks.
5. Wait for approval if the work exceeds
   the authorized phase.

After implementing:
1. Explain files created or modified.
2. Run appropriate checks.
3. Report the results accurately.
4. Explain any remaining issues.
5. Suggest the next logical phase.

Do not silently change the architecture.

Do not install unnecessary plugins or MCP tools.

Never claim a test passed unless it was run.

Keep documentation synchronized with code.

## 13. Assessment Documentation

Maintain:
- README.md
- docs/architecture.md
- docs/decisions.md
- docs/assessment-notes.md

Record significant engineering decisions,
excluded features and known limitations.

Do not claim unimplemented functionality works.
