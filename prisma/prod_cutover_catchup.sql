-- Catch-up migration for prod after the 2026-06-01 cutover.
-- Adds the schema changes that landed on dev between the
-- 2026-05-26 rollback and today but were never applied to prod.
-- Everything is IF NOT EXISTS-guarded so re-running is safe.

-- users: live-feed opt-out (CSV of activity types)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS activity_hidden_types VARCHAR(255) NULL;

-- users: per-user hidden widgets (CSV of widget keys)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS hidden_widgets VARCHAR(500) NULL;

-- notifications: site-wide notification inbox
CREATE TABLE IF NOT EXISTS notifications (
  id          INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  type        VARCHAR(32)  NOT NULL,
  actor_nick  VARCHAR(64)  NULL,
  target      VARCHAR(255) NULL,
  target_url  VARCHAR(512) NULL,
  payload     JSON         NULL,
  read_at     INT          NULL,
  created_at  INT          NOT NULL,
  KEY ix_user_unread (user_id, read_at, created_at)
);

-- font_groups + font_group_members: shared style sets
CREATE TABLE IF NOT EXISTS font_groups (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(64)  NOT NULL,
  owner_id   INT UNSIGNED NOT NULL,
  created_at INT          NOT NULL
);
CREATE TABLE IF NOT EXISTS font_group_members (
  id       INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  group_id INT UNSIGNED NOT NULL,
  user_id  INT UNSIGNED NOT NULL,
  UNIQUE KEY uq_group_user (group_id, user_id),
  CONSTRAINT font_group_members_ibfk_1 FOREIGN KEY (group_id) REFERENCES font_groups(id) ON DELETE CASCADE
);

-- styles: group_id link for shared styles
ALTER TABLE styles
  ADD COLUMN IF NOT EXISTS group_id INT UNSIGNED NULL;
