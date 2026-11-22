# TaskFlow backend

Run `npm run dev` to start React and the Hono Worker from the same origin at `http://localhost:8787`. The frontend sends requests to relative `/api/v1` URLs. Vite exits if port 8787 is in use. After `npm run build`, run `npm run test:worker` to smoke-test the built app under Cloudflare Workerd. `npm test` exercises the API and actual Drizzle query generation with a scripted PostgreSQL driver. The test identity is injected only in tests. A real Clerk session and Supabase connection are needed for end-to-end persistence verification.

## Local environment

Use `.env.local` for the frontend's `VITE_CLERK_PUBLISHABLE_KEY`. Copy `.dev.vars.example` to `.dev.vars` if it does not exist. Set these Worker-only variables in that file.

| Variable or binding | Purpose |
| --- | --- |
| `CLERK_PUBLISHABLE_KEY` | Same Clerk instance as the frontend |
| `CLERK_SECRET_KEY` | Secret key for the Worker |
| `CLERK_AUTHORIZED_PARTIES` | Comma-separated, exact browser origins such as `http://localhost:8787` |
| `APP_ENV` | Set to `development` locally to permit a direct PostgreSQL connection |
| `DATABASE_URL` | Local runtime connection string for a restricted PostgreSQL role |
| `HYPERDRIVE` | Cloudflare binding required for production database access |
| `MIGRATION_DATABASE_URL` | Separate migration role connection string in the shell that runs Drizzle Kit |

Use the exact scheme, hostname, and port shown by Vite. An origin has no trailing slash. The frontend can obtain a Clerk session token with `useAuth().getToken()` and send it as `Authorization: Bearer <token>` on same-origin API requests. The API verifies Clerk session tokens, rejects pending sessions, and scopes database queries to the verified user ID.

## Database migration and roles

Use a migration administrator with schema-creation privileges and a separate `taskflow_runtime` login. For IPv4-only local clients, Supabase's session pooler is an alternative to the direct endpoint. Use verified TLS with the appropriate CA for remote connections. For local Workerd, place the Supabase CA at `prod-ca-2021.crt` in the project root or set `NODE_EXTRA_CA_CERTS` to its path before running `npm run dev`. The dev command loads that CA into Workerd’s trust store. Set `sslmode=verify-full` on the runtime URL.

The initial migration is under `drizzle/`. After explicit approval, confirm the target project and the verified TLS connection, then run from the repository root:

```sh
node --env-file=.env ./node_modules/drizzle-kit/bin.cjs migrate --config=drizzle.config.ts
```

After the schema migration succeeds, apply [the runtime role and RLS SQL](../scripts/sql/taskflow-runtime.sql) as the migration administrator through a verified-TLS PostgreSQL client. For example, with the confirmed administrative connection already open in `psql` from the repo root:

```text
\set ON_ERROR_STOP on
\i scripts/sql/taskflow-runtime.sql
\password taskflow_runtime
```

The SQL applies the role, grants, and policy in one transaction. Effective privilege assertions guard against accidental role membership, schema creation, task ownership, and grant options. The password prompt is separate from the SQL file. Keep the runtime login out of the migration role, Supabase Data API, and Vite configuration.

The profile migration creates a row per Clerk user in `public.user_profiles`. The signed-in workspace initializes the row on first access. Only the optional TaskFlow display name is stored there. The profile page reads the account name and primary email from Clerk. The runtime role can read and insert owned profiles and update the display name.

Each task and profile request starts a transaction and binds the verified Clerk user ID with parameterized `set_config('taskflow.clerk_user_id', userId, true)` before any task SQL. Reads and writes use the same transaction connection. The RLS policy compares the setting to `user_id` for existing and proposed rows and denies missing or empty identity. Repository owner predicates remain in place. Writes also take the existing transaction-level advisory lock, including reorder, and the identity is released on commit or rollback.

Before a live CRUD test, point the root `.dev.vars` beside `wrangler.jsonc` at the restricted runtime role using verified TLS. Verify two distinct Clerk identities, including a cross-user 404, no visibility without an identity, and isolation after reusing a connection. The local scripted driver tests assert SQL ordering and rollback. Live PostgreSQL ownership and transaction isolation were verified with the provisioned runtime login. A signed-in browser run is still needed to verify the complete Clerk-to-Worker flow.

## Production Hyperdrive

For a new Cloudflare environment, create a Hyperdrive configuration after infrastructure approval with the restricted Supabase runtime role. Use the Supabase direct endpoint where supported, disable query caching, and set server TLS verification to `verify-full` with the Supabase CA. Use the dashboard or a credential-safe API input for the connection details. Add the real configuration ID to `wrangler.jsonc`:

```jsonc
"hyperdrive": [{ "binding": "HYPERDRIVE", "id": "<configuration-id>" }]
```

Build with `npm run build` and deploy the generated Vite Worker and assets with `npx --no-install wrangler deploy` after approval. Set `CLERK_SECRET_KEY` as a Worker secret and set `CLERK_PUBLISHABLE_KEY` and `CLERK_AUTHORIZED_PARTIES` for the deployed Clerk instance and exact SPA origin. Leave `APP_ENV=development` and `DATABASE_URL` in local configuration. Deploy only after approval. The [hosted assessment preview](https://taskflow.zaidansari2249.workers.dev) uses the provisioned Hyperdrive binding and the Clerk development instance. Hosted signed-in database requests still need end-to-end verification.

## REST API

All routes use the `/api/v1` prefix. Success payloads use `{ "data": ... }` and errors use `{ "error": { "code": "...", "message": "..." } }`. Deleting a task returns 204 with an empty body.

| Method and path | Behavior |
| --- | --- |
| `GET /health` | Public liveness check without a database query |
| `GET /tasks` | List owned tasks. Filter by `search`, `status`, or `priority`. Sort by `position`, `createdAt`, `updatedAt`, `dueDate`, `priority`, or `title` with `direction=asc\|desc` |
| `GET /tasks/stats` | Owned totals, in progress, completed, and high priority |
| `GET /tasks/:id` | Read one owned task |
| `POST /tasks` | Create a task. `title` is required. Accepts `description`, `status`, `priority`, and `dueDate` |
| `PATCH /tasks/:id` | Update one or more of those fields |
| `DELETE /tasks/:id` | Delete one owned task |
| `PATCH /tasks/reorder` | Accepts `{id, status, position}`. Move one task to a zero-based destination index and return the updated owned board |

Statuses are `todo`, `in_progress`, and `done`. Priorities are `low`, `medium`, and `high`. Dates use `YYYY-MM-DD`. The reorder index is measured after removing the moved task from the destination, so the destination length is a valid append index. Missing and foreign identifiers both return 404. Concurrent writes for a user serialize on a PostgreSQL transaction lock. Reorder compacts affected columns and commits the move atomically.

`POST /api/v1/profile` initializes or returns the verified session owner’s profile. `PUT /api/v1/profile` accepts `{displayName: string | null}` and saves it for that same owner. Both require a verified Clerk session.
