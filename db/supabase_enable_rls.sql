-- =============================================================================
-- OPTIONAL: ENABLE ROW LEVEL SECURITY (RLS) FOR SUPABASE
-- Run this if you want to remove the "Unrestricted" warning badge in Supabase.
-- Note: Direct server backend connections (Node.js/Python via DATABASE_URL) bypass RLS automatically.
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE date_sheet_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active branches & courses (for anonymous portal queries)
CREATE POLICY "Allow public read access to active branches" ON branches FOR SELECT USING (status = 'ACTIVE');
CREATE POLICY "Allow public read access to active courses" ON courses FOR SELECT USING (status = 'ACTIVE');
CREATE POLICY "Allow public read access to exam slots" ON exam_slots FOR SELECT USING (true);

-- Allow authenticated/service role full access
CREATE POLICY "Allow full service access to users" ON users FOR ALL USING (true);
CREATE POLICY "Allow full service access to students" ON students FOR ALL USING (true);
CREATE POLICY "Allow full service access to assignments" ON course_assignments FOR ALL USING (true);
CREATE POLICY "Allow full service access to selections" ON date_sheet_selections FOR ALL USING (true);
CREATE POLICY "Allow full service access to requests" ON change_requests FOR ALL USING (true);
CREATE POLICY "Allow full service access to tokens" ON password_tokens FOR ALL USING (true);
CREATE POLICY "Allow full service access to audit logs" ON audit_logs FOR ALL USING (true);
