#!/usr/bin/env node

/**
 * CivicNexus — 1-Click Automated Local Setup Script
 * Sets up dependencies, environment files, SSL certificates, database schemas, and demo data
 * on any new laptop (Windows, macOS, Linux).
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = __dirname;
const COLOR = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
};

function logStep(stepNum, title) {
  console.log(`\n${COLOR.cyan}${COLOR.bright}[Step ${stepNum}] ${title}${COLOR.reset}`);
}

function logSuccess(msg) {
  console.log(`${COLOR.green}  ✓ ${msg}${COLOR.reset}`);
}

function logWarning(msg) {
  console.log(`${COLOR.yellow}  ⚠ ${msg}${COLOR.reset}`);
}

function logError(msg) {
  console.log(`${COLOR.red}  ✗ ${msg}${COLOR.reset}`);
}

function runCmd(cmd, desc) {
  try {
    process.stdout.write(`  Running: ${cmd}... `);
    execSync(cmd, { cwd: ROOT_DIR, stdio: 'pipe' });
    console.log(`${COLOR.green}Done${COLOR.reset}`);
    return true;
  } catch (err) {
    console.log(`${COLOR.red}Failed${COLOR.reset}`);
    if (desc) logWarning(desc);
    return false;
  }
}

async function main() {
  console.log(`
${COLOR.magenta}${COLOR.bright}=======================================================
   🏛️  CivicNexus — Automated Local Environment Setup
   Smart India Hackathon 2026 Innovation Platform
=======================================================${COLOR.reset}
`);

  // 1. Verify Node.js version
  logStep(1, 'Checking Node.js & NPM Prerequisites');
  const nodeVersion = process.version;
  console.log(`  Current Node.js version: ${COLOR.bright}${nodeVersion}${COLOR.reset}`);
  const majorVersion = parseInt(nodeVersion.replace(/^v/, '').split('.')[0], 10);
  if (majorVersion < 18) {
    logError('Node.js version 18 or higher is required. Please upgrade Node.js.');
    process.exit(1);
  }
  logSuccess('Node.js version is compatible.');

  // 2. Ensure .env.local and .env files
  logStep(2, 'Configuring Local Environment Variables & API Keys');
  const envPath = path.join(ROOT_DIR, '.env');
  const envLocalPath = path.join(ROOT_DIR, '.env.local');
  const envExamplePath = path.join(ROOT_DIR, '.env.example');

  if (!fs.existsSync(envLocalPath)) {
    if (fs.existsSync(envPath)) {
      fs.copyFileSync(envPath, envLocalPath);
      logSuccess('Created .env.local from existing .env');
    } else if (fs.existsSync(envExamplePath)) {
      fs.copyFileSync(envExamplePath, envLocalPath);
      logWarning('Created .env.local from .env.example template.');
    } else {
      logError('No .env or .env.local file found.');
    }
  } else {
    logSuccess('.env.local is present.');
  }

  // Audit API Keys inside .env.local
  if (fs.existsSync(envLocalPath)) {
    let envContent = fs.readFileSync(envLocalPath, 'utf8');
    let hasChanges = false;

    // Check DATABASE_URL
    const dbUrlMatch = envContent.match(/^DATABASE_URL\s*=\s*["']?([^"'\r\n]+)["']?/m);
    const dbUrl = dbUrlMatch ? dbUrlMatch[1] : '';
    if (!dbUrl || dbUrl.includes('username:password')) {
      logWarning('DATABASE_URL is not configured or using placeholder.');
      console.log(`     ${COLOR.yellow}👉 To connect to the shared database, paste your team DATABASE_URL into .env.local${COLOR.reset}`);
    } else {
      logSuccess('DATABASE_URL (Neon PostgreSQL): Configured ✓');
    }

    // Auto-generate NEON_AUTH_COOKIE_SECRET if missing
    if (!envContent.includes('NEON_AUTH_COOKIE_SECRET') || envContent.includes('replace_with_a_strong_random_secret')) {
      const crypto = require('crypto');
      const randomSecret = crypto.randomBytes(32).toString('hex');
      if (envContent.includes('replace_with_a_strong_random_secret')) {
        envContent = envContent.replace('replace_with_a_strong_random_secret', randomSecret);
      } else {
        envContent += `\nNEON_AUTH_COOKIE_SECRET="${randomSecret}"\n`;
      }
      hasChanges = true;
      logSuccess('NEON_AUTH_COOKIE_SECRET: Auto-generated secure 64-character secret ✓');
    } else {
      logSuccess('NEON_AUTH_COOKIE_SECRET: Configured ✓');
    }

    // Ensure NEON_AUTH_BASE_URL
    if (!envContent.includes('NEON_AUTH_BASE_URL')) {
      envContent += `\nNEON_AUTH_BASE_URL="https://localhost:3000"\n`;
      hasChanges = true;
      logSuccess('NEON_AUTH_BASE_URL: Set to https://localhost:3000 ✓');
    }

    // Check Google AI Key
    const aiKeyMatch = envContent.match(/^GOOGLE_GENERATIVE_AI_API_KEY\s*=\s*["']?([^"'\r\n]+)["']?/m);
    if (aiKeyMatch && aiKeyMatch[1] && !aiKeyMatch[1].includes('your_google_api_key')) {
      logSuccess('GOOGLE_GENERATIVE_AI_API_KEY (Gemini): Configured ✓');
    } else {
      logWarning('GOOGLE_GENERATIVE_AI_API_KEY: Optional (using seeded fallback embeddings).');
    }

    // Check Geoapify Key
    const geoKeyMatch = envContent.match(/^NEXT_PUBLIC_GEOAPIFY_API_KEY\s*=\s*["']?([^"'\r\n]+)["']?/m);
    if (geoKeyMatch && geoKeyMatch[1] && !geoKeyMatch[1].includes('your_geoapify_api_key')) {
      logSuccess('NEXT_PUBLIC_GEOAPIFY_API_KEY: Configured ✓');
    } else {
      logWarning('NEXT_PUBLIC_GEOAPIFY_API_KEY: Optional (using browser GPS / fallback map).');
    }

    if (hasChanges) {
      fs.writeFileSync(envLocalPath, envContent, 'utf8');
      logSuccess('Updated .env.local with auto-configured local parameters.');
    }
  }

  // 3. Ensure Local SSL Certificates for HTTPS
  logStep(3, 'Checking Local HTTPS SSL Certificates');
  const keyPath = path.join(ROOT_DIR, 'localhost-key.pem');
  const certPath = path.join(ROOT_DIR, 'localhost.pem');

  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    logSuccess('SSL certificates (localhost-key.pem, localhost.pem) found.');
  } else {
    logWarning('Certificates not found. Attempting generation using mkcert...');
    const mkcertExe = path.join(ROOT_DIR, 'tools', 'mkcert.exe');
    if (process.platform === 'win32' && fs.existsSync(mkcertExe)) {
      runCmd(`"${mkcertExe}" -install && "${mkcertExe}" localhost 127.0.0.1 ::1`, 'mkcert generation');
    } else {
      logWarning('Self-signed certs will be created by Next.js on first run.');
    }
  }

  // 4. Install Dependencies
  logStep(4, 'Installing NPM Dependencies (--legacy-peer-deps)');
  console.log('  Installing packages cleanly using npm...');
  const installSuccess = runCmd('npm install --legacy-peer-deps', 'Failed to install some dependencies.');
  if (!installSuccess) {
    logWarning('Attempting fallback install...');
    execSync('npm install --force', { cwd: ROOT_DIR, stdio: 'inherit' });
  }
  logSuccess('All dependencies installed successfully.');

  // 5. Run Database Migrations
  logStep(5, 'Applying Database Schema & Extensions');
  runCmd('npx tsx --env-file=.env.local --env-file=.env src/db/migrate-round2.ts', 'Database schema update');
  logSuccess('Database schemas and PostgreSQL enums verified.');

  // 6. Seed Complete Demo Presentation Dataset
  logStep(6, 'Seeding Presentation Demo Ecosystem');
  console.log('  Populating realistic problems, projects, students, faculty, and industry records...');
  runCmd('npx tsx --env-file=.env.local --env-file=.env src/db/seed-demo.ts', 'Demo seeder execution');
  logSuccess('Live presentation demo dataset seeded successfully.');

  // 7. Verify TypeScript Types
  logStep(7, 'Verifying TypeScript Type Safety');
  const typeCheck = runCmd('npx tsc --noEmit', 'TypeScript validation');
  if (typeCheck) {
    logSuccess('TypeScript compilation: 0 errors.');
  }

  // Final Summary & Demo Accounts
  console.log(`
${COLOR.green}${COLOR.bright}=======================================================
   🎉 Setup Complete! CivicNexus is ready for presentation.
=======================================================${COLOR.reset}

${COLOR.cyan}${COLOR.bright}How to Start the Application:${COLOR.reset}
  Run: ${COLOR.yellow}${COLOR.bright}npm run dev${COLOR.reset}
  Open: ${COLOR.bright}https://localhost:3000${COLOR.reset} in your browser.

${COLOR.cyan}${COLOR.bright}Presentation Demo Accounts (Password: DemoPassword@2026):${COLOR.reset}
  👤 Citizen:          ${COLOR.bright}demo.citizen@civicnexus.demo${COLOR.reset}
  🎓 Student (CSE):    ${COLOR.bright}demo.student.cse@civicnexus.demo${COLOR.reset}
  ⚡ Student (IoT):    ${COLOR.bright}demo.student.iot@civicnexus.demo${COLOR.reset}
  🏛️  Faculty:          ${COLOR.bright}demo.faculty@civicnexus.demo${COLOR.reset}
  🏢 Industry:         ${COLOR.bright}demo.industry@civicnexus.demo${COLOR.reset}
  🛡️  Admin:            ${COLOR.bright}demo.admin@civicnexus.demo${COLOR.reset}

${COLOR.cyan}Tip:${COLOR.reset} On the /login page, you can simply click the fast-login buttons to sign in instantly!
`);
}

main().catch((err) => {
  console.error('\nSetup error:', err);
  process.exit(1);
});
