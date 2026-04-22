#!/usr/bin/env node
/**
 * Wait for the dev server to respond on http://localhost:<PORT>,
 * then open it in the user's default browser.
 *
 * Usage:  node scripts/open-browser.mjs            (defaults to /zh?autologin=1)
 *         PORT=3000 OPEN_PATH=/en/posts node scripts/open-browser.mjs
 *
 * The default URL carries `?autologin=1`, which triggers the dev-only
 * <DevAutoLogin /> component to fetch /api/dev/auto-login and sign in as
 * the admin account from .env. Set DEV_AUTOLOGIN=0 in .env to disable,
 * or override OPEN_PATH to skip it (e.g. OPEN_PATH=/zh).
 */

import { spawn } from 'node:child_process';

const PORT = process.env.PORT || '3000';
const OPEN_PATH = process.env.OPEN_PATH ||
  (process.env.DEV_AUTOLOGIN === '0' ? '/zh' : '/zh?autologin=1');
const URL = `http://localhost:${PORT}${OPEN_PATH}`;
const TIMEOUT_MS = 60_000;
const POLL_MS = 500;

async function ping() {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 1500);
    const res = await fetch(URL, { signal: ctl.signal, redirect: 'manual' });
    clearTimeout(t);
    // Accept any HTTP response (200/302/etc) — server is up.
    return res.status > 0;
  } catch {
    return false;
  }
}

function openInBrowser(url) {
  const p = process.platform;
  if (p === 'win32') {
    spawn('cmd', ['/c', 'start', '""', url], { detached: true, stdio: 'ignore' }).unref();
  } else if (p === 'darwin') {
    spawn('open', [url], { detached: true, stdio: 'ignore' }).unref();
  } else {
    spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref();
  }
}

const start = Date.now();
process.stdout.write(`\x1b[36m▶\x1b[0m Waiting for ${URL} …`);

while (Date.now() - start < TIMEOUT_MS) {
  if (await ping()) {
    process.stdout.write(` \x1b[32mready\x1b[0m\n`);
    openInBrowser(URL);
    console.log(`\x1b[32m✓\x1b[0m Opened browser → ${URL}`);
    process.exit(0);
  }
  process.stdout.write('.');
  await new Promise((r) => setTimeout(r, POLL_MS));
}

process.stdout.write(' \x1b[33mtimeout\x1b[0m\n');
console.log(`Server didn't respond within ${TIMEOUT_MS / 1000}s. Open it manually: ${URL}`);
process.exit(0); // don't fail the launch sequence
