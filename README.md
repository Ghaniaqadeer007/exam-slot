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
