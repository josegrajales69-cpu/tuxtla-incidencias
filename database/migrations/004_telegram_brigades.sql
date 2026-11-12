BEGIN;
CREATE TABLE IF NOT EXISTS telegram_brigade_links(
 user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 telegram_user_id bigint NOT NULL UNIQUE,
 linked_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS telegram_link_codes(
 user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 code_hash text NOT NULL UNIQUE,
 expires_at timestamptz NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS telegram_bot_offsets(
 bot_id bigint PRIMARY KEY,
 next_update_id bigint NOT NULL DEFAULT 0
);
COMMIT;
