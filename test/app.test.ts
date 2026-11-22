import { env, exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { ApiError, type ErrorBody } from "../src/errors";
import type { HealthBody } from "../src/routes/health";

/** Calls the Worker under test through its real fetch handler. */
function api(url: string): Promise<Response> {
  return exports.default.fetch(url);
}

describe("GET /v1/health", () => {
  it("reports the database and the deployed version", async () => {
    const response = await api("https://api.nolva.test/v1/health");

    expect(response.status).toBe(200);
    const body = await response.json<HealthBody>();
    expect(body.status).toBe("ok");
    expect(body.database).toBe("ok");
    expect(typeof body.version).toBe("string");
  });

  it("tags every response with a request id", async () => {
    const response = await api("https://api.nolva.test/v1/health");
    expect(response.headers.get("X-Request-Id")).toMatch(/^[\w-]{8,}$/);
  });
});

describe("errors", () => {
  it("unknown endpoints get a JSON 404", async () => {
    const response = await api("https://api.nolva.test/v1/nope");

    expect(response.status).toBe(404);
    const body = await response.json<ErrorBody>();
    expect(body.error.code).toBe("not_found");
    expect(body.error.requestId).toBe(response.headers.get("X-Request-Id"));
  });

  it("expected failures keep their status and code", async () => {
    const app = createApp().get("/v1/teapot", () => {
      throw new ApiError(418, "teapot", "Short and stout");
    });

    const response = await app.request("/v1/teapot", {}, env);

    expect(response.status).toBe(418);
    expect((await response.json<ErrorBody>()).error).toMatchObject({
      code: "teapot",
      message: "Short and stout",
    });
  });

  it("unexpected failures are hidden behind a generic 500", async () => {
    const app = createApp().get("/v1/boom", () => {
      throw new Error("secret stack details");
    });

    const response = await app.request("/v1/boom", {}, env);

    expect(response.status).toBe(500);
    const text = await response.text();
    expect(text).not.toContain("secret");
    expect((JSON.parse(text) as ErrorBody).error.code).toBe("internal");
  });
});
