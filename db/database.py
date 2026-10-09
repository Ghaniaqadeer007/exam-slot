import sqlite3
import os
import json
import uuid
import hashlib
from datetime import datetime, timedelta

DB_PATH = os.path.join(os.path.dirname(__file__), "examslot.db")
SCHEMA_PATH = os.path.join(os.path.dirname(__file__), "schema.sql")

def get_db_connection(db_path=None):
    """Establishes a connection to SQLite with foreign keys enabled."""
    target_path = db_path or DB_PATH
    conn = sqlite3.connect(target_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db(db_path=None):
    """Initializes database tables and indexes from schema.sql."""
    conn = get_db_connection(db_path)
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        schema_sql = f.read()
    conn.executescript(schema_sql)
    conn.commit()
    conn.close()
    print("Database schema successfully initialized.")

def hash_password(password: str) -> str:
    """Helper to generate password hash using SHA-256 (for lightweight testing/demo)."""
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

def hash_token(token: str) -> str:
    """Generates SHA-256 hash of password setup/reset token."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()

# =============================================================================
# BUSINESS RULE ENFORCEMENT HELPERS
# =============================================================================

def parse_time_minutes(time_str: str) -> int:
    """Converts HH:MM string to minutes since midnight."""
    parts = time_str.split(":")
    return int(parts[0]) * 60 + int(parts[1])

def check_slot_overlap(start1: str, end1: str, start2: str, end2: str) -> bool:
    """
    Checks if two time slots overlap.
    Assumption A18: If end time is missing, default to start + 180 minutes (3 hours).
    """
    s1 = parse_time_minutes(start1)
    e1 = parse_time_minutes(end1) if end1 else s1 + 180
    
    s2 = parse_time_minutes(start2)
    e2 = parse_time_minutes(end2) if end2 else s2 + 180
    
    return max(s1, s2) < min(e1, e2)

def validate_and_save_datesheet(conn, student_id: str, selections: list) -> dict:
    """
    Validates business rules for date sheet saving and saves selections atomically:
    1. Student assignment is complete (4 to 6 courses).
    2. Branch is selected.
    3. Student is not locked (or has an unconsumed approved CHANGE_DATESHEET request).
    4. Selections cover all assigned courses.
    5. Each slot belongs to the target course.
    6. No slot time overlaps on the same date.
    """
    cursor = conn.cursor()
    
    # 1. Fetch student
    cursor.execute("SELECT * FROM students WHERE id = ?", (student_id,))
    student = cursor.fetchone()
    if not student:
        raise ValueError("Student not found")
        
    if not student["branch_id"]:
        raise ValueError("BRANCH_NOT_SELECTED: Must select a branch before saving date sheet")
        
    # Check unlock status
    cursor.execute("""
        SELECT * FROM change_requests 
        WHERE student_id = ? AND type = 'CHANGE_DATESHEET' AND status = 'APPROVED' AND consumed_at IS NULL
        ORDER BY created_at DESC LIMIT 1
    """, (student_id,))
    unlock_request = cursor.fetchone()
    
    if student["datesheet_status"] == "SAVED" and not unlock_request:
        raise ValueError("DATESHEET_ALREADY_SAVED: Date sheet is locked and cannot be changed without admin approval")

    # 2. Fetch assigned courses
    cursor.execute("SELECT course_id FROM course_assignments WHERE student_id = ?", (student_id,))
    assigned_rows = cursor.fetchall()
    assigned_course_ids = {r["course_id"] for r in assigned_rows}
    
    if len(assigned_course_ids) < 4 or len(assigned_course_ids) > 6:
        raise ValueError(f"ASSIGNMENT_INCOMPLETE: Student must have between 4 and 6 assigned courses (currently has {len(assigned_course_ids)})")
        
    # 3. Validate selections count and courses
    selected_course_ids = {s["course_id"] for s in selections}
    if selected_course_ids != assigned_course_ids:
        raise ValueError("VALIDATION_ERROR: Selections must cover exactly all assigned courses")

    # 4. Fetch slot details and check course matching & overlaps
    slots_by_id = {}
    for sel in selections:
        cursor.execute("SELECT * FROM exam_slots WHERE id = ?", (sel["slot_id"],))
        slot = cursor.fetchone()
        if not slot:
            raise ValueError(f"NOT_FOUND: Slot {sel['slot_id']} does not exist")
        if slot["course_id"] != sel["course_id"]:
            raise ValueError(f"SLOT_NOT_FOR_COURSE: Slot {sel['slot_id']} belongs to a different course")
        slots_by_id[sel["slot_id"]] = slot

    # 5. Overlap detection
    num_selections = len(selections)
    for i in range(num_selections):
        for j in range(i + 1, num_selections):
            s1 = slots_by_id[selections[i]["slot_id"]]
            s2 = slots_by_id[selections[j]["slot_id"]]
            
            if s1["exam_date"] == s2["exam_date"]:
                if check_slot_overlap(s1["start_time"], s1["end_time"], s2["start_time"], s2["end_time"]):
                    cursor.execute("SELECT course_code FROM courses WHERE id = ?", (s1["course_id"],))
                    c1_code = cursor.fetchone()["course_code"]
                    cursor.execute("SELECT course_code FROM courses WHERE id = ?", (s2["course_id"],))
                    c2_code = cursor.fetchone()["course_code"]
                    raise ValueError(f"SLOT_CONFLICT: Courses {c1_code} and {c2_code} overlap on {s1['exam_date']} ({s1['start_time']} vs {s2['start_time']})")

    # 6. Save atomically
    cursor.execute("DELETE FROM date_sheet_selections WHERE student_id = ?", (student_id,))
    
    for sel in selections:
        selection_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO date_sheet_selections (id, student_id, course_id, slot_id, branch_id, created_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        """, (selection_id, student_id, sel["course_id"], sel["slot_id"], student["branch_id"]))
        
    cursor.execute("""
        UPDATE students 
        SET datesheet_status = 'SAVED', datesheet_saved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (student_id,))
    
    # Consume unlock if present
    if unlock_request:
        cursor.execute("""
            UPDATE change_requests 
            SET consumed_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        """, (unlock_request["id"],))

    conn.commit()
    return {"status": "success", "message": "Date sheet saved successfully"}

def select_student_branch(conn, student_id: str, branch_id: str) -> dict:
    """
    Selects exam branch for student:
    - Enforces one-time selection unless approved CHANGE_BRANCH unlock is active.
    - If approved unlock active: clears old date sheet, consumes unlock, sets automatic CHANGE_DATESHEET unlock.
    """
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM students WHERE id = ?", (student_id,))
    student = cursor.fetchone()
    if not student:
        raise ValueError("Student not found")

    cursor.execute("SELECT status FROM branches WHERE id = ?", (branch_id,))
    branch = cursor.fetchone()
    if not branch or branch["status"] != "ACTIVE":
        raise ValueError("INVALID_BRANCH: Selected branch is not active or does not exist")

    cursor.execute("""
        SELECT * FROM change_requests 
        WHERE student_id = ? AND type = 'CHANGE_BRANCH' AND status = 'APPROVED' AND consumed_at IS NULL
        ORDER BY created_at DESC LIMIT 1
    """, (student_id,))
    unlock_request = cursor.fetchone()

    if student["branch_locked"] and not unlock_request:
        raise ValueError("BRANCH_ALREADY_SELECTED: Branch has already been selected and is locked")

    cursor.execute("""
        UPDATE students 
        SET branch_id = ?, branch_locked = 1, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (branch_id, student_id))

    if unlock_request:
        # Mark unlock as consumed
        cursor.execute("UPDATE change_requests SET consumed_at = CURRENT_TIMESTAMP WHERE id = ?", (unlock_request["id"],))
        # Clear previous date sheet selections
        cursor.execute("DELETE FROM date_sheet_selections WHERE student_id = ?", (student_id,))
        cursor.execute("UPDATE students SET datesheet_status = 'NOT_SAVED', datesheet_saved_at = NULL WHERE id = ?", (student_id,))
        
        # Grant automatic CHANGE_DATESHEET unlock per Assumption A17
        auto_unlock_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO change_requests (id, student_id, type, reason, status, admin_remark, created_at)
            VALUES (?, ?, 'CHANGE_DATESHEET', 'Automatic unlock following branch change', 'APPROVED', 'System approved branch change workflow', CURRENT_TIMESTAMP)
        """, (auto_unlock_id, student_id))

    conn.commit()
    return {"status": "success", "message": "Branch selected successfully"}
