-- Repair messages addressed by a user to themselves.
--
-- 113 rows across 78 threads carried `from_id = to_id`. They were minted by the
-- chat composer, which offered you your own account as a chat peer, and by the
-- legacy PHP messenger before it. Two of them are why this repair exists:
-- thread 3202 began on 2026-06-01 as Spot chatting with Spot, and diNO and
-- dipswitch were added to it three days later. /api/chat/thread resolves a 1:1
-- conversation with
--
--   (from_id = me AND to_id = peer) OR (from_id = peer AND to_id = me)
--
-- which collapses to `from_id = me AND to_id = me` when the peer is you, so
-- opening "chat with myself" returned thread 3202 -- diNO and dipswitch's group
-- -- and anything typed there would have gone to them.
--
-- The code now refuses a self peer at every entry point (lib/chatPeer.ts), so
-- this file is the second half: `to_id` is the legacy addressing column and
-- these rows claim a recipient that is the sender. NULL is what that column
-- already means for "not addressed to exactly one person" (lib/chatFanout.ts,
-- addressedTo). Message text, sender, thread and timestamps are untouched --
-- the conversations stay readable exactly as they are.
--
-- Reversible: every affected row is copied to messages_self_addressed_backup
-- first, so `UPDATE messages m JOIN messages_self_addressed_backup b ON
-- b.id = m.id SET m.to_id = b.to_id, m.postedto = b.postedto` puts it back.

CREATE TABLE IF NOT EXISTS messages_self_addressed_backup (
  id INT UNSIGNED NOT NULL PRIMARY KEY,
  thread INT NULL,
  from_id INT NULL,
  to_id INT NULL,
  postername VARCHAR(255) NULL,
  postedto VARCHAR(255) NULL,
  backed_up_at INT NOT NULL
);

INSERT IGNORE INTO messages_self_addressed_backup
  (id, thread, from_id, to_id, postername, postedto, backed_up_at)
SELECT id, thread, from_id, to_id, postername, postedto, UNIX_TIMESTAMP()
FROM messages
WHERE from_id IS NOT NULL AND from_id = to_id;

UPDATE messages
SET to_id = NULL, postedto = NULL
WHERE from_id IS NOT NULL AND from_id = to_id;
