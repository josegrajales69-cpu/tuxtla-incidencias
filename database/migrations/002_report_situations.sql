BEGIN;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS situation text;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS situation_label text;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS priority text CHECK(priority IN ('ALTA','MEDIA','BAJA','POR_CONFIRMAR'));
ALTER TABLE reports ADD COLUMN IF NOT EXISTS priority_reason text;
CREATE OR REPLACE FUNCTION enqueue_report_dispatch() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 INSERT INTO dispatch_outbox(report_id,payload) VALUES(NEW.id,jsonb_build_object(
  'id',NEW.id,'title',NEW.title,'description',NEW.description,'category',NEW.category,'status',NEW.status,
  'address',NEW.address,'createdAt',NEW.created_at,'photoUrl',NEW.photo_url,
  'situation',NEW.situation,'situationLabel',NEW.situation_label,'priority',NEW.priority,'priorityReason',NEW.priority_reason,
  'prioritySource',CASE WHEN NEW.situation IS NOT NULL THEN 'structured-v1' ELSE NULL END,
  'coordinates',jsonb_build_object('latitude',ST_Y(NEW.location),'longitude',ST_X(NEW.location))
 )) ON CONFLICT(report_id) DO NOTHING;
 RETURN NEW;
END;$$;
COMMIT;
