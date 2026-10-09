-- =============================================================================
-- EXAMSOLT DATABASE SCHEMA (DDL)
-- Compatible with PostgreSQL, SQLite 3.31+, and MySQL 8.0+
-- Standard source of truth for ExamSlot relational database structure.
-- =============================================================================

-- Enable Foreign Key constraints (for SQLite)
PRAGMA foreign_keys = ON;

-- -----------------------------------------------------------------------------
-- 1. USERS TABLE
-- Stores credentials and baseline role access (ADMIN, STUDENT)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,                       -- UUID v4 string
    email TEXT NOT NULL UNIQUE,                -- Lowercase unique email
    password_hash TEXT NOT NULL,               -- Hashed password (bcrypt / argon2)
    role TEXT NOT NULL DEFAULT 'STUDENT',      -- 'ADMIN' | 'STUDENT'
    is_active INTEGER NOT NULL DEFAULT 1,      -- 1 = Active, 0 = Inactive
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (role IN ('ADMIN', 'STUDENT')),
    CHECK (is_active IN (0, 1))
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- -----------------------------------------------------------------------------
-- 2. BRANCHES TABLE
-- Exam campuses located in various cities
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS branches (
    id TEXT PRIMARY KEY,                       -- UUID v4 string
    code TEXT NOT NULL UNIQUE,                 -- e.g., 'LHR', 'ISB', 'KHI' (Stored uppercase)
    name TEXT NOT NULL,                        -- e.g., 'Lahore Campus'
    city TEXT NOT NULL,                        -- e.g., 'Lahore'
    address TEXT NOT NULL,
    contact_number TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',     -- 'ACTIVE' | 'INACTIVE'
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

CREATE INDEX IF NOT EXISTS idx_branches_status ON branches(status);
CREATE INDEX IF NOT EXISTS idx_branches_code ON branches(code);

-- -----------------------------------------------------------------------------
-- 3. COURSES TABLE
-- University courses available for enrollment & exam scheduling
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,                       -- UUID v4 string
    course_code TEXT NOT NULL UNIQUE,          -- e.g., 'CS101', 'MT201' (Stored uppercase)
    title TEXT NOT NULL,                       -- e.g., 'Programming Fundamentals'
    credit_hours INTEGER NOT NULL,             -- 1 to 6
    department TEXT NOT NULL,                  -- e.g., 'Computer Science'
    status TEXT NOT NULL DEFAULT 'ACTIVE',     -- 'ACTIVE' | 'INACTIVE'
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (credit_hours BETWEEN 1 AND 6),
    CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_department ON courses(department);
CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(course_code);

-- -----------------------------------------------------------------------------
-- 4. STUDENTS TABLE
-- Extended profile information grouped into Personal, Parent/Guardian, Academic
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,                       -- UUID v4 string
    user_id TEXT NOT NULL UNIQUE,              -- FK to users.id
    
    -- Personal Group
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,                       -- Pakistani format 03XX-XXXXXXX
    cnic TEXT NOT NULL UNIQUE,                 -- Pakistani format XXXXX-XXXXXXX-X (13 digits)
    dob DATE NOT NULL,
    gender TEXT NOT NULL,                      -- 'MALE' | 'FEMALE' | 'OTHER'
    address TEXT NOT NULL,
    photo_url TEXT NULL,
    
    -- Parent / Guardian Group
    father_name TEXT NOT NULL,
    parent_cnic TEXT NOT NULL,
    parent_occupation TEXT NOT NULL,
    parent_contact TEXT NOT NULL,
    emergency_contact TEXT NOT NULL,
    
    -- Academic Group
    registration_number TEXT NOT NULL UNIQUE,  -- e.g., 'BCS2023001'
    program TEXT NOT NULL,                     -- e.g., 'BS Computer Science'
    semester INTEGER NOT NULL,                 -- e.g., 1 to 8
    session TEXT NOT NULL,                     -- e.g., 'Fall 2023'
    previous_qualification TEXT NOT NULL,      -- e.g., 'FSc Pre-Engineering'
    previous_institute TEXT NOT NULL,          -- e.g., 'Government College'
    marks_or_cgpa REAL NOT NULL,               -- CGPA (0.00 - 4.00) or Marks (0 - 100)
    
    -- Branch Selection & Lock Status
    branch_id TEXT NULL,                       -- FK to branches.id
    branch_locked INTEGER NOT NULL DEFAULT 0,  -- 1 = Branch selection locked (one-time choice done)
    datesheet_status TEXT NOT NULL DEFAULT 'NOT_SAVED', -- 'NOT_SAVED' | 'SAVED'
    datesheet_saved_at TIMESTAMP NULL,
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT,
    CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
    CHECK (datesheet_status IN ('NOT_SAVED', 'SAVED')),
    CHECK (branch_locked IN (0, 1)),
    CHECK (marks_or_cgpa >= 0.0 AND marks_or_cgpa <= 100.0)
);

CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_reg_no ON students(registration_number);
CREATE INDEX IF NOT EXISTS idx_students_cnic ON students(cnic);
CREATE INDEX IF NOT EXISTS idx_students_branch_id ON students(branch_id);
CREATE INDEX IF NOT EXISTS idx_students_datesheet_status ON students(datesheet_status);

