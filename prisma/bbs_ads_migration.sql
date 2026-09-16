-- Run on the server after deploying: mysql -u root uprough_ascii < bbs_ads_migration.sql
-- (Plain ALTER, no IF NOT EXISTS: MySQL does not accept it. Re-running
-- after a partial apply fails on the duplicate column - drop it first or
-- comment out the lines that already landed.)

ALTER TABLE bbses ADD COLUMN demozoo_id INT UNSIGNED NULL;
ALTER TABLE bbses ADD UNIQUE INDEX uq_bbses_demozoo (demozoo_id);

CREATE TABLE IF NOT EXISTS bbs_ads (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  bbs_id        INT UNSIGNED NOT NULL,
  demozoo_ad_id INT UNSIGNED NOT NULL,
  filename      VARCHAR(255) NOT NULL,
  filesize      INT NULL,
  content       MEDIUMTEXT NOT NULL,
  encoding      VARCHAR(16) NULL,
  is_ansi       TINYINT(1) NOT NULL DEFAULT 0,
  phones_json   TEXT NOT NULL,
  nodes         INT NULL,
  handles_json  TEXT NOT NULL,
  groups_json   TEXT NOT NULL,
  page_url      VARCHAR(255) NULL,
  UNIQUE KEY uq_bbs_ads_demozoo (demozoo_ad_id),
  INDEX idx_bbs_ads_bbs (bbs_id),
  FULLTEXT INDEX fts_bbs_ads_filename (filename)
);
-- No FOREIGN KEY: bbses is MyISAM (like bbs_of). The app joins on bbs_id
-- and the import never deletes; orphan protection lives in code review,
-- not in the engine.
