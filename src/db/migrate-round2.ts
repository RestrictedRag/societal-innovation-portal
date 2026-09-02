import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function runMigration() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not defined in environment.');
    process.exit(1);
  }

  const sql = postgres(databaseUrl, {
    ssl: { rejectUnauthorized: false },
    max: 1,
  });

  console.log('Running safe Round 2 schema extensions...');

  try {
    // 1. Create project_type enum if not exists
    await sql.unsafe(`
      DO $$ BEGIN
        CREATE TYPE project_type AS ENUM ('RESEARCH', 'PROBLEM_SOLVING');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 2. Extend users table
    await sql.unsafe(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS department text,
        ADD COLUMN IF NOT EXISTS year_of_study integer,
        ADD COLUMN IF NOT EXISTS skills text[],
        ADD COLUMN IF NOT EXISTS interests text[],
        ADD COLUMN IF NOT EXISTS preferred_project_type text,
        ADD COLUMN IF NOT EXISTS expertise text[],
        ADD COLUMN IF NOT EXISTS bio text;
    `);

    // 3. Extend citizen_problems table
    await sql.unsafe(`
      ALTER TABLE citizen_problems
        ADD COLUMN IF NOT EXISTS problem_type text,
        ADD COLUMN IF NOT EXISTS category text,
        ADD COLUMN IF NOT EXISTS subcategory text;
    `);

    // 4. Extend university_projects table
    await sql.unsafe(`
      ALTER TABLE university_projects
        ADD COLUMN IF NOT EXISTS project_type project_type NOT NULL DEFAULT 'PROBLEM_SOLVING',
        ADD COLUMN IF NOT EXISTS health_status text NOT NULL DEFAULT 'HEALTHY',
        ADD COLUMN IF NOT EXISTS last_activity_at timestamp with time zone NOT NULL DEFAULT now();
    `);

    // 5. Create industry_needs table
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS industry_needs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        company_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title text NOT NULL,
        description text NOT NULL,
        domain problem_domain,
        target_trl integer NOT NULL DEFAULT 4,
        resource_offerings text[],
        status text NOT NULL DEFAULT 'OPEN',
        created_at timestamp with time zone NOT NULL DEFAULT now(),
        updated_at timestamp with time zone NOT NULL DEFAULT now()
      );
    `);

    // 6. Create resource_offers table
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS resource_offers (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id uuid NOT NULL REFERENCES university_projects(id) ON DELETE CASCADE,
        corporate_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        offering_type text NOT NULL,
        details text NOT NULL,
        status text NOT NULL DEFAULT 'OFFERED',
        created_at timestamp with time zone NOT NULL DEFAULT now()
      );
    `);

    console.log('✅ Round 2 schema extensions applied successfully!');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await sql.end();
  }
}

runMigration().catch(console.error);
