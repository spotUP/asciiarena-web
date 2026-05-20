-- Run on the server after deploying: mysql -u root asciiarena < font_groups_migration.sql

ALTER TABLE styles ADD COLUMN IF NOT EXISTS group_id INT UNSIGNED NULL;

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
  FOREIGN KEY (group_id) REFERENCES font_groups(id) ON DELETE CASCADE
);
