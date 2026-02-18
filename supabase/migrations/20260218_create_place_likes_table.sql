-- Likes on places, one per user per place.
-- Deleting a place or user cascades to remove their likes.

CREATE TABLE IF NOT EXISTS place_likes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id   UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT place_likes_unique UNIQUE (user_id, place_id)
);

CREATE INDEX IF NOT EXISTS idx_place_likes_user_id  ON place_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_place_likes_place_id ON place_likes(place_id);
