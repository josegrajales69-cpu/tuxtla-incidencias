BEGIN;
CREATE TABLE IF NOT EXISTS dispatch_outbox (
  event_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id uuid NOT NULL UNIQUE,
  folio bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sending','sent','failed')),
  attempts integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  locked_until timestamptz,
  last_error text,
  sent_at timestamptz,
  telegram_message_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS dispatch_outbox_pending_idx ON dispatch_outbox(next_attempt_at)
  WHERE status IN ('pending','sending');
CREATE OR REPLACE FUNCTION enqueue_report_dispatch() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO dispatch_outbox(report_id,payload) VALUES (NEW.id,jsonb_build_object(
    'id',NEW.id,'title',NEW.title,'description',NEW.description,'category',NEW.category,
    'status',NEW.status,'address',NEW.address,'createdAt',NEW.created_at,
    'coordinates',jsonb_build_object('latitude',ST_Y(NEW.location),'longitude',ST_X(NEW.location))
  )) ON CONFLICT(report_id) DO NOTHING;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS reports_dispatch_created ON reports;
CREATE TRIGGER reports_dispatch_created AFTER INSERT ON reports FOR EACH ROW EXECUTE FUNCTION enqueue_report_dispatch();
COMMIT;
