import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'database.json');

// --- Helper: SHA-256 for Token Hashing ---
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// --- Initial Seed Data matching Loopverse PRD Section 15.1 ---
const defaultData = {
  users: [
    {
      id: 'usr_admin',
      email: 'admin@examslot.test',
      vu_id: 'admin@examslot.test',
      password: 'admin123',
      role: 'admin',
      created_at: '2026-09-01T08:00:00Z'
    },
    {
      id: 'usr_admin_vu',
      email: 'admin@vu.edu.pk',
      vu_id: 'admin@vu.edu.pk',
      password: 'admin123',
      role: 'admin',
      created_at: '2026-09-01T08:00:00Z'
    },
    // Student 1: Incomplete assignment (3 courses)
    {
      id: 'usr_std_1',
      email: 'std1@examslot.test',
      vu_id: 'BC220201001',
      password: 'student123',
      role: 'student',
      created_at: '2026-09-01T08:00:00Z'
    },
    // Student 2: Complete assignment, branch pending
    {
      id: 'usr_std_2',
      email: 'std2@examslot.test',
      vu_id: 'BC220201002',
      password: 'student123',
      role: 'student',
      created_at: '2026-09-01T08:00:00Z'
    },
    // Student 3: Branch chosen, date sheet not saved
    {
      id: 'usr_std_3',
      email: 'std3@examslot.test',
      vu_id: 'BC220201003',
      password: 'student123',
      role: 'student',
      created_at: '2026-09-01T08:00:00Z'
    },
    // Student 4: Date sheet saved (locked)
    {
      id: 'usr_std_4',
      email: 'std4@examslot.test',
      vu_id: 'BC220201004',
      password: 'student123',
      role: 'student',
      created_at: '2026-09-01T08:00:00Z'
    },
    // Student 5: Date sheet saved with pending change request
    {
      id: 'usr_std_5',
      email: 'std5@examslot.test',
      vu_id: 'BC220201005',
      password: 'student123',
      role: 'student',
      created_at: '2026-09-01T08:00:00Z'
    }
  ],

  // 4 Branches (3 Active, 1 Inactive to demo status filter)
  branches: [
    {
      id: 'br_lhr',
      code: 'LHR',
      name: 'Lahore - M.A Jinnah Main Campus',
      city: 'Lahore',
      address: 'Defence Road, Off Raiwind Road, Lahore',
      contact_number: '042-111-880-880',
      status: 'active',
      capacity: 800,
      created_at: '2026-09-01T08:00:00Z'
    },
    {
      id: 'br_isb',
      code: 'ISB',
      name: 'Islamabad - Regional Campus',
      city: 'Islamabad',
      address: 'Plot # 12, Sector F-8/1, Islamabad',
      contact_number: '051-9258481',
      status: 'active',
      capacity: 650,
      created_at: '2026-09-01T08:00:00Z'
    },
    {
      id: 'br_khi',
      code: 'KHI',
      name: 'Karachi - Clifton Center',
      city: 'Karachi',
      address: 'Block 5, Clifton, Karachi',
      contact_number: '021-35874211',
      status: 'active',
      capacity: 700,
      created_at: '2026-09-01T08:00:00Z'
    },
    {
      id: 'br_pew',
      code: 'PEW',
      name: 'Peshawar - University Town Campus (Renovating)',
      city: 'Peshawar',
      address: 'Jamrud Road, University Town, Peshawar',
      contact_number: '091-5842100',
      status: 'inactive', // Inactive: should not appear in student branch selection
      capacity: 400,
      created_at: '2026-09-01T08:00:00Z'
    }
  ],

  // 8 Courses (per PRD section 15.1)
  courses: [
    {
      id: 'crs_cs101',
      course_code: 'CS101',
      title: 'Programming Fundamentals',
      credit_hours: 3,
      department: 'Computer Science',
      status: 'active',
      created_at: '2026-09-01T08:00:00Z'
    },
    {
      id: 'crs_cs201',
      course_code: 'CS201',
      title: 'Data Structures',
      credit_hours: 3,
      department: 'Computer Science',
      status: 'active',
      created_at: '2026-09-01T08:00:00Z'
    },
    {
      id: 'crs_cs301',
      course_code: 'CS301',
      title: 'Database Systems',
      credit_hours: 3,
      department: 'Computer Science',
      status: 'active',
      created_at: '2026-09-01T08:00:00Z'
    },
    {
      id: 'crs_cs310',
      course_code: 'CS310',
      title: 'Computer Networks',
      credit_hours: 3,
      department: 'Computer Science',
      status: 'active',
      created_at: '2026-09-01T08:00:00Z'
    },
    {
      id: 'crs_mt101',
      course_code: 'MT101',
      title: 'Calculus & Analytical Geometry',
      credit_hours: 3,
      department: 'Mathematics',
      status: 'active',
      created_at: '2026-09-01T08:00:00Z'
    },
    {
      id: 'crs_mt201',
      course_code: 'MT201',
      title: 'Linear Algebra',
      credit_hours: 3,
      department: 'Mathematics',
      status: 'active',
      created_at: '2026-09-01T08:00:00Z'
    },
    {
      id: 'crs_en101',
      course_code: 'EN101',
      title: 'English Composition',
      credit_hours: 3,
      department: 'Humanities',
      status: 'active',
      created_at: '2026-09-01T08:00:00Z'
    },
    {
      id: 'crs_se301',
      course_code: 'SE301',
      title: 'Software Engineering Principles',
      credit_hours: 3,
      department: 'Computer Science',
      status: 'active',
      created_at: '2026-09-01T08:00:00Z'
    }
  ],

  // 5 Students covering all Demo States (Section 15.1)
  students: [
    // 1. Incomplete assignment (3 courses assigned)
    {
      id: 'std_1',
      user_id: 'usr_std_1',
      registration_number: 'BC220201001',
      full_name: 'Zainab Fatima',
      email: 'std1@examslot.test',
      phone: '0300-1234567',
      cnic: '35201-1234567-1',
      dob: '2003-05-14',
      gender: 'Female',
      address: 'House 14, Street 2, Model Town, Lahore',
      father_name: 'Muhammad Tariq',
      parent_cnic: '35201-7654321-1',
      parent_occupation: 'Civil Engineer',
      parent_contact: '0321-7654321',
      emergency_contact: '0300-9998877',
      program: 'BS Computer Science',
      semester: 3,
      session: 'Fall 2024',
      previous_qualification: 'F.Sc Pre-Engineering',
      previous_institute: 'Punjab Group of Colleges',
      marks_or_cgpa: '3.65',
      branch_id: null,
      branch_locked: false,
      datesheet_status: 'not_saved',
      datesheet_saved_at: null,
      branch_change_unlocked: 0,
      datesheet_change_unlocked: 0,
      created_at: '2026-09-01T08:00:00Z'
    },

    // 2. Complete assignment (4 courses), no branch chosen yet
    {
      id: 'std_2',
      user_id: 'usr_std_2',
      registration_number: 'BC220201002',
      full_name: 'Bilal Ahmed',
      email: 'std2@examslot.test',
      phone: '0312-3456789',
      cnic: '35202-2345678-2',
      dob: '2002-11-20',
      gender: 'Male',
      address: 'Flat 4B, Gulshan-e-Iqbal, Karachi',
      father_name: 'Ahmed Saeed',
      parent_cnic: '35202-8765432-2',
      parent_occupation: 'Businessman',
      parent_contact: '0333-8765432',
      emergency_contact: '0312-1122334',
      program: 'BS Software Engineering',
      semester: 4,
      session: 'Spring 2024',
      previous_qualification: 'A-Levels',
      previous_institute: 'Karachi Grammar School',
      marks_or_cgpa: '3.40',
      branch_id: null,
      branch_locked: false,
      datesheet_status: 'not_saved',
      datesheet_saved_at: null,
      branch_change_unlocked: 0,
      datesheet_change_unlocked: 0,
      created_at: '2026-09-01T08:00:00Z'
    },

    // 3. Branch chosen, date sheet not saved
    {
      id: 'std_3',
      user_id: 'usr_std_3',
      registration_number: 'BC220201003',
      full_name: 'Hamza Malik',
      email: 'std3@examslot.test',
      phone: '0345-5678901',
      cnic: '61101-3456789-3',
      dob: '2003-02-18',
      gender: 'Male',
      address: 'House 88, Street 15, Sector G-10/2, Islamabad',
      father_name: 'Malik Jahangir',
      parent_cnic: '61101-9876543-3',
      parent_occupation: 'Government Officer',
      parent_contact: '0301-9876543',
      emergency_contact: '0345-3344556',
      program: 'BS Computer Science',
      semester: 4,
      session: 'Spring 2024',
      previous_qualification: 'ICS',
      previous_institute: 'Islamabad College for Boys',
      marks_or_cgpa: '3.78',
      branch_id: 'br_isb',
      branch_locked: true,
      datesheet_status: 'not_saved',
      datesheet_saved_at: null,
      branch_change_unlocked: 0,
      datesheet_change_unlocked: 0,
      created_at: '2026-09-01T08:00:00Z'
    },

    // 4. Date sheet saved (locked)
    {
      id: 'std_4',
      user_id: 'usr_std_4',
      registration_number: 'BC220201004',
      full_name: 'Amina Sheikh',
      email: 'std4@examslot.test',
      phone: '0322-4567890',
      cnic: '35201-4567890-4',
      dob: '2004-08-09',
      gender: 'Female',
      address: '22-B, DHA Phase 5, Lahore',
      father_name: 'Sheikh Naeem',
      parent_cnic: '35201-6543210-4',
      parent_occupation: 'Chartered Accountant',
      parent_contact: '0300-6543210',
      emergency_contact: '0322-7788990',
      program: 'BS Computer Science',
      semester: 5,
      session: 'Fall 2023',
      previous_qualification: 'F.Sc Pre-Engineering',
      previous_institute: 'Kinnaird College',
      marks_or_cgpa: '3.92',
      branch_id: 'br_lhr',
      branch_locked: true,
      datesheet_status: 'saved',
      datesheet_saved_at: '2026-10-08T11:00:00Z',
      branch_change_unlocked: 0,
      datesheet_change_unlocked: 0,
      created_at: '2026-09-01T08:00:00Z'
    },

    // 5. Date sheet saved with a pending change request
    {
      id: 'std_5',
      user_id: 'usr_std_5',
      registration_number: 'BC220201005',
      full_name: 'Usman Farooq',
      email: 'std5@examslot.test',
      phone: '0304-6789012',
      cnic: '42101-5678901-5',
      dob: '2003-10-25',
      gender: 'Male',
      address: 'A-12, North Nazimabad, Karachi',
      father_name: 'Farooq Azam',
      parent_cnic: '42101-5432109-5',
      parent_occupation: 'Banker',
      parent_contact: '0315-5432109',
      emergency_contact: '0304-4455667',
      program: 'BS Software Engineering',
      semester: 5,
      session: 'Fall 2023',
      previous_qualification: 'F.Sc Pre-Engineering',
      previous_institute: 'Adamjee Science College',
      marks_or_cgpa: '3.50',
      branch_id: 'br_khi',
      branch_locked: true,
      datesheet_status: 'saved',
      datesheet_saved_at: '2026-10-07T16:20:00Z',
      branch_change_unlocked: 0,
      datesheet_change_unlocked: 0,
      created_at: '2026-09-01T08:00:00Z'
    }
  ],

  // Course Assignments (enforcing the 4-6 rule)
  course_assignments: [
    // Student 1: only 3 courses (INCOMPLETE, < 4)
    { id: 'as_1', student_id: 'std_1', course_id: 'crs_cs101' },
    { id: 'as_2', student_id: 'std_1', course_id: 'crs_cs201' },
    { id: 'as_3', student_id: 'std_1', course_id: 'crs_mt101' },

    // Student 2: 4 courses (COMPLETE)
    { id: 'as_4', student_id: 'std_2', course_id: 'crs_cs101' },
    { id: 'as_5', student_id: 'std_2', course_id: 'crs_cs201' },
    { id: 'as_6', student_id: 'std_2', course_id: 'crs_mt101' },
    { id: 'as_7', student_id: 'std_2', course_id: 'crs_en101' },

    // Student 3: 4 courses (COMPLETE)
    { id: 'as_8', student_id: 'std_3', course_id: 'crs_cs101' },
    { id: 'as_9', student_id: 'std_3', course_id: 'crs_cs201' },
    { id: 'as_10', student_id: 'std_3', course_id: 'crs_cs301' },
    { id: 'as_11', student_id: 'std_3', course_id: 'crs_mt101' },

    // Student 4: 5 courses (COMPLETE)
    { id: 'as_12', student_id: 'std_4', course_id: 'crs_cs101' },
    { id: 'as_13', student_id: 'std_4', course_id: 'crs_cs201' },
    { id: 'as_14', student_id: 'std_4', course_id: 'crs_cs301' },
    { id: 'as_15', student_id: 'std_4', course_id: 'crs_cs310' },
    { id: 'as_16', student_id: 'std_4', course_id: 'crs_mt101' },

    // Student 5: 4 courses (COMPLETE)
    { id: 'as_17', student_id: 'std_5', course_id: 'crs_cs101' },
    { id: 'as_18', student_id: 'std_5', course_id: 'crs_cs201' },
    { id: 'as_19', student_id: 'std_5', course_id: 'crs_cs301' },
    { id: 'as_20', student_id: 'std_5', course_id: 'crs_se301' }
  ],

  // Exam Slots (Multiple slots per course for real student choice + intentional conflict pair)
  exam_slots: [
    // CS101 Slots
    {
      id: 's_cs101_1',
      course_id: 'crs_cs101',
      exam_date: '2026-10-24',
      day_name: 'Saturday',
      start_time: '09:00',
      end_time: '12:00',
      capacity: 60,
      booked_count: 2
    },
    {
      id: 's_cs101_2',
      course_id: 'crs_cs101',
      exam_date: '2026-10-25',
      day_name: 'Sunday',
      start_time: '14:00',
      end_time: '17:00',
      capacity: 60,
      booked_count: 0
    },

    // CS201 Slots
    {
      id: 's_cs201_1',
      course_id: 'crs_cs201',
      exam_date: '2026-10-26',
      day_name: 'Monday',
      start_time: '09:00',
      end_time: '12:00',
      capacity: 60,
      booked_count: 2
    },
    {
      id: 's_cs201_2',
      course_id: 'crs_cs201',
      exam_date: '2026-10-27',
      day_name: 'Tuesday',
      start_time: '14:00',
      end_time: '17:00',
      capacity: 60,
      booked_count: 0
    },

    // CS301 Slots
    {
      id: 's_cs301_1',
      course_id: 'crs_cs301',
      exam_date: '2026-10-28',
      day_name: 'Wednesday',
      start_time: '09:00',
      end_time: '12:00',
      capacity: 60,
      booked_count: 2
    },
    {
      id: 's_cs301_2',
      course_id: 'crs_cs301',
      exam_date: '2026-10-28',
      day_name: 'Wednesday',
      start_time: '14:00',
      end_time: '17:00',
      capacity: 60,
      booked_count: 0
    },

    // CS310 Slots
    {
      id: 's_cs310_1',
      course_id: 'crs_cs310',
      exam_date: '2026-10-30',
      day_name: 'Friday',
      start_time: '09:00',
      end_time: '12:00',
      capacity: 60,
      booked_count: 1
    },

    // MT101 Slots (Note: s_mt101_3 deliberately conflicts with s_cs101_1 on Oct 24 09:00 for demo!)
    {
      id: 's_mt101_1',
      course_id: 'crs_mt101',
      exam_date: '2026-11-02',
      day_name: 'Monday',
      start_time: '09:00',
      end_time: '12:00',
      capacity: 60,
      booked_count: 1
    },
    {
      id: 's_mt101_2',
      course_id: 'crs_mt101',
      exam_date: '2026-11-03',
      day_name: 'Tuesday',
      start_time: '14:00',
      end_time: '17:00',
      capacity: 60,
      booked_count: 0
    },
    {
      id: 's_mt101_3',
      course_id: 'crs_mt101',
      exam_date: '2026-10-24', // Deliberate conflict with CS101 Slot 1
      day_name: 'Saturday',
      start_time: '09:00',
      end_time: '12:00',
      capacity: 60,
      booked_count: 0
    },

    // MT201 Slots
    {
      id: 's_mt201_1',
      course_id: 'crs_mt201',
      exam_date: '2026-11-04',
      day_name: 'Wednesday',
      start_time: '09:00',
      end_time: '12:00',
      capacity: 60,
      booked_count: 0
    },

    // EN101 Slots
    {
      id: 's_en101_1',
      course_id: 'crs_en101',
      exam_date: '2026-11-05',
      day_name: 'Thursday',
      start_time: '09:00',
      end_time: '12:00',
      capacity: 60,
      booked_count: 0
    },

    // SE301 Slots
    {
      id: 's_se301_1',
      course_id: 'crs_se301',
      exam_date: '2026-11-06',
      day_name: 'Friday',
      start_time: '09:00',
      end_time: '12:00',
      capacity: 60,
      booked_count: 1
    }
  ],

  // Date Sheet Selections (Pre-saved for Student 4 and Student 5)
  date_sheet_selections: [
    // Student 4's saved date sheet
    { id: 'dss_4_1', student_id: 'std_4', course_id: 'crs_cs101', slot_id: 's_cs101_1' },
    { id: 'dss_4_2', student_id: 'std_4', course_id: 'crs_cs201', slot_id: 's_cs201_1' },
    { id: 'dss_4_3', student_id: 'std_4', course_id: 'crs_cs301', slot_id: 's_cs301_1' },
    { id: 'dss_4_4', student_id: 'std_4', course_id: 'crs_cs310', slot_id: 's_cs310_1' },
    { id: 'dss_4_5', student_id: 'std_4', course_id: 'crs_mt101', slot_id: 's_mt101_1' },

    // Student 5's saved date sheet
    { id: 'dss_5_1', student_id: 'std_5', course_id: 'crs_cs101', slot_id: 's_cs101_1' },
    { id: 'dss_5_2', student_id: 'std_5', course_id: 'crs_cs201', slot_id: 's_cs201_1' },
    { id: 'dss_5_3', student_id: 'std_5', course_id: 'crs_cs301', slot_id: 's_cs301_1' },
    { id: 'dss_5_4', student_id: 'std_5', course_id: 'crs_se301', slot_id: 's_se301_1' }
  ],

  // Change Requests (Student 5 has a pending request for Demo)
  change_requests: [
    {
      id: 'req_demo_5',
      student_id: 'std_5',
      type: 'change_datesheet',
      reason: 'Have a medical surgery appointment on Oct 24, need to re-pick afternoon slot for CS101.',
      status: 'pending',
      admin_remark: null,
      decided_by: null,
      decided_at: null,
      consumed_at: null,
      created_at: '2026-10-08T14:30:00Z'
    }
  ],

  // Single-use 24-hour setup tokens
  password_tokens: [],

  // Outgoing emails log (Mailtrap / Console log fallback per Section 11.4)
  email_logs: []
};

