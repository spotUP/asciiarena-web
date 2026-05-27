-- Backfill: set all existing users to fully opted-out of the live activity feed.
-- Run against the dev DB (and later against prod) when introducing the
-- registration opt-in change or when new activity types are added, so existing
-- users aren't surprised by their actions appearing in the live feed without
-- consent.
--
-- Current canonical list (keep in sync with lib/activity-types.ts):
--   wall, upload, request, view, comment, fav, unfav, claim,
--   notif-comment, notif-fav, notif-reply, notif-message, notif-status
--
-- Usage on server:
--   sudo mysql uprough_ascii_dev < backfill-activity-optout.sql
--
-- Safe to re-run: only touches rows where activity_hidden_types IS NULL or is
-- missing any of the canonical types; idempotent for rows already covering all.

-- 1. Backfill NULL rows (first-time setup)
UPDATE users
SET activity_hidden_types = 'wall,upload,request,view,comment,fav,unfav,claim,notif-comment,notif-fav,notif-reply,notif-message,notif-status'
WHERE activity_hidden_types IS NULL;

-- 2. Append any newly-introduced types that existing rows don't yet list.
-- Note: notification types default to hidden too, matching the Round 1 policy:
-- existing users must visit /settings to opt back in.
UPDATE users SET activity_hidden_types = CONCAT_WS(',', activity_hidden_types, 'fav')
  WHERE FIND_IN_SET('fav', activity_hidden_types) = 0;
UPDATE users SET activity_hidden_types = CONCAT_WS(',', activity_hidden_types, 'unfav')
  WHERE FIND_IN_SET('unfav', activity_hidden_types) = 0;
UPDATE users SET activity_hidden_types = CONCAT_WS(',', activity_hidden_types, 'claim')
  WHERE FIND_IN_SET('claim', activity_hidden_types) = 0;
UPDATE users SET activity_hidden_types = CONCAT_WS(',', activity_hidden_types, 'notif-comment')
  WHERE FIND_IN_SET('notif-comment', activity_hidden_types) = 0;
UPDATE users SET activity_hidden_types = CONCAT_WS(',', activity_hidden_types, 'notif-fav')
  WHERE FIND_IN_SET('notif-fav', activity_hidden_types) = 0;
UPDATE users SET activity_hidden_types = CONCAT_WS(',', activity_hidden_types, 'notif-reply')
  WHERE FIND_IN_SET('notif-reply', activity_hidden_types) = 0;
UPDATE users SET activity_hidden_types = CONCAT_WS(',', activity_hidden_types, 'notif-message')
  WHERE FIND_IN_SET('notif-message', activity_hidden_types) = 0;
UPDATE users SET activity_hidden_types = CONCAT_WS(',', activity_hidden_types, 'notif-status')
  WHERE FIND_IN_SET('notif-status', activity_hidden_types) = 0;
