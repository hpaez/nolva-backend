# 0001 — Accounts, cloud storage and sync

- **Status:** accepted
- **Date:** 2026-11-22

## Context

Nolva works fully offline on each device. Users need their documents backed
up and available on every device they sign in to, without passwords, at a
cost that stays near zero while the user base is small.

## Decision

- **Platform:** Cloudflare Workers for the API, **D1** for metadata and **R2**
  for page images. R2 has no egress fees, which matters because images are
  most of the traffic. Free tiers cover development and early users.
- **Language:** TypeScript with Hono; tests run inside the Workers runtime.
- **One environment:** `production`, deployed from `main` after a manual
  approval in GitHub Actions.
- **Sign-in:** Google and Apple only (Apple is mandatory on iOS when Google
  is offered). The app sends the provider's ID token; the Worker verifies it
  against the provider's JWKS (`iss`, `aud`, `exp`), upserts the user by
  `(provider, subject)` and issues its own tokens:
  - access token: JWT, 15 minutes;
  - refresh token: opaque, 60 days, stored hashed and **rotated** on every
    use. Reusing a rotated token revokes the whole session.
- **Data:** client-generated UUIDs (the core already creates them) for
  documents and pages. Deletions are tombstones so they propagate. Every
  server write gets a per-user, monotonically increasing `seq`.
- **Files:** immutable objects under `u/<user>/p/<page>/…` (originals never
  change; each processed image has a new name), so file sync is "transfer
  what is missing".
- **Sync protocol:**
  - _Push_: upload files first, then metadata, so no device ever sees a page
    whose image is missing. Last writer wins per record by `updated_at_ms`.
  - _Pull_: `GET /v1/sync/changes?since=<seq>`, paginated, including
    tombstones; the response carries the next cursor.
- **Client:** the sync engine (outbox, cursor, conflict rules) lives in
  nolva-core so Android and iOS share it; each platform supplies the HTTP
  transport (OkHttp, URLSession) through a UniFFI interface and schedules
  background sync (WorkManager, BGTaskScheduler).

## Consequences

- Last-writer-wins can drop a concurrent edit to the same record on two
  devices; acceptable for a single user's documents, revisit if sharing
  between users is added.
- Two copies of each page (original and processed) are stored; dropping the
  original would halve storage but prevent re-cropping on other devices.
- Without a staging environment, migrations must be backward compatible and
  deploys are gated by manual approval.
