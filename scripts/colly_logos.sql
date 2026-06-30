-- Creates the colly_logos catalog table (Phase 1 of colly-logo-search).
-- Run once on the production DB before scripts/backfill-colly-logos.ts.
-- Matches the `colly_logos` model in prisma/schema.prisma.
-- (Alternative: `npx prisma db push` if you prefer Prisma to apply it.)

CREATE TABLE IF NOT EXISTS colly_logos (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  colly_id   INT UNSIGNED NOT NULL,
  position   INT NOT NULL,
  start_line INT NOT NULL,
  label      CHAR(120) NOT NULL,
  label_norm CHAR(120) NOT NULL,
  artist_id  INT UNSIGNED NULL,
  crew_id    INT UNSIGNED NULL,
  user_id    INT UNSIGNED NULL,
  PRIMARY KEY (id),
  INDEX colly_logos_colly_id_idx (colly_id),
  INDEX colly_logos_artist_id_idx (artist_id),
  INDEX colly_logos_crew_id_idx (crew_id),
  INDEX colly_logos_user_id_idx (user_id),
  INDEX colly_logos_label_norm_idx (label_norm),
  FULLTEXT INDEX ft_colly_logo_label (label)
) ENGINE=InnoDB;
