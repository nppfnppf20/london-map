-- Add visibility column to places and collections tables.
-- Existing rows default to 'public' for backwards compatibility.

ALTER TABLE places
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'private', 'friends', 'friends_of_friends'));

ALTER TABLE collections
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'private', 'friends', 'friends_of_friends'));
