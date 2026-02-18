-- Comments on places, authored by authenticated users.
-- Deleting a place cascades to its comments.

CREATE TABLE IF NOT EXISTS comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id   UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body       TEXT NOT NULL CHECK (char_length(body) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_place_id ON comments(place_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id  ON comments(user_id);
