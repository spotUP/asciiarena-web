-- Live polls system. Run on the server after deploying:
--   mysql -u root asciiarena < polls_migration.sql

CREATE TABLE IF NOT EXISTS polls (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  slug          VARCHAR(96)  NOT NULL,
  title         VARCHAR(255) NOT NULL,
  body          MEDIUMTEXT   NOT NULL,
  type          ENUM('single','multi','yesno','rating','ranked','approval','text_suggest') NOT NULL,
  status        ENUM('draft','open','closed') NOT NULL DEFAULT 'draft',
  featured      TINYINT(1)   NOT NULL DEFAULT 0,
  created_by_id INT UNSIGNED NOT NULL,
  opens_at      INT          NULL,
  closes_at     INT          NULL,
  config        JSON         NULL,
  show_results  ENUM('always','after_vote','after_close') NOT NULL DEFAULT 'always',
  result_layout ENUM('solid','tail','dual_row') NOT NULL DEFAULT 'tail',
  created_at    INT          NOT NULL,
  updated_at    INT          NOT NULL,
  UNIQUE KEY uq_slug (slug),
  KEY ix_status_featured (status, featured),
  KEY ix_creator (created_by_id)
);

CREATE TABLE IF NOT EXISTS poll_options (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  poll_id       INT UNSIGNED NOT NULL,
  label         VARCHAR(255) NOT NULL,
  color_idx     TINYINT      NOT NULL DEFAULT 7,
  sort_order    INT          NOT NULL DEFAULT 0,
  created_by_id INT UNSIGNED NULL,
  approved      TINYINT(1)   NOT NULL DEFAULT 1,
  KEY ix_poll (poll_id),
  CONSTRAINT poll_options_ibfk_1 FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS poll_votes (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  poll_id     INT UNSIGNED NOT NULL,
  user_id     INT UNSIGNED NOT NULL,
  option_id   INT UNSIGNED NOT NULL,
  vote_value  INT          NULL,
  created_at  INT          NOT NULL,
  updated_at  INT          NOT NULL,
  UNIQUE KEY uq_poll_user_option (poll_id, user_id, option_id),
  KEY ix_poll (poll_id),
  KEY ix_user (user_id),
  CONSTRAINT poll_votes_ibfk_1 FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE,
  CONSTRAINT poll_votes_ibfk_2 FOREIGN KEY (option_id) REFERENCES poll_options(id) ON DELETE CASCADE
);
