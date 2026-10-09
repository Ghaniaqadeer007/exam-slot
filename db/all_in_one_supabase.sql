-- =============================================================================
-- EXAMSLOT HACKATHON ALL-IN-ONE SUPABASE DATABASE (SCHEMA + SEED + RLS)
-- 100% Fail-Safe PostgreSQL Script for Supabase SQL Editor
-- =============================================================================

-- 1. USERS TABLE (Credentials & Roles)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'STUDENT' CHECK (role IN ('ADMIN', 'STUDENT')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. BRANCHES TABLE (Exam Centers)
CREATE TABLE IF NOT EXISTS public.branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT NOT NULL,
    contact_number TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    capacity INTEGER NOT NULL DEFAULT 500,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. COURSES TABLE (Academic Courses)
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    credit_hours INTEGER NOT NULL CHECK (credit_hours BETWEEN 1 AND 6),
    department TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. STUDENTS TABLE (Full 3-Group Profile)
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Group 1: Personal Information
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    cnic TEXT NOT NULL UNIQUE,
    dob DATE NOT NULL DEFAULT '2004-01-01',
    gender TEXT NOT NULL DEFAULT 'MALE' CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
    address TEXT NOT NULL,
    photo_url TEXT,
    
    -- Group 2: Parent / Guardian Details
    father_name TEXT NOT NULL,
    parent_cnic TEXT NOT NULL,
    parent_occupation TEXT NOT NULL,
    parent_contact TEXT NOT NULL,
    emergency_contact TEXT NOT NULL,
    
    -- Group 3: Academic Profile
    registration_number TEXT NOT NULL UNIQUE,
    program TEXT NOT NULL DEFAULT 'BS Computer Science',
    semester INTEGER NOT NULL DEFAULT 1 CHECK (semester BETWEEN 1 AND 8),
    session TEXT NOT NULL DEFAULT 'Fall 2026',
    previous_qualification TEXT NOT NULL DEFAULT 'HSSC / Intermediate',
    previous_institute TEXT NOT NULL DEFAULT 'Punjab College',
    marks_or_cgpa NUMERIC(4,2) NOT NULL DEFAULT 3.50,
    
    -- Branch Selection & Lock Engine
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    branch_locked BOOLEAN NOT NULL DEFAULT FALSE,
    datesheet_status TEXT NOT NULL DEFAULT 'NOT_SAVED' CHECK (datesheet_status IN ('NOT_SAVED', 'SAVED')),
    datesheet_saved_at TIMESTAMPTZ,
    branch_change_unlocked INTEGER NOT NULL DEFAULT 0,
    datesheet_change_unlocked INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. COURSE ASSIGNMENTS TABLE (4 to 6 Course Rule Junction)
CREATE TABLE IF NOT EXISTS public.course_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_student_course UNIQUE (student_id, course_id)
);

-- 6. EXAM SLOTS TABLE (Dates & Timings)
CREATE TABLE IF NOT EXISTS public.exam_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    exam_date DATE NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL DEFAULT '12:00',
    capacity INTEGER NOT NULL DEFAULT 60,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. DATE SHEET SELECTIONS TABLE (Finalized Schedules)
CREATE TABLE IF NOT EXISTS public.date_sheet_selections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    slot_id UUID NOT NULL REFERENCES public.exam_slots(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_selection_student_course UNIQUE (student_id, course_id)
);

-- 8. CHANGE REQUESTS TABLE (Petitions & Unlocks)
CREATE TABLE IF NOT EXISTS public.change_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('CHANGE_BRANCH', 'CHANGE_DATESHEET')),
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    admin_remark TEXT,
    decided_at TIMESTAMPTZ,
    consumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- SEED DATA FOR HACKATHON DEMO (ADMINS, BRANCHES, COURSES, STUDENTS, SLOTS)
-- =============================================================================

-- Seed Branches
INSERT INTO public.branches (id, code, name, city, address, contact_number, status, capacity) VALUES
('b1111111-1111-1111-1111-111111111111', 'LHR', 'Lahore - Main Campus', 'Lahore', 'Defence Road, Off Raiwind Road', '042-111-880-880', 'ACTIVE', 800),
('b2222222-2222-2222-2222-222222222222', 'ISB', 'Islamabad - Regional Campus', 'Islamabad', 'Plot # 12, Sector F-8/1', '051-9258481', 'ACTIVE', 650),
('b3333333-3333-3333-3333-333333333333', 'KHI', 'Karachi - Clifton Center', 'Karachi', 'Block 5, Clifton', '021-35874211', 'ACTIVE', 700)
ON CONFLICT (code) DO NOTHING;

