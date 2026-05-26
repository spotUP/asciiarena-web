-- Backfill: set all existing users to fully opted-out of the live activity feed.
-- Run against the dev DB (and later against prod) before/after deploying the
-- registration opt-in change so existing users aren't surprised by their
-- actions appearing in the live feed without consent.
--
-- Usage on server:
--   mysql -u asciiarena -p uprough_ascii_dev < backfill-activity-optout.sql
--
-- Safe to re-run: only touches rows where activity_hidden_types IS NULL.

UPDATE users
SET activity_hidden_types = 'wall,upload,request,view,comment'
WHERE activity_hidden_types IS NULL;
