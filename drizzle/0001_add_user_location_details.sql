ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "formatted_address" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "country" text;