BEGIN;
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS session_version integer NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique ON users(lower(username)) WHERE username IS NOT NULL;
CREATE TABLE IF NOT EXISTS account_audit(
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
 target_id uuid REFERENCES users(id) ON DELETE SET NULL,
 action text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
COMMIT;
