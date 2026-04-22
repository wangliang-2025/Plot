#!/usr/bin/env node
/**
 * SQLite 数据库还原（还原前会自动把当前库再备份一份，安全可逆）
 *
 *   npm run db:list-backups            # 列出所有备份
 *   npm run db:restore -- latest       # 还原最新一份
 *   npm run db:restore -- 2            # 还原列表中的第 2 份
 *   npm run db:restore -- dev.db.20260419-223330
 *
 * （上面参数前不加 -- 也可以；PowerShell 用户推荐这种简短写法）
 *
 * 安全保障：
 *   - 还原前先把当前 dev.db 复制到 backups/dev.db.before-restore.<时间戳>
 *   - 文件名错误时直接拒绝
 *   - 还原后提示重启服务
 */

import {
  existsSync,
  mkdirSync,
  copyFileSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DB_PATH = join(ROOT, 'prisma', 'dev.db');
const BACKUP_DIR = join(ROOT, 'prisma', 'backups');
const FILE_PREFIX = 'dev.db.';

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

// ───────── parse args ─────────
// 兼容多种写法（PowerShell 经常吞掉 -- 前缀）：
//   npm run db:restore                 # 显示列表
//   npm run db:restore -- --list       # 同上
//   npm run db:restore -- --latest     # 还原最新
//   npm run db:restore -- latest       # 同上（PowerShell 友好）
//   npm run db:restore -- --pick 2     # 还原第 2 份
//   npm run db:restore -- 2            # 同上（数字 = pick）
//   npm run db:restore -- dev.db.20260419-223330
const args = process.argv.slice(2);
const wantList = args.includes('--list') || args.length === 0;
const wantLatest = args.includes('--latest') || args.includes('latest');

// 找出 --pick N 形式
let pickIndex = (() => {
  const i = args.indexOf('--pick');
  if (i !== -1 && args[i + 1]) {
    const n = Number(args[i + 1]);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
})();
// 找出独立的数字参数
if (pickIndex == null) {
  const numArg = args.find((a) => /^\d+$/.test(a));
  if (numArg) pickIndex = Number(numArg);
}

// 找出第一个像备份文件名的参数
const explicitName = args.find((a) => /^dev\.db\./.test(a)) || null;

// ───────── 准备目录 ─────────
if (!existsSync(BACKUP_DIR)) {
  log.err(`备份目录不存在：${BACKUP_DIR}`);
  log.dim('先跑一次 `npm run db:backup` 才能进行还原');
  process.exit(1);
}

// 从文件名里提取时间戳排序（mtime 在 Windows 上复制后会保留源时间，不可靠）
function stampOf(name) {
  // 匹配 dev.db.<YYYYMMDD-HHMMSS>[-label] 或 dev.db.before-restore.<YYYYMMDD-HHMMSS>
  const m = name.match(/(\d{8}-\d{6})/);
  return m ? m[1] : '';
}

const backups = readdirSync(BACKUP_DIR)
  .filter((f) => f.startsWith(FILE_PREFIX))
  .map((f) => {
    const full = join(BACKUP_DIR, f);
    const s = statSync(full);
    return {
      name: f,
      full,
      size: s.size,
      stamp: stampOf(f),
      isPreRestore: f.includes('.before-restore.'),
    };
  })
  .sort((a, b) => b.stamp.localeCompare(a.stamp));

if (backups.length === 0) {
  log.err(`备份目录里没有任何备份`);
  log.dim('先跑 `npm run db:backup` 创建第一份备份');
  process.exit(1);
}

// ───────── 仅列出 ─────────
if (wantList && !wantLatest && !explicitName && pickIndex == null) {
  console.log();
  console.log(`${c.bold}可用备份（按时间倒序，共 ${backups.length} 份）${c.reset}`);
  console.log(`${c.dim}${'─'.repeat(72)}${c.reset}`);
  backups.forEach((b, idx) => {
    const tag = b.isPreRestore ? `${c.yellow}[restore-snap]${c.reset} ` : '';
    const pretty = prettyStamp(b.stamp);
    const sz = formatSize(b.size).padStart(9);
    console.log(`  ${String(idx + 1).padStart(2)}. ${sz}  ${pretty}  ${tag}${b.name}`);
  });
  console.log();
  log.dim('还原最新：    npm run db:restore -- --latest');
  log.dim('还原第 N 份： npm run db:restore -- --pick 3');
  log.dim('指定文件名：  npm run db:restore -- dev.db.20260419-213000');
  process.exit(0);
}

// ───────── 找出要还原的那一份 ─────────
let target = null;
if (wantLatest) {
  target = backups.find((b) => !b.isPreRestore) || backups[0];
} else if (pickIndex != null) {
  target = backups[pickIndex - 1];
  if (!target) {
    log.err(`--pick ${pickIndex} 越界（共 ${backups.length} 份）`);
    process.exit(1);
  }
} else if (explicitName) {
  target = backups.find((b) => b.name === explicitName);
  if (!target) {
    log.err(`找不到备份文件：${explicitName}`);
    log.dim('用 `npm run db:list-backups` 看看可用列表');
    process.exit(1);
  }
}

if (!target) {
  log.err('请通过 --latest / --pick N / 文件名 指定要还原的备份');
  process.exit(1);
}

// ───────── 安全：把当前库再快照一份 ─────────
if (existsSync(DB_PATH)) {
  const ts = formatStamp(new Date());
  const safety = join(BACKUP_DIR, `${FILE_PREFIX}before-restore.${ts}`);
  log.step('还原前先把当前数据库快照保存（可逆操作）');
  if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR, { recursive: true });
  copyFileSync(DB_PATH, safety);
  log.ok(`已快照：${safety}`);
}

// ───────── 还原 ─────────
log.step(`还原 ${target.name} → prisma/dev.db`);
copyFileSync(target.full, DB_PATH);
log.ok(`完成 (${formatSize(target.size)})`);

console.log();
console.log(`${c.green}${c.bold}✔ 数据库已还原${c.reset}`);
log.dim('如果开发服务器正在跑，请先停掉再重启：');
log.dim('  npm run stop && npm run dev');
log.dim('如发现还原错了，可以再次执行：');
log.dim('  npm run db:restore -- --latest   # 现在最新的一份就是你刚才的"还原前快照"');

// ───────── helpers ─────────
function formatStamp(d) {
  const p = (n) => String(n).padStart(2, '0');
  return (
    d.getFullYear().toString() +
    p(d.getMonth() + 1) +
    p(d.getDate()) +
    '-' +
    p(d.getHours()) +
    p(d.getMinutes()) +
    p(d.getSeconds())
  );
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function prettyStamp(s) {
  // 20260419-223330 → 2026-04-19 22:33:30
  if (!/^\d{8}-\d{6}$/.test(s)) return s.padEnd(19);
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)} ${s.slice(9, 11)}:${s.slice(11, 13)}:${s.slice(13, 15)}`;
}
