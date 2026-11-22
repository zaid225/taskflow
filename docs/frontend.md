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

The Tasks view remembers its List or Table preference. The table uses the same query and filters, and the Board link opens the existing Kanban page. Bulk deletion confirms the selected count, sends at most three concurrent authenticated requests, and keeps failed rows selected for retry. The custom account menu and photo editor use Clerk for images and the existing TaskFlow profile query for display names.

## V2 branch

Calendar groups the existing owned task response by due date. Month controls and arrow keys make dates selectable. The command palette is available in the signed-in header and via Cmd/Ctrl+K outside form fields. The Task table supports bulk status, priority and confirmed deletion with partial-failure feedback. Saved filters are scoped to the Clerk account in the current browser, and CSV export includes only the loaded results from the active filters.

The Dashboard derives completion percentage, priority counts, overdue tasks, upcoming tasks, and a rolling seven-day completion trend from the existing task response. The trend represents retained tasks with completion timestamps. Reopened and deleted tasks are not part of an historical event log.

Calendar, Board, Dashboard, Tasks, Profile, and the signed-in command palette load in separate client chunks. The review draft for subtasks is in [the migration plan](subtasks-migration-plan.md). Preview with `npm run dev` and the configured local Clerk origin. Review and test on staging before any production deployment.
