# nolva-backend

API for [Nolva](https://github.com/hpaez/nolva-android): accounts, sync and
file storage, running on Cloudflare Workers with D1 (metadata) and R2
(page images). Written in TypeScript with [Hono](https://hono.dev).

The design (sign-in, data model, sync protocol) is in
[docs/decisions/0001-accounts-and-sync.md](docs/decisions/0001-accounts-and-sync.md).

## API

| Method | Path         | Description                          |
| ------ | ------------ | ------------------------------------ |
| `GET`  | `/v1/health` | Database status and deployed version |

Every response has an `X-Request-Id` header. Errors share one shape:

```json
{ "error": { "code": "not_found", "message": "No such endpoint", "requestId": "…" } }
```

## Local development

Requires Node.js 24 (see `.nvmrc`).

```sh
npm install                 # also generates worker-configuration.d.ts
npm run db:migrate:local    # apply migrations to the local D1
npm run dev                 # http://localhost:8787/v1/health
```

| Script               | What it does                                                                     |
| -------------------- | -------------------------------------------------------------------------------- |
| `npm test`           | Vitest inside the Workers runtime (Miniflare), with a fresh migrated D1 per file |
| `npm run check`      | Lint, format check, typecheck and tests, like CI                                 |
| `npm run cf-typegen` | Regenerate binding types after editing `wrangler.jsonc`                          |

## Migrations

SQL files in `migrations/`, numbered and applied in order (`wrangler d1
migrations create DB <name>` creates the next one). Deploys apply them
**before** the new code goes live, so each migration must work with the
version still running: add tables and columns first, remove them in a later
release.

## CI/CD

- **CI** (`ci.yml`) runs on every pull request: lint, format, typecheck,
  tests and a bundle check. The job is named `CI result`, the required check
  for `main`.
- **Deploy** (`deploy.yml`) runs on every push to `main`: CI again, then the
  `production` job **waits for approval**, applies migrations, deploys and
  checks `/v1/health`. It can also be started by hand from Actions.

### One-time setup

1. **Cloudflare API token** (My Profile → API Tokens → Create Token →
   "Edit Cloudflare Workers" template, then add _Account → D1 → Edit_),
   scoped to the Nolva account.
2. **GitHub environment** (Settings → Environments → New environment
   `production`):
   - _Required reviewers_: add yourself, so every deploy waits for approval.
   - _Deployment branches_: selected branches → `main`.
   - _Environment secrets_: `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
3. **Branch protection** for `main`: require pull requests and the
   `CI result` check.
