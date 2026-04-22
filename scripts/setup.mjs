#!/usr/bin/env node
/**
 * One-time environment setup. Idempotent — safe to run on every launch.
 *
 *  - check Node version
 *  - copy .env.example -> .env (if missing)
 *  - npm install (if node_modules missing or stale)
 *  - prisma db push (if needed)
 *  - prisma db seed (if no Post rows yet)
 */

import { existsSync, copyFileSync, statSync, mkdirSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';
const npxCmd = isWin ? 'npx.cmd' : 'npx';

const c = {
  reset: '\x1b[0m', dim: '\x1b[2m', bold: '\x1b[1m',
  cyan: '\x1b[36m', green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m', gray: '\x1b[90m',
};
const log = {
  step: (m) => console.log(`${c.cyan}${c.bold}▶${c.reset} ${m}`),
  ok:   (m) => console.log(`${c.green}✓${c.reset} ${m}`),
  warn: (m) => console.log(`${c.yellow}!${c.reset} ${m}`),
  err:  (m) => console.log(`${c.red}✗${c.reset} ${m}`),
  dim:  (m) => console.log(`${c.gray}  ${m}${c.reset}`),
};

// On Windows, .cmd / .bat files must be invoked through the shell
// (Node 20.12+ and 22+ refuse to spawn them directly — see CVE-2024-27980).
const useShell = isWin;

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', cwd: ROOT, shell: useShell, ...opts });
  if (r.status !== 0) {
    throw new Error(`${cmd} ${args.join(' ')} exited with code ${r.status}`);
  }
}

function runQuiet(cmd, args, opts = {}) {
  return spawnSync(cmd, args, { stdio: 'pipe', cwd: ROOT, shell: useShell, encoding: 'utf8', ...opts });
}

function readEnvDatabaseUrl() {
  const candidates = [join(ROOT, '.env.local'), join(ROOT, '.env')];
  for (const file of candidates) {
    if (!existsSync(file)) continue;
    const raw = readFileSync(file, 'utf8');
    const line = raw
      .split(/\r?\n/)
      .find((l) => l.trim().startsWith('DATABASE_URL='));
    if (!line) continue;
    return line
      .replace(/^DATABASE_URL=/, '')
      .trim()
      .replace(/^['"]|['"]$/g, '');
  }
  return '';
}

// ───────── 1. Node version ─────────
log.step('Checking Node.js version');
const major = Number(process.versions.node.split('.')[0]);
if (major < 18) {
  log.err(`Node.js ${process.versions.node} detected — requires >= 18 (recommended: 20+).`);
  process.exit(1);
}
log.ok(`Node.js ${process.versions.node}`);

// ───────── 2. .env ─────────
const envPath = join(ROOT, '.env');
const envExample = join(ROOT, '.env.example');
if (!existsSync(envPath)) {
  log.step('Creating .env from .env.example');
  if (!existsSync(envExample)) {
    log.err('.env.example missing — cannot bootstrap.');
    process.exit(1);
  }
  copyFileSync(envExample, envPath);
  log.ok('.env created — edit it later for production values');
} else {
  log.ok('.env present');
}

// ───────── 3. node_modules ─────────
const nodeModules = join(ROOT, 'node_modules');
const lockfile = join(ROOT, 'package-lock.json');
const stampPath = join(nodeModules, '.install-stamp');

async function writeStamp() {
  try {
    mkdirSync(nodeModules, { recursive: true });
    const fs = await import('node:fs/promises');
    await fs.writeFile(stampPath, new Date().toISOString());
  } catch { /* ignore */ }
}

let needsInstall = false;
if (!existsSync(nodeModules)) {
  needsInstall = true;
} else if (!existsSync(stampPath)) {
  // node_modules already exists but no stamp — assume install is current,
  // create the stamp so subsequent runs can compare against the lockfile.
  await writeStamp();
} else if (existsSync(lockfile)) {
  try {
    const lockTime = statSync(lockfile).mtimeMs;
    const stampTime = statSync(stampPath).mtimeMs;
    if (lockTime > stampTime) needsInstall = true;
  } catch { /* ignore */ }
}

if (needsInstall) {
  log.step('Installing dependencies (this may take a few minutes the first time)…');
  run(npmCmd, ['install', '--no-audit', '--no-fund', '--loglevel=error']);
  await writeStamp();
  log.ok('Dependencies installed');
} else {
  log.ok('Dependencies up to date');
}

// ───────── 4. Database bootstrap ─────────
const dbPath = join(ROOT, 'prisma', 'dev.db');
const dbUrl = readEnvDatabaseUrl();
const isSQLite = dbUrl.startsWith('file:');
const dbExisted = isSQLite ? existsSync(dbPath) : true;

if (isSQLite && !dbExisted) {
  log.step('Initializing SQLite database (first run)…');
  run(npxCmd, ['prisma', 'db', 'push', '--skip-generate']);
  log.ok('SQLite schema synced');
} else if (!isSQLite) {
  log.step('Syncing PostgreSQL schema (prisma db push)…');
  run(npxCmd, ['prisma', 'db', 'push', '--skip-generate']);
  log.ok('PostgreSQL schema synced');
} else {
  log.ok('SQLite database file present');
}

// ───────── 5. Seed (only if no posts) ─────────
function postCount() {
  const r = runQuiet(npxCmd, ['tsx', '--env-file=.env', 'scripts/_count-posts.mjs']);
  if (r.status === 0) {
    const n = Number((r.stdout || '').trim());
    if (Number.isFinite(n)) return n;
  }
  return -1;
}

const count = postCount();
if (count <= 0) {
  log.step('Seeding initial admin & sample posts…');
  run(npmCmd, ['run', 'db:seed']);
  log.ok('Seed completed');
} else {
  log.ok(`Database already has ${count} post(s) — skipping seed`);
}

// ───────── 6. Pre-launch auto backup (SQLite only) ─────────
if (isSQLite && dbExisted) {
  log.step('Auto-backup before launch…');
  const r = spawnSync(
    'node',
    ['scripts/db-backup.mjs', '--label', 'auto-launch'],
    { cwd: ROOT, shell: useShell, stdio: 'pipe', encoding: 'utf8' }
  );
  if (r.status === 0) {
    const m = (r.stdout || '').match(/dev\.db\.[\d\-a-z]+/i);
    log.ok(`Snapshot saved${m ? ` → ${m[0]}` : ''}`);
  } else {
    log.warn('Auto-backup failed (continuing anyway):');
    log.dim((r.stderr || r.stdout || '').toString().trim().split('\n').slice(-3).join('\n  '));
  }
} else {
  log.dim(isSQLite ? 'First-ever launch — skipping pre-launch backup' : 'PostgreSQL mode — skipping local SQLite backup');
}

console.log(`${c.green}${c.bold}✔ Setup complete.${c.reset}`);
console.log(`${c.dim}  Admin login → email from .env (default: admin@example.com / ChangeMe123!)${c.reset}`);
