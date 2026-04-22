#!/usr/bin/env node
/**
 * Stop whatever is listening on the dev port (default 3000).
 * Cross-platform — uses platform-specific commands to find & kill the PID.
 *
 * 关闭前会自动调用 db-backup（label = auto-stop）保存当前数据库快照。
 * 备份失败 → 仅警告，不阻塞关闭。
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = process.env.PORT || '3000';
const isWin = process.platform === 'win32';
const useShell = isWin;

const c = {
  reset: '\x1b[0m', dim: '\x1b[2m', bold: '\x1b[1m',
  cyan: '\x1b[36m', green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m',
};
const log = {
  step: (m) => console.log(`${c.cyan}${c.bold}▶${c.reset} ${m}`),
  ok:   (m) => console.log(`${c.green}✓${c.reset} ${m}`),
  warn: (m) => console.log(`${c.yellow}!${c.reset} ${m}`),
  dim:  (m) => console.log(`${c.dim}  ${m}${c.reset}`),
};

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

// ───────── 1. 关闭前自动备份 ─────────
const dbPath = join(ROOT, 'prisma', 'dev.db');
const isSQLite = readEnvDatabaseUrl().startsWith('file:');
if (isSQLite && existsSync(dbPath)) {
  log.step('Auto-backup before stop…');
  const r = spawnSync(
    'node',
    ['scripts/db-backup.mjs', '--label', 'auto-stop'],
    { cwd: ROOT, shell: useShell, stdio: 'pipe', encoding: 'utf8' }
  );
  if (r.status === 0) {
    const m = (r.stdout || '').match(/dev\.db\.[\d\-a-z]+/i);
    log.ok(`Snapshot saved${m ? ` → ${m[0]}` : ''}`);
  } else {
    log.warn('Auto-backup failed (continuing to stop server):');
    const tail = (r.stderr || r.stdout || '').toString().trim().split('\n').slice(-3).join('\n  ');
    if (tail) log.dim(tail);
  }
} else {
  log.dim(isSQLite ? 'No database file — skipping auto-backup' : 'PostgreSQL mode — skipping local SQLite backup');
}

// ───────── 2. 找出占用端口的进程 ─────────
function findPids() {
  if (isWin) {
    const r = spawnSync('powershell', [
      '-NoProfile', '-Command',
      `Get-NetTCPConnection -LocalPort ${PORT} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique`,
    ], { encoding: 'utf8' });
    return (r.stdout || '').split(/\r?\n/).map((s) => s.trim()).filter(Boolean).filter((s) => /^\d+$/.test(s));
  }
  const r = spawnSync('lsof', ['-ti', `:${PORT}`], { encoding: 'utf8' });
  return (r.stdout || '').split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
}

function kill(pid) {
  if (isWin) {
    spawnSync('taskkill', ['/F', '/PID', pid, '/T'], { stdio: 'ignore' });
  } else {
    spawnSync('kill', ['-9', pid], { stdio: 'ignore' });
  }
}

// ───────── 3. 杀掉进程 ─────────
const pids = findPids();
if (pids.length === 0) {
  log.warn(`No process listening on port ${PORT}.`);
  process.exit(0);
}

for (const pid of pids) {
  kill(pid);
  log.ok(`Stopped PID ${pid} (port ${PORT})`);
}
