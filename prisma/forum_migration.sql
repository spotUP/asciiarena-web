-- Native forum: boards > topics > posts. Run on the server after deploying:
--   ssh spot@97.75.89.139 'mysql -u <user> -p<pass> asciiarena' < forum_migration.sql
-- (prisma/*.sql is not rsynced by deploy.sh, so it has to be piped over.)
--
-- Everything is IF NOT EXISTS-guarded so re-running is safe. Create order
-- matters: posts -> topics -> boards by foreign key.
--
-- Timestamps are unsigned unix seconds (INT), matching polls / news /
-- notifications / chat_participants rather than the DATETIME columns on the
-- legacy wall tables.

CREATE TABLE IF NOT EXISTS forum_boards (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  slug          VARCHAR(96)  NOT NULL,
  name          VARCHAR(120) NOT NULL,
  description   VARCHAR(255) NOT NULL DEFAULT '',
  sort_order    INT          NOT NULL DEFAULT 0,
  -- Minimum users.rank required to see / to post. NULL read rank means the
  -- board is visible to logged-out visitors. VARCHAR not CHAR: "Senior Member"
  -- is 13 chars and CHAR pads.
  min_read_rank VARCHAR(16)  NULL,
  min_post_rank VARCHAR(16)  NOT NULL DEFAULT 'Member',
  locked        TINYINT(1)   NOT NULL DEFAULT 0,
  hidden        TINYINT(1)   NOT NULL DEFAULT 0,
  -- Denormalized so the board index can ORDER BY last_post_at without a
  -- groupwise-max over forum_posts. Repaired by lib/forum/counters.ts.
  topic_count   INT          NOT NULL DEFAULT 0,
  post_count    INT          NOT NULL DEFAULT 0,
  last_topic_id INT UNSIGNED NULL,
  last_post_id  INT UNSIGNED NULL,
  last_post_at  INT          NULL,
  last_user_id  INT UNSIGNED NULL,
  created_at    INT          NOT NULL,
  updated_at    INT          NOT NULL,
  UNIQUE KEY uq_forum_board_slug (slug),
  KEY ix_visible_order (hidden, sort_order)
);

CREATE TABLE IF NOT EXISTS forum_topics (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  board_id      INT UNSIGNED NOT NULL,
  slug          VARCHAR(120) NOT NULL,
  title         VARCHAR(200) NOT NULL,
  user_id       INT UNSIGNED NOT NULL,
  pinned        TINYINT(1)   NOT NULL DEFAULT 0,
  locked        TINYINT(1)   NOT NULL DEFAULT 0,
  -- Includes the opening post, so a live topic never counts zero.
  post_count    INT          NOT NULL DEFAULT 1,
  view_count    INT          NOT NULL DEFAULT 0,
  first_post_id INT UNSIGNED NULL,
  last_post_id  INT UNSIGNED NULL,
  -- Set to created_at on insert so a topic with no replies still sorts.
  last_post_at  INT          NOT NULL,
  last_user_id  INT UNSIGNED NULL,
  deleted_at    INT          NULL,
  deleted_by_id INT UNSIGNED NULL,
  created_at    INT          NOT NULL,
  updated_at    INT          NOT NULL,
  UNIQUE KEY uq_board_slug (board_id, slug),
  -- The board listing's exact ORDER BY. deleted_at leads so the index also
  -- serves the live-only filter.
  KEY ix_board_listing (board_id, deleted_at, pinned, last_post_at),
  KEY ix_user_topics (user_id, id),
  FULLTEXT KEY ft_forum_topic_title (title),
  CONSTRAINT forum_topics_ibfk_1 FOREIGN KEY (board_id) REFERENCES forum_boards(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS forum_posts (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  topic_id      INT UNSIGNED NOT NULL,
  -- Denormalized from forum_topics so the read gate and the "latest forum
  -- posts" widget never need the join. Immutable while topics cannot move.
  board_id      INT UNSIGNED NOT NULL,
  user_id       INT UNSIGNED NOT NULL,
  body          MEDIUMTEXT   NOT NULL,
  -- RESERVED for the optional ANSI-art attachment. Column pair mirrors
  -- logos.ansi_b64 + logos.font so the existing renderer works unchanged.
  -- Nothing writes these yet.
  ansi_b64      MEDIUMTEXT   NULL,
  ansi_font     VARCHAR(32)  NULL,
  edited_at     INT          NULL,
  edited_by_id  INT UNSIGNED NULL,
  edit_count    INT          NOT NULL DEFAULT 0,
  deleted_at    INT          NULL,
  deleted_by_id INT UNSIGNED NULL,
  created_at    INT          NOT NULL,
  KEY ix_topic_seq (topic_id, deleted_at, id),
  KEY ix_user_posts (user_id, id),
  KEY ix_board_recent (board_id, id),
  FULLTEXT KEY ft_forum_post_body (body),
  CONSTRAINT forum_posts_ibfk_1 FOREIGN KEY (topic_id) REFERENCES forum_topics(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS forum_reports (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  post_id        INT UNSIGNED NOT NULL,
  topic_id       INT UNSIGNED NOT NULL,
  board_id       INT UNSIGNED NOT NULL,
  reporter_id    INT UNSIGNED NOT NULL,
  reason         VARCHAR(255) NOT NULL,
  created_at     INT          NOT NULL,
  -- NULL means still in the queue; the admin badge counts exactly these.
  resolved_at    INT          NULL,
  resolved_by_id INT UNSIGNED NULL,
  resolution     VARCHAR(16)  NULL,
  UNIQUE KEY uq_post_reporter (post_id, reporter_id),
  KEY ix_queue (resolved_at, created_at)
);

-- Seed one board so the forum is not a blank page on first load.
INSERT INTO forum_boards (slug, name, description, sort_order, min_post_rank, created_at, updated_at)
SELECT 'general', 'General', 'Anything scene related', 0, 'Member', UNIX_TIMESTAMP(), UNIX_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM forum_boards);
