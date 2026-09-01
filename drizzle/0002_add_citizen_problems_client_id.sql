ALTER TABLE "citizen_problems" ADD COLUMN IF NOT EXISTS "client_id" uuid DEFAULT gen_random_uuid();
--> statement-breakpoint
UPDATE "citizen_problems" SET "client_id" = gen_random_uuid() WHERE "client_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "citizen_problems" ALTER COLUMN "client_id" SET NOT NULL;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "citizen_problems" ADD CONSTRAINT "citizen_problems_client_id_unique" UNIQUE("client_id");
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
