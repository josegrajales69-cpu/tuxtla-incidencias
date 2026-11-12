BEGIN;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS withdrawn_at timestamptz;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS withdrawn_by uuid REFERENCES users(id);
CREATE INDEX IF NOT EXISTS reports_active_category_idx ON reports(category) WHERE withdrawn_at IS NULL;
COMMIT;
