BEGIN;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS resolution_photo_url text;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS resolution_notes text;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS resolved_by uuid REFERENCES users(id);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS resolved_at timestamptz;
CREATE OR REPLACE FUNCTION require_resolution_evidence() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.status='RESUELTO' AND OLD.status IS DISTINCT FROM 'RESUELTO' AND
 (NEW.resolution_photo_url IS NULL OR NEW.resolution_photo_url !~ '^/media/reports/[0-9a-f-]{36}\.jpg$' OR NEW.resolved_by IS NULL OR NEW.resolved_at IS NULL) THEN
  RAISE EXCEPTION 'Se necesita una foto de solución para resolver el reporte' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS reports_require_resolution_photo ON reports;
CREATE TRIGGER reports_require_resolution_photo BEFORE UPDATE OF status ON reports FOR EACH ROW EXECUTE FUNCTION require_resolution_evidence();
COMMIT;
