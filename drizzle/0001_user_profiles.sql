CREATE TABLE "public"."user_profiles" (
	"user_id" varchar(255) PRIMARY KEY NOT NULL,
	"display_name" varchar(80),
	CONSTRAINT "user_profiles_owner_nonblank" CHECK (length(btrim("user_profiles"."user_id")) > 0),
	CONSTRAINT "user_profiles_display_name_nonblank" CHECK (length(btrim("user_profiles"."display_name")) > 0)
);
--> statement-breakpoint
ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
REVOKE ALL ON TABLE public.user_profiles FROM PUBLIC, anon, authenticated, service_role;
--> statement-breakpoint
CREATE POLICY user_profiles_clerk_owner ON public.user_profiles
  USING (user_id = NULLIF(current_setting('taskflow.clerk_user_id', true), ''))
  WITH CHECK (user_id = NULLIF(current_setting('taskflow.clerk_user_id', true), ''));
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'taskflow_runtime') THEN
    GRANT SELECT, INSERT ON TABLE public.user_profiles TO taskflow_runtime;
    GRANT UPDATE (display_name) ON TABLE public.user_profiles TO taskflow_runtime;
  END IF;
END
$$;
