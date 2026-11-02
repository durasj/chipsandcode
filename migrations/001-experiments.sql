CREATE TABLE IF NOT EXISTS cnc_sessions (
  id text PRIMARY KEY,
  name text NOT NULL DEFAULT 'Anonym',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cnc_experiments (
  id text PRIMARY KEY,
  owner_id text NOT NULL REFERENCES cnc_sessions(id),
  payload jsonb NOT NULL CHECK (
    payload->>'id' = id AND payload->>'visibility' IN ('PRIVATE', 'PUBLIC')
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);

CREATE INDEX IF NOT EXISTS cnc_experiments_owner_idx ON cnc_experiments(owner_id);
