#!/usr/bin/env node
/**
 * SQLite 数据库一键备份
 *
 *   npm run db:backup                              # 默认保留最近 20 份（无标签）
 *   npm run db:backup -- before-schema-change      # 给备份打标签（PowerShell 友好写法）
 *   npm run db:backup -- --label "v1-snapshot"     # 等价的传统写法
 *   npm run db:backup -- --keep 50                 # 调整无标签备份的保留份数
 *
 * 备份文件位置：prisma/backups/dev.db.<时间戳>[-<label>]
 *
 * 轮转策略（按 label 分桶，互不影响）：
 *   - 无 label                       → 保留最近 keep 份（默认 20）
 *   - label 以 "auto-" 开头          → 每个 auto label 各自保留 10 份（启停备份用）
 *   - 其他用户自定义 label           → 永久保留（里程碑备份）
 *   - dev.db.before-restore.*        → 永久保留（restore 前的安全快照）
 *
 * 设计要点：
 *   - 用 fs.copyFile 单文件原子复制（SQLite 单文件特性）
 *   - 复制前会先 PRAGMA wal_checkpoint，避免 -wal/-shm 残留
 *
 * 退出码：
 *   0 = 备份成功（或正常无操作）
 *   1 = 备份失败（被 setup/stop 调用时仅警告，不阻塞主流程）
 */

import {
  existsSync,
  mkdirSync,
  copyFileSync,
  readdirSync,
  statSync,
  unlinkSync,
} from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

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
// 兼容三种写法（PowerShell 会吞掉部分 -- 前缀，所以放宽）：
//   npm run db:backup
//   npm run db:backup -- --label foo --keep 50
//   npm run db:backup foo                 ← 第一个非 -- 参数当 label
const args = process.argv.slice(2);
function argOf(flag, fallback) {
  const i = args.indexOf(flag);
  if (i !== -1 && args[i + 1]) return args[i + 1];
  return fallback;
}
const keep = Math.max(1, Number(argOf('--keep', 20)));
const positional = args.find((a, idx) => {
  if (a.startsWith('--')) return false;
  // 不能是上一个 --xxx 后面的值
  const prev = args[idx - 1];
  if (prev === '--label' || prev === '--keep') return false;
  return true;
});
const label = (argOf('--label', positional || '') || '')
  .trim()
  .replace(/[^A-Za-z0-9._-]/g, '');

// ───────── checks ─────────
if (!existsSync(DB_PATH)) {
  log.err(`数据库文件不存在：${DB_PATH}`);
  log.dim('如果是首次启动，先跑 `npm run db:push` 或 `npm run launch` 初始化');
  process.exit(1);
}

// ───────── 1. WAL checkpoint（如果项目以后开了 WAL，避免漏数据） ─────────
log.step('刷新 WAL 缓冲到主库文件…');
const ckpt = spawnSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['prisma', 'db', 'execute', '--stdin', '--schema', 'prisma/schema.prisma'],
  {
    cwd: ROOT,
    shell: process.platform === 'win32',
    input: 'PRAGMA wal_checkpoint(TRUNCATE);',
    encoding: 'utf8',
  }
);
if (ckpt.status === 0) {
  log.ok('WAL checkpoint 完成');
} else {
  log.warn('WAL checkpoint 失败（默认 SQLite 不开 WAL，通常无影响），继续备份');
}

// ───────── 2. 准备目录 ─────────
if (!existsSync(BACKUP_DIR)) {
  mkdirSync(BACKUP_DIR, { recursive: true });
  log.ok(`已创建备份目录：${BACKUP_DIR}`);
}

// ───────── 3. 拷贝 ─────────
const ts = formatStamp(new Date());
const fileName = label ? `${FILE_PREFIX}${ts}-${label}` : `${FILE_PREFIX}${ts}`;
const target = join(BACKUP_DIR, fileName);

log.step(`备份到 ${fileName}`);
copyFileSync(DB_PATH, target);

const size = statSync(target).size;
log.ok(`完成 (${formatSize(size)})`);

// ───────── 4. 轮转（按 label 分桶） ─────────
const AUTO_KEEP = 10; // 每个 auto-* label 各自保留份数

function stampOf(name) {
  const m = name.match(/(\d{8}-\d{6})/);
  return m ? m[1] : '';
}

// 解析文件名 → { stamp, labelKey, isProtected }
//  - 无 label                  → labelKey = ''           （走 keep 轮转）
//  - 'auto-launch'/'auto-stop' → labelKey = 'auto-xxx'   （各自走 AUTO_KEEP）
//  - 其他 label                → isProtected = true      （永久保留）
//  - before-restore.*          → isProtected = true
function parseFile(name) {
  if (name.includes('.before-restore.')) {
    return { name, stamp: stampOf(name), labelKey: '__protected__', isProtected: true };
  }
  // 文件名形如：dev.db.<YYYYMMDD-HHmmss>[-label]
  const m = name.match(/^dev\.db\.\d{8}-\d{6}(?:-(.+))?$/);
  if (!m) return { name, stamp: stampOf(name), labelKey: '__skip__', isProtected: true };
  const lbl = (m[1] || '').trim();
  if (!lbl) return { name, stamp: stampOf(name), labelKey: '', isProtected: false };
  if (lbl.startsWith('auto-')) {
    return { name, stamp: stampOf(name), labelKey: lbl, isProtected: false };
  }
  return { name, stamp: stampOf(name), labelKey: lbl, isProtected: true };
}

const allFiles = readdirSync(BACKUP_DIR)
  .filter((f) => f.startsWith(FILE_PREFIX))
  .map(parseFile);

// 按桶分组，桶内倒序（最新在前），超出阈值的删除
const buckets = new Map();
for (const f of allFiles) {
  if (f.isProtected) continue;
  const arr = buckets.get(f.labelKey) || [];
  arr.push(f);
  buckets.set(f.labelKey, arr);
}

const toDelete = [];
for (const [key, arr] of buckets) {
  arr.sort((a, b) => b.stamp.localeCompare(a.stamp));
  const limit = key.startsWith('auto-') ? AUTO_KEEP : keep;
  if (arr.length > limit) {
    toDelete.push(...arr.slice(limit).map((f) => ({ ...f, limit, key })));
  }
}

if (toDelete.length > 0) {
  log.step(`旧备份轮转：删除 ${toDelete.length} 份`);
  for (const item of toDelete) {
    try {
      unlinkSync(join(BACKUP_DIR, item.name));
      const tag = item.key ? `[${item.key} 保留 ${item.limit}]` : `[无标签 保留 ${item.limit}]`;
      log.dim(`删除 ${item.name} ${tag}`);
    } catch (err) {
      log.warn(`删除失败 ${item.name}: ${err.message}`);
    }
  }
}

// ───────── 5. 收尾摘要 ─────────
const remaining = readdirSync(BACKUP_DIR)
  .filter((f) => f.startsWith(FILE_PREFIX))
  .sort();

console.log();
console.log(`${c.bold}备份目录：${c.reset}${BACKUP_DIR}`);
console.log(`${c.bold}当前共有：${c.reset}${remaining.length} 份备份`);
console.log(`${c.dim}查看：npm run db:list-backups${c.reset}`);
console.log(`${c.dim}还原：npm run db:restore -- --latest${c.reset}`);

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
