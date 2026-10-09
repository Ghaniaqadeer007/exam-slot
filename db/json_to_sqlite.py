"""
JSON to SQLite Synchronization Module
Syncs server/database.json changes directly into SQLite examslot.db.
"""

import sqlite3
import json
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "examslot.db")
JSON_PATH = os.path.join(os.path.dirname(__file__), "../server/database.json")

def sync_json_to_db():
    if not os.path.exists(JSON_PATH):
        print(f"JSON database file not found at {JSON_PATH}")
        return

    with open(JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = OFF;")
    cursor = conn.cursor()

    # 1. Sync Users
    users = data.get("users", [])
    cursor.execute("DELETE FROM users")
    for u in users:
        role = u.get("role", "student").upper()
        if role not in ("ADMIN", "STUDENT"):
            role = "STUDENT"
        cursor.execute("""
            INSERT INTO users (id, email, password_hash, role, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, 1, ?, ?)
        """, (
            u["id"],
            u["email"],
            u.get("password", u.get("password_hash", "admin123")),
            role,
            u.get("created_at", datetime.now().isoformat()),
            datetime.now().isoformat()
        ))

    # 2. Sync Branches
    branches = data.get("branches", [])
    cursor.execute("DELETE FROM branches")
    for b in branches:
        status = b.get("status", "active").upper()
        if status not in ("ACTIVE", "INACTIVE"):
            status = "ACTIVE"
        cursor.execute("""
            INSERT INTO branches (id, code, name, city, address, contact_number, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            b["id"],
            b["code"].upper(),
            b["name"],
            b["city"],
            b["address"],
            b.get("contact_number", "N/A"),
            status,
            b.get("created_at", datetime.now().isoformat()),
            datetime.now().isoformat()
        ))

    # 3. Sync Courses
    courses = data.get("courses", [])
    cursor.execute("DELETE FROM courses")
    for c in courses:
        status = c.get("status", "active").upper()
        if status not in ("ACTIVE", "INACTIVE"):
            status = "ACTIVE"
        cursor.execute("""
            INSERT INTO courses (id, course_code, title, credit_hours, department, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            c["id"],
            c["course_code"].upper(),
            c["title"],
            int(c.get("credit_hours", 3)),
            c.get("department", "Computer Science"),
            status,
            c.get("created_at", datetime.now().isoformat()),
            datetime.now().isoformat()
        ))

    # 4. Sync Students
    students = data.get("students", [])
    cursor.execute("DELETE FROM students")
    for s in students:
        gender = s.get("gender", "Male").upper()
        if gender not in ("MALE", "FEMALE", "OTHER"):
            gender = "MALE"

        ds_status = s.get("datesheet_status", "not_saved").upper()
        if ds_status not in ("NOT_SAVED", "SAVED"):
            ds_status = "NOT_SAVED"

        marks_cgpa = 3.50
        try:
            marks_cgpa = float(s.get("marks_or_cgpa", s.get("cgpa", 3.50)))
        except (ValueError, TypeError):
            marks_cgpa = 3.50

        cursor.execute("""
            INSERT INTO students (
                id, user_id, full_name, phone, cnic, dob, gender, address, photo_url,
                father_name, parent_cnic, parent_occupation, parent_contact, emergency_contact,
                registration_number, program, semester, session, previous_qualification,
                previous_institute, marks_or_cgpa, branch_id, branch_locked, datesheet_status,
                datesheet_saved_at, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            s["id"],
            s["user_id"],
            s["full_name"],
            s.get("phone", "+92 300 0000000"),
            s.get("cnic", f"35201-{s['id']}-1"),
            s.get("dob", "2004-01-01"),
            gender,
            s.get("address", "Resident Address"),
            s.get("profile_photo", None),
            s.get("father_name", "Father Name"),
            s.get("parent_cnic", "35201-1234567-1"),
            s.get("parent_occupation", "Professional"),
            s.get("parent_contact", "+92 301 0000000"),
            s.get("emergency_contact", "+92 302 0000000"),
            s.get("registration_number", s.get("vu_id", "BC000000")),
            s.get("program", "BS Computer Science"),
            int(s.get("semester", 1)),
            s.get("session", "Fall 2026"),
            s.get("previous_qualification", "HSSC"),
            s.get("previous_institute", "College"),
            marks_cgpa,
            s.get("branch_id"),
            1 if s.get("branch_locked") else 0,
            ds_status,
            s.get("datesheet_saved_at"),
            s.get("created_at", datetime.now().isoformat()),
            datetime.now().isoformat()
        ))

    # 5. Sync Course Assignments
    assignments = data.get("course_assignments", [])
    cursor.execute("DELETE FROM course_assignments")
    for a in assignments:
        cursor.execute("""
            INSERT INTO course_assignments (id, student_id, course_id, created_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        """, (
            a["id"],
            a["student_id"],
            a["course_id"]
        ))

    # 6. Sync Exam Slots
    slots = data.get("exam_slots", [])
    cursor.execute("DELETE FROM exam_slots")
    for sl in slots:
        cursor.execute("""
            INSERT INTO exam_slots (id, course_id, exam_date, start_time, end_time, capacity, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            sl["id"],
            sl["course_id"],
            sl["exam_date"],
            sl["start_time"],
            sl.get("end_time", "12:00"),
            int(sl.get("capacity", 60)),
            sl.get("created_at", datetime.now().isoformat()),
            datetime.now().isoformat()
        ))

    # 7. Sync Date Sheet Selections
    selections = data.get("date_sheet_selections", [])
    cursor.execute("DELETE FROM date_sheet_selections")
    for sel in selections:
        # Get branch_id for student
        cursor.execute("SELECT branch_id FROM students WHERE id = ?", (sel["student_id"],))
        st_row = cursor.fetchone()
        branch_id = st_row[0] if st_row and st_row[0] else "br_lhr"

        cursor.execute("""
            INSERT INTO date_sheet_selections (id, student_id, course_id, slot_id, branch_id, created_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        """, (
            sel["id"],
            sel["student_id"],
            sel["course_id"],
            sel["slot_id"],
            branch_id
        ))

    # 8. Sync Change Requests
    requests = data.get("change_requests", [])
    cursor.execute("DELETE FROM change_requests")
    for req in requests:
        req_type = req.get("type", "CHANGE_BRANCH").upper()
        if req_type not in ("CHANGE_BRANCH", "CHANGE_DATESHEET"):
            req_type = "CHANGE_BRANCH"

        status = req.get("status", "PENDING").upper()
        if status not in ("PENDING", "APPROVED", "REJECTED"):
            status = "PENDING"

        cursor.execute("""
            INSERT INTO change_requests (
                id, student_id, type, reason, status, admin_remark, decided_by, decided_at, consumed_at, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            req["id"],
            req["student_id"],
            req_type,
            req.get("reason", "Request"),
            status,
            req.get("admin_remark"),
            req.get("decided_by"),
            req.get("decided_at"),
            req.get("consumed_at"),
            req.get("created_at", datetime.now().isoformat())
        ))

    conn.commit()
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.close()
    print("Successfully synchronized server/database.json -> SQLite examslot.db")

if __name__ == "__main__":
    sync_json_to_db()
