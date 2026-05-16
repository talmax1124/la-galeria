CREATE TABLE IF NOT EXISTS uploads (
  id           TEXT PRIMARY KEY,
  uploader     TEXT NOT NULL,
  filename     TEXT NOT NULL,
  object_key   TEXT NOT NULL UNIQUE,
  mimetype     TEXT NOT NULL,
  size_bytes   INTEGER NOT NULL,
  uploaded_at  INTEGER NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending'
);

CREATE INDEX IF NOT EXISTS idx_uploads_uploader    ON uploads(uploader);
CREATE INDEX IF NOT EXISTS idx_uploads_uploaded_at ON uploads(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_uploads_status      ON uploads(status);
