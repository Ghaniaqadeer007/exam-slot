# ExamSlot — Entity-Relationship Diagram (ERD)

This document describes the complete relational database model for **ExamSlot**.

---

## 1. Mermaid ERD Diagram

```mermaid
erDiagram
    users ||--o| students : "1-to-1 profile"
    users ||--o{ course_assignments : "assigned_by"
    users ||--o{ change_requests : "decided_by"
    users ||--o{ password_tokens : "user_tokens"
    users ||--o{ audit_logs : "actor"

    branches ||--o{ students : "selected_branch"
    branches ||--o{ date_sheet_selections : "exam_branch"

    courses ||--o{ course_assignments : "enrolled_course"
    courses ||--o{ exam_slots : "scheduled_slots"
    courses ||--o{ date_sheet_selections : "selected_course"

    students ||--o{ course_assignments : "assigned_courses"
    students ||--o{ date_sheet_selections : "saved_selections"
    students ||--o{ change_requests : "submitted_requests"

    exam_slots ||--o{ date_sheet_selections : "chosen_slot"

    users {
        string id PK
        string email UK
        string password_hash
        string role "ADMIN | STUDENT"
        int is_active
        timestamp last_login_at
        timestamp created_at
        timestamp updated_at
    }

    branches {
        string id PK
        string code UK "Stored uppercase"
        string name
        string city
        text address
        string contact_number
        string status "ACTIVE | INACTIVE"
        timestamp created_at
        timestamp updated_at
    }

    courses {
        string id PK
        string course_code UK "Stored uppercase"
        string title
        int credit_hours "1 to 6"
        string department
        string status "ACTIVE | INACTIVE"
        timestamp created_at
        timestamp updated_at
    }

    students {
        string id PK
        string user_id FK,UK
        string full_name
        string phone
        string cnic UK
        date dob
        string gender "MALE | FEMALE | OTHER"
        text address
        string photo_url
        string father_name
        string parent_cnic
        string parent_occupation
        string parent_contact
        string emergency_contact
        string registration_number UK
        string program
        int semester
        string session
        string previous_qualification
        string previous_institute
        real marks_or_cgpa
        string branch_id FK
        int branch_locked
        string datesheet_status "NOT_SAVED | SAVED"
        timestamp datesheet_saved_at
        timestamp created_at
        timestamp updated_at
    }

    course_assignments {
        string id PK
        string student_id FK
        string course_id FK
        string assigned_by FK
        timestamp created_at
    }

    exam_slots {
        string id PK
        string course_id FK
        date exam_date
        string start_time "HH:MM"
        string end_time "HH:MM"
        int capacity
        timestamp created_at
        timestamp updated_at
    }

    date_sheet_selections {
        string id PK
        string student_id FK
        string course_id FK
        string slot_id FK
        string branch_id FK
        timestamp created_at
    }

    change_requests {
        string id PK
        string student_id FK
        string type "CHANGE_BRANCH | CHANGE_DATESHEET"
        text reason
        string status "PENDING | APPROVED | REJECTED"
        text admin_remark
        string decided_by FK
        timestamp decided_at
        timestamp consumed_at
        timestamp created_at
    }

    password_tokens {
        string id PK
        string user_id FK
        string token_hash
        string purpose "SETUP | RESET"
        timestamp expires_at
        timestamp used_at
        timestamp created_at
    }

    audit_logs {
        string id PK
        string actor_id FK
        string action
        string entity
        string entity_id
        text metadata
        timestamp created_at
    }
```

---

## 2. Entity Descriptions & Key Constraints

| Entity | Purpose | Key Constraints |
|---|---|---|
| **users** | System credentials and roles | `email` UNIQUE, `role` IN ('ADMIN', 'STUDENT') |
| **branches** | Exam campuses across cities | `code` UNIQUE (uppercase), `status` IN ('ACTIVE', 'INACTIVE') |
| **courses** | Offered academic courses | `course_code` UNIQUE (uppercase), `credit_hours` between 1 and 6 |
| **students** | Complete 3-group student profile | `user_id` UNIQUE, `registration_number` UNIQUE, `cnic` UNIQUE |
| **course_assignments** | Assigned courses mapping (4–6 per student) | UNIQUE(`student_id`, `course_id`) |
| **exam_slots** | Exam date and time schedules | UNIQUE(`course_id`, `exam_date`, `start_time`) |
| **date_sheet_selections** | Finalized date sheet selections | UNIQUE(`student_id`, `course_id`) |
| **change_requests** | Branch/Date sheet change requests | Partial UNIQUE(`student_id`, `type`) WHERE status = 'PENDING' |
| **password_tokens** | 24-hour single-use setup/reset links | `purpose` IN ('SETUP', 'RESET'), `token_hash` indexed |
| **audit_logs** | Admin action audit logging | FK to `users.id` (ON DELETE SET NULL) |
