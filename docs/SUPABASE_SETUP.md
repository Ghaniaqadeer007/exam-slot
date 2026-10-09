# How to Run ExamSlot Database on Supabase

This guide walks you through deploying and connecting your **ExamSlot** database on **Supabase** (PostgreSQL).

---

## Method 1: Supabase Dashboard SQL Editor (Quickest — 2 Minutes)

This method requires **no CLI or local tools**.

### Step 1: Open your Supabase Dashboard
1. Go to [https://supabase.com](https://supabase.com) and log in.
2. Select your project (or click **New Project** to create a free PostgreSQL database).

### Step 2: Run the Schema Script
1. In your project dashboard, click **SQL Editor** from the left navigation menu.
2. Click **New query**.
3. Open the file [`db/supabase_schema.sql`](../db/supabase_schema.sql) in your code editor.
4. Copy the entire file content, paste it into the Supabase SQL Editor, and click **Run** (or `Ctrl + Enter`).
5. You will see `Success. No rows returned`.

### Step 3: Run the Seed Script
1. Click **New query** again in the SQL Editor.
2. Open the file [`db/supabase_seed.sql`](../db/supabase_seed.sql) in your code editor.
3. Copy the entire file content, paste it into the Supabase SQL Editor, and click **Run**.
4. You will see `Success. No rows returned`.

### Step 4: Verify Your Tables
1. Click **Table Editor** from the left navigation menu.
2. You will see all 10 tables created and populated with demo data:
   - `users` (1 Admin, 5 Students)
   - `branches` (3 Active, 1 Inactive)
   - `courses` (8 Courses)
   - `students` (5 Demo States)
   - `course_assignments`, `exam_slots`, `date_sheet_selections`, `change_requests`, `password_tokens`, `audit_logs`.

---

## Method 2: Connecting via Prisma / Node.js / Python

If you are building your Node.js or Python backend server to connect directly to Supabase:

### Step 1: Get Your Supabase Connection String
1. In your Supabase Dashboard, go to **Project Settings** -> **Database**.
2. Under **Connection string**, select **URI**.
3. Copy the connection string:
   ```text
   postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```
   *(Replace `[YOUR-PASSWORD]` with your database password).*

### Step 2: Update `.env`
In your project `.env` file, update `DATABASE_URL`:
```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

### Step 3: Sync with Prisma (If using Node.js)
```bash
# Push Prisma schema to Supabase
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

---

## Method 3: Using Supabase CLI

If you prefer using the command line:

```bash
# Login to Supabase CLI
npx supabase login

# Link your local project
npx supabase link --project-ref your-project-ref

# Run schema and seed via psql CLI
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" -f db/supabase_schema.sql
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" -f db/supabase_seed.sql
```

---

## Summary of Supabase Credentials & Seed Accounts

| Account Role | Email | Password | Status / Demo Scenario |
|---|---|---|---|
| **Admin** | `admin@examslot.test` | `AdminPassword123!` | Admin panel access & review |
| **Student 1** | `student1@examslot.test` | `StudentPassword123!` | Incomplete assignment (3 courses) |
| **Student 2** | `student2@examslot.test` | `StudentPassword123!` | Complete assignment (4 courses), No branch |
| **Student 3** | `student3@examslot.test` | `StudentPassword123!` | Branch selected (`LHR`), No date sheet |
| **Student 4** | `student4@examslot.test` | `StudentPassword123!` | Date sheet saved (`ISB`) — **Locked** |
| **Student 5** | `student5@examslot.test` | `StudentPassword123!` | Date sheet saved (`KHI`) + Pending Request |
