import { applyD1Migrations } from "cloudflare:test";
import { env } from "cloudflare:workers";

// Each test file gets its own isolated storage; bring its D1 to the
// current schema first, exactly as `wrangler d1 migrations apply` would.
await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
