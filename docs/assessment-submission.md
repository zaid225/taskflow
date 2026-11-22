# TaskFlow assessment submission

| Deliverable | Status |
| --- | --- |
| Working application URL | Pending Cloudflare deployment and public verification |
| Source repository URL | Pending GitHub destination and push approval |
| On-camera video | Script ready below |

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

Record the demo after checking signed-in persistence on the submitted URL.
