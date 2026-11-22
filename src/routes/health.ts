import { Hono } from "hono";
import type { AppEnv } from "../env";

export interface HealthBody {
  status: "ok" | "degraded";
  database: "ok" | "unavailable";
  /** Id of the deployed Worker version, to tell deploys apart. */
  version: string;
}

export const health = new Hono<AppEnv>().get("/health", async (c) => {
  let database: HealthBody["database"];
  try {
    const row = await c.env.DB.prepare("SELECT 1 AS ok").first<{ ok: number }>();
    database = row?.ok === 1 ? "ok" : "unavailable";
  } catch (error) {
    console.error("health: database check failed", error);
    database = "unavailable";
  }
  const body: HealthBody = {
    status: database === "ok" ? "ok" : "degraded",
    database,
    version: c.env.CF_VERSION_METADATA.id,
  };
  return c.json(body, database === "ok" ? 200 : 503);
});
