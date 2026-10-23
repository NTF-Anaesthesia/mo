# mo

Instructions for every AI assistant working here (Claude Code reads this through `CLAUDE.md`).

The NTF anaesthesia MO apps, served at **mo.anantf.com** by a small Cloudflare Worker named `mo`: the MO guide
(`mo/`), the Baby MO test (`babymo/`, at `/test/`) and the question bank (`qbank/`, at `/qbank/`). Part of the NTF
anaesthesia teaching sites (anantf.com is the landing site, in the `anantf-site` repo).

## Public here, private elsewhere

Anything merged here is public. Keep only code, docs, general rules and **made-up** sample data. Never commit
secrets, tokens, personal data, real names or patient details. Private notes belong in the owner's private notes
repo; never copy anything from there into this repo, a PR or an issue (neutral pointers like "ask the owner" are fine).

## Rules that bite

- Each app keeps its own folder and public path; `worker/routes.js` `SITES` decides what mo.anantf.com serves
  (`mo/` at the root, `babymo/` at `/test/`, `qbank/` at `/qbank/`). The Baby MO test reads the bank at `../qbank/`,
  so they must stay on one address.
- Each `sw.js` VERSION starts with its folder name and is stamped by the app's own tool: after changing a file a worker
  caches, run `node <app>/tools/stamp.mjs` (`qbank`, `babymo`, `mo/guide`); a version test checks it.
- The shared look comes from the app kit at `https://design.anantf.com/v1/` (never copy it here). Pages of anantf.com
  (spinal, regional, airway ...) are linked relatively; the Worker forwards them to anantf.com.
- The MO guide teaches the department handbook's clinical content as a learning app; it is not the handbook. Rosters,
  leave, MC, who to email, names and phone numbers must not be added to it.
- Questions in the bank are public: nothing confidential, patient-identifiable or copyrighted.
- Wrangler config keeps `preview_urls` and `workers_dev` off. The Worker is named `mo`.

## App defaults

- Installable web apps cancel the browser's automatic install prompt: add
  `<script>addEventListener('beforeinstallprompt', e => e.preventDefault());</script>` to the `<head>` of every page
  that links a manifest. Keep the manifest, icons and service worker: installable, never prompted. No install buttons.

## Checks before merging

```
node tools/check.mjs        # repo checks + Worker tests
node tools/proofread.mjs    # page and doc mistakes
```

Per app tests are listed in each app's `NOTES.md`; the browser ones run with
`PLAYWRIGHT_PATH=/opt/node22/lib/node_modules/playwright/index.mjs CHROMIUM_PATH=/opt/pw-browsers/chromium`
(`node qbank/test/e2e.mjs`, `babymo/test/e2e.mjs`, `mo/guide/test/e2e.mjs` and the `pwa.e2e.mjs` beside each).

## Working with the owner

- Instructions mostly come from a phone. Work through a request to the end; ask only when a decision is genuinely
  the owner's. When asked to plan, plan and wait.
- Keep each PR small and finished on its own. Start PR titles with the app: "<App>: …".
- Merge your own PRs once the checks pass, then report with the PR link (merge by the number the PR creation
  returned) and call `unsubscribe_pr_activity`: each PR event re-sends the whole context.
- Push once per finished step, not after every small commit (limited build minutes).
- Each app keeps `NOTES.md` (lasting decisions, how to test) and, for the MO guide, `STATUS.md`; the repo's own
  `STATUS.md` holds the state of the host. Read them before starting; update them when a task finishes. Cheap end of
  session: `quick-save`.
- Plain words, short; explain technical terms briefly the first time.

## Token savers

- `.claude/settings.json` is only read when a session has exactly one repo attached. Sessions usually attach the
  owner's notes repo as well; then the environment's shared settings apply instead, so keep both in step.
- `.claude/settings.json` denies reading `__/` and `vendor/` folders. Add generated files and very large files to its
  `deny` list (edit their build scripts instead), and say so here. Ask the owner if one is really needed.
- Run only the touched app's tests while iterating and the full run once before merge. Screenshots only for visual
  changes (one, viewport-sized); debug logic with text.

## Private notes and repo layout

Private notes: `NTF-Anaesthesia/ntf-hub-attach-always` (private, org members only). At the start of a session attach it
(`add_repo`) and read its `AGENTS.md`; save lasting notes there, never here. Repo layout: one repo per app or app
group, public code plus a `-private` pair; a new app gets its own repo (test in ntf-hub-attach-always `hub/new-repo.md`),
never a folder here.
