-- Friendships table for social graph.
-- Directional: user_id sends request to friend_id.
-- Both directions are checked when querying mutual friends.

CREATE TABLE IF NOT EXISTS friendships (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status    TEXT NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'accepted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT friendships_unique  UNIQUE (user_id, friend_id),
  CONSTRAINT friendships_no_self CHECK (user_id != friend_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_user_id   ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status    ON friendships(status);
