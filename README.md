# TaskFlow

TaskFlow is a responsive task manager with a dashboard, a searchable task list, and a Kanban board. It supports task creation, editing, completion, deletion, due dates, priority and status filters, and persistent board ordering. Accounts can save a TaskFlow display name.

## Stack and architecture

React, TypeScript, Vite, React Router, Tailwind CSS, shadcn/ui, and TanStack Query power the frontend. Custom Clerk screens support email/password, signup verification, password recovery, and Google sign-in. One Cloudflare Worker serves the SPA and the same-origin Hono API. Drizzle and node-postgres connect to Supabase PostgreSQL. Hosted database access uses a Hyperdrive binding. The API verifies Clerk sessions and PostgreSQL row-level security scopes records to the verified user.

## Local setup

1. Run `npm ci`.
2. Copy `.env.example` to `.env.local` and set `VITE_CLERK_PUBLISHABLE_KEY` for the Clerk development instance.
3. Copy `.dev.vars.example` to `.dev.vars`. Set `APP_ENV`, `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_AUTHORIZED_PARTIES`, and `DATABASE_URL`. Use the restricted runtime login and verified TLS. Place the Supabase CA at `prod-ca-2021.crt` or set `NODE_EXTRA_CA_CERTS`.
4. Run `npm run dev` and open [localhost:8787](http://localhost:8787).

Set `MIGRATION_DATABASE_URL` in the ignored `.env` for the migration administrator. Verify the target database before applying migrations. The [backend setup](docs/backend.md) documents the migration command and restricted runtime-role provisioning.

## Tests

Run `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build`. After building, run `npm run test:worker` for a local Workerd smoke test of SPA routes, API health, and signed-out request handling. The automated tests use mocked Clerk or database dependencies where applicable. Verify authenticated workflows with a real Clerk session.

## Deployment

Configure a cache-disabled `HYPERDRIVE` binding with the restricted PostgreSQL login, Supabase CA, and hostname verification. Provide `VITE_CLERK_PUBLISHABLE_KEY` at build time and the matching Worker `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` at runtime. Set `CLERK_AUTHORIZED_PARTIES` to the exact hosted origin and verify the Google flow returns through `/sso-callback`.

After approval, run `npm run build` followed by `npx --no-install wrangler deploy`. Confirm the deployed SPA paths and API responses before publishing the URL. See [backend deployment setup](docs/backend.md) for additional details.

## Known limitations

The custom UI supports email-code verification. Other Clerk verification factors and unsupported session tasks show recovery guidance. A hosted assessment preview using Clerk development keys has Clerk’s development-instance restrictions.

The [live assessment preview](https://taskflow.zaidansari2249.workers.dev) passed public route, health, and signed-out API checks. Signed-in persistence through the hosted Worker still needs verification. GitHub submission is pending. See the [assessment submission draft](docs/assessment-submission.md).
