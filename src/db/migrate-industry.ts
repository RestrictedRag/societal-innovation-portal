import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function runIndustryMigration() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not defined in environment.');
    process.exit(1);
  }

  const sql = postgres(databaseUrl, {
    ssl: { rejectUnauthorized: false },
    max: 1,
  });

  console.log('🚀 Running safe Industry Portal schema migration...');

  try {
    // 1. Create company_profiles table
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS company_profiles (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        company_name text NOT NULL,
        company_type text,
        industry text,
        sector text,
        website text,
        description text,
        location text,
        areas_of_expertise text[],
        technologies text[],
        csr_interests text[],
        innovation_interests text[],
        preferred_domains text[],
        available_resources text[],
        funding_capacity text,
        pilot_locations text[],
        contact_person_name text,
        contact_email text,
        contact_phone text,
        created_at timestamp with time zone NOT NULL DEFAULT now(),
        updated_at timestamp with time zone NOT NULL DEFAULT now()
      );
    `);

    // 2. Extend industry_needs table
    await sql.unsafe(`
      ALTER TABLE industry_needs
        ADD COLUMN IF NOT EXISTS technology text[],
        ADD COLUMN IF NOT EXISTS problem_category text,
        ADD COLUMN IF NOT EXISTS required_skills text[],
        ADD COLUMN IF NOT EXISTS preferred_project_type text DEFAULT 'BOTH',
        ADD COLUMN IF NOT EXISTS expected_outcome text,
        ADD COLUMN IF NOT EXISTS funding_available text,
        ADD COLUMN IF NOT EXISTS pilot_opportunity text,
        ADD COLUMN IF NOT EXISTS timeline text,
        ADD COLUMN IF NOT EXISTS location text;
    `);

    // 3. Create industry_collaborations table
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS industry_collaborations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id uuid NOT NULL REFERENCES university_projects(id) ON DELETE CASCADE,
        company_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        proposal_type text NOT NULL,
        title text NOT NULL,
        description text NOT NULL,
        commitment text,
        estimated_value numeric(16, 2) DEFAULT 0,
        duration text,
        contact_person text,
        contact_email text,
        status text NOT NULL DEFAULT 'PROPOSED',
        faculty_feedback text,
        created_at timestamp with time zone NOT NULL DEFAULT now(),
        updated_at timestamp with time zone NOT NULL DEFAULT now()
      );

      ALTER TABLE industry_collaborations
        ADD COLUMN IF NOT EXISTS company_user_id uuid REFERENCES users(id) ON DELETE CASCADE,
        ADD COLUMN IF NOT EXISTS proposal_type text,
        ADD COLUMN IF NOT EXISTS title text,
        ADD COLUMN IF NOT EXISTS description text,
        ADD COLUMN IF NOT EXISTS commitment text,
        ADD COLUMN IF NOT EXISTS estimated_value numeric(16, 2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS duration text,
        ADD COLUMN IF NOT EXISTS contact_person text,
        ADD COLUMN IF NOT EXISTS contact_email text,
        ADD COLUMN IF NOT EXISTS status text DEFAULT 'PROPOSED',
        ADD COLUMN IF NOT EXISTS faculty_feedback text;

      DO $$ 
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'industry_collaborations' AND column_name = 'status'
        ) THEN
          ALTER TABLE industry_collaborations ALTER COLUMN status TYPE text USING status::text;
          ALTER TABLE industry_collaborations ALTER COLUMN status SET DEFAULT 'PROPOSED';
        END IF;
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'industry_collaborations' AND column_name = 'industry_id'
        ) THEN
          ALTER TABLE industry_collaborations ALTER COLUMN industry_id DROP NOT NULL;
        END IF;
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'industry_collaborations' AND column_name = 'offer_type'
        ) THEN
          ALTER TABLE industry_collaborations ALTER COLUMN offer_type DROP NOT NULL;
        END IF;
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'industry_collaborations' AND column_name = 'details'
        ) THEN
          ALTER TABLE industry_collaborations ALTER COLUMN details DROP NOT NULL;
        END IF;
      END $$;
    `);

    // 4. Create project_pilots table
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS project_pilots (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id uuid NOT NULL REFERENCES university_projects(id) ON DELETE CASCADE,
        company_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        collaboration_id uuid REFERENCES industry_collaborations(id) ON DELETE SET NULL,
        title text NOT NULL,
        location text NOT NULL,
        start_date timestamp with time zone,
        end_date timestamp with time zone,
        objective text NOT NULL,
        target_population text,
        infrastructure_details text,
        expected_metrics text,
        responsible_contact text,
        status text NOT NULL DEFAULT 'PROPOSED',
        progress_percent integer NOT NULL DEFAULT 0,
        impact_summary text,
        metrics_json text,
        created_at timestamp with time zone NOT NULL DEFAULT now(),
        updated_at timestamp with time zone NOT NULL DEFAULT now()
      );

      ALTER TABLE project_pilots
        ADD COLUMN IF NOT EXISTS company_user_id uuid REFERENCES users(id) ON DELETE CASCADE,
        ADD COLUMN IF NOT EXISTS collaboration_id uuid REFERENCES industry_collaborations(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS title text,
        ADD COLUMN IF NOT EXISTS location text,
        ADD COLUMN IF NOT EXISTS start_date timestamp with time zone,
        ADD COLUMN IF NOT EXISTS end_date timestamp with time zone,
        ADD COLUMN IF NOT EXISTS objective text,
        ADD COLUMN IF NOT EXISTS target_population text,
        ADD COLUMN IF NOT EXISTS infrastructure_details text,
        ADD COLUMN IF NOT EXISTS expected_metrics text,
        ADD COLUMN IF NOT EXISTS responsible_contact text,
        ADD COLUMN IF NOT EXISTS status text DEFAULT 'PROPOSED',
        ADD COLUMN IF NOT EXISTS progress_percent integer DEFAULT 0,
        ADD COLUMN IF NOT EXISTS impact_summary text,
        ADD COLUMN IF NOT EXISTS metrics_json text;

      DO $$ 
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'project_pilots' AND column_name = 'status'
        ) THEN
          ALTER TABLE project_pilots ALTER COLUMN status TYPE text USING status::text;
          ALTER TABLE project_pilots ALTER COLUMN status SET DEFAULT 'PROPOSED';
        END IF;
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'project_pilots' AND column_name = 'location'
        ) THEN
          ALTER TABLE project_pilots ALTER COLUMN location TYPE text USING location::text;
        END IF;
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'project_pilots' AND column_name = 'target_population'
        ) THEN
          ALTER TABLE project_pilots ALTER COLUMN target_population TYPE text USING target_population::text;
        END IF;
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'project_pilots' AND column_name = 'industry_id'
        ) THEN
          ALTER TABLE project_pilots ALTER COLUMN industry_id DROP NOT NULL;
        END IF;
      END $$;
    `);

    // 5. Create saved_projects table
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS saved_projects (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        project_id uuid NOT NULL REFERENCES university_projects(id) ON DELETE CASCADE,
        notes text,
        created_at timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT saved_projects_user_project_unique UNIQUE (user_id, project_id)
      );
    `);

    // 6. Create interest_requests table
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS interest_requests (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        project_id uuid NOT NULL REFERENCES university_projects(id) ON DELETE CASCADE,
        target_type text NOT NULL DEFAULT 'PROJECT',
        target_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
        interest_type text NOT NULL DEFAULT 'EXPLORATORY_MEETING',
        message text NOT NULL,
        support_details text,
        preferred_time text,
        contact_email text,
        status text NOT NULL DEFAULT 'PENDING',
        created_at timestamp with time zone NOT NULL DEFAULT now()
      );
    `);

    // 7. Create notifications table
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS notifications (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title text NOT NULL,
        message text NOT NULL,
        type text NOT NULL DEFAULT 'SYSTEM',
        link text,
        is_read boolean NOT NULL DEFAULT false,
        created_at timestamp with time zone NOT NULL DEFAULT now()
      );
    `);

    console.log('✅ Industry Portal database schema migration executed successfully!');
  } catch (err) {
    console.error('Migration error:', err);
    throw err;
  } finally {
    await sql.end();
  }
}

runIndustryMigration()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