-- -----------------------------------------------------------------------------
-- 5. COURSE ASSIGNMENTS TABLE
-- Junction table mapping students to assigned courses (Rule: 4 to 6 courses per student)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS course_assignments (
    id TEXT PRIMARY KEY,                       -- UUID v4 string
    student_id TEXT NOT NULL,                  -- FK to students.id
    course_id TEXT NOT NULL,                   -- FK to courses.id
    assigned_by TEXT NULL,                     -- FK to users.id (admin who assigned)
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE RESTRICT,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT uq_student_course UNIQUE (student_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_assignments_student ON course_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_assignments_course ON course_assignments(course_id);

-- -----------------------------------------------------------------------------
-- 6. EXAM SLOTS TABLE
-- Scheduled dates and times for course exams
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS exam_slots (
    id TEXT PRIMARY KEY,                       -- UUID v4 string
    course_id TEXT NOT NULL,                   -- FK to courses.id
    exam_date DATE NOT NULL,                   -- Date of exam (YYYY-MM-DD)
    start_time TEXT NOT NULL,                  -- Start time (HH:MM)
    end_time TEXT NULL,                        -- End time (HH:MM, null defaults to +3h)
    capacity INTEGER NULL,                     -- Optional seat capacity limit per slot
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE RESTRICT,
    CONSTRAINT uq_course_date_start UNIQUE (course_id, exam_date, start_time)
);

CREATE INDEX IF NOT EXISTS idx_slots_course ON exam_slots(course_id);
CREATE INDEX IF NOT EXISTS idx_slots_date ON exam_slots(exam_date);

-- -----------------------------------------------------------------------------
-- 7. DATE SHEET SELECTIONS TABLE
-- Finalized student slot selections for their date sheet
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS date_sheet_selections (
    id TEXT PRIMARY KEY,                       -- UUID v4 string
    student_id TEXT NOT NULL,                  -- FK to students.id
    course_id TEXT NOT NULL,                   -- FK to courses.id
    slot_id TEXT NOT NULL,                     -- FK to exam_slots.id
    branch_id TEXT NOT NULL,                   -- FK to branches.id
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE RESTRICT,
    FOREIGN KEY (slot_id) REFERENCES exam_slots(id) ON DELETE RESTRICT,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT,
    CONSTRAINT uq_selection_student_course UNIQUE (student_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_selections_student ON date_sheet_selections(student_id);
CREATE INDEX IF NOT EXISTS idx_selections_slot ON date_sheet_selections(slot_id);

-- -----------------------------------------------------------------------------
-- 8. CHANGE REQUESTS TABLE
-- Student requests to unlock branch selection or date sheet selection
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS change_requests (
    id TEXT PRIMARY KEY,                       -- UUID v4 string
    student_id TEXT NOT NULL,                  -- FK to students.id
    type TEXT NOT NULL,                        -- 'CHANGE_BRANCH' | 'CHANGE_DATESHEET'
    reason TEXT NOT NULL,                      -- Reason provided (10 to 500 chars)
    status TEXT NOT NULL DEFAULT 'PENDING',    -- 'PENDING' | 'APPROVED' | 'REJECTED'
    admin_remark TEXT NULL,                    -- Admin decision notes
    decided_by TEXT NULL,                      -- FK to users.id (Admin who decided)
    decided_at TIMESTAMP NULL,                 -- Decision timestamp
    consumed_at TIMESTAMP NULL,                -- When approved unlock was used by student
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (decided_by) REFERENCES users(id) ON DELETE SET NULL,
    CHECK (type IN ('CHANGE_BRANCH', 'CHANGE_DATESHEET')),
    CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'))
);

CREATE INDEX IF NOT EXISTS idx_requests_student ON change_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON change_requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_type ON change_requests(type);

-- Partial Unique Index: Only one pending request per type per student
CREATE UNIQUE INDEX IF NOT EXISTS uq_pending_request_per_type 
ON change_requests(student_id, type) 
WHERE status = 'PENDING';

-- -----------------------------------------------------------------------------
-- 9. PASSWORD TOKENS TABLE
-- Password setup and reset links (24h expiry, single-use)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS password_tokens (
    id TEXT PRIMARY KEY,                       -- UUID v4 string
    user_id TEXT NOT NULL,                     -- FK to users.id
    token_hash TEXT NOT NULL,                  -- SHA-256 hash of token secret
    purpose TEXT NOT NULL,                     -- 'SETUP' | 'RESET'
    expires_at TIMESTAMP NOT NULL,             -- Expiry date/time (24 hours)
    used_at TIMESTAMP NULL,                    -- Set when token is consumed
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CHECK (purpose IN ('SETUP', 'RESET'))
);

CREATE INDEX IF NOT EXISTS idx_tokens_user ON password_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_tokens_hash ON password_tokens(token_hash);

-- -----------------------------------------------------------------------------
-- 10. AUDIT LOGS TABLE (Bonus)
-- System audit log recording admin & system actions
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,                       -- UUID v4 string
    actor_id TEXT NULL,                        -- FK to users.id
    action TEXT NOT NULL,                      -- Action name, e.g. 'CREATE_STUDENT'
    entity TEXT NOT NULL,                      -- Entity name, e.g. 'STUDENT'
    entity_id TEXT NULL,                       -- Target entity ID
    metadata TEXT NULL,                        -- JSON formatted metadata string
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
