// Repo checks for mistakes tests don't catch. Run before merging: node tools/check.mjs
// 1. Each app's sw.js has a VERSION starting with its folder name and deletes only caches with its own prefix (apps can
//    share an origin). The apps stamp their own VERSION (node <app>/tools/stamp.mjs; each app's version test checks it).
//    A retired worker (VERSION ends in -retired) is skipped.
// 2. Every file in an app's SHELL list exists.
// 3. wrangler.jsonc keeps preview links and the workers.dev address off.
// 4. The Worker's tests pass (node --test 'worker/test/*.test.mjs').
// Exits 1 on any failure.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const fail = msg => errors.push(msg);

const SKIPDIR = /^(\.|node_modules$|tools$|worker$|assets$)/;
const apps = fs.readdirSync(ROOT, { withFileTypes: true }).filter(d => d.isDirectory() && !SKIPDIR.test(d.name))
  .flatMap(d => [d.name, ...fs.readdirSync(path.join(ROOT, d.name), { withFileTypes: true }).filter(e => e.isDirectory() && !SKIPDIR.test(e.name)).map(e => `${d.name}/${e.name}`)])
  .filter(d => fs.existsSync(path.join(ROOT, d, 'sw.js')));
for (const app of apps) {
  const swPath = `${app}/sw.js`;
  const sw = fs.readFileSync(path.join(ROOT, swPath), 'utf8');
  const prefix = `${app.split('/')[0]}-`;

  const version = sw.match(/const VERSION = '([^']+)'/)?.[1];
  if (!version) fail(`${swPath}: no VERSION constant`);
  else if (!version.startsWith(prefix)) fail(`${swPath}: VERSION '${version}' should start with '${prefix}'`);
  else if (version.endsWith('-retired')) continue;

  for (const line of sw.split('\n').filter(l => l.includes('caches.delete'))) {
    if (!line.includes(`startsWith('${prefix}')`)) fail(`${swPath}: caches.delete without a startsWith('${prefix}') guard deletes other apps' caches:\n    ${line.trim()}`);
  }

  const shellSrc = sw.match(/const SHELL = \[([\s\S]*?)\];/)?.[1];
  if (!shellSrc) { fail(`${swPath}: no SHELL list`); continue; }
  const shell = [...shellSrc.matchAll(/'([^']+)'/g)].map(m => m[1]).filter(f => f !== './')
    .map(f => path.posix.normalize(`${app}/${f}`));
  for (const f of shell) if (!fs.existsSync(path.join(ROOT, f))) fail(`${swPath}: SHELL lists ${f}, which doesn't exist`);
}

const wrangler = path.join(ROOT, 'wrangler.jsonc');
if (fs.existsSync(wrangler)) {
  const w = fs.readFileSync(wrangler, 'utf8').replace(/^\s*\/\/.*$/gm, '');
  if (!/"preview_urls"\s*:\s*false/.test(w)) fail('wrangler.jsonc: "preview_urls" should be false (no preview links)');
  if (!/"workers_dev"\s*:\s*false/.test(w)) fail('wrangler.jsonc: "workers_dev" should be false (real addresses only)');
}

if (fs.existsSync(path.join(ROOT, 'worker/test'))) {
  try { execFileSync(process.execPath, ['--test', 'worker/test/*.test.mjs'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch (e) { fail('worker tests failed:\n' + String(e.stdout || e.message).split('\n').filter(l => /not ok|Error|expected|actual/.test(l)).slice(0, 10).join('\n')); }
}

// 5. Each page loads kit.js (the app core's theme); the four copies are the same file and name the version tools/app-kit.mjs
//    lists for the workers (CORE_FILES), so what a worker caches is what the page loads.
{
  const { CORE } = await import('./app-kit.mjs');
  const copies = ['mo', 'mo/guide', 'babymo', 'qbank'].map(d => [d, fs.readFileSync(path.join(ROOT, d, 'kit.js'), 'utf8')]);
  for (const [d, text] of copies) {
    if (text !== copies[0][1]) fail(`${d}/kit.js differs from ${copies[0][0]}/kit.js (keep the copies identical)`);
    if (!text.includes(`const CORE = '${CORE}';`)) fail(`${d}/kit.js names a different core version than tools/app-kit.mjs (${CORE})`);
    if (!/src="kit\.js"/.test(fs.readFileSync(path.join(ROOT, d, 'index.html'), 'utf8'))) fail(`${d}/index.html does not load kit.js`);
  }
}

if (errors.length) {
  console.error(`check: ${errors.length} problem(s)\n- ` + errors.join('\n- '));
  process.exit(1);
}
console.log(`check: ok (${apps.join(', ') || 'no apps'}; worker tests pass)`);
