CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS progress (
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  lesson_url TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (student_id, lesson_url)
);
CREATE TABLE IF NOT EXISTS approval_requests (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id),
  level INTEGER NOT NULL,
  state TEXT NOT NULL DEFAULT 'pending',
  created_at INTEGER NOT NULL,
  reviewed_at INTEGER
);
CREATE UNIQUE INDEX IF NOT EXISTS one_pending_request
  ON approval_requests(student_id, level) WHERE state = 'pending';
CREATE TABLE IF NOT EXISTS unlocks (
  student_id TEXT NOT NULL REFERENCES students(id),
  level INTEGER NOT NULL,
  request_id TEXT NOT NULL REFERENCES approval_requests(id),
  created_at INTEGER NOT NULL,
  PRIMARY KEY (student_id, level)
);
CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash TEXT PRIMARY KEY,
  expires_at INTEGER NOT NULL
);
