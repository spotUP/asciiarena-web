-- Archive support for conversations.
--
-- Until now the only way to clear a thread from the inbox was "Leave", which
-- removes the user from the conversation for good. archived_at is the
-- reversible alternative: it hides the thread from the default list, and the
-- thread resurfaces by itself as soon as a message newer than archived_at
-- arrives (the rule lives in isArchived(), lib/chatThread.ts).
--
-- Idempotent, and deliberately NOT written as "ADD COLUMN IF NOT EXISTS":
-- that syntax is MariaDB-only, and this database is MySQL 8, where it is a
-- syntax error. The information_schema guard below works on both.

SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'chat_participants'
    AND COLUMN_NAME = 'archived_at'
);

SET @ddl := IF(@col_exists = 0,
  'ALTER TABLE chat_participants ADD COLUMN archived_at INT NULL AFTER title',
  'DO 0'
);

PREPARE stmt FROM @ddl;

EXECUTE stmt;

DEALLOCATE PREPARE stmt;
