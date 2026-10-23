// worker/sites.js with a stand-in for the static assets. Run: node --test 'worker/test/*.test.mjs'
import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../sites.js';

const FILES = { '/mo/index.html': '<h1>mo</h1>', '/mo/guide/index.html': '<h1>guide</h1>', '/babymo/index.html': '<h1>test</h1>', '/qbank/index.html': '<h1>bank</h1>', '/qbank/bank/questions.json': '{}' };
const env = { ASSETS: { fetch: async req => {
  const p = new URL(req.url).pathname;
  return p in FILES ? new Response(FILES[p], { status: 200 }) : new Response('', { status: 404 });
} } };
const get = (url, method = 'GET') => worker.fetch(new Request(url, { method, redirect: 'manual' }), env);

test('serves the folder index, noindex', async () => {
  const r = await get('https://mo.anantf.com/');
  assert.equal(r.status, 200);
  assert.equal(await r.text(), '<h1>mo</h1>');
  assert.equal(r.headers.get('X-Robots-Tag'), 'noindex, nofollow');
  assert.equal(await (await get('https://mo.anantf.com/test/')).text(), '<h1>test</h1>');
  assert.equal(await (await get('https://mo.anantf.com/qbank/')).text(), '<h1>bank</h1>');
  assert.equal((await get('https://mo.anantf.com/qbank/bank/questions.json')).status, 200);
});

test('folder without a slash redirects (301); the old Baby MO path forwards to /test/', async () => {
  const guide = await get('https://mo.anantf.com/guide');
  assert.equal(guide.status, 301);
  assert.equal(guide.headers.get('location'), 'https://mo.anantf.com/guide/');
  assert.equal((await get('https://mo.anantf.com/qbank')).status, 301);
  const old = await get('https://mo.anantf.com/babymo/');
  assert.equal(old.status, 301);
  assert.equal(old.headers.get('location'), 'https://mo.anantf.com/test/');
});

test('a page of anantf.com is forwarded there (302); unknown hosts 404', async () => {
  const r = await get('https://mo.anantf.com/spinal/?x=1');
  assert.equal(r.status, 302);
  assert.equal(r.headers.get('location'), 'https://anantf.com/spinal/?x=1');
  assert.equal((await get('https://x.workers.dev/mo/')).status, 404);
  assert.equal((await get('https://anantf.com/mo/')).status, 404);
});

test('only GET and HEAD', async () => {
  assert.equal((await get('https://mo.anantf.com/', 'POST')).status, 405);
});
