-- Notifications table: backs the per-user bell + dropdown UI.
-- Read by /api/notifications, written by lib/notifications.ts createNotification().
--
-- Usage on server:
--   sudo mysql uprough_ascii_dev < 2026-05-27-notifications-schema.sql
--
-- Idempotent: uses IF NOT EXISTS for table creation.

CREATE TABLE IF NOT EXISTS notifications (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT UNSIGNED NOT NULL,
  type            VARCHAR(32) NOT NULL,
  actor_nick      VARCHAR(64) NULL,
  target          VARCHAR(255) NULL,
  target_url      VARCHAR(512) NULL,
  payload         JSON NULL,
  read_at         INT NULL,
  created_at      INT NOT NULL,
  KEY ix_user_unread (user_id, read_at, created_at)
);
