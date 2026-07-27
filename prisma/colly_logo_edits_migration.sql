-- prisma/colly_logo_edits_migration.sql
-- Public logo tagging: one append-only snapshot per save. The newest row for a
-- colly IS that colly's current logo map; colly_logos is a derived index
-- rebuilt from it. Run on the server after deploying:
--   mysql -u <user> -p <db> < colly_logo_edits_migration.sql

CREATE TABLE IF NOT EXISTS colly_logo_edits (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  colly_id   INT UNSIGNED NOT NULL,
  user_id    INT UNSIGNED NOT NULL,
  timestamp  INT          NOT NULL,
  map        MEDIUMTEXT   NOT NULL,
  logo_count INT          NOT NULL DEFAULT 0,
  KEY ix_colly_newest (colly_id, id),
  KEY ix_user (user_id)
);
