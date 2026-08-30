CREATE EXTENSION IF NOT EXISTS vector;

CREATE TYPE "user_role" AS ENUM ('citizen', 'university', 'corporate', 'admin');
CREATE TYPE "problem_status" AS ENUM ('PENDING', 'OPEN', 'NEEDS_REVIEW', 'REJECTED', 'CLAIMED');
CREATE TYPE "problem_domain" AS ENUM (
  'healthcare',
  'agriculture',
  'education',
  'disaster_management',
  'clean_energy',
  'water_management',
  'urban_infrastructure',
  'governance',
  'financial_inclusion',
  'waste_management'
);
CREATE TYPE "university_project_status" AS ENUM ('ACTIVE', 'COMPLETED', 'ABANDONED');
CREATE TYPE "escrow_ledger_status" AS ENUM ('HELD', 'RELEASED', 'REFUNDED');

CREATE TABLE "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "role" "user_role" NOT NULL,
  "name" text NOT NULL,
  "email" text NOT NULL,
  "verified" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE ("email")
);

CREATE TABLE "citizen_problems" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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
  CONSTRAINT "citizen_problems_secondary_tags_max_2" CHECK (array_length("secondary_tags", 1) <= 2),
  CONSTRAINT "citizen_problems_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "citizen_problems_claimed_by_users_id_fk" FOREIGN KEY ("claimed_by") REFERENCES "users"("id") ON DELETE SET NULL
);

CREATE TABLE "problem_embeddings" (
  "problem_id" uuid PRIMARY KEY,
  "embedding" vector(1024),
  "model_version" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "problem_embeddings_problem_id_citizen_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "citizen_problems"("id") ON DELETE CASCADE
);

CREATE INDEX "problem_embeddings_embedding_hnsw_idx"
ON "problem_embeddings" USING hnsw ("embedding" vector_l2_ops);

CREATE TABLE "university_projects" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "problem_id" uuid NOT NULL,
  "university_id" uuid NOT NULL,
  "status" "university_project_status" DEFAULT 'ACTIVE' NOT NULL,
  "budget" text DEFAULT '0' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "university_projects_problem_id_citizen_problems_id_fk" FOREIGN KEY ("problem_id") REFERENCES "citizen_problems"("id") ON DELETE CASCADE,
  CONSTRAINT "university_projects_university_id_users_id_fk" FOREIGN KEY ("university_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE TABLE "project_updates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" uuid NOT NULL,
  "trl_level" integer NOT NULL,
  "description" text NOT NULL,
  "evidence_url" text,
  "verified" boolean DEFAULT false NOT NULL,
  "verified_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "project_updates_project_id_university_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "university_projects"("id") ON DELETE CASCADE,
  CONSTRAINT "project_updates_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL
);

CREATE TABLE "escrow_ledger" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "project_id" uuid NOT NULL,
  "milestone_id" uuid,
  "corporate_id" uuid NOT NULL,
  "amount" text NOT NULL,
  "status" "escrow_ledger_status" DEFAULT 'HELD' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "released_at" timestamp with time zone,
  CONSTRAINT "escrow_ledger_project_id_university_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "university_projects"("id") ON DELETE CASCADE,
  CONSTRAINT "escrow_ledger_milestone_id_project_updates_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "project_updates"("id") ON DELETE SET NULL,
  CONSTRAINT "escrow_ledger_corporate_id_users_id_fk" FOREIGN KEY ("corporate_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER citizen_problems_updated_at
BEFORE UPDATE ON "citizen_problems"
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
