# TaskFlow assessment submission

| Deliverable | Status |
| --- | --- |
| Working application URL | [Cloudflare assessment preview](https://taskflow.zaidansari2249.workers.dev) |
| Source repository URL | [GitHub repository](https://github.com/zaid225/taskflow) |
| On-camera video | Script ready below |

## Release verification

Cloudflare serves the SPA and Hono API from one Worker and connects to Supabase through a cache-disabled Hyperdrive binding with verified TLS. The preview uses the Clerk development instance. Public routes, API health, and signed-out API rejection passed. A real Clerk session verified task creation, refresh persistence, editing, completion, a Kanban move through the card menu, bulk deletion, and profile display-name persistence with immediate header synchronization. Live OAuth photo handling and photo upload/removal still need a separate check.

## Three engineering decisions

1. **One Worker for the React app and API.** The browser uses relative API URLs, while Worker-first routing reserves API paths and SPA fallback preserves deep links.
2. **Clerk session verification and PostgreSQL row-level security.** The Worker binds the verified Clerk user ID to a database transaction. Owner-scoped queries and RLS enforce the same boundary, and transaction-local identity clears when the connection is reused.
3. **Atomic Kanban moves.** A server transaction treats the status change and position updates as one operation. The frontend shows the move immediately, accepts the server’s returned order, and restores its previous view if the move fails.

## Three excluded features

- **Team workspaces and sharing.** The assessment uses individual ownership. Sharing would require a membership model and a separate authorization review.
- **Recurring tasks and reminders.** Scheduling and delivery would add background jobs, time zone handling, and retry behavior.
- **Offline editing.** Queuing changes across devices would require conflict resolution for task edits and board order.

## One current limitation

The custom authentication UI supports email-code verification. Some configured Clerk factors or session tasks can require additional steps that TaskFlow currently handles with recovery guidance. With another day, I would implement one configured additional factor and test enrollment and recovery end to end.

## Short on-camera script

“TaskFlow is a personal task manager with a list, a dashboard, and a Kanban board. I’ll show creating a task, moving it on the board, and refreshing to check persistence.

“I made three engineering decisions. First, the React app and API share a Cloudflare Worker. That keeps the browser on one origin and makes direct links work. Second, the API verifies Clerk sessions and binds the user’s identity to each PostgreSQL transaction, where row-level security also enforces ownership. Third, board moves update status and position in one transaction, so a failed move doesn’t leave tasks in a partial order.

“I left out team sharing, reminders, and offline editing to focus on individual ownership and consistent task data. With another day, I would add a custom flow for another Clerk verification factor and test recovery.”

### Recording checklist

- **0–15s** Open the hosted preview, sign in, and show the dashboard.
- **15–40s** Create a task, move it on the board, and refresh to demonstrate persistence.
- **40–70s** Explain same-origin deployment, transaction-scoped ownership, and atomic board ordering.
- **70–90s** Name the three exclusions and explain the additional Clerk factor you would support with another day.

Use the verified preview URL for the on-camera recording.
