import fs from 'node:fs';
// Top-level pnpm symlink (node_modules/postgres) is broken in this Linux
// mount, so import the real package files directly from the pnpm store.
import postgres from './node_modules/.pnpm/postgres@3.4.9/node_modules/postgres/src/index.js';

function readEnv(name) {
  for (const file of ['.env.local', '.env']) {
    try {
      const txt = fs.readFileSync(file, 'utf8');
      for (const line of txt.split('\n')) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m && m[1] === name) {
          return m[2].replace(/^["']|["']$/g, '');
        }
      }
    } catch {}
  }
  return undefined;
}

const url = readEnv('DATABASE_URL');
if (!url) {
  console.error('No DATABASE_URL found');
  process.exit(1);
}

const sql = postgres(url, { ssl: { rejectUnauthorized: false }, max: 1 });

function hr(t) {
  console.log('\n===== ' + t + ' =====');
}

try {
  hr('EXTENSIONS (postgis / vector)');
  console.log(await sql`SELECT extname FROM pg_extension WHERE extname IN ('postgis','vector') ORDER BY extname`);

  hr('TABLES present');
  console.log((await sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`).map(r => r.table_name));

  for (const t of ['users', 'citizen_problems', 'universities']) {
    hr('COLUMNS of ' + t);
    const cols = await sql`
      SELECT column_name, data_type, udt_name, is_nullable
      FROM information_schema.columns
      WHERE table_schema='public' AND table_name=${t}
      ORDER BY ordinal_position`;
    if (cols.length === 0) { console.log('  (table does not exist)'); }
    else cols.forEach(c => console.log(`  ${c.column_name.padEnd(22)} ${c.data_type} / ${c.udt_name} ${c.is_nullable === 'YES' ? '(nullable)' : '(NOT NULL)'}`));
  }

  hr('ENUM user_role values');
  console.log((await sql`SELECT e.enumlabel FROM pg_enum e JOIN pg_type t ON t.oid=e.enumtypid WHERE t.typname='user_role' ORDER BY e.enumsortorder`).map(r => r.enumlabel));

  hr('ENUM problem_status values');
  console.log((await sql`SELECT e.enumlabel FROM pg_enum e JOIN pg_type t ON t.oid=e.enumtypid WHERE t.typname='problem_status' ORDER BY e.enumsortorder`).map(r => r.enumlabel));

  hr('ROW COUNTS');
  for (const t of ['users', 'citizen_problems', 'universities', 'university_projects']) {
    try {
      const [{ n }] = await sql.unsafe(`SELECT COUNT(*)::int AS n FROM "${t}"`);
      console.log(`  ${t.padEnd(22)} ${n}`);
    } catch (e) { console.log(`  ${t.padEnd(22)} ERR ${e.message}`); }
  }

  // users location resolution by role (only if columns exist)
  const userCols = (await sql`SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='users'`).map(r => r.column_name);
  hr('users: does lat/long still exist?');
  console.log('  latitude column present :', userCols.includes('latitude'));
  console.log('  longitude column present:', userCols.includes('longitude'));
  console.log('  university_id present   :', userCols.includes('university_id'));

  if (userCols.includes('role')) {
    hr('users by role: own lat/long populated + university link');
    const rows = await sql.unsafe(`
      SELECT role,
             COUNT(*)::int AS total,
             COUNT(latitude)::int AS with_lat,
             COUNT(longitude)::int AS with_lng,
             COUNT(university_id)::int AS with_university
      FROM users GROUP BY role ORDER BY role`);
    console.table(rows.map(r => ({ ...r })));
  }
} catch (e) {
  console.error('INTROSPECTION ERROR:', e.message);
} finally {
  await sql.end({ timeout: 5 });
}
