# Notes

Lasting rules, owner preferences and lessons (never task chatter), and how to test.

## Hosting

- One Worker (`mo`) serves `mo.anantf.com`; `anantf.com` itself is another repo on GitHub Pages and only holds small
  redirect pages at `/mo/`, `/babymo/` and `/qbank/`.
- Phones that installed an app at an old `anantf.com` path keep working: the redirect pages ship a service worker that
  removes the old install and sends the phone here. Installs on `mo.anantf.com` have their own storage and caches.
- A path this repo doesn't have is forwarded (302) to the same path on anantf.com, so the guide's links to other
  sites' pages keep working. `.md` files, tests, tools and config are never uploaded.
- Local check of the Worker: `npx wrangler@4 dev --local --port 8799`, then curl a few paths (it treats every request
  as the first `routes` host). Stop wrangler and workerd by PID.

## Testing

- `node tools/check.mjs` (service workers, Worker tests); unit and browser tests per app (see `AGENTS.md`).
- The question-bank "suggest a change" links open an issue in this repo.
