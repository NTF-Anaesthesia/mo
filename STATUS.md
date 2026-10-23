# Status

## Now

- 23 Oct 2026: imported from the old site repo (folders `mo/`, `babymo/`, `qbank/`, no history) with its own Worker `mo`.
  The checks pass. The cut-over (deploying Worker `mo`, which takes mo.anantf.com over from the old Worker) is run by a
  separate job; until it has run, the live host is still served by the old Worker.

## Waiting on the owner

- In Cloudflare, Workers Builds: connect Worker `mo` to this repo (optional while deploys come from the job or from
  this repo's Deploy workflow with secrets), and disconnect the old Worker `anantf-mo` from the old site repo.
- Real sign-in test at mo.anantf.com/test/ (passphrase and faculty Google sign-in) on a real phone; ask the owner.

## Next (in order)

1. Check mo.anantf.com after the cut-over: `/`, `/guide/`, `/test/`, `/qbank/` answer 200 and `/babymo/` forwards to `/test/`.
2. Pick up each app's own `NOTES.md` / `mo/STATUS.md` lists.

## Recently done

- Import PR (service workers re-stamped, question-bank suggestion links now open issues in this repo).

## Decisions (dated, one line each)

- 23 Oct 2026: the question bank lives here with the Baby MO test and is served at `/qbank/` on the same address, so
  the test's reads stay same-origin.
- 23 Oct 2026: the Worker is named `mo`, not `anantf-mo`, so builds of the old site repo cannot redeploy over this host.
- 23 Oct 2026: service-worker versions stay stamped in the repo by each app's own tool (no deploy-time stamping).
