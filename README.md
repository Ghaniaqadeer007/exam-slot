<<<<<<< HEAD
ExamSlot — Self-Service Exam Date Sheet System
A multi-branch exam management platform enabling students to autonomously design, validate, and print conflict-free examination schedules, backed by administrative oversight, controlled change workflows, and multi-campus logistics.   
PDF
+ 2

📌 Table of Contents
Project Overview

Key Features & Business Rules

System Architecture & Tech Stack

Database Entity Relationship Diagram (ERD)

Design Assumptions & Safe-Delete Decisions

Local Setup & Installation

Environment Variables

Database Seeding & Demo Credentials

API Endpoints Overview

📖 Project Overview
In a multi-branch virtual university environment, publishing a static, centralized date sheet creates logistical conflicts[cite: 1]. ExamSlot shifts the scheduling model to a self-service system:

University Administrators configure campuses (branches), catalog courses, assign enrollments, and publish available exam time slots[cite: 2, 3, 4].

Students receive secure setup tokens, select their exam branch once, assemble a non-overlapping date sheet across their enrolled courses, and generate official printable exam slips[cite: 3, 5, 6].

Any subsequent modifications to a locked branch or date sheet require formal administrative approval with single-use unlock workflows[cite: 6, 7].

⚙️ Key Features & Business Rules
1. Student Workflow & Constraints
Invitation-Only Password Setup: Student accounts are generated strictly by administrators[cite: 3, 5]. Upon account creation, the student receives an email containing a time-limited (24-hour), single-use token to set their password[cite: 3].

One-Time Branch Selection: Following their initial login, students select their examination branch[cite: 5, 7]. Once committed, this screen is bypassed entirely on subsequent sessions unless formally unlocked[cite: 5, 7].

Enrollment Boundaries: Students are assigned between 4 and 6 courses[cite: 4, 8]. The date sheet selection module remains inaccessible if course assignments are incomplete[cite: 4].

Real-Time Conflict Prevention: A student cannot select two course exams on the same date with overlapping time intervals[cite: 6, 8]. The interface and backend validation prevent saving until all enrolled courses have distinct, conflict-free slots assigned[cite: 6, 8].

Immutable After Save: Saving the date sheet permanently locks the selection and displays an official printable slip[cite: 6, 7].

"Need Help" Request System: Students can file change requests (Branch Change or Date Sheet Change) accompanied by a mandatory reason[cite: 6, 7]. Duplicate pending requests of the same type are barred[cite: 7].

2. Administrative Controls & Rules
Multi-Branch & Course Management: Complete CRUD operations on campus locations and academic subjects[cite: 2, 3].

Course Assignment: Assignment interface enforcing the strict 4-to-6 course boundary with duplicate prevention[cite: 4, 8].

Exam Slot Provisioning: Admins define exam slots per course, with automated validation disallowing past dates and invalid durations (End>Start)[cite: 4].

Change Request Moderation: Review queue to inspect, approve, or reject student change requests with administrative remarks[cite: 4, 5].

Single-Use Unlock Mechanism: Admin approval grants a one-time unlock, allowing the student to revise their selection once before automatically relocking[cite: 7, 8].

Server-Side Pagination & Search: All administrative directory tables implement server-side searching, sorting, and pagination[cite: 5].

