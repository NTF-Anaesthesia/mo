// Which folder of this repo each address serves. Pure functions, no Cloudflare APIs, so worker/test/routes.test.mjs
// can check them in Node. worker/sites.js is the Worker that uses them.
//
// A host in SITES is served only from the folders listed for it plus the shared files below. A host not listed serves
// nothing, except local testing (localhost), which sees the repo as it is.

// host -> { root: 'mo/' }: the folder served at the address's root (the folder's own name works too: /mo/ is the same page)
//         prefixes: more apps, one path each (/test/ is the Baby MO test, from babymo/; /qbank/ is the question bank)
//         redirects: old paths that mean the same thing here (/babymo/ is /test/ on this address; the guide links ../../babymo/)
export const SITES = {
  'mo.anantf.com': { root: 'mo/', prefixes: { '/test/': 'babymo/', '/qbank/': 'qbank/' }, redirects: { '/babymo/': '/test/' } },
};

// The folders and files every site host serves as they are: the MO landing page's icons and the logo mark the Baby MO
// test caches (the apps link them as /assets/app-icons/mo/... and ../ana-ntf-monogram.svg). The app kit and its fonts
// come from https://design.anantf.com/v1/.
export const SHARED = ['/assets/app-icons/', '/ana-ntf-monogram.svg'];

const LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/;

// -> { file } (a path inside the repo, or a folder ending in "/"), { redirect } (a public path to send the browser to),
//    { notFound: true }
export function resolve(host, pathname) {
  const out = route(host, pathname);
  // an encoded slash, dot or backslash, or a leftover ".." could point the asset lookup out of the folder: refuse
  return out.file != null && /%2e|%2f|%5c|\\|(^|\/)\.\.?(\/|$)/i.test(out.file) ? { notFound: true } : out;
}

function route(host, pathname) {
  host = String(host || '').toLowerCase().replace(/:\d+$/, '');
  const site = SITES[host], p = pathname;
  if (!site) return LOCAL.test(host) ? { file: p.replace(/^\//, '') } : { notFound: true };
  for (const s of SHARED) {
    if (s.endsWith('/')) {
      if (p === s.slice(0, -1)) return { redirect: s };
      if (p.startsWith(s)) return { file: p.slice(1) };
    } else if (p === s) return { file: p.slice(1) };
  }
  for (const [from, to] of Object.entries(site.redirects || {})) {
    if (p === from.slice(0, -1)) return { redirect: to };
    if (p.startsWith(from)) return { redirect: to + p.slice(from.length) };
  }
  for (const [prefix, folder] of Object.entries(site.prefixes || {})) {
    if (p === prefix.slice(0, -1)) return { redirect: prefix };
    if (p.startsWith(prefix)) return { file: folder + p.slice(prefix.length) };
  }
  const own = '/' + site.root;
  if (p === own.slice(0, -1)) return { redirect: own };
  if (p.startsWith(own)) return { file: site.root + p.slice(own.length) };
  return { file: site.root + p.replace(/^\//, '') };
}

// Where a site host sends an address its own folders don't have: the same path on anantf.com (the guide links to the
// regional pages, the spinal page and the airway page that way).
export const APEX = 'https://anantf.com';
export const isSite = host => !!SITES[String(host || '').toLowerCase().replace(/:\d+$/, '')];
