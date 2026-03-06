CREATE TABLE IF NOT EXISTS workflow_rules (
  id SERIAL PRIMARY KEY,
  workspace_id INTEGER NOT NULL,
  event TEXT NOT NULL,
  action_type TEXT NOT NULL,
  action_payload JSONB NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at timestamptz DEFAULT now()
);