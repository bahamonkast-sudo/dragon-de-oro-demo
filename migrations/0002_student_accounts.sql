ALTER TABLE students ADD COLUMN email TEXT;
ALTER TABLE students ADD COLUMN password_salt TEXT;
ALTER TABLE students ADD COLUMN password_hash TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS student_email_unique ON students(email) WHERE email IS NOT NULL;
CREATE TABLE IF NOT EXISTS student_sessions (
  token_hash TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS student_sessions_student ON student_sessions(student_id);
