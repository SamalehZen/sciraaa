-- Admin module schema updates

-- Extend users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS failed_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;

-- Audit log (append-only)
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  actor_username TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  target_username TEXT,
  action TEXT NOT NULL,
  metadata JSON,
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log (action);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log (actor_username);
CREATE INDEX IF NOT EXISTS idx_audit_log_target ON audit_log (target_username);

-- User preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  username TEXT PRIMARY KEY REFERENCES users(username) ON DELETE CASCADE,
  language TEXT NOT NULL DEFAULT 'fr',
  theme TEXT NOT NULL DEFAULT 'system',
  prefs JSON,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User presence (denormalized)
CREATE TABLE IF NOT EXISTS user_presence (
  username TEXT PRIMARY KEY REFERENCES users(username) ON DELETE CASCADE,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_ip TEXT,
  user_agent TEXT,
  city TEXT,
  country TEXT,
  lat REAL,
  lon REAL
);
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON user_presence (last_seen_at DESC);
