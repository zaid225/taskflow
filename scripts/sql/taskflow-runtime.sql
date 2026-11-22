-- Apply after the initial Drizzle migration, using the approved migration administrator.
-- Set the runtime password separately through a secure prompt after this transaction commits.
BEGIN;

DO $$
BEGIN
  IF current_database() <> 'postgres' OR to_regclass('public.tasks') IS NULL THEN
    RAISE EXCEPTION 'Expected the migrated TaskFlow database';
  END IF;
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.tasks'::regclass)
     OR EXISTS (SELECT 1 FROM pg_policy WHERE polrelid = 'public.tasks'::regclass) THEN
    RAISE EXCEPTION 'Expected RLS enabled and no existing task policies';
  END IF;
END
$$;

CREATE ROLE taskflow_runtime LOGIN NOINHERIT NOSUPERUSER
  NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;

-- Supabase can assign default table privileges to its Data API roles.
REVOKE ALL ON TABLE public.tasks FROM PUBLIC, anon, authenticated, service_role;
GRANT CONNECT ON DATABASE postgres TO taskflow_runtime;
GRANT USAGE ON SCHEMA public TO taskflow_runtime;
GRANT USAGE ON TYPE public.task_status, public.task_priority TO taskflow_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.tasks TO taskflow_runtime;

CREATE POLICY tasks_clerk_owner ON public.tasks
  FOR ALL TO taskflow_runtime
  USING (user_id = NULLIF(current_setting('taskflow.clerk_user_id', true), ''))
  WITH CHECK (user_id = NULLIF(current_setting('taskflow.clerk_user_id', true), ''));

-- Fail and roll back provisioning if effective privileges exceed the intended scope.
DO $$
DECLARE runtime pg_roles%ROWTYPE;
BEGIN
  SELECT * INTO STRICT runtime FROM pg_roles WHERE rolname = 'taskflow_runtime';
  IF NOT runtime.rolcanlogin OR runtime.rolinherit OR runtime.rolsuper OR runtime.rolbypassrls
     OR runtime.rolcreatedb OR runtime.rolcreaterole OR runtime.rolreplication
     OR EXISTS (SELECT 1 FROM pg_auth_members WHERE member = runtime.oid)
     OR EXISTS (SELECT 1 FROM pg_class WHERE oid = 'public.tasks'::regclass AND relowner = runtime.oid)
     OR has_database_privilege(runtime.oid, current_database(), 'CREATE')
     OR EXISTS (SELECT 1 FROM pg_namespace WHERE has_schema_privilege(runtime.oid, oid, 'CREATE'))
     OR NOT has_database_privilege(runtime.oid, current_database(), 'CONNECT')
     OR NOT has_schema_privilege(runtime.oid, 'public', 'USAGE')
     OR NOT has_type_privilege(runtime.oid, 'public.task_status', 'USAGE')
     OR NOT has_type_privilege(runtime.oid, 'public.task_priority', 'USAGE')
     OR EXISTS (
       SELECT 1 FROM unnest(ARRAY['SELECT','INSERT','UPDATE','DELETE']) AS required(privilege)
       WHERE NOT has_table_privilege(runtime.oid, 'public.tasks', required.privilege)
     )
     OR has_table_privilege(runtime.oid, 'public.tasks', 'TRUNCATE,REFERENCES,TRIGGER,MAINTAIN')
     OR EXISTS (
       SELECT 1 FROM unnest(ARRAY['SELECT','INSERT','UPDATE','DELETE']) AS granted(privilege)
       WHERE has_table_privilege(runtime.oid, 'public.tasks', granted.privilege || ' WITH GRANT OPTION')
     ) THEN
    RAISE EXCEPTION 'TaskFlow runtime effective privileges do not match the expected scope';
  END IF;
END
$$;

-- A fresh database may have applied the profile migration before role provisioning.
DO $$
BEGIN
  IF to_regclass('public.user_profiles') IS NOT NULL THEN
    GRANT SELECT, INSERT ON TABLE public.user_profiles TO taskflow_runtime;
    GRANT UPDATE (display_name) ON TABLE public.user_profiles TO taskflow_runtime;
  END IF;
END
$$;

COMMIT;