🛠️ System Architecture & Tech Stack
Frontend: Next.js / React (App Router), Tailwind CSS (Themed with deep burgundy #4B3238 and slate accents), Lucide Icons.

Backend: Node.js / Express or Next.js API Routes (RESTful design)[cite: 9].

Database & ORM: PostgreSQL / SQLite via Prisma ORM or Drizzle ORM[cite: 9].

Authentication: JWT tokens / HTTP-only secure cookies with bcrypt password hashing[cite: 8].

Email Service: Nodemailer / Resend integration for transactional invites and reset links[cite: 9].

🗄️ Database Entity Relationship Diagram (ERD)
Plaintext
       +------------------+                    +------------------+
       |     BRANCHES     |                    |     COURSES      |
       +------------------+                    +------------------+
       | id (PK)          |<---+          +--->| id (PK)          |
       | name             |    |          |    | course_code (UQ) |
       | code (UQ)        |    |          |    | title            |
       | city             |    |          |    | credit_hours     |
       | address          |    |          |    | department       |
       | contact_number   |    |          |    | status           |
       | status           |    |          |    +--------+---------+
       +------------------+    |          |             |
                               |          |             | 1:N
                               |          |    +--------v---------+
       +------------------+    |          |    |    EXAM_SLOTS    |
       |     STUDENTS     |    |          |    +------------------+
       +------------------+    |          |    | id (PK)          |<---+
       | id (PK)          |    |          |    | course_id (FK)   |    |
       | full_name        |    |          |    | exam_date        |    |
       | email (UQ)       |    |          |    | start_time       |    |
       | password_hash    |    |          |    | end_time         |    |
       | phone            |    |          |    | capacity         |    |
       | cnic_or_bform    |    |          |    +------------------+    |
       | dob              |    |          |                            |
       | gender           |    |          +-----------------+          |
       | address          |    |                            |          |
       | guardian_name    |    |   +-------------------+    |          |
       | guardian_cnic    |    |   | COURSE_ASSIGNMENT |    |          |
       | registration_no  |    |   +-------------------+    |          |
       | program          |    |   | id (PK)           |    |          |
       | semester         |    |   | student_id (FK)   |----+          |
       | branch_id (FK)   |----+   | course_id (FK)    |               |
       | is_branch_locked |        +-------------------+               |
       | is_sheet_locked  |                                            |
       +--------+---------+                                            |
                |                                                      |
                | 1:N                                                  |
       +--------v---------------+              +-----------------------v--+
       |    STUDENT_REQUESTS    |              |   STUDENT_DATE_SHEETS    |
       +------------------------+              +--------------------------+
       | id (PK)                |              | id (PK)                  |
       | student_id (FK)        |              | student_id (FK)          |
       | request_type           |              | course_id (FK)           |
       | reason                 |              | exam_slot_id (FK)--------+
       | status                 |              +--------------------------+
       | admin_remark           |
       | unlocked_used          |
       +------------------------+
🧠 Design Assumptions & Safe-Delete Decisions
Safe-Delete Strategy for Branches & Exam Slots:

Rule Applied: Soft-Delete & Referential Restriction[cite: 3, 4].

Reasoning: A campus branch or an exam slot cannot be permanently purged (HARD DELETE) if student records or generated date sheets reference them[cite: 3, 4]. Deleting an active branch with enrolled students would break data provenance on printed date sheets[cite: 6]. The system flags deleted branches as status: 'inactive' (omitting them from new student dropdowns while keeping historical records intact)[cite: 2, 3]. Exam slots selected by any student cannot be dropped unless all affected students have their date sheets unlocked[cite: 4].

Password Token Lifecycle:

Password tokens are generated as 256-bit cryptographically secure strings stored as SHA-256 hashes with an expiration time of 24 hours[cite: 3]. Once utilized, the token record is marked with a non-null used_at timestamp to guarantee single-use enforcement[cite: 3].

Course Assignment Boundaries (4 to 6 Courses):

Enforced at the database transaction layer[cite: 4, 8]. Course assignment modifications by administrators are disallowed once a student's date sheet is saved, unless a date sheet change request is approved[cite: 4, 7].

Schedule Conflict Criteria:

An overlap occurs when:

Date 
A
​
 =Date 
B
​
 ∧(Start 
A
​
 <End 
B
​
 )∧(End 
A
​
 >Start 
B
​
 )
Both frontend UI guards and backend SQL validations reject any payload containing overlapping intervals[cite: 6, 8].

🚀 Local Setup & Installation
Prerequisites
Node.js (v18.x or later)

npm or pnpm

PostgreSQL (or SQLite for local mock testing)

Installation Steps
Clone the repository:

Bash
git clone https://github.com/your-team/examslot.git
cd examslot
Install project dependencies:

Bash
npm install
Configure Environment Variables:
Copy the example .env file and supply your configuration:

Bash
cp .env.example .env
Initialize Database & Migrations:

Bash
npx prisma migrate dev --name init
Run Seed Script:
Populate the database with minimum hackathon data (1 admin, 3 branches, 8 courses, 5 students, and slots):   
PDF

Bash
npm run db:seed
Start Local Development Server:

Bash
npm run dev
Open http://localhost:3000 in your browser.

🔐 Environment Variables
Create a .env file in the project root with the following parameters:

Code snippet
# Application
PORT=3000
NODE_ENV=development
APP_URL=http://localhost:3000

# Database Connection
DATABASE_URL="postgresql://postgres:password@localhost:5432/examslot_db?schema=public"

# Authentication & Tokens
JWT_SECRET="super-secret-jwt-token-key-32-chars-min"
INVITE_TOKEN_EXPIRY_HOURS=24

# SMTP / Email Configuration (Mailtrap, SendGrid, or Gmail App Password)
SMTP_HOST="sandbox.smtp.mailtrap.io"
SMTP_PORT=2525
SMTP_USER="your_smtp_username"
SMTP_PASS="your_smtp_password"
SMTP_FROM="ExamSlot Admin <no-reply@examslot.edu>"
👥 Database Seeding & Demo Credentials
The database seed populates complete test records ready for immediate evaluation.   
PDF

Administrative Demo Account
URL: http://localhost:3000/login[cite: 5]

Email: admin@examslot.edu

   
PDF

Password: AdminPass2026!

   
PDF

Role: Global Administrator[cite: 2]

Student Demo Account (Onboarding Ready)
Email: aisha.khan@student.edu

   
PDF

Password: StudentPass2026!

   
PDF

Registration No: 2026-CS-0101[cite: 3]

Status: Assigned 5 courses, ready for branch & slot design[cite: 4, 5, 6].

(Note: Additional pre-seeded student accounts are documented inside prisma/seed.ts).

📡 API Endpoints Overview
Public & Authentication
POST /api/auth/login — Authenticate user and issue JWT cookie[cite: 5, 8].

POST /api/auth/set-password — Set password via token link sent by admin[cite: 3].

POST /api/auth/forgot-password — Dispatch password reset link[cite: 5].

Student Operations
GET /api/student/profile — Fetch read-only personal, guardian, and academic info[cite: 3, 6].

POST /api/student/branch — Select exam branch (enforces one-time constraint)[cite: 5, 8].

GET /api/student/assigned-courses — Fetch enrolled courses and available slots[cite: 4, 6].

POST /api/student/datesheet — Commit selected exam slots (checks overlaps and locks)[cite: 6, 8].

GET /api/student/requests — View history and status of submitted requests[cite: 5, 7].

POST /api/student/requests — Submit branch or date sheet change request[cite: 6, 7].

Admin Management (Server Paginated)
GET /api/admin/branches — List branches with page, limit, and search query params[cite: 5].

POST /api/admin/branches — Create a new campus branch[cite: 2].

PATCH /api/admin/branches/:id — Update or soft-delete branch records[cite: 2, 3].

GET /api/admin/courses — Paginated list of courses[cite: 3, 5].

POST /api/admin/students — Register student (dispatches setup email link)[cite: 3].

POST /api/admin/assignments — Assign 4 to 6 courses to a student[cite: 4, 8].

POST /api/admin/exam-slots — Publish date and time slots for courses[cite: 4].

PATCH /api/admin/requests/:id — Approve or reject requests with admin remarks[cite: 4, 5].
=======
# ExamSlot &bull; Self-Service Exam Date Sheet System
**Platform:** Virtual University of Pakistan &bull; Loopverse 3.0 Hackathon (Web Dev Onsite)  
**Live Application URL:** [http://localhost:5000](http://localhost:5000)

---

## 1. System Overview

ExamSlot is a full-stack web application designed for a multi-branch Virtual University where students sit examinations in person. Instead of publishing a rigid, fixed date sheet, ExamSlot enables students to self-serve: they choose their permanent examination branch and pick personalized, conflict-free exam date and time slots from administrative offerings.

The system features two interconnected portals:
* **Admin Panel:** Full CRUD for Branches, Courses, 3-Group Students, Course Assignments (enforcing the 4–6 rule), Exam Schedule Slots, and Student Petitions with a single-use unlock engine. Every list features server-side search and pagination.
* **Student Panel:** Single-use 24-hour onboarding/reset email links, one-time branch selection, read-only profile, assigned course slot selection with real-time conflict prevention, printable roll number slip (PDF), and a throttled "Need Help" change request workflow.

---

## 2. Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    USERS ||--o| STUDENTS : "1 to 1"
    USERS ||--o{ PASSWORD_TOKENS : "has reset tokens"
    BRANCHES ||--o{ STUDENTS : "exam center"
    STUDENTS ||--o{ COURSE_ASSIGNMENTS : "enrolled in (4-6)"
    COURSES ||--o{ COURSE_ASSIGNMENTS : "assigned to"
    COURSES ||--o{ EXAM_SLOTS : "schedules"
    STUDENTS ||--o{ DATE_SHEET_SELECTIONS : "picks"
    EXAM_SLOTS ||--o{ DATE_SHEET_SELECTIONS : "chosen by"
    STUDENTS ||--o{ CHANGE_REQUESTS : "submits"
    BRANCHES ||--o{ CHANGE_REQUESTS : "target branch"

    USERS {
        string id PK
        string email UK
        string vu_id UK
        string password_hash
        string role "admin | student"
        datetime created_at
    }

    BRANCHES {
        string id PK
        string code UK
        string name
        string city
        string address
        string contact_number
        string status "active | inactive"
        int capacity
    }

    STUDENTS {
        string id PK
        string user_id FK
        string registration_number UK
        string full_name
        string email UK
        string phone
        string cnic UK
        date dob
        string gender
        string address
        string father_name
        string parent_cnic
        string parent_occupation
        string parent_contact
        string emergency_contact
        string program
        int semester
        string session
        string marks_or_cgpa
        string branch_id FK
        bool branch_locked
        string datesheet_status "not_saved | saved"
        int branch_change_unlocked
        int datesheet_change_unlocked
    }

    COURSES {
        string id PK
        string course_code UK
        string title
        int credit_hours
        string department
        string status "active | inactive"
    }

    COURSE_ASSIGNMENTS {
        string id PK
        string student_id FK
        string course_id FK
    }

    EXAM_SLOTS {
        string id PK
        string course_id FK
        date exam_date
        string day_name
        time start_time
        time end_time
        int capacity
        int booked_count
    }

    DATE_SHEET_SELECTIONS {
        string id PK
        string student_id FK
        string course_id FK
        string slot_id FK
    }

    CHANGE_REQUESTS {
        string id PK
        string student_id FK
        string type "change_branch | change_datesheet"
        string reason
        string status "pending | approved | rejected"
        string admin_remark
        datetime consumed_at
    }
```

---

## 3. Seed Credentials (PRD Section 15.1)

| Role | Username / Email | Password | Demo State Description |
| :--- | :--- | :--- | :--- |
| **👑 Admin** | `admin@examslot.test` | `admin123` | Full CRUD, safe-delete controls, request reviews |
| **Student 1** | `std1@examslot.test` | `student123` | **Incomplete Assignment (3 courses):** Blocks branch selection & slot picker |
| **Student 2** | `std2@examslot.test` | `student123` | **Complete (4 courses), Branch Pending:** One-time branch selection test |
| **Student 3** | `std3@examslot.test` | `student123` | **Branch Chosen, Datesheet Pending:** Slot picker & conflict check demo |
| **Student 4** | `std4@examslot.test` | `student123` | **Locked Date Sheet:** Finalized schedule & high-res print slip |
| **Student 5** | `std5@examslot.test` | `student123` | **Locked with Pending Petition:** Demonstrates request review & unlock engine |

*(Quick 1-click test buttons for all 6 demo accounts are built directly into the login gateway card).*

---

## 4. Assumptions (PRD Section 17)

| ID | Assumption |
| :--- | :--- |
| **[A1]** | A single administrative role; no hierarchical sub-roles. |
| **[A2]** | Student next-page state order: `assignment complete` $\to$ `branch chosen` $\to$ `date sheet saved`. |
| **[A3]** | Access token lifetime 60 minutes; session token cached on client. |
| **[A4]** | **Safe-delete rule:** Branches chosen by students cannot be hard-deleted (`409 Conflict`); they are marked inactive instead so saved date sheets keep showing the branch. |
| **[A5]** | Courses with assignments or slots cannot be hard-deleted; mark inactive. |
| **[A6]** | Resending a setup email invalidates earlier tokens. |
| **[A7]** | Deleting a student cascades to their assignments, selections, and requests after explicit confirmation. |
| **[A8]** | Phone, CNIC, and CGPA formats follow Pakistani conventions (`03XX-XXXXXXX`, 13-digit CNIC, 4.00 CGPA scale). |
| **[A9]** | After a date sheet is saved, assignment changes are blocked unless a date sheet change request is approved. |
| **[A10]** | Chosen slots cannot be deleted or have date/time edited (`409 Conflict`). |
| **[A11]** | Time zone is `Asia/Karachi` (UTC+5); stored in UTC. |
| **[A12]** | Password policy: 8+ characters, includes at least one letter and one number. |
| **[A13]** | Slot picker displays date and time together per course. |
| **[A14]** | Draft picks live in the client until Save. |
| **[A15]** | A student can have one pending request of each type at the same time. |
| **[A16]** | A request can only be raised when the thing it unlocks is currently locked. |
| **[A17]** | Approved branch change clears saved date sheet selections (slots may not match the new branch); date sheet re-selection unlocks automatically. |
| **[A18]** | If a slot has no end time, treat it as 3 hours long for overlap conflict checks. |

---

## 5. Five-Minute Demo Script (PRD Section 16)

1. **(0:00 - 0:45) Admin Panel & Safe Delete:**
   * Log in as `admin@examslot.test`.
   * Open **Branches** tab: search and server-side pagination. Click **Delete** on Lahore campus $\to$ see safe-delete block (`409 Conflict` with student count).
2. **(0:45 - 1:30) Student Creation & Setup Email Link:**
   * Open **Students** tab $\to$ click **Add Student**. Fill Personal, Parent, and Academic groups.
   * On submission, view the single-use 24-hour setup link modal.
3. **(1:30 - 2:00) 4–6 Course Assignment Rule:**
   * Open **Course Assignments** tab $\to$ notice Student 1 has 3 courses ("Assignment Incomplete").
   * Try assigning 3 courses or 7 courses $\to$ server strictly rejects with `409 ASSIGNMENT_LIMIT`.
4. **(2:00 - 2:30) Exam Slots & Protection:**
   * Open **Exam Slots** tab: create slot with past date $\to$ rejected. Delete slot chosen by Student 4 $\to$ rejected (`409 IN_USE`).
5. **(2:30 - 3:00) Student Branch Selection (One-Time Only):**
   * Log in as Student 2 (`std2@examslot.test`).
   * Select Karachi branch $\to$ confirm. Log out and log back in $\to$ branch selection page is skipped permanently.
6. **(3:00 - 3:45) Slot Picker, Conflict Rule & Print Slip:**
   * Log in as Student 3 (`std3@examslot.test`).
   * Pick conflicting slots on Oct 24 at 09:00 AM $\to$ real-time conflict alert banner appears and Save is blocked.
   * Pick valid non-conflicting slots $\to$ click **Save & Generate Date Sheet** $\to$ view formal Examination Roll Number Slip and click **Print Date Sheet**.
7. **(3:45 - 4:30) Need Help & One-Time Unlock Engine:**
   * Log in as Student 5 (`std5@examslot.test`) $\to$ view pending petition. Try submitting duplicate request $\to$ rejected (`409 REQUEST_ALREADY_PENDING`).
   * Switch to Admin $\to$ **Petitions** tab $\to$ click **Approve** with remarks.
   * Switch back to Student 5 $\to$ date sheet is unlocked **one time only** with a green notification banner.
8. **(4:30 - 5:00) Mobile 360px Walkthrough:**
   * Resize viewport to 360 px width $\to$ tables collapse into responsive cards with zero horizontal page scroll.

---

## 6. How to Run Locally

1. **Quick Launch:** Double-click [`start.bat`](file:///c:/Users/hp/Desktop/hackatation/start.bat) in the root directory.
2. **Command Line:**
   ```powershell
   node server/index.js
   ```
3. Open **`http://localhost:5000`** in any browser.
>>>>>>> 330756f (Initial commit: ExamSlot platform with authentication, full database persistence, and React portal UI)
