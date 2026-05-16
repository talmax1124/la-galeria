CREATE TABLE IF NOT EXISTS reactions (
  id         TEXT PRIMARY KEY,
  upload_id  TEXT NOT NULL,
  emoji      TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (upload_id) REFERENCES uploads(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_reactions_upload ON reactions(upload_id);

CREATE TABLE IF NOT EXISTS comments (
  id         TEXT PRIMARY KEY,
  upload_id  TEXT NOT NULL,
  name       TEXT NOT NULL,
  body       TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (upload_id) REFERENCES uploads(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_comments_upload ON comments(upload_id);
