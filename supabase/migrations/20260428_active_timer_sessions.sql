-- Migration: active_timer_sessions
-- Stores in-progress student timer sessions so dept heads can see
-- live sessions and optionally stop them.

CREATE TABLE IF NOT EXISTS active_timer_sessions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  department_id TEXT        NOT NULL,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  description   TEXT        NOT NULL DEFAULT '',
  status        TEXT        NOT NULL DEFAULT 'ACTIVE'
                  CHECK (status IN ('ACTIVE', 'STOPPED_BY_HEAD')),
  stopped_at    TIMESTAMPTZ,
  stop_reason   TEXT,
  stopped_by    UUID        REFERENCES auth.users(id),

  -- One active session per student at a time
  UNIQUE (student_id)
);

CREATE INDEX IF NOT EXISTS idx_active_timer_sessions_dept
  ON active_timer_sessions (department_id);

-- RLS: backend uses service-role (bypasses RLS) for writes.
-- Public SELECT lets Realtime subscriptions work for both students and dept heads.
ALTER TABLE active_timer_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_active_sessions"
  ON active_timer_sessions FOR SELECT
  USING (true);

-- Enable Realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE active_timer_sessions;
