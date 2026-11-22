import { Hono } from "hono";
import { requestId } from "hono/request-id";
import type { AppEnv } from "./env";
import { ApiError, errorBody } from "./errors";
import { health } from "./routes/health";

/**
 * Builds the API. Every response carries an `X-Request-Id` header, and every
 * error uses the same JSON shape ({@link ErrorBody}).
 */
export function createApp() {
  const app = new Hono<AppEnv>();

  app.use(requestId());
  app.route("/v1", health);

  app.notFound((c) => c.json(errorBody("not_found", "No such endpoint", c.get("requestId")), 404));

  app.onError((error, c) => {
    if (error instanceof ApiError) {
      return c.json(errorBody(error.code, error.message, c.get("requestId")), error.status);
    }
    // Unexpected: log the details (Workers Logs), return nothing internal.
    console.error("unhandled error", { requestId: c.get("requestId"), error });
    return c.json(errorBody("internal", "Internal error", c.get("requestId")), 500);
  });

  return app;
}
