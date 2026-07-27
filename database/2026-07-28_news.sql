-- Site news: the announcement bar and the /news archive.
--
-- `banner` lets an item be published to /news without also interrupting every
-- visitor with the top-of-page bar.
--
-- news_reads is the per-user "already seen" marker for logged-in members;
-- anonymous visitors get the same behaviour from localStorage, so they have no
-- rows here.
--
-- Idempotent: CREATE TABLE IF NOT EXISTS is valid on MySQL 8 (unlike
-- ADD COLUMN IF NOT EXISTS, which is MariaDB-only).

CREATE TABLE IF NOT EXISTS news (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title         VARCHAR(200) NOT NULL,
  body          MEDIUMTEXT NOT NULL,
  published     TINYINT(1) NOT NULL DEFAULT 0,
  banner        TINYINT(1) NOT NULL DEFAULT 1,
  created_by_id INT UNSIGNED NULL,
  created_at    INT NOT NULL,
  updated_at    INT NOT NULL,
  PRIMARY KEY (id),
  KEY ix_published_created (published, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS news_reads (
  id      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  news_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  read_at INT NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_news_user (news_id, user_id),
  KEY ix_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
