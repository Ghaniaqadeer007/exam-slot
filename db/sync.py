"""
Database Synchronization Module
Syncs SQLite examslot.db with server/database.json so that the Node.js Express server
and SQLite database are always 100% synchronized.
"""

import sqlite3
import json
import os
import hashlib
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "examslot.db")
JSON_PATH = os.path.join(os.path.dirname(__file__), "../server/database.json")

def export_db_to_json():
    """Exports SQLite examslot.db tables into server/database.json."""
    if not os.path.exists(DB_PATH):
        return

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Users
    cursor.execute("SELECT * FROM users")
    users = []
    for r in cursor.fetchall():
        users.append({
            "id": r["id"],
            "email": r["email"],
            "vu_id": r["email"],
            "password": r["password_hash"], # Uses hashed/stored pass
            "role": r["role"].lower(),
            "created_at": str(r["created_at"]) if r["created_at"] else datetime.now().isoformat()
        })

    # Branches
    cursor.execute("SELECT * FROM branches")
    branches = []
    for r in cursor.fetchall():
        branches.append({
            "id": r["id"],
            "code": r["code"],
            "name": r["name"],
            "city": r["city"],
            "address": r["address"],
            "contact_number": r["contact_number"],
            "status": r["status"].lower(),
            "capacity": 500,
            "created_at": str(r["created_at"]) if r["created_at"] else datetime.now().isoformat()
        })

    # Courses
    cursor.execute("SELECT * FROM courses")
    courses = []
    for r in cursor.fetchall():
        courses.append({
            "id": r["id"],
            "course_code": r["course_code"],
            "title": r["title"],
            "credit_hours": r["credit_hours"],
            "department": r["department"],
            "status": r["status"].lower(),
            "created_at": str(r["created_at"]) if r["created_at"] else datetime.now().isoformat()
        })

    # Students
    cursor.execute("SELECT * FROM students")
    students = []
    for r in cursor.fetchall():
        cursor.execute("SELECT email FROM users WHERE id = ?", (r["user_id"],))
        user_row = cursor.fetchone()
        email = user_row["email"] if user_row else "student@examslot.test"

        students.append({
            "id": r["id"],
            "user_id": r["user_id"],
            "registration_number": r["registration_number"],
            "full_name": r["full_name"],
            "email": email,
            "phone": r["phone"],
            "cnic": r["cnic"],
            "dob": str(r["dob"]),
            "gender": r["gender"].capitalize(),
            "address": r["address"],
            "profile_photo": r["photo_url"],
            "father_name": r["father_name"],
            "parent_cnic": r["parent_cnic"],
            "parent_occupation": r["parent_occupation"],
            "parent_contact": r["parent_contact"],
            "emergency_contact": r["emergency_contact"],
            "program": r["program"],
            "semester": r["semester"],
            "session": r["session"],
            "previous_qualification": r["previous_qualification"],
            "previous_institute": r["previous_institute"],
            "marks_or_cgpa": str(r["marks_or_cgpa"]),
            "branch_id": r["branch_id"],
            "branch_locked": bool(r["branch_locked"]),
            "datesheet_status": r["datesheet_status"].lower(),
            "datesheet_saved_at": str(r["datesheet_saved_at"]) if r["datesheet_saved_at"] else None,
            "branch_change_unlocked": 0,
            "datesheet_change_unlocked": 0,
            "created_at": str(r["created_at"]) if r["created_at"] else datetime.now().isoformat()
        })

    # Course Assignments
    cursor.execute("SELECT * FROM course_assignments")
    course_assignments = []
    for r in cursor.fetchall():
        course_assignments.append({
            "id": r["id"],
            "student_id": r["student_id"],
            "course_id": r["course_id"]
        })

    # Exam Slots
    cursor.execute("SELECT * FROM exam_slots")
    exam_slots = []
    for r in cursor.fetchall():
        date_str = str(r["exam_date"])
        date_obj = datetime.strptime(date_str, "%Y-%m-%d") if "-" in date_str else datetime.now()
        day_name = date_obj.strftime("%A")

        cursor.execute("SELECT COUNT(*) FROM date_sheet_selections WHERE slot_id = ?", (r["id"],))
        booked_count = cursor.fetchone()[0]

        exam_slots.append({
            "id": r["id"],
            "course_id": r["course_id"],
            "exam_date": date_str,
            "day_name": day_name,
            "start_time": r["start_time"],
            "end_time": r["end_time"] or "12:00",
            "capacity": r["capacity"] or 60,
            "booked_count": booked_count,
            "created_at": str(r["created_at"]) if r["created_at"] else datetime.now().isoformat()
        })

    # Date Sheet Selections
    cursor.execute("SELECT * FROM date_sheet_selections")
    date_sheet_selections = []
    for r in cursor.fetchall():
        date_sheet_selections.append({
            "id": r["id"],
            "student_id": r["student_id"],
            "course_id": r["course_id"],
            "slot_id": r["slot_id"]
        })

    # Change Requests
    cursor.execute("SELECT * FROM change_requests")
    change_requests = []
    for r in cursor.fetchall():
        change_requests.append({
            "id": r["id"],
            "student_id": r["student_id"],
            "type": r["type"].lower(),
            "reason": r["reason"],
            "status": r["status"].lower(),
            "admin_remark": r["admin_remark"],
            "decided_by": r["decided_by"],
            "decided_at": str(r["decided_at"]) if r["decided_at"] else None,
            "consumed_at": str(r["consumed_at"]) if r["consumed_at"] else None,
            "created_at": str(r["created_at"]) if r["created_at"] else datetime.now().isoformat()
        })

    conn.close()

    db_json = {
        "users": users,
        "branches": branches,
        "courses": courses,
        "students": students,
        "course_assignments": course_assignments,
        "exam_slots": exam_slots,
        "date_sheet_selections": date_sheet_selections,
        "change_requests": change_requests,
        "password_tokens": [],
        "email_logs": []
    }

    os.makedirs(os.path.dirname(JSON_PATH), exist_ok=True)
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(db_json, f, indent=2)

    print("Successfully synchronized SQLite examslot.db -> server/database.json")

if __name__ == "__main__":
    export_db_to_json()
