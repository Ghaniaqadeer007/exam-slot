-- =============================================================================
-- EXAMSOLOT DATABASE SEED DATA (RAW SQL)
-- Standard SQL seed script for PostgreSQL, SQLite, or MySQL
-- Pre-populates all demo states required by PRD Section 15.1
-- =============================================================================

-- Enable Foreign Keys (SQLite)
PRAGMA foreign_keys = ON;

-- Clean existing data
DELETE FROM audit_logs;
DELETE FROM password_tokens;
DELETE FROM change_requests;
DELETE FROM date_sheet_selections;
DELETE FROM exam_slots;
DELETE FROM course_assignments;
DELETE FROM students;
DELETE FROM courses;
DELETE FROM branches;
DELETE FROM users;

-- -----------------------------------------------------------------------------
-- 1. ADMIN USER
-- Password hash for 'AdminPassword123!' (SHA-256 / bcrypt)
-- -----------------------------------------------------------------------------
INSERT INTO users (id, email, password_hash, role, is_active, created_at)
VALUES (
    'u-admin-0000-0000-0000-000000000001', 
    'admin@examslot.test', 
    'f600aa640ebc7270f2f354f9a039750c18d1eb0337c7674fb1d23ef7ea604593', -- SHA256('AdminPassword123!')
    'ADMIN', 
    1, 
    CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 2. BRANCHES (3 Active, 1 Inactive)
-- -----------------------------------------------------------------------------
INSERT INTO branches (id, code, name, city, address, contact_number, status, created_at) VALUES
('b-lhr-01', 'LHR', 'Lahore Campus', 'Lahore', '12-A Canal Bank Road, Lahore', '042-111-222-333', 'ACTIVE', CURRENT_TIMESTAMP),
('b-isb-02', 'ISB', 'Islamabad Campus', 'Islamabad', 'Sector H-8/4, Islamabad', '051-111-222-444', 'ACTIVE', CURRENT_TIMESTAMP),
('b-khi-03', 'KHI', 'Karachi Campus', 'Karachi', 'Block 6 PECHS, Main Shahrah-e-Faisal, Karachi', '021-111-222-555', 'ACTIVE', CURRENT_TIMESTAMP),
('b-fsd-04', 'FSD', 'Faisalabad Campus', 'Faisalabad', 'Sargodha Road, Faisalabad', '041-111-222-666', 'INACTIVE', CURRENT_TIMESTAMP);

-- -----------------------------------------------------------------------------
-- 3. COURSES (8 courses)
-- -----------------------------------------------------------------------------
INSERT INTO courses (id, course_code, title, credit_hours, department, status, created_at) VALUES
('c-cs101', 'CS101', 'Programming Fundamentals', 3, 'Computer Science', 'ACTIVE', CURRENT_TIMESTAMP),
('c-cs201', 'CS201', 'Data Structures', 3, 'Computer Science', 'ACTIVE', CURRENT_TIMESTAMP),
('c-cs301', 'CS301', 'Database Systems', 3, 'Computer Science', 'ACTIVE', CURRENT_TIMESTAMP),
('c-cs310', 'CS310', 'Computer Networks', 3, 'Computer Science', 'ACTIVE', CURRENT_TIMESTAMP),
('c-mt101', 'MT101', 'Calculus', 3, 'Mathematics', 'ACTIVE', CURRENT_TIMESTAMP),
('c-mt201', 'MT201', 'Linear Algebra', 3, 'Mathematics', 'ACTIVE', CURRENT_TIMESTAMP),
('c-en101', 'EN101', 'English Composition', 2, 'Humanities', 'ACTIVE', CURRENT_TIMESTAMP),
('c-se301', 'SE301', 'Software Engineering', 3, 'Software Engineering', 'ACTIVE', CURRENT_TIMESTAMP);

-- -----------------------------------------------------------------------------
-- 4. EXAM SLOTS (Includes conflict pair s-cs201-2 & s-mt101-2)
-- -----------------------------------------------------------------------------
INSERT INTO exam_slots (id, course_id, exam_date, start_time, end_time, capacity, created_at) VALUES
('s-cs101-1', 'c-cs101', '2027-01-11', '09:00', '12:00', 50, CURRENT_TIMESTAMP),
('s-cs101-2', 'c-cs101', '2027-01-15', '14:00', '17:00', 50, CURRENT_TIMESTAMP),
('s-cs201-1', 'c-cs201', '2027-01-11', '09:00', '12:00', 40, CURRENT_TIMESTAMP),
('s-cs201-2', 'c-cs201', '2027-01-13', '14:00', '17:00', 40, CURRENT_TIMESTAMP), -- Overlaps with s-mt101-2
('s-cs201-3', 'c-cs201', '2027-01-15', '09:00', '12:00', 40, CURRENT_TIMESTAMP),
('s-cs301-1', 'c-cs301', '2027-01-12', '09:00', '12:00', 35, CURRENT_TIMESTAMP),
('s-cs301-2', 'c-cs301', '2027-01-16', '14:00', '17:00', 35, CURRENT_TIMESTAMP),
('s-cs310-1', 'c-cs310', '2027-01-14', '09:00', '12:00', 30, CURRENT_TIMESTAMP),
('s-cs310-2', 'c-cs310', '2027-01-18', '14:00', '17:00', 30, CURRENT_TIMESTAMP),
('s-mt101-1', 'c-mt101', '2027-01-12', '14:00', '17:00', 60, CURRENT_TIMESTAMP),
('s-mt101-2', 'c-mt101', '2027-01-13', '14:00', '17:00', 60, CURRENT_TIMESTAMP), -- Overlaps with s-cs201-2
('s-mt101-3', 'c-mt101', '2027-01-16', '09:00', '12:00', 60, CURRENT_TIMESTAMP),
('s-mt201-1', 'c-mt201', '2027-01-14', '14:00', '17:00', 45, CURRENT_TIMESTAMP),
('s-mt201-2', 'c-mt201', '2027-01-19', '09:00', '12:00', 45, CURRENT_TIMESTAMP),
('s-en101-1', 'c-en101', '2027-01-15', '09:00', '12:00', 70, CURRENT_TIMESTAMP),
('s-en101-2', 'c-en101', '2027-01-20', '14:00', '17:00', 70, CURRENT_TIMESTAMP),
('s-se301-1', 'c-se301', '2027-01-18', '09:00', '12:00', 40, CURRENT_TIMESTAMP),
('s-se301-2', 'c-se301', '2027-01-21', '14:00', '17:00', 40, CURRENT_TIMESTAMP);

-- -----------------------------------------------------------------------------
-- 5. USERS & STUDENTS (5 Demo States)
-- Password hash for 'StudentPassword123!' (SHA-256)
-- -----------------------------------------------------------------------------

-- State 1: Ali Khan (Incomplete assignment - 3 courses)
INSERT INTO users (id, email, password_hash, role, is_active, created_at)
VALUES ('u-stu-0001', 'student1@examslot.test', '56e54e4f16a048a1e204c35e98eb738f6b0bf5d2db2491a67a5f6e80b2a95c87', 'STUDENT', 1, CURRENT_TIMESTAMP);

INSERT INTO students (id, user_id, full_name, phone, cnic, dob, gender, address, father_name, parent_cnic, parent_occupation, parent_contact, emergency_contact, registration_number, program, semester, session, previous_qualification, previous_institute, marks_or_cgpa, branch_id, branch_locked, datesheet_status, created_at)
VALUES ('st-0001', 'u-stu-0001', 'Ali Khan', '0300-1111111', '35202-1111111-1', '2002-05-15', 'MALE', '123 Canal Bank Road, Lahore', 'Tariq Khan', '35202-0000001-1', 'Businessman', '0300-9999001', '0300-9999001', 'BCS2023001', 'BS Computer Science', 3, 'Fall 2023', 'FSc Pre-Engineering', 'Punjab College', 3.65, NULL, 0, 'NOT_SAVED', CURRENT_TIMESTAMP);

INSERT INTO course_assignments (id, student_id, course_id, assigned_by, created_at) VALUES
('asgn-01-1', 'st-0001', 'c-cs101', 'u-admin-0000-0000-0000-000000000001', CURRENT_TIMESTAMP),
('asgn-01-2', 'st-0001', 'c-cs201', 'u-admin-0000-0000-0000-000000000001', CURRENT_TIMESTAMP),
('asgn-01-3', 'st-0001', 'c-mt101', 'u-admin-0000-0000-0000-000000000001', CURRENT_TIMESTAMP);


-- State 2: Fatima Zahra (Complete assignment - 4 courses, No branch selected)
INSERT INTO users (id, email, password_hash, role, is_active, created_at)
VALUES ('u-stu-0002', 'student2@examslot.test', '56e54e4f16a048a1e204c35e98eb738f6b0bf5d2db2491a67a5f6e80b2a95c87', 'STUDENT', 1, CURRENT_TIMESTAMP);

INSERT INTO students (id, user_id, full_name, phone, cnic, dob, gender, address, father_name, parent_cnic, parent_occupation, parent_contact, emergency_contact, registration_number, program, semester, session, previous_qualification, previous_institute, marks_or_cgpa, branch_id, branch_locked, datesheet_status, created_at)
VALUES ('st-0002', 'u-stu-0002', 'Fatima Zahra', '0301-2222222', '35202-2222222-2', '2003-01-20', 'FEMALE', '45 Gulberg III, Lahore', 'Zahra Ahmed', '35202-0000002-2', 'Engineer', '0300-9999002', '0300-9999002', 'BCS2023002', 'BS Computer Science', 3, 'Fall 2023', 'A-Levels', 'Kinnaird College', 3.80, NULL, 0, 'NOT_SAVED', CURRENT_TIMESTAMP);

INSERT INTO course_assignments (id, student_id, course_id, assigned_by, created_at) VALUES
('asgn-02-1', 'st-0002', 'c-cs101', 'u-admin-0000-0000-0000-000000000001', CURRENT_TIMESTAMP),
('asgn-02-2', 'st-0002', 'c-cs201', 'u-admin-0000-0000-0000-000000000001', CURRENT_TIMESTAMP),
('asgn-02-3', 'st-0002', 'c-mt101', 'u-admin-0000-0000-0000-000000000001', CURRENT_TIMESTAMP),
('asgn-02-4', 'st-0002', 'c-cs301', 'u-admin-0000-0000-0000-000000000001', CURRENT_TIMESTAMP);


-- State 3: Usman Tariq (Branch chosen LHR, Date sheet not saved)
INSERT INTO users (id, email, password_hash, role, is_active, created_at)
VALUES ('u-stu-0003', 'student3@examslot.test', '56e54e4f16a048a1e204c35e98eb738f6b0bf5d2db2491a67a5f6e80b2a95c87', 'STUDENT', 1, CURRENT_TIMESTAMP);

INSERT INTO students (id, user_id, full_name, phone, cnic, dob, gender, address, father_name, parent_cnic, parent_occupation, parent_contact, emergency_contact, registration_number, program, semester, session, previous_qualification, previous_institute, marks_or_cgpa, branch_id, branch_locked, datesheet_status, created_at)
VALUES ('st-0003', 'u-stu-0003', 'Usman Tariq', '0302-3333333', '35202-3333333-3', '2001-11-10', 'MALE', '78 Model Town, Lahore', 'Tariq Mehmood', '35202-0000003-3', 'Doctor', '0300-9999003', '0300-9999003', 'BCS2023003', 'BS Computer Science', 3, 'Fall 2023', 'FSc Pre-Engineering', 'GCU Lahore', 3.40, 'b-lhr-01', 1, 'NOT_SAVED', CURRENT_TIMESTAMP);

INSERT INTO course_assignments (id, student_id, course_id, assigned_by, created_at) VALUES
('asgn-03-1', 'st-0003', 'c-cs101', 'u-admin-0000-0000-0000-000000000001', CURRENT_TIMESTAMP),
('asgn-03-2', 'st-0003', 'c-cs201', 'u-admin-0000-0000-0000-000000000001', CURRENT_TIMESTAMP),
('asgn-03-3', 'st-0003', 'c-mt101', 'u-admin-0000-0000-0000-000000000001', CURRENT_TIMESTAMP),
('asgn-03-4', 'st-0003', 'c-en101', 'u-admin-0000-0000-0000-000000000001', CURRENT_TIMESTAMP);


-- State 4: Ayesha Malik (Date sheet saved ISB - Locked)
INSERT INTO users (id, email, password_hash, role, is_active, created_at)
VALUES ('u-stu-0004', 'student4@examslot.test', '56e54e4f16a048a1e204c35e98eb738f6b0bf5d2db2491a67a5f6e80b2a95c87', 'STUDENT', 1, CURRENT_TIMESTAMP);

INSERT INTO students (id, user_id, full_name, phone, cnic, dob, gender, address, father_name, parent_cnic, parent_occupation, parent_contact, emergency_contact, registration_number, program, semester, session, previous_qualification, previous_institute, marks_or_cgpa, branch_id, branch_locked, datesheet_status, datesheet_saved_at, created_at)
VALUES ('st-0004', 'u-stu-0004', 'Ayesha Malik', '0303-4444444', '35202-4444444-4', '2002-08-25', 'FEMALE', '15 Sector F-7/2, Islamabad', 'Malik Riaz', '35202-0000004-4', 'Civil Servant', '0300-9999004', '0300-9999004', 'BCS2023004', 'BS Software Engineering', 3, 'Fall 2023', 'FSc Pre-Engineering', 'Army Public School', 3.90, 'b-isb-02', 1, 'SAVED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO course_assignments (id, student_id, course_id, assigned_by, created_at) VALUES
('asgn-04-1', 'st-0004', 'c-cs101', 'u-admin-0000-0000-0000-000000000001', CURRENT_TIMESTAMP),
('asgn-04-2', 'st-0004', 'c-cs201', 'u-admin-0000-0000-0000-000000000001', CURRENT_TIMESTAMP),
('asgn-04-3', 'st-0004', 'c-mt101', 'u-admin-0000-0000-0000-000000000001', CURRENT_TIMESTAMP),
('asgn-04-4', 'st-0004', 'c-se301', 'u-admin-0000-0000-0000-000000000001', CURRENT_TIMESTAMP);

INSERT INTO date_sheet_selections (id, student_id, course_id, slot_id, branch_id, created_at) VALUES
('sel-04-1', 'st-0004', 'c-cs101', 's-cs101-1', 'b-isb-02', CURRENT_TIMESTAMP),
('sel-04-2', 'st-0004', 'c-cs201', 's-cs201-1', 'b-isb-02', CURRENT_TIMESTAMP),
('sel-04-3', 'st-0004', 'c-mt101', 's-mt101-1', 'b-isb-02', CURRENT_TIMESTAMP),
('sel-04-4', 'st-0004', 'c-se301', 's-se301-1', 'b-isb-02', CURRENT_TIMESTAMP);


-- State 5: Bilal Ahmed (Date sheet saved KHI + Pending Change Request)
INSERT INTO users (id, email, password_hash, role, is_active, created_at)
VALUES ('u-stu-0005', 'student5@examslot.test', '56e54e4f16a048a1e204c35e98eb738f6b0bf5d2db2491a67a5f6e80b2a95c87', 'STUDENT', 1, CURRENT_TIMESTAMP);

INSERT INTO students (id, user_id, full_name, phone, cnic, dob, gender, address, father_name, parent_cnic, parent_occupation, parent_contact, emergency_contact, registration_number, program, semester, session, previous_qualification, previous_institute, marks_or_cgpa, branch_id, branch_locked, datesheet_status, datesheet_saved_at, created_at)
VALUES ('st-0005', 'u-stu-0005', 'Bilal Ahmed', '0304-5555555', '35202-5555555-5', '2001-03-30', 'MALE', '99 Clifton Block 2, Karachi', 'Ahmed Hassan', '35202-0000005-5', 'Banker', '0300-9999005', '0300-9999005', 'BCS2023005', 'BS Computer Science', 3, 'Fall 2023', 'A-Levels', 'NIXOR College', 3.55, 'b-khi-03', 1, 'SAVED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO course_assignments (id, student_id, course_id, assigned_by, created_at) VALUES
('asgn-05-1', 'st-0005', 'c-cs101', 'u-admin-0000-0000-0000-000000000001', CURRENT_TIMESTAMP),
('asgn-05-2', 'st-0005', 'c-cs201', 'u-admin-0000-0000-0000-000000000001', CURRENT_TIMESTAMP),
('asgn-05-3', 'st-0005', 'c-mt101', 'u-admin-0000-0000-0000-000000000001', CURRENT_TIMESTAMP),
('asgn-05-4', 'st-0005', 'c-cs310', 'u-admin-0000-0000-0000-000000000001', CURRENT_TIMESTAMP),
('asgn-05-5', 'st-0005', 'c-se301', 'u-admin-0000-0000-0000-000000000001', CURRENT_TIMESTAMP);

INSERT INTO date_sheet_selections (id, student_id, course_id, slot_id, branch_id, created_at) VALUES
('sel-05-1', 'st-0005', 'c-cs101', 's-cs101-1', 'b-khi-03', CURRENT_TIMESTAMP),
('sel-05-2', 'st-0005', 'c-cs201', 's-cs201-3', 'b-khi-03', CURRENT_TIMESTAMP),
('sel-05-3', 'st-0005', 'c-mt101', 's-mt101-3', 'b-khi-03', CURRENT_TIMESTAMP),
('sel-05-4', 'st-0005', 'c-cs310', 's-cs310-1', 'b-khi-03', CURRENT_TIMESTAMP),
('sel-05-5', 'st-0005', 'c-se301', 's-se301-1', 'b-khi-03', CURRENT_TIMESTAMP);

INSERT INTO change_requests (id, student_id, type, reason, status, created_at) VALUES
('req-0005-01', 'st-0005', 'CHANGE_DATESHEET', 'I have an urgent medical appointment on 2027-01-11 and need to change my CS101 slot.', 'PENDING', CURRENT_TIMESTAMP);

-- -----------------------------------------------------------------------------
-- 6. PASSWORD SETUP TOKEN
-- Token for Student 1 email onboarding demo
-- -----------------------------------------------------------------------------
INSERT INTO password_tokens (id, user_id, token_hash, purpose, expires_at, created_at) VALUES
('tok-0001', 'u-stu-0001', '065fbd73c6dc252ea93e390c2bf05047b1c31aeef530e20e8b2bb8e5611cb0f7', 'SETUP', datetime(CURRENT_TIMESTAMP, '+24 hours'), CURRENT_TIMESTAMP);
