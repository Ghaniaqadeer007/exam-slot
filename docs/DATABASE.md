# ExamSlot — Database Architecture & Business Rules Guide

This document details the database schema, business rule enforcement strategies, indexing strategy, transaction boundaries, and seed data topology for **ExamSlot**.

---

## 1. Core Database Architecture

ExamSlot uses a strict relational topology designed to support atomicity, row-level locking, and exact business rule compliance across both SQLite (local development/demo) and PostgreSQL/MySQL (production deployment).

### 1.1 Schemas & Migrations

The database artifacts are structured cleanly under `db/`:

- `db/schema.sql` — ANSI-compliant SQL DDL script defining tables, primary keys, foreign keys, check constraints, default values, and unique indexes.
- `db/schema.prisma` — Prisma ORM schema for Node.js / Express backend implementations.
- `db/database.py` — Python database connection wrapper, schema initialization runner, and transaction validation logic.
- `db/models.py` — Python dataclass / ORM data models mapping all 10 schema entities.
- `db/seed.py` — Python seed script populating seed data for all 5 student demo states.
- `db/seed.sql` — Pure ANSI SQL seed script matching the exact seed dataset.
- `db/init_db.py` — Production/demo initialization script that builds and seeds `examslot.db`.

---

## 2. Business Rule Enforcement Matrix

| Rule ID | Business Rule | Enforced At | Implementation Detail |
|---|---|---|---|
| **BR1** | 4 to 6 assigned courses per student | DB & Service | Checked on single assignment add/remove and bulk replace. Attempting to reduce below 4 raises `ASSIGNMENT_LIMIT (409)`. |
| **BR2** | Single-time branch selection | DB & Service | `students.branch_locked` flag set to 1 on select. Second selection calls fail with `BRANCH_ALREADY_SELECTED (409)` unless an approved unconsumed request exists. |
| **BR3** | Single-time date sheet saving | DB & Service | `students.datesheet_status` set to `'SAVED'`. Re-saving fails with `DATESHEET_ALREADY_SAVED (409)` unless unlocked by an approved request. |
| **BR4** | Valid slot selection | Service & FK | FK constraint `date_sheet_selections.slot_id` -> `exam_slots.id`. Slot `course_id` must match target course or raises `SLOT_NOT_FOR_COURSE (422)`. |
| **BR5** | No overlapping exam slots | Service Transaction | Pairwise overlap check for slots on the same date: $\max(S_1, S_2) < \min(E_1, E_2)$. Missing end time defaults to $+3$ hours (Assumption A18). |
| **BR6** | Single-use unlock | DB Transaction | `change_requests.consumed_at` populated upon student saving new branch/date sheet. Subsequent save attempts re-lock. |
| **BR7** | Role-based data visibility | Backend Middleware | Route guards enforce Admin vs Student scope. Student endpoints derive `student_id` strictly from token context. |
| **BR8** | Unique attributes | Database Constraints | `UNIQUE` constraints on `users.email`, `branches.code`, `courses.course_code`, `students.registration_number`, `students.cnic`. |
| **BR9** | Safe delete rule | FK RESTRICT | `branches`, `courses`, and `exam_slots` use `ON DELETE RESTRICT`. Used entities return `IN_USE (409)` and UI offers "Mark Inactive". |
| **BR10** | Single pending request per type | Partial Unique Index | `CREATE UNIQUE INDEX uq_pending_request_per_type ON change_requests(student_id, type) WHERE status = 'PENDING';` |
| **BR11** | Password link TTL (24h) | Service & DB | `password_tokens.expires_at` set to $+24$ hours. Token is hashed (SHA-256) and invalidated after use (`used_at`). |
| **BR12** | Future exam slots only | Service Validation | Slot creation validates `exam_date >= TODAY` and `end_time > start_time`. |

---

## 3. Seed Dataset Overview (PRD Section 15.1)

Running `python db/init_db.py` populates `examslot.db` with the required evaluation dataset:

1. **Admin User**: `admin@examslot.test` / `AdminPassword123!`
2. **4 Branches**:
   - `LHR` — Lahore Campus (Active)
   - `ISB` — Islamabad Campus (Active)
   - `KHI` — Karachi Campus (Active)
   - `FSD` — Faisalabad Campus (Inactive)
3. **8 Courses**: `CS101`, `CS201`, `CS301`, `CS310`, `MT101`, `MT201`, `EN101`, `SE301`
4. **5 Demo Students**:
   - **Student 1** (`student1@examslot.test`): Incomplete assignment (3 courses: `CS101`, `CS201`, `MT101`).
   - **Student 2** (`student2@examslot.test`): Complete assignment (4 courses), no branch selected.
   - **Student 3** (`student3@examslot.test`): Branch chosen (`LHR` Lahore), date sheet not saved.
   - **Student 4** (`student4@examslot.test`): Date sheet saved (`ISB` Islamabad) — **Locked**.
   - **Student 5** (`student5@examslot.test`): Date sheet saved (`KHI` Karachi) with a **PENDING** date sheet change request.
5. **Conflict Testing Slots**: `CS201` (`s-cs201-2`) and `MT101` (`s-mt101-2`) both scheduled on `2027-01-13` at `14:00 - 17:00` to test live conflict rejection.