-- Seed Courses
INSERT INTO public.courses (id, course_code, title, credit_hours, department) VALUES
('c1111111-1111-1111-1111-111111111111', 'CS101', 'Programming Fundamentals', 3, 'Computer Science'),
('c2222222-2222-2222-2222-222222222222', 'CS201', 'Data Structures', 3, 'Computer Science'),
('c3333333-3333-3333-3333-333333333333', 'CS301', 'Database Systems', 3, 'Computer Science'),
('c4444444-4444-4444-4444-444444444444', 'MT101', 'Calculus & Analytical Geometry', 3, 'Mathematics')
ON CONFLICT (course_code) DO NOTHING;

-- Seed Admin User
INSERT INTO public.users (id, email, password_hash, role) VALUES
('a1111111-1111-1111-1111-111111111111', 'admin@examslot.test', 'admin123', 'ADMIN')
ON CONFLICT (email) DO NOTHING;

-- Seed Demo Student User & Profile
INSERT INTO public.users (id, email, password_hash, role) VALUES
('u1111111-1111-1111-1111-111111111111', 'student@examslot.test', 'student123', 'STUDENT')
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.students (id, user_id, full_name, phone, cnic, father_name, parent_cnic, parent_occupation, parent_contact, emergency_contact, registration_number, program, semester, session, marks_or_cgpa, address) VALUES
('s1111111-1111-1111-1111-111111111111', 'u1111111-1111-1111-1111-111111111111', 'Fatima Ali', '+92 300 1234567', '35201-1234567-1', 'Muhammad Ali', '35201-7654321-1', 'Civil Engineer', '+92 321 7654321', '+92 300 9998877', 'BC220201001', 'BS Computer Science', 3, 'Fall 2026', 3.65, 'House 14, Street 2, Model Town, Lahore')
ON CONFLICT (registration_number) DO NOTHING;

-- Seed Course Assignments
INSERT INTO public.course_assignments (student_id, course_id) VALUES
('s1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111'),
('s1111111-1111-1111-1111-111111111111', 'c2222222-2222-2222-2222-222222222222'),
('s1111111-1111-1111-1111-111111111111', 'c3333333-3333-3333-3333-333333333333'),
('s1111111-1111-1111-1111-111111111111', 'c4444444-4444-4444-4444-444444444444')
ON CONFLICT (student_id, course_id) DO NOTHING;

-- Seed Exam Slots
INSERT INTO public.exam_slots (course_id, exam_date, start_time, end_time) VALUES
('c1111111-1111-1111-1111-111111111111', '2026-10-24', '09:00', '12:00'),
('c2222222-2222-2222-2222-222222222222', '2026-10-25', '14:00', '17:00'),
('c3333333-3333-3333-3333-333333333333', '2026-10-26', '09:00', '12:00'),
('c4444444-4444-4444-4444-444444444444', '2026-10-27', '14:00', '17:00');

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.date_sheet_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.change_requests ENABLE ROW LEVEL SECURITY;

-- Drop Policies if exist to prevent duplicate policy errors
DROP POLICY IF EXISTS "Public All Users" ON public.users;
DROP POLICY IF EXISTS "Public All Students" ON public.students;
DROP POLICY IF EXISTS "Public All Branches" ON public.branches;
DROP POLICY IF EXISTS "Public All Courses" ON public.courses;
DROP POLICY IF EXISTS "Public All Assignments" ON public.course_assignments;
DROP POLICY IF EXISTS "Public All Slots" ON public.exam_slots;
DROP POLICY IF EXISTS "Public All Selections" ON public.date_sheet_selections;
DROP POLICY IF EXISTS "Public All Requests" ON public.change_requests;

-- Create Clean Public Policies
CREATE POLICY "Public All Users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public All Students" ON public.students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public All Branches" ON public.branches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public All Courses" ON public.courses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public All Assignments" ON public.course_assignments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public All Slots" ON public.exam_slots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public All Selections" ON public.date_sheet_selections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public All Requests" ON public.change_requests FOR ALL USING (true) WITH CHECK (true);
