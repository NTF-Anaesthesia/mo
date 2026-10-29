// The NTF phone-app kit (DESIGN-APP.md) lives in NTF-Anaesthesia/ntf-design and is served at https://design.anantf.com/v1/
// (CORS open; /v1/ never breaks, a breaking change would go to /v2/). The app stamps (qbank, babymo, mo/guide, regional)
// use this to put the kit's URLs in their workers' SITE lists, and hash those entries by URL (no files to read here).
// The workers serve the kit cache first, so a compatible change made in place on /v1/ reaches installed apps with their
// next new VERSION. When the fonts app.css loads change, update KIT_FONTS (node tools/app-kit.mjs --check compares it
// with the live app.css) and run every app's stamp: a worker that lists a file the kit no longer has cannot install.
export const KIT = 'https://design.anantf.com/v1/';
// The fonts app.css loads (its url()s, relative to /v1/).
export const KIT_FONTS = ['fonts/inter.woff2', 'fonts/jetbrains-mono.woff2', 'fonts/literata.woff2'].map((f) => KIT + f);
// The app core's theme (app-ui, pinned to one exact version; a page loads it through its kit.js, which names the same
// version: test/kit.test.mjs in each app compares them). Files are listed because a worker caches the import closure.
export const CORE = 'https://core.anawj.com/ui/1.0.0-rc.35/';
export const CORE_FILES = ['theme/choice.js', 'theme/colour.js', 'theme/grid.js', 'theme/guard.js', 'theme/index.js', 'theme/looks.js',
  'theme/looks/a.js', 'theme/looks/b.js', 'theme/looks/c.js', 'theme/looks/d.js', 'theme/looks/e.js', 'theme/motion.js',
  'theme/palette-css.js', 'theme/presets.js', 'theme/schema.js', 'theme/switch.js'].map((f) => CORE + f);
export const isKit = (f) => f.startsWith(KIT) || f.startsWith(CORE);
// The kit URLs a page or stylesheet links (href=, src=), plus the fonts app.css loads when it links app.css and the core theme's files when the page loads kit.js.
export function kitRefs(text) {
  const refs = new Set([...text.matchAll(/(?:href|src)=["'](https:\/\/design\.anantf\.com\/v1\/[^"'?#]+)/g)].map((m) => m[1]));
  if (refs.has(KIT + 'app.css')) for (const f of KIT_FONTS) refs.add(f);
  if (/src=["']kit\.js["']/.test(text)) for (const f of CORE_FILES) refs.add(f);
  return [...refs].sort();
}

if (import.meta.url === `file://${process.argv[1]}` && process.argv.includes('--check')) {
  const css = await (await fetch(KIT + 'app.css')).text();
  const live = [...new Set([...css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)].map((m) => new URL(m[1], KIT + 'app.css').href))].sort();
  if (JSON.stringify(live) !== JSON.stringify([...KIT_FONTS].sort())) { console.error(`KIT_FONTS is ${KIT_FONTS.join(', ')}; the live app.css loads ${live.join(', ')}`); process.exit(1); }
  console.log(`app kit fonts ok (${live.length})`);
}
