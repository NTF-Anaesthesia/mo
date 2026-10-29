// worker/routes.js: which folder each address serves, and what it must never serve. Run: node --test 'worker/test/*.test.mjs'
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { resolve, isSite, SITES } from '../routes.js';

const R = resolve;
const MO = 'mo.anantf.com';

test('the root is the landing page; the guide and its files come from mo/', () => {
  assert.deepEqual(R(MO, '/'), { file: 'mo/' });
  assert.deepEqual(R(MO, '/guide/'), { file: 'mo/guide/' });
  assert.deepEqual(R(MO, '/guide/sw.js'), { file: 'mo/guide/sw.js' });
  assert.deepEqual(R(MO, '/sw.js'), { file: 'mo/sw.js' });
  assert.deepEqual(R(MO.toUpperCase() + ':443', '/guide/'), { file: 'mo/guide/' });
  assert.deepEqual(R(MO, '/mo/guide/'), { file: 'mo/guide/' });
  assert.deepEqual(R(MO, '/mo'), { redirect: '/mo/' });
});

test('the Baby MO test is /test/ (from babymo/); the old path means the same thing', () => {
  assert.deepEqual(R(MO, '/test/'), { file: 'babymo/' });
  assert.deepEqual(R(MO, '/test/sw.js'), { file: 'babymo/sw.js' });
  assert.deepEqual(R(MO, '/test'), { redirect: '/test/' });
  assert.deepEqual(R(MO, '/babymo/'), { redirect: '/test/' });
  assert.deepEqual(R(MO, '/babymo'), { redirect: '/test/' });
  assert.deepEqual(R(MO, '/babymo/js/app.js'), { redirect: '/test/js/app.js' });
});

test('the question bank is /qbank/, same origin as the test', () => {
  assert.deepEqual(R(MO, '/qbank/'), { file: 'qbank/' });
  assert.deepEqual(R(MO, '/qbank'), { redirect: '/qbank/' });
  assert.deepEqual(R(MO, '/qbank/sw.js'), { file: 'qbank/sw.js' });
  assert.deepEqual(R(MO, '/qbank/bank/questions.json'), { file: 'qbank/bank/questions.json' });
  assert.deepEqual(R(MO, '/qbank/js/bank.js'), { file: 'qbank/js/bank.js' });
});

test('shared: the landing page icons and the logo mark', () => {
  assert.deepEqual(R(MO, '/assets/app-icons/mo/icon.svg'), { file: 'assets/app-icons/mo/icon.svg' });
  assert.deepEqual(R(MO, '/assets/app-icons'), { redirect: '/assets/app-icons/' });
  assert.deepEqual(R(MO, '/ana-ntf-monogram.svg'), { file: 'ana-ntf-monogram.svg' });
});

test('anything else maps inside mo/ (a 404 there; sites.js sends it to anantf.com)', () => {
  assert.deepEqual(R(MO, '/spinal/'), { file: 'mo/spinal/' });
  assert.deepEqual(R(MO, '/airway.html'), { file: 'mo/airway.html' });
});

test('nothing escapes its folder', () => {
  for (const p of ['/%2e%2e/README.md', '/guide/%2e%2e/%2e%2e/README.md', '/guide/..%2fREADME.md', '/guide/..\\README.md', '/guide/../README.md', '/%2E%2E/x', '/test/%2e%2e/%2e%2e/README.md', '/qbank/%2e%2e/x'])
    assert.deepEqual(R(MO, p), { notFound: true }, p);
});

test('unknown hosts serve nothing; localhost serves the repo', () => {
  assert.deepEqual(R('x.workers.dev', '/mo/'), { notFound: true });
  assert.deepEqual(R('anantf.com', '/mo/'), { notFound: true });
  assert.deepEqual(R('localhost:8787', '/mo/'), { file: 'mo/' });
  assert.ok(isSite(MO) && !isSite('anantf.com') && !isSite('x.workers.dev'));
  assert.deepEqual(Object.keys(SITES), [MO]);
});

test('every folder in SITES exists', () => {
  for (const [host, s] of Object.entries(SITES))
    for (const f of [s.root, ...Object.values(s.prefixes || {})].filter(Boolean))
      assert.ok(fs.existsSync(new URL(`../../${f}`, import.meta.url)), `${host}: ${f}`);
});

// every file the service workers ask for (SHELL, SITE, DATA) must be served on this address (apart from the app kit on
// design.anantf.com and the app core's theme on core.anawj.com): a worker installs all or nothing
const repo = path.resolve(new URL('../..', import.meta.url).pathname);
for (const [sw, base] of [['babymo/sw.js', '/test/'], ['qbank/sw.js', '/qbank/'], ['mo/guide/sw.js', '/guide/'], ['mo/sw.js', '/']]) {
  test(`${sw}: every file it caches is served on ${MO}`, () => {
    const src = fs.readFileSync(path.join(repo, sw), 'utf8');
    for (const n of ['SHELL', 'SITE', 'DATA']) {
      const m = src.match(new RegExp(`const ${n} = \\[([\\s\\S]*?)\\];`));
      if (!m) continue;
      for (const f of [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1])) {
        if (f.startsWith('https://design.anantf.com/v1/') || f.startsWith('https://core.anawj.com/ui/')) continue;
        const pub = new URL(f, 'https://' + MO + base).pathname;
        const r = R(MO, pub);
        assert.ok(r.file, `${sw}: ${f} (${pub}) is not served on ${MO}`);
        const onDisk = r.file.endsWith('/') ? r.file + 'index.html' : r.file;
        assert.ok(fs.existsSync(path.join(repo, onDisk)), `${pub} -> ${onDisk} does not exist`);
      }
    }
  });
}
