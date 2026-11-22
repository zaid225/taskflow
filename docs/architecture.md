# TaskFlow architecture

Vite serves a React application with one declarative BrowserRouter. The Clerk provider lives inside that router. Public design-system and not-found pages can render without Clerk configuration. An auth boundary handles provider loading and failures, and a session guard protects the dashboard, task list, and board.

Custom forms and verification screens live under `src/features/auth`. Clerk owns authentication attempts and sessions. Google OAuth returns unfinished attempts to the app’s `/sso-callback`, which uses Clerk’s callback handler and routes to custom signup or verification screens as needed. The task views use the Worker API with a TanStack Query cache scoped to the active Clerk session.

The Hono Worker independently verifies Clerk bearer sessions. Each task operation binds the verified Clerk user ID in a transaction-local PostgreSQL setting and passes that transaction into the owner-scoped repository. Worker-first routing serves the API under `/api`, while static assets use SPA fallback. Route handlers validate shared Zod schemas, services serialize task records, and the Drizzle repository owns PostgreSQL queries and transactions. The React guard only controls the frontend experience.
