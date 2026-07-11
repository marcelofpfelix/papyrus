# papyrus status and roadmap

This file is a summary and historical roadmap index only. `.agents/request-audit.md`
is the authoritative request-by-request tracker, including feature requests,
bugs, roadmap ideas, deferred decisions, verification evidence, and next actions.

If this file, the README, or another guide appears to claim an area is complete
but the audit marks a concrete request as `Partial`, `Missing`, `Unverified`, or
`Deferred`, the audit wins.

## Source of truth

- Current request status: `.agents/request-audit.md`
- Public theme specification: `docs/theme-spec.md`
- Implementation and setup guide: `docs/guide.md`
- Pure adaptation checklist: `.agents/pure-parity.md`
- Starlight reference log: `.agents/starlight-comparison.md`
- CV source comparison: `.agents/cv-source-comparison.md`
- Deployment notes: `docs/deploy.md`

## What belongs here

Keep this file small. It should explain where to find the authoritative tracker,
not repeat the tracker.

Do not add duplicate status tables, broad `Done`/`Partial`/`Pending` sections, or
per-feature roadmap inventories here. Add or update a row in
`.agents/request-audit.md` instead.

## Current policy

- Every feature, bug, behavior, and roadmap item gets its own row in
  `.agents/request-audit.md`.
- A row is `Verified` only when the evidence column names the command, file,
  browser assertion, screenshot, or other artifact that proves the requested
  behavior.
- Repo-only roadmap/status docs must not be exposed as public demo routes unless
  explicitly re-authorized.
- Deferred deploy and renderer decisions stay deferred until the user
  re-authorizes them or chooses a renderer strategy.