class Database {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(content);
      }
    } catch (e) {
      console.error('Error reading db file, falling back to seed data:', e);
    }
    this.save(defaultData);
    return JSON.parse(JSON.stringify(defaultData));
  }

  save(dataToSave = this.data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
    try {
      const syncScript = path.join(__dirname, '../db/json_to_sqlite.py');
      execSync(`python "${syncScript}"`, { stdio: 'ignore' });
    } catch (e) {
      console.error('SQLite sync warning:', e.message);
    }
  }

  // --- Helper: Standard Server-Side Pagination & Search ---
  paginate(list, page = 1, pageSize = 10) {
    const p = Math.max(1, parseInt(page) || 1);
    const size = Math.min(100, Math.max(1, parseInt(pageSize) || 10));
    const total = list.length;
    const totalPages = Math.ceil(total / size) || 1;
    const offset = (p - 1) * size;
    const data = list.slice(offset, offset + size);

    return {
      data,
      meta: {
        page: p,
        pageSize: size,
        total,
        totalPages
      }
    };
  }

  // --- Helper: Derive Student State Machine (PRD Section 4.1) ---
  deriveStudentState(student) {
    const assignments = this.data.course_assignments.filter(ca => ca.student_id === student.id);
    if (assignments.length < 4) {
      return 'ASSIGNMENT_INCOMPLETE';
    }
    if (!student.branch_id || student.branch_change_unlocked === 1) {
      return 'BRANCH_PENDING';
    }
    if (student.datesheet_status !== 'saved' || student.datesheet_change_unlocked === 1) {
      return 'DATESHEET_PENDING';
    }
    return 'LOCKED';
  }

  // Populate Student Object with relations
  populateStudent(student) {
    const branch = student.branch_id ? this.data.branches.find(b => b.id === student.branch_id) : null;
    const assignments = this.data.course_assignments.filter(ca => ca.student_id === student.id);
    const assignedCourseIds = assignments.map(ca => ca.course_id);

    const courses = this.data.courses
      .filter(c => assignedCourseIds.includes(c.id))
      .map(c => {
        const slots = this.data.exam_slots.filter(s => s.course_id === c.id);
        const sel = this.data.date_sheet_selections.find(ds => ds.student_id === student.id && ds.course_id === c.id);
        const selectedSlot = sel ? this.data.exam_slots.find(s => s.id === sel.slot_id) : null;
        return {
          ...c,
          slots,
          selectedSlot
        };
      });

    const selections = this.data.date_sheet_selections
      .filter(ds => ds.student_id === student.id)
      .map(ds => {
        const course = this.data.courses.find(c => c.id === ds.course_id);
        const slot = this.data.exam_slots.find(s => s.id === ds.slot_id);
        return { ...ds, course, slot };
      });

    const requests = this.data.change_requests
      .filter(r => r.student_id === student.id)
      .map(r => {
        const targetBranch = r.target_branch_id ? this.data.branches.find(b => b.id === r.target_branch_id) : null;
        return { ...r, targetBranch };
      });

    const state = this.deriveStudentState(student);
    const regNo = student.registration_number || student.vu_id || 'BC-VU';
    const numCgpa = student.cgpa != null ? Number(student.cgpa) : (parseFloat(student.marks_or_cgpa) || 3.50);

    return {
      ...student,
      vu_id: regNo,
      registration_number: regNo,
      cgpa: numCgpa,
      guardian_contact: student.parent_contact || student.guardian_contact || student.emergency_contact || '0300-0000000',
      state,
      branch,
      courses,
      selections,
      requests,
      assignmentCount: assignedCourseIds.length
    };
  }

  // Find User by Email / VU ID
  findUserByCredentials(emailOrId, password) {
    const term = (emailOrId || '').trim().toLowerCase();
    return this.data.users.find(
      u => (u.email.toLowerCase() === term || (u.vu_id && u.vu_id.toLowerCase() === term)) && u.password === password
    );
  }

  // Create Single-Use Password Setup Token
  createPasswordToken(userId, purpose = 'setup') {
    // Invalidate existing active tokens for this user
    this.data.password_tokens = this.data.password_tokens.filter(pt => pt.user_id !== userId || pt.used_at !== null);

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 Hours

    this.data.password_tokens.push({
      id: 'pt_' + Date.now(),
      user_id: userId,
      token_hash: tokenHash,
      purpose,
      expires_at: expiresAt,
      used_at: null,
      created_at: new Date().toISOString()
    });

    this.save();
    return { rawToken, expiresAt };
  }

  // Verify and Consume Token
  consumePasswordToken(rawToken, newPassword) {
    const tokenHash = hashToken(rawToken);
    const tokenRecord = this.data.password_tokens.find(
      pt => pt.token_hash === tokenHash && pt.used_at === null
    );

    if (!tokenRecord) {
      const err = new Error('This setup link is invalid or has already been used.');
      err.status = 400;
      throw err;
    }

    if (new Date(tokenRecord.expires_at) < new Date()) {
      const err = new Error('This setup link has expired (24-hour limit exceeded). Request a new link.');
      err.status = 400;
      throw err;
    }

    // Update password
    const user = this.data.users.find(u => u.id === tokenRecord.user_id);
    if (!user) throw new Error('User account not found');

    user.password = newPassword;
    tokenRecord.used_at = new Date().toISOString();

    this.save();
    return user;
  }

  // Send Simulated / Logged Email
  logEmail(to, subject, body, token = null) {
    const logEntry = {
      id: 'email_' + Date.now(),
      to,
      subject,
      body,
      token,
      sent_at: new Date().toISOString()
    };
    this.data.email_logs.unshift(logEntry);
    this.save();
    console.log(`[ExamSlot Email Sent] -> TO: ${to} | SUBJECT: ${subject}`);
    return logEntry;
  }
}

export const db = new Database();
