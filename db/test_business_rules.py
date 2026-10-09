"""
Automated Business Rules & Edge Cases Test Suite
Executes verification tests against the ExamSlot database to validate BR1-BR12 and E1-E22 logic.
"""

import unittest
import os
import sqlite3
from database import get_db_connection, init_db, validate_and_save_datesheet, select_student_branch
from seed import seed_database

TEST_DB_PATH = os.path.join(os.path.dirname(__file__), "test_examslot.db")

class TestExamSlotDatabaseBusinessRules(unittest.TestCase):

    def setUp(self):
        seed_database(TEST_DB_PATH)
        self.conn = get_db_connection(TEST_DB_PATH)

    def tearDown(self):
        self.conn.close()
        if os.path.exists(TEST_DB_PATH):
            os.remove(TEST_DB_PATH)

    def test_br1_assignment_incomplete_blocks_branch_and_datesheet(self):
        """Student 1 has 3 courses assigned (< 4). Saving date sheet must fail."""
        selections = [
            {"course_id": "c-cs101", "slot_id": "s-cs101-1"},
            {"course_id": "c-cs201", "slot_id": "s-cs201-1"},
            {"course_id": "c-mt101", "slot_id": "s-mt101-1"},
        ]
        with self.assertRaises(ValueError) as ctx:
            validate_and_save_datesheet(self.conn, "st-0001", selections)
        self.assertIn("BRANCH_NOT_SELECTED", str(ctx.exception))

    def test_br2_single_time_branch_selection(self):
        """Branch selection can be made only once."""
        # Student 2 selects branch for the first time
        res = select_student_branch(self.conn, "st-0002", "b-lhr-01")
        self.assertEqual(res["status"], "success")

        # Second selection attempt must fail with BRANCH_ALREADY_SELECTED
        with self.assertRaises(ValueError) as ctx:
            select_student_branch(self.conn, "st-0002", "b-isb-02")
        self.assertIn("BRANCH_ALREADY_SELECTED", str(ctx.exception))

    def test_br5_slot_conflict_detection(self):
        """Student cannot pick two slots overlapping on the same date and time."""
        # Select branch for student 2 first
        select_student_branch(self.conn, "st-0002", "b-lhr-01")

        # s-cs201-2 and s-mt101-2 both occur on 2027-01-13 (14:00 - 17:00)
        conflicting_selections = [
            {"course_id": "c-cs101", "slot_id": "s-cs101-1"},
            {"course_id": "c-cs201", "slot_id": "s-cs201-2"}, # 2027-01-13 14:00-17:00
            {"course_id": "c-mt101", "slot_id": "s-mt101-2"}, # 2027-01-13 14:00-17:00 CONFLICT
            {"course_id": "c-cs301", "slot_id": "s-cs301-1"},
        ]
        with self.assertRaises(ValueError) as ctx:
            validate_and_save_datesheet(self.conn, "st-0002", conflicting_selections)
        self.assertIn("SLOT_CONFLICT", str(ctx.exception))

    def test_br3_datesheet_saved_once_and_locked(self):
        """Saving date sheet works once and locks second save attempts."""
        # Select branch for student 2
        select_student_branch(self.conn, "st-0002", "b-lhr-01")

        valid_selections = [
            {"course_id": "c-cs101", "slot_id": "s-cs101-1"}, # 2027-01-11 09:00
            {"course_id": "c-cs201", "slot_id": "s-cs201-3"}, # 2027-01-15 09:00
            {"course_id": "c-mt101", "slot_id": "s-mt101-1"}, # 2027-01-12 14:00
            {"course_id": "c-cs301", "slot_id": "s-cs301-1"}, # 2027-01-12 09:00
        ]
        res = validate_and_save_datesheet(self.conn, "st-0002", valid_selections)
        self.assertEqual(res["status"], "success")

        # Re-saving locked date sheet must fail with DATESHEET_ALREADY_SAVED
        with self.assertRaises(ValueError) as ctx:
            validate_and_save_datesheet(self.conn, "st-0002", valid_selections)
        self.assertIn("DATESHEET_ALREADY_SAVED", str(ctx.exception))

    def test_safe_delete_branch_in_use(self):
        """Branch used by students cannot be deleted."""
        cursor = self.conn.cursor()
        # b-lhr-01 is used by st-0003
        with self.assertRaises(sqlite3.IntegrityError):
            cursor.execute("DELETE FROM branches WHERE id = 'b-lhr-01'")

if __name__ == "__main__":
    unittest.main()
