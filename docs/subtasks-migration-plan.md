# Subtasks migration proposal

This SQL is a review draft. It has not been added to the Drizzle journal or run. Subtask code is deferred until this plan is reviewed.

The composite foreign key binds each subtask to a task with the same Clerk owner. Worker routes would verify the Clerk session and use the existing transaction helper before any parent or child query. The repository would include both task ID and owner in its predicates. A missing parent or a parent owned by someone else would return the same 404. Task deletion would cascade to its subtasks.

## Proposed SQL

```sql
CREATE UNIQUE INDEX tasks_id_user_id_unique ON public.tasks (id, user_id);

CREATE TABLE public.subtasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL,
  user_id varchar(255) NOT NULL,
  title varchar(160) NOT NULL CHECK (length(btrim(title)) >= 3),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (task_id, user_id) REFERENCES public.tasks (id, user_id)
    ON DELETE CASCADE
);

CREATE INDEX subtasks_owner_task_idx ON public.subtasks (user_id, task_id);
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.subtasks FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT, INSERT, DELETE ON TABLE public.subtasks TO taskflow_runtime;
GRANT UPDATE (title, completed_at) ON TABLE public.subtasks TO taskflow_runtime;

CREATE POLICY subtasks_clerk_owner ON public.subtasks
  FOR ALL TO taskflow_runtime
  USING (user_id = NULLIF(current_setting('taskflow.clerk_user_id', true), ''))
  WITH CHECK (user_id = NULLIF(current_setting('taskflow.clerk_user_id', true), ''));
```

The parent index is additive and the existing task rows need no backfill. A regular index build briefly blocks writes on the parent table. Check staging execution time and production table size before choosing a deployment window. If a concurrent index build is needed, plan it separately from a transactional Drizzle migration.

Before rollout, test missing identity, a different owner's parent ID, attempted owner changes, completion toggles, and cascade behavior with the actual restricted runtime role. Existing task endpoints should remain independent of the new table. Stage the schema first and enable subtask UI only after the staging checks pass. Production execution requires explicit migration approval.
