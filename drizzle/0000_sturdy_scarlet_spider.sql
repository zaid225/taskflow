CREATE TYPE "public"."task_priority" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('todo', 'in_progress', 'done');--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"title" varchar(160) NOT NULL,
	"description" text,
	"status" "task_status" DEFAULT 'todo' NOT NULL,
	"priority" "task_priority" DEFAULT 'medium' NOT NULL,
	"due_date" date,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "tasks_title_nonblank" CHECK (length(btrim("tasks"."title")) > 0),
	CONSTRAINT "tasks_owner_nonblank" CHECK (length(btrim("tasks"."user_id")) > 0),
	CONSTRAINT "tasks_position_nonnegative" CHECK ("tasks"."position" >= 0),
	CONSTRAINT "tasks_completed_consistency" CHECK (("tasks"."status" = 'done') = ("tasks"."completed_at" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "tasks_owner_status_position_idx" ON "tasks" USING btree ("user_id","status","position","id");--> statement-breakpoint
CREATE INDEX "tasks_owner_updated_idx" ON "tasks" USING btree ("user_id","updated_at");