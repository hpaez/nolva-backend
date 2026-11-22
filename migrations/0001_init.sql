-- Schema bookkeeping only; accounts and sync tables arrive with their
-- features. Keeps the migrations pipeline (local, tests and CD) exercised
-- from the first deploy.
CREATE TABLE IF NOT EXISTS app_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
) STRICT;

INSERT INTO app_meta (key, value) VALUES ('schema_created_at', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));
