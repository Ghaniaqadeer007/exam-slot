"""
ExamSlot Database Seed Script
Populates the database with demo seed data for evaluation:
- 1 Admin user
- 4 Branches (3 Active, 1 Inactive)
- 8 Courses
- 5 Students covering all 5 demo states from PRD Section 15.1
- Exam slots with intentional conflict pairs for testing
- Change requests and password setup tokens
"""

import os
import uuid
from datetime import datetime, timedelta
from database import get_db_connection, init_db, hash_password, hash_token

def seed_database(db_path=None):
    # Ensure tables exist
    init_db(db_path)
    
    conn = get_db_connection(db_path)
    cursor = conn.cursor()

    # Clear existing data cleanly in correct cascade order
    tables = [
        "audit_logs", "password_tokens", "change_requests", 
        "date_sheet_selections", "exam_slots", "course_assignments", 
        "students", "courses", "branches", "users"
    ]
    for table in tables:
        cursor.execute(f"DELETE FROM {table}")
    conn.commit()

    print("Seeding ExamSlot database...")

    # -------------------------------------------------------------------------
    # 1. ADMIN USER
    # -------------------------------------------------------------------------
    admin_id = "u-admin-0000-0000-0000-000000000001"
    admin_email = "admin@examslot.test"
    admin_pass_hash = hash_password("AdminPassword123!")
    
    cursor.execute("""
        INSERT INTO users (id, email, password_hash, role, is_active, created_at)
        VALUES (?, ?, ?, 'ADMIN', 1, CURRENT_TIMESTAMP)
    """, (admin_id, admin_email, admin_pass_hash))

    # -------------------------------------------------------------------------
    # 2. BRANCHES (3 Active, 1 Inactive)
    # -------------------------------------------------------------------------
    branches_data = [
        ("b-lhr-01", "LHR", "Lahore Campus", "Lahore", "12-A Canal Bank Road, Lahore", "042-111-222-333", "ACTIVE"),
        ("b-isb-02", "ISB", "Islamabad Campus", "Islamabad", "Sector H-8/4, Islamabad", "051-111-222-444", "ACTIVE"),
        ("b-khi-03", "KHI", "Karachi Campus", "Karachi", "Block 6 PECHS, Main Shahrah-e-Faisal, Karachi", "021-111-222-555", "ACTIVE"),
        ("b-fsd-04", "FSD", "Faisalabad Campus", "Faisalabad", "Sargodha Road, Faisalabad", "041-111-222-666", "INACTIVE"),
    ]
    
    for b_id, code, name, city, addr, phone, status in branches_data:
        cursor.execute("""
            INSERT INTO branches (id, code, name, city, address, contact_number, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        """, (b_id, code, name, city, addr, phone, status))

    # -------------------------------------------------------------------------
    # 3. COURSES (8 courses)
    # -------------------------------------------------------------------------
    courses_data = [
        ("c-cs101", "CS101", "Programming Fundamentals", 3, "Computer Science", "ACTIVE"),
        ("c-cs201", "CS201", "Data Structures", 3, "Computer Science", "ACTIVE"),
        ("c-cs301", "CS301", "Database Systems", 3, "Computer Science", "ACTIVE"),
        ("c-cs310", "CS310", "Computer Networks", 3, "Computer Science", "ACTIVE"),
        ("c-mt101", "MT101", "Calculus", 3, "Mathematics", "ACTIVE"),
        ("c-mt201", "MT201", "Linear Algebra", 3, "Mathematics", "ACTIVE"),
        ("c-en101", "EN101", "English Composition", 2, "Humanities", "ACTIVE"),
        ("c-se301", "SE301", "Software Engineering", 3, "Software Engineering", "ACTIVE"),
    ]
    
    for c_id, code, title, ch, dept, status in courses_data:
        cursor.execute("""
            INSERT INTO courses (id, course_code, title, credit_hours, department, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        """, (c_id, code, title, ch, dept, status))

    # -------------------------------------------------------------------------
    # 4. EXAM SLOTS (Multiple per course + conflict pair)
    # -------------------------------------------------------------------------
    # Note: CS201 and MT101 have overlapping slots on 2027-01-13 (14:00 - 17:00)
    slots_data = [
        # CS101
        ("s-cs101-1", "c-cs101", "2027-01-11", "09:00", "12:00", 50),
        ("s-cs101-2", "c-cs101", "2027-01-15", "14:00", "17:00", 50),
        
        # CS201
        ("s-cs201-1", "c-cs201", "2027-01-11", "09:00", "12:00", 40),
        ("s-cs201-2", "c-cs201", "2027-01-13", "14:00", "17:00", 40), # Conflicts with s-mt101-2
        ("s-cs201-3", "c-cs201", "2027-01-15", "09:00", "12:00", 40),
        
        # CS301
        ("s-cs301-1", "c-cs301", "2027-01-12", "09:00", "12:00", 35),
        ("s-cs301-2", "c-cs301", "2027-01-16", "14:00", "17:00", 35),
        
        # CS310
        ("s-cs310-1", "c-cs310", "2027-01-14", "09:00", "12:00", 30),
        ("s-cs310-2", "c-cs310", "2027-01-18", "14:00", "17:00", 30),
        
        # MT101
        ("s-mt101-1", "c-mt101", "2027-01-12", "14:00", "17:00", 60),
        ("s-mt101-2", "c-mt101", "2027-01-13", "14:00", "17:00", 60), # Conflicts with s-cs201-2
        ("s-mt101-3", "c-mt101", "2027-01-16", "09:00", "12:00", 60),
        
        # MT201
        ("s-mt201-1", "c-mt201", "2027-01-14", "14:00", "17:00", 45),
        ("s-mt201-2", "c-mt201", "2027-01-19", "09:00", "12:00", 45),
        
        # EN101
        ("s-en101-1", "c-en101", "2027-01-15", "09:00", "12:00", 70),
        ("s-en101-2", "c-en101", "2027-01-20", "14:00", "17:00", 70),
        
        # SE301
        ("s-se301-1", "c-se301", "2027-01-18", "09:00", "12:00", 40),
        ("s-se301-2", "c-se301", "2027-01-21", "14:00", "17:00", 40),
    ]

    for slot_id, course_id, date_str, stime, etime, cap in slots_data:
        cursor.execute("""
            INSERT INTO exam_slots (id, course_id, exam_date, start_time, end_time, capacity, created_at)
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        """, (slot_id, course_id, date_str, stime, etime, cap))

    # -------------------------------------------------------------------------
    # 5. STUDENTS (5 Demo States as per PRD 15.1)
    # -------------------------------------------------------------------------
    students_info = [
        # Student 1: Incomplete assignment (3 courses)
        {
            "user_id": "u-stu-0001",
            "student_id": "st-0001",
            "email": "student1@examslot.test",
            "name": "Ali Khan",
            "phone": "0300-1111111",
            "cnic": "35202-1111111-1",
            "reg_no": "BCS2023001",
            "branch_id": None,
            "branch_locked": 0,
            "datesheet_status": "NOT_SAVED",
            "courses": ["c-cs101", "c-cs201", "c-mt101"], # Only 3 assigned (INCOMPLETE)
            "selections": []
        },
        # Student 2: Complete assignment (4 courses), No branch selected
        {
            "user_id": "u-stu-0002",
            "student_id": "st-0002",
            "email": "student2@examslot.test",
            "name": "Fatima Zahra",
            "phone": "0301-2222222",
            "cnic": "35202-2222222-2",
            "reg_no": "BCS2023002",
            "branch_id": None,
            "branch_locked": 0,
            "datesheet_status": "NOT_SAVED",
            "courses": ["c-cs101", "c-cs201", "c-mt101", "c-cs301"], # 4 courses
            "selections": []
        },
        # Student 3: Branch chosen (LHR), Date sheet not saved
        {
            "user_id": "u-stu-0003",
            "student_id": "st-0003",
            "email": "student3@examslot.test",
            "name": "Usman Tariq",
            "phone": "0302-3333333",
            "cnic": "35202-3333333-3",
            "reg_no": "BCS2023003",
            "branch_id": "b-lhr-01",
            "branch_locked": 1,
            "datesheet_status": "NOT_SAVED",
            "courses": ["c-cs101", "c-cs201", "c-mt101", "c-en101"], # 4 courses
            "selections": []
        },
        # Student 4: Date sheet saved (Locked)
        {
            "user_id": "u-stu-0004",
            "student_id": "st-0004",
            "email": "student4@examslot.test",
            "name": "Ayesha Malik",
            "phone": "0303-4444444",
            "cnic": "35202-4444444-4",
            "reg_no": "BCS2023004",
            "branch_id": "b-isb-02",
            "branch_locked": 1,
            "datesheet_status": "SAVED",
            "courses": ["c-cs101", "c-cs201", "c-mt101", "c-se301"], # 4 courses
            "selections": [
                ("c-cs101", "s-cs101-1", "b-isb-02"),
                ("c-cs201", "s-cs201-1", "b-isb-02"),
                ("c-mt101", "s-mt101-1", "b-isb-02"),
                ("c-se301", "s-se301-1", "b-isb-02"),
            ]
        },
        # Student 5: Date sheet saved with PENDING change request
        {
            "user_id": "u-stu-0005",
            "student_id": "st-0005",
            "email": "student5@examslot.test",
            "name": "Bilal Ahmed",
            "phone": "0304-5555555",
            "cnic": "35202-5555555-5",
            "reg_no": "BCS2023005",
            "branch_id": "b-khi-03",
            "branch_locked": 1,
            "datesheet_status": "SAVED",
            "courses": ["c-cs101", "c-cs201", "c-mt101", "c-cs310", "c-se301"], # 5 courses
            "selections": [
                ("c-cs101", "s-cs101-1", "b-khi-03"),
                ("c-cs201", "s-cs201-3", "b-khi-03"),
                ("c-mt101", "s-mt101-3", "b-khi-03"),
                ("c-cs310", "s-cs310-1", "b-khi-03"),
                ("c-se301", "s-se301-1", "b-khi-03"),
            ],
            "pending_request": {
                "id": "req-0005-01",
                "type": "CHANGE_DATESHEET",
                "reason": "I have an urgent medical appointment on 2027-01-11 and need to change my CS101 slot."
            }
        }
    ]

    default_pass_hash = hash_password("StudentPassword123!")

    for stu in students_info:
        # Create User
        cursor.execute("""
            INSERT INTO users (id, email, password_hash, role, is_active, created_at)
            VALUES (?, ?, ?, 'STUDENT', 1, CURRENT_TIMESTAMP)
        """, (stu["user_id"], stu["email"], default_pass_hash))

        # Create Student profile
        cursor.execute("""
            INSERT INTO students (
                id, user_id, full_name, phone, cnic, dob, gender, address, photo_url,
                father_name, parent_cnic, parent_occupation, parent_contact, emergency_contact,
                registration_number, program, semester, session, previous_qualification, previous_institute, marks_or_cgpa,
                branch_id, branch_locked, datesheet_status, datesheet_saved_at, created_at
            ) VALUES (
                ?, ?, ?, ?, ?, '2002-05-15', 'MALE', '123 University Road, City', NULL,
                'Guardian Name', '35202-0000000-0', 'Business', '0300-0000000', '0300-9999999',
                ?, 'BS Computer Science', 3, 'Fall 2023', 'FSc Pre-Engineering', 'Punjab College', 3.65,
                ?, ?, ?, ?, CURRENT_TIMESTAMP
            )
        """, (
            stu["student_id"], stu["user_id"], stu["name"], stu["phone"], stu["cnic"],
            stu["reg_no"], stu["branch_id"], stu["branch_locked"], stu["datesheet_status"],
            datetime.now().strftime("%Y-%m-%d %H:%M:%S") if stu["datesheet_status"] == "SAVED" else None
        ))

        # Assign Courses
        for course_id in stu["courses"]:
            asgn_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO course_assignments (id, student_id, course_id, assigned_by, created_at)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            """, (asgn_id, stu["student_id"], course_id, admin_id))

        # Date Sheet Selections
        for course_id, slot_id, branch_id in stu["selections"]:
            sel_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO date_sheet_selections (id, student_id, course_id, slot_id, branch_id, created_at)
                VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            """, (sel_id, stu["student_id"], course_id, slot_id, branch_id))

        # Pending Request if any
        if "pending_request" in stu:
            req = stu["pending_request"]
            cursor.execute("""
                INSERT INTO change_requests (id, student_id, type, reason, status, created_at)
                VALUES (?, ?, ?, ?, 'PENDING', CURRENT_TIMESTAMP)
            """, (req["id"], stu["student_id"], req["type"], req["reason"]))

    # -------------------------------------------------------------------------
    # 6. PASSWORD SETUP TOKEN (for Student 1 email setup flow demo)
    # -------------------------------------------------------------------------
    token_plain = "demo_setup_token_student1_2026"
    token_hash = hash_token(token_plain)
    token_id = "tok-0001"
    expires_at = (datetime.now() + timedelta(hours=24)).strftime("%Y-%m-%d %H:%M:%S")

    cursor.execute("""
        INSERT INTO password_tokens (id, user_id, token_hash, purpose, expires_at, created_at)
        VALUES (?, 'u-stu-0001', ?, 'SETUP', ?, CURRENT_TIMESTAMP)
    """, (token_id, token_hash, expires_at))

    conn.commit()
    conn.close()
    print("Database seeding completed successfully!")
    print("\n--- DEMO CREDENTIALS SUMMARY ---")
    print("Admin:   admin@examslot.test   / AdminPassword123!")
    print("Student: student1@examslot.test / StudentPassword123! (State 1: Incomplete assignment)")
    print("Student: student2@examslot.test / StudentPassword123! (State 2: Complete assignment, No branch)")
    print("Student: student3@examslot.test / StudentPassword123! (State 3: Branch chosen LHR, No date sheet)")
    print("Student: student4@examslot.test / StudentPassword123! (State 4: Date sheet saved ISB - Locked)")
    print("Student: student5@examslot.test / StudentPassword123! (State 5: Saved KHI + Pending Request)")

if __name__ == "__main__":
    seed_database()
