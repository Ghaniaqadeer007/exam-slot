-- =============================================================================
-- EXAMSOLOT SUPABASE (POSTGRESQL) SCHEMA DDL
-- Copy and paste this directly into the Supabase Dashboard SQL Editor & click RUN
-- =============================================================================

-- Drop tables if re-running script (in reverse dependency order)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS password_tokens CASCADE;
DROP TABLE IF EXISTS change_requests CASCADE;
DROP TABLE IF EXISTS date_sheet_selections CASCADE;
DROP TABLE IF EXISTS exam_slots CASCADE;
DROP TABLE IF EXISTS course_assignments CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS branches CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- -----------------------------------------------------------------------------
-- 1. USERS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'STUDENT',
    is_active INTEGER NOT NULL DEFAULT 1,
    last_login_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_users_role CHECK (role IN ('ADMIN', 'STUDENT')),
    CONSTRAINT chk_users_is_active CHECK (is_active IN (0, 1))
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

-- -----------------------------------------------------------------------------
-- 2. BRANCHES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE branches (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT NOT NULL,
    contact_number TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_branches_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

CREATE INDEX idx_branches_status ON branches(status);
CREATE INDEX idx_branches_code ON branches(code);

-- -----------------------------------------------------------------------------
-- 3. COURSES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE courses (
    id TEXT PRIMARY KEY,
    course_code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    credit_hours INTEGER NOT NULL,
    department TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_courses_credit CHECK (credit_hours BETWEEN 1 AND 6),
    CONSTRAINT chk_courses_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_courses_department ON courses(department);
CREATE INDEX idx_courses_code ON courses(course_code);

-- -----------------------------------------------------------------------------
-- 4. STUDENTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE students (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    -- Personal Group
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    cnic TEXT NOT NULL UNIQUE,
    dob DATE NOT NULL,
    gender TEXT NOT NULL,
    address TEXT NOT NULL,
    photo_url TEXT NULL,
    
    -- Parent / Guardian Group
    father_name TEXT NOT NULL,
    parent_cnic TEXT NOT NULL,
    parent_occupation TEXT NOT NULL,
    parent_contact TEXT NOT NULL,
    emergency_contact TEXT NOT NULL,
    
    -- Academic Group
    registration_number TEXT NOT NULL UNIQUE,
    program TEXT NOT NULL,
    semester INTEGER NOT NULL,
    session TEXT NOT NULL,
    previous_qualification TEXT NOT NULL,
    previous_institute TEXT NOT NULL,
    marks_or_cgpa DOUBLE PRECISION NOT NULL,
    
    -- Branch Selection & Lock Status
    branch_id TEXT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    branch_locked INTEGER NOT NULL DEFAULT 0,
    datesheet_status TEXT NOT NULL DEFAULT 'NOT_SAVED',
    datesheet_saved_at TIMESTAMPTZ NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_students_gender CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
    CONSTRAINT chk_students_datesheet CHECK (datesheet_status IN ('NOT_SAVED', 'SAVED')),
    CONSTRAINT chk_students_branch_locked CHECK (branch_locked IN (0, 1)),
    CONSTRAINT chk_students_marks CHECK (marks_or_cgpa >= 0.0 AND marks_or_cgpa <= 100.0)
);

CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_students_reg_no ON students(registration_number);
CREATE INDEX idx_students_cnic ON students(cnic);
CREATE INDEX idx_students_branch_id ON students(branch_id);
CREATE INDEX idx_students_datesheet_status ON students(datesheet_status);

-- -----------------------------------------------------------------------------
-- 5. COURSE ASSIGNMENTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE course_assignments (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
    assigned_by TEXT NULL REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_student_course UNIQUE (student_id, course_id)
);

CREATE INDEX idx_assignments_student ON course_assignments(student_id);
CREATE INDEX idx_assignments_course ON course_assignments(course_id);

-- -----------------------------------------------------------------------------
-- 6. EXAM SLOTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE exam_slots (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
    exam_date DATE NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NULL,
    capacity INTEGER NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_course_date_start UNIQUE (course_id, exam_date, start_time)
);

CREATE INDEX idx_slots_course ON exam_slots(course_id);
CREATE INDEX idx_slots_date ON exam_slots(exam_date);

-- -----------------------------------------------------------------------------
-- 7. DATE SHEET SELECTIONS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE date_sheet_selections (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
    slot_id TEXT NOT NULL REFERENCES exam_slots(id) ON DELETE RESTRICT,
    branch_id TEXT NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_selection_student_course UNIQUE (student_id, course_id)
);

CREATE INDEX idx_selections_student ON date_sheet_selections(student_id);
CREATE INDEX idx_selections_slot ON date_sheet_selections(slot_id);

-- -----------------------------------------------------------------------------
-- 8. CHANGE REQUESTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE change_requests (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    admin_remark TEXT NULL,
    decided_by TEXT NULL REFERENCES users(id) ON DELETE SET NULL,
    decided_at TIMESTAMPTZ NULL,
    consumed_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_requests_type CHECK (type IN ('CHANGE_BRANCH', 'CHANGE_DATESHEET')),
    CONSTRAINT chk_requests_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'))
);

CREATE INDEX idx_requests_student ON change_requests(student_id);
CREATE INDEX idx_requests_status ON change_requests(status);
CREATE INDEX idx_requests_type ON change_requests(type);

-- Partial Unique Index for Supabase/PostgreSQL
CREATE UNIQUE INDEX uq_pending_request_per_type 
ON change_requests(student_id, type) 
WHERE status = 'PENDING';

-- -----------------------------------------------------------------------------
-- 9. PASSWORD TOKENS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE password_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    purpose TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_tokens_purpose CHECK (purpose IN ('SETUP', 'RESET'))
);

CREATE INDEX idx_tokens_user ON password_tokens(user_id);
CREATE INDEX idx_tokens_hash ON password_tokens(token_hash);

-- -----------------------------------------------------------------------------
-- 10. AUDIT LOGS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id TEXT PRIMARY KEY,
    actor_id TEXT NULL REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id TEXT NULL,
    metadata TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
