-- Create session_locks table for blocking time ranges when students can register hours
CREATE TABLE session_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  reason TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_datetime_range CHECK (start_datetime < end_datetime)
);

-- Enable RLS
ALTER TABLE session_locks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- SUPER_ADMIN can see all locks
CREATE POLICY "super_admin_view_all_locks" ON session_locks
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'SUPER_ADMIN'
    OR (auth.jwt() ->> 'role' = 'DEPT_HEAD' AND department_id = (SELECT department_id FROM profiles WHERE id = auth.uid()))
  );

-- DEPT_HEAD can see locks for their department
CREATE POLICY "dept_head_view_own_dept_locks" ON session_locks
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'DEPT_HEAD' 
    AND department_id = (SELECT department_id FROM profiles WHERE id = auth.uid())
  );

-- DEPT_HEAD can create locks for their department
CREATE POLICY "dept_head_create_own_dept_locks" ON session_locks
  FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'role' = 'DEPT_HEAD'
    AND created_by = auth.uid()
    AND department_id = (SELECT department_id FROM profiles WHERE id = auth.uid())
  );

-- SUPER_ADMIN can create locks for any department
CREATE POLICY "super_admin_create_any_locks" ON session_locks
  FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'role' = 'SUPER_ADMIN'
    AND created_by = auth.uid()
  );

-- DEPT_HEAD can delete own locks
CREATE POLICY "dept_head_delete_own_locks" ON session_locks
  FOR DELETE
  USING (
    auth.jwt() ->> 'role' = 'DEPT_HEAD'
    AND created_by = auth.uid()
  );

-- SUPER_ADMIN can delete any lock
CREATE POLICY "super_admin_delete_any_locks" ON session_locks
  FOR DELETE
  USING (auth.jwt() ->> 'role' = 'SUPER_ADMIN');

-- Index for common queries
CREATE INDEX idx_session_locks_department_id ON session_locks(department_id);
CREATE INDEX idx_session_locks_created_by ON session_locks(created_by);
CREATE INDEX idx_session_locks_datetime ON session_locks(start_datetime, end_datetime);
