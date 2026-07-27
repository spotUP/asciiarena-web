-- Archive support for conversations.
--
-- Until now the only way to clear a thread from the inbox was "Leave", which
-- removes the user from the conversation for good. archived_at is the
-- reversible alternative: it hides the thread from the default list, and the
-- thread resurfaces by itself as soon as a message newer than archived_at
-- arrives (the rule lives in isArchived(), lib/chatThread.ts).
--
-- Idempotent: safe to run more than once.

ALTER TABLE chat_participants
  ADD COLUMN IF NOT EXISTS archived_at INT NULL AFTER title;
