# TaskFlow frontend

| Feature | Before frontend completion | Current implementation |
| --- | --- | --- |
| Shell, navigation, theme and authentication | Implemented | Existing responsive shell, theme and Clerk flows |
| Task list and dashboard | Demonstration data | Clerk-authenticated task list, counts and recent tasks from the Worker |
| Create, details, edit, delete and completion | Missing | Dialogs and server-backed mutations with validation and toast feedback |
| Search, status, priority and sorting | Missing | Server-side query parameters and a clear-filters action |
| Board | Static columns | Mouse, touch and keyboard-accessible moves with persistent reorder requests |
| Loading, empty and error states | Partial | Skeletons, empty states and query retries |

The task workspace uses a TanStack Query cache scoped to the current Clerk session. Requests obtain the Clerk session token and call the same-origin Hono API. Successful writes refresh the task lists, details and dashboard counts. A board move updates the cached order optimistically, restores the snapshot on failure, and uses the board returned by the Worker on success. No task data is stored in browser persistence.

`npm test` includes frontend interaction and cache tests with mocked fetch responses. Live authenticated persistence requires the PostgreSQL schema, approved runtime role and RLS setup described in [backend setup](backend.md).
