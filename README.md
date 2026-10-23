# mo

The NTF anaesthesia MO apps, served at [mo.anantf.com](https://mo.anantf.com/) by a small Cloudflare Worker.

| Address | Folder | What |
|---|---|---|
| `mo.anantf.com/` | `mo/` | Landing page for new MOs |
| `mo.anantf.com/guide/` | `mo/guide/` | The MO guide (installable, offline) |
| `mo.anantf.com/test/` | `babymo/` | The Baby MO test (`/babymo/` forwards here) |
| `mo.anantf.com/qbank/` | `qbank/` | The department's question bank |
| any other path | | forwarded to the same path on anantf.com (spinal, airway, regional pages) |

- `worker/routes.js` decides what each address serves; `worker/sites.js` is the Worker; `wrangler.jsonc` its config
  (Worker `mo`, preview links and workers.dev off); `.assetsignore` limits what is uploaded.
- `tools/`: `check.mjs` (repo checks + Worker tests; run before merging), `proofread.mjs` (page and doc mistakes;
  `--live` checks the real addresses), `shots.mjs` (phone screenshots by hand), `app-kit.mjs` (the shared app kit's URLs).
- The shared look is the NTF phone-app kit at `https://design.anantf.com/v1/`.
- `.claude/skills/quick-save`: cheap end-of-session save. `STATUS.md`, `NOTES.md`: state files.

Older addresses `anantf.com/mo/`, `/babymo/` and `/qbank/` redirect here.
