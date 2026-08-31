CREATE TYPE "public"."escrow_ledger_status" AS ENUM('HELD', 'RELEASED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."problem_domain" AS ENUM('healthcare', 'agriculture', 'education', 'disaster_management', 'clean_energy', 'water_management', 'urban_infrastructure', 'governance', 'financial_inclusion', 'waste_management');--> statement-breakpoint
CREATE TYPE "public"."problem_status" AS ENUM('PENDING', 'OPEN', 'NEEDS_REVIEW', 'REJECTED', 'CLAIMED');--> statement-breakpoint
CREATE TYPE "public"."university_project_status" AS ENUM('ACTIVE', 'COMPLETED', 'ABANDONED');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('CITIZEN', 'STUDENT', 'FACULTY', 'COMPANY_REP');--> statement-breakpoint
CREATE TABLE "citizen_problems" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"description" text NOT NULL,
	"image_url" text,
	"status" "problem_status" DEFAULT 'PENDING' NOT NULL,
	"spam_score" real,
	"domain" "problem_domain",
	"secondary_tags" "problem_domain"[],
	"claimed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "citizen_problems_secondary_tags_max_2" CHECK (array_length("citizen_problems"."secondary_tags", 1) <= 2)
);
--> statement-breakpoint
CREATE TABLE "escrow_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"milestone_id" uuid,
	"corporate_id" uuid NOT NULL,
	"amount" numeric(16, 2) NOT NULL,
	"status" "escrow_ledger_status" DEFAULT 'HELD' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"released_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "problem_embeddings" (
	"problem_id" uuid PRIMARY KEY NOT NULL,
	"embedding" vector(1024),
	"model_version" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_updates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"trl_level" integer NOT NULL,
	"description" text NOT NULL,
	"evidence_url" text,
	"verified" boolean DEFAULT false NOT NULL,
	"verified_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "university_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"problem_id" uuid NOT NULL,
	"university_id" uuid NOT NULL,
	"status" "university_project_status" DEFAULT 'ACTIVE' NOT NULL,
	"budget" numeric(16, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"full_name" text NOT NULL,
	"role" "user_role" NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"formatted_address" text,
	"country" text,
	"latitude" real,
	"longitude" real,
	"is_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "citizen_problems" ADD CONSTRAINT "citizen_problems_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "citizen_problems" ADD CONSTRAINT "citizen_problems_claimed_by_users_id_fk" FOREIGN KEY ("claimed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrow_ledger" ADD CONSTRAINT "escrow_ledger_project_id_university_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."university_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrow_ledger" ADD CONSTRAINT "escrow_ledger_milestone_id_project_updates_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "public"."project_updates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "escrow_ledger" ADD CONSTRAINT "escrow_ledger_corporate_id_users_id_fk" FOREIGN KEY ("corporate_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_embeddings" ADD CONSTRAINT "problem_embeddings_problem_id_citizen_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."citizen_problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_updates" ADD CONSTRAINT "project_updates_project_id_university_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."university_projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_updates" ADD CONSTRAINT "project_updates_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "university_projects" ADD CONSTRAINT "university_projects_problem_id_citizen_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."citizen_problems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "university_projects" ADD CONSTRAINT "university_projects_university_id_users_id_fk" FOREIGN KEY ("university_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "problem_embeddings_embedding_hnsw_idx" ON "problem_embeddings" USING hnsw ("embedding" vector_l2_ops);