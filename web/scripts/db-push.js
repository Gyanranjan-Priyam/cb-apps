import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
  return env;
}

const args = process.argv.slice(2);
const isProdOnly = args.includes('--prod-only');
const isLocalOnly = args.includes('--local-only');

const baseEnv = parseEnvFile(path.join(projectRoot, '.env'));
const localEnv = { ...process.env, ...baseEnv, ...parseEnvFile(path.join(projectRoot, '.env.local')) };
const prodEnv = { ...process.env, ...baseEnv, ...parseEnvFile(path.join(projectRoot, '.env.production')) };

function pushToDatabase(name, envVars) {
  if (!envVars.DATABASE_URL) {
    console.warn(`[!] Skipping ${name}: DATABASE_URL not found.`);
    return;
  }
  console.log(`\n========================================`);
  console.log(`[db-push] Syncing ${name.toUpperCase()} database...`);
  console.log(`========================================`);
  try {
    const isLocal = name.toLowerCase() === 'local';
    const cmd = isLocal 
      ? 'npx prisma db push --accept-data-loss' 
      : 'npx prisma db push';

    execSync(cmd, {
      cwd: projectRoot,
      stdio: 'inherit',
      env: { ...process.env, ...envVars },
    });
    console.log(`[✓] ${name.toUpperCase()} database synced successfully.`);
  } catch (error) {
    console.error(`[!] Failed to sync ${name.toUpperCase()} database:`, error.message);
  }
}

console.log('Project root:', projectRoot);

if (!isProdOnly) {
  pushToDatabase('local', localEnv);
}

if (!isLocalOnly && prodEnv.DATABASE_URL && prodEnv.DATABASE_URL !== localEnv.DATABASE_URL) {
  pushToDatabase('production', prodEnv);
}

console.log('\n========================================');
console.log('[db-push] Generating Prisma Client...');
console.log('========================================');
try {
  execSync('npx prisma generate', { cwd: projectRoot, stdio: 'inherit', env: localEnv });
  console.log('[✓] Prisma Client generated successfully.');
} catch (e) {
  console.warn('[!] Note: If prisma generate failed due to a file lock, please restart the dev server.');
}

console.log('\n[✓] All database push operations completed.');
