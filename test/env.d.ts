import type { D1Migration } from "cloudflare:test";

declare global {
  namespace Cloudflare {
    // Bindings that exist only in tests (see vitest.config.ts).
    interface Env {
      TEST_MIGRATIONS: D1Migration[];
    }
  }
}
