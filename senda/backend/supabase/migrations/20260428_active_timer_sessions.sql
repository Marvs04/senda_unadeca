-- ─── session_locks ────────────────────────────────────────────────────────────
-- Allows dept heads to block hour registration for a date/time range.

CREATE TABLE IF NOT EXISTS session_locks (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id  TEXT        NOT NULL,
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime   TIMESTAMPTZ NOT NULL,
  reason         TEXT,
  created_by     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (start_datetime < end_datetime)
);

CREATE INDEX IF NOT EXISTS idx_session_locks_dept
  ON session_locks (department_id);

ALTER TABLE session_locks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_session_locks"
  ON session_locks FOR SELECT USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE session_locks;


-- ─── active_timer_sessions ────────────────────────────────────────────────────
-- Stores in-progress student timer sessions so dept heads can see
-- live sessions and optionally stop them.

DROP TABLE IF EXISTS active_timer_sessions;

CREATE TABLE active_timer_sessions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  department_id TEXT        NOT NULL,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  description   TEXT        NOT NULL DEFAULT '',
  status        TEXT        NOT NULL DEFAULT 'ACTIVE'
                  CHECK (status IN ('ACTIVE', 'STOPPED_BY_HEAD')),
  stopped_at    TIMESTAMPTZ,
  stop_reason   TEXT,
  stopped_by    UUID        REFERENCES auth.users(id),
  UNIQUE (student_id)
);

CREATE INDEX IF NOT EXISTS idx_active_timer_sessions_dept
  ON active_timer_sessions (department_id);

ALTER TABLE active_timer_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_active_sessions" ON active_timer_sessions;
CREATE POLICY "public_read_active_sessions"
  ON active_timer_sessions FOR SELECT USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE active_timer_sessions;
