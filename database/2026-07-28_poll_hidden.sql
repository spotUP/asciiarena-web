-- Let a voter dismiss a poll they have already answered from the home page
-- hero, without hiding it from /polls or from anyone else.
--
-- Idempotent: CREATE TABLE IF NOT EXISTS is valid on MySQL 8.

CREATE TABLE IF NOT EXISTS poll_hidden (
  id        INT UNSIGNED NOT NULL AUTO_INCREMENT,
  poll_id   INT UNSIGNED NOT NULL,
  user_id   INT UNSIGNED NOT NULL,
  hidden_at INT NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_poll_user (poll_id, user_id),
  KEY ix_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
