"""
Database Setup & Seed Execution Script
Run this script to initialize the SQLite database and populate seed data.
"""

import os
import sys
from seed import seed_database

if __name__ == "__main__":
    db_file = os.path.join(os.path.dirname(__file__), "examslot.db")
    print(f"Initializing ExamSlot Database at: {db_file}")
    seed_database(db_file)
    print("\nDatabase initialization complete! Database ready for production/demo use.")
