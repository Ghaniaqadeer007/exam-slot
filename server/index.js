import express from 'express';
import cors from 'cors';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { db } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_PATH = path.join(__dirname, '../dist');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(DIST_PATH));

// --------------------------------------------------------------------------
// Auth & Role Middleware
// --------------------------------------------------------------------------
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Authentication required' } });
  }

  const token = authHeader.replace('Bearer ', '');
  const [role, id] = token.split(':');

  if (!id || !role) {
    return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Malformed authentication token' } });
  }

  req.user = { id, role };
  next();
}

function studentOnly(req, res, next) {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access restricted to students only.' } });
  }
  next();
}

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Administrative authority required.' } });
  }
  next();
}

// --------------------------------------------------------------------------
// 1. Authentication Endpoints (PRD Section 10.1)
// --------------------------------------------------------------------------
app.post(['/api/v1/auth/login', '/api/auth/login'], (req, res) => {
  const { vu_id, email, password, role } = req.body;
  const identifier = email || vu_id;

  if (!identifier || !password) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Please enter your email/ID and password.' } });
  }

  const user = db.findUserByCredentials(identifier, password);
  if (!user) {
    return res.status(401).json({
      error: { code: 'UNAUTHENTICATED', message: 'Invalid credentials. Please verify your Email/ID and password.' }
    });
  }

  if (role && user.role !== role) {
    return res.status(403).json({
      error: { code: 'FORBIDDEN', message: `Account role mismatch: registered as ${user.role}.` }
    });
  }

  const token = `${user.role}:${user.id}`;
  let studentProfile = null;
  if (user.role === 'student') {
    let s = db.data.students.find(st => st.user_id === user.id || (st.email && st.email.toLowerCase() === user.email.toLowerCase()));
    if (!s) {
      const newStudentId = 'stu_' + Date.now();
      const cleanRegNo = user.vu_id || 'BC' + Math.floor(10000000 + Math.random() * 90000000);
      s = {
        id: newStudentId,
        user_id: user.id,
        full_name: user.full_name || 'Enrolled Student',
        email: user.email.toLowerCase(),
        phone: '+92 300 0000000',
        cnic: '35201-1234567-1',
        dob: '2004-01-01',
        gender: 'Male',
        address: 'Resident Address',
        father_name: 'Father / Guardian',
        parent_cnic: '35201-7654321-1',
        parent_occupation: 'Professional',
        parent_contact: '+92 301 0000000',
        emergency_contact: '+92 302 0000000',
        registration_number: cleanRegNo,
        program: 'BS Computer Science',
        semester: 1,
        session: 'Fall 2026',
        previous_qualification: 'HSSC / Intermediate',
        previous_institute: 'Punjab College',
        marks_or_cgpa: '3.50',
        branch_id: null,
        branch_locked: false,
        datesheet_status: 'not_saved',
        created_at: new Date().toISOString()
      };
      db.data.students.push(s);

      const availableCourses = db.data.courses.filter(c => c.status === 'active');
      availableCourses.slice(0, 4).forEach(c => {
        db.data.course_assignments.push({
          id: 'ca_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          student_id: newStudentId,
          course_id: c.id
        });
      });
      db.save();
    }
    studentProfile = db.populateStudent(s);
  }

  return res.json({
    data: {
      message: 'Authentication successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        vu_id: user.vu_id,
        role: user.role
      },
      student: studentProfile
    }
  });
});

app.post(['/api/v1/auth/logout', '/api/auth/logout'], (req, res) => {
  return res.json({ data: { message: 'Logged out successfully' } });
});

app.get(['/api/v1/auth/me', '/api/auth/me'], authMiddleware, (req, res) => {
  const user = db.data.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });

  let studentProfile = null;
  if (user.role === 'student') {
    const s = db.data.students.find(st => st.user_id === user.id || st.email.toLowerCase() === user.email.toLowerCase());
    if (s) studentProfile = db.populateStudent(s);
  }

  return res.json({
    data: {
      user: { id: user.id, email: user.email, vu_id: user.vu_id, role: user.role },
      student: studentProfile
    }
  });
});

// Forgot Password Flow (Generic response per Section 6.1)
app.post(['/api/v1/auth/forgot-password', '/api/auth/forgot-password'], (req, res) => {
  const { email_or_id, email } = req.body;
  const target = (email || email_or_id || '').trim().toLowerCase();

  const user = db.data.users.find(u => u.email.toLowerCase() === target || (u.vu_id && u.vu_id.toLowerCase() === target));
  if (user) {
    const { rawToken } = db.createPasswordToken(user.id, 'reset');
    const resetLink = `http://localhost:5000/set-password?token=${rawToken}`;
    db.logEmail(
      user.email,
      'Reset your ExamSlot password',
      `Click the link to reset your password (valid for 24 hours, works once): ${resetLink}`,
      rawToken
    );
  }

  return res.json({
    data: {
      message: "If an account exists for that email, we've sent a reset link."
    }
  });
});

// Set Password via Token (PRD Section 5.4 / 6.1)
app.post(['/api/v1/auth/set-password', '/api/auth/set-password'], (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword || newPassword.length < 8) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Password must be at least 8 characters long.' }
    });
  }

  try {
    const user = db.consumePasswordToken(token, newPassword);
    return res.json({
      data: {
        message: 'Password set successfully. You can sign in now.',
        user: { id: user.id, email: user.email, role: user.role }
      }
    });
  } catch (err) {
    return res.status(err.status || 400).json({
      error: { code: 'TOKEN_INVALID_OR_EXPIRED', message: err.message }
    });
  }
});

// Student Self Sign-Up (Comprehensive 3-Group Registration)
app.post(['/api/v1/auth/student-signup', '/api/auth/signup'], (req, res) => {
  const {
    // Group 1: Personal
    full_name, email, phone, cnic, dob, gender = 'Male', address,
    // Group 2: Parent / Guardian
    father_name, parent_cnic, parent_occupation, parent_contact, emergency_contact,
    // Group 3: Academic
    registration_number, program, semester = 1, session = 'Fall 2026',
    previous_qualification, previous_institute, marks_or_cgpa,
    // Security
    password
  } = req.body;

  if (!full_name || !email || !password) {
    return res.status(422).json({
      error: { code: 'VALIDATION_ERROR', message: 'Full name, email, and password are required.' }
    });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanRegNo = (registration_number && registration_number.trim()) 
    ? registration_number.trim().toUpperCase() 
    : 'BC' + Math.floor(10000000 + Math.random() * 90000000);

  const existingUser = db.data.users.find(u => u.email.toLowerCase() === cleanEmail);
  if (existingUser) {
    if (existingUser.password !== password) {
      return res.status(401).json({
        error: { code: 'UNAUTHENTICATED', message: 'An account with this email address already exists. Invalid password provided.' }
      });
    }
    const studentObj = db.data.students.find(s => s.user_id === existingUser.id);
    const studentProfile = studentObj ? db.populateStudent(studentObj) : null;
    const token = `${existingUser.role}:${existingUser.id}`;
    db.save();

    return res.status(200).json({
      data: {
        message: 'Signed in with existing account successfully.',
        token,
        user: {
          id: existingUser.id,
          email: existingUser.email,
          vu_id: existingUser.vu_id,
          role: existingUser.role
        },
        student: studentProfile
      }
    });
  }

  // Check unique reg number
  if (db.data.students.some(s => s.registration_number.toUpperCase() === cleanRegNo)) {
    return res.status(409).json({
      error: { code: 'DUPLICATE', message: `Registration number '${cleanRegNo}' already exists.` }
    });
  }

  const newUserId = 'usr_' + Date.now();
  const newUser = {
    id: newUserId,
    email: cleanEmail,
    vu_id: cleanRegNo,
    password: password,
    role: 'student',
    created_at: new Date().toISOString()
  };
  db.data.users.push(newUser);

  const newStudentId = 'stu_' + Date.now();
  const newStudent = {
    id: newStudentId,
    user_id: newUserId,
    full_name: full_name.trim(),
    email: cleanEmail,
    phone: phone ? phone.trim() : '+92 300 0000000',
    cnic: cnic ? cnic.trim() : '35201-' + Math.floor(1000000 + Math.random() * 9000000) + '-1',
    dob: dob || '2004-01-01',
    gender: gender || 'Male',
    address: address ? address.trim() : 'Campus Hostel / Resident Address',
    profile_photo: null,

    father_name: father_name ? father_name.trim() : 'Father / Guardian',
    parent_cnic: parent_cnic ? parent_cnic.trim() : '35201-1234567-1',
    parent_occupation: parent_occupation ? parent_occupation.trim() : 'Professional',
    parent_contact: parent_contact ? parent_contact.trim() : '+92 301 0000000',
    emergency_contact: emergency_contact ? emergency_contact.trim() : '+92 302 0000000',

    registration_number: cleanRegNo,
    program: program ? program.trim() : 'BS Computer Science',
    semester: parseInt(semester) || 1,
    session: session || 'Fall 2026',
    previous_qualification: previous_qualification ? previous_qualification.trim() : 'HSSC / Intermediate',
    previous_institute: previous_institute ? previous_institute.trim() : 'Punjab College',
    marks_or_cgpa: marks_or_cgpa ? marks_or_cgpa.trim() : '3.45',

    branch_id: null,
    branch_selected_at: null,
    datesheet_status: 'pending',
    created_at: new Date().toISOString()
  };
  db.data.students.push(newStudent);

  // Assign 4 starter courses to satisfy Section 4.4 assignment rule
  const availableCourses = db.data.courses.filter(c => c.status === 'active');
  const starterCourses = availableCourses.slice(0, 4);
  starterCourses.forEach(c => {
    db.data.course_assignments.push({
      id: 'ca_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      student_id: newStudentId,
      course_id: c.id,
      assigned_at: new Date().toISOString()
    });
  });

  db.save();

  const token = `student:${newUserId}`;
  const studentProfile = db.populateStudent(newStudent);

  return res.status(201).json({
    data: {
      message: 'Student account created successfully.',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        vu_id: newUser.vu_id,
        role: newUser.role
      },
      student: studentProfile
    }
  });
});

// Admin Self Sign-Up Endpoint
app.post(['/api/v1/auth/admin-signup', '/api/auth/admin-signup'], (req, res) => {
  const { full_name, email, department, staff_id, password } = req.body;

  if (!full_name || !email || !password) {
    return res.status(422).json({
      error: { code: 'VALIDATION_ERROR', message: 'Full name, official email, and password are required.' }
    });
  }

  const cleanEmail = email.trim().toLowerCase();
  if (db.data.users.some(u => u.email.toLowerCase() === cleanEmail)) {
    return res.status(409).json({
      error: { code: 'DUPLICATE', message: `An account with email '${cleanEmail}' already exists.` }
    });
  }

  const newAdminId = 'usr_admin_' + Date.now();
  const staffId = staff_id ? staff_id.trim().toUpperCase() : 'EMP-' + Math.floor(1000 + Math.random() * 9000);

  const newAdminUser = {
    id: newAdminId,
    email: cleanEmail,
    vu_id: staffId,
    full_name: full_name.trim(),
    department: department ? department.trim() : 'Examination Authority',
    password: password,
    role: 'admin',
    created_at: new Date().toISOString()
  };

  db.data.users.push(newAdminUser);
  db.save();

  const token = `admin:${newAdminId}`;

  return res.status(201).json({
    data: {
      message: 'Administrative authority account created successfully.',
      token,
      user: {
        id: newAdminUser.id,
        email: newAdminUser.email,
        vu_id: newAdminUser.vu_id,
        role: newAdminUser.role,
        full_name: newAdminUser.full_name,
        department: newAdminUser.department
      }
    }
  });
});


// --------------------------------------------------------------------------
// 2. Admin: Branch Management (Full CRUD + Safe Delete + Pagination) (4.1)
// --------------------------------------------------------------------------
app.get(['/api/v1/admin/branches', '/api/admin/branches'], authMiddleware, adminOnly, (req, res) => {
  const { search = '', status = '', page = 1, pageSize = 10 } = req.query;

  let list = db.data.branches;

  if (status) {
    list = list.filter(b => b.status === status);
  }

  if (search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(b => 
      b.name.toLowerCase().includes(q) || 
      b.code.toLowerCase().includes(q) || 
      b.city.toLowerCase().includes(q)
    );
  }

  // Attach student usage counts
  const enriched = list.map(b => {
    const studentCount = db.data.students.filter(s => s.branch_id === b.id).length;
    return { ...b, studentCount };
  });

  return res.json(db.paginate(enriched, page, pageSize));
});

// Create Branch
app.post(['/api/v1/admin/branches', '/api/admin/branches'], authMiddleware, adminOnly, (req, res) => {
  const { code, name, city, address, contact_number, status = 'active', capacity = 500 } = req.body;

  if (!code || !name || !city || !address) {
    return res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'Name, unique code, city, and address are required.' } });
  }

  const upperCode = code.trim().toUpperCase();
  if (db.data.branches.some(b => b.code.toUpperCase() === upperCode)) {
    return res.status(409).json({ error: { code: 'DUPLICATE', message: `Branch code '${upperCode}' is already in use.` } });
  }

  const newBranch = {
    id: 'br_' + Date.now(),
    code: upperCode,
    name: name.trim(),
    city: city.trim(),
    address: address.trim(),
    contact_number: contact_number || 'N/A',
    status: status === 'inactive' ? 'inactive' : 'active',
    capacity: parseInt(capacity) || 500,
    created_at: new Date().toISOString()
  };

  db.data.branches.push(newBranch);
  db.save();

  return res.status(201).json({ data: newBranch });
});

// Update Branch
app.put(['/api/v1/admin/branches/:id', '/api/admin/branches/:id'], authMiddleware, adminOnly, (req, res) => {
  const { id } = req.params;
  const branch = db.data.branches.find(b => b.id === id);
  if (!branch) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Branch not found' } });

  const { code, name, city, address, contact_number, status, capacity } = req.body;

  if (code) {
    const upperCode = code.trim().toUpperCase();
    if (db.data.branches.some(b => b.id !== id && b.code.toUpperCase() === upperCode)) {
      return res.status(409).json({ error: { code: 'DUPLICATE', message: `Branch code '${upperCode}' already in use.` } });
    }
    branch.code = upperCode;
  }

  if (name) branch.name = name.trim();
  if (city) branch.city = city.trim();
  if (address) branch.address = address.trim();
  if (contact_number !== undefined) branch.contact_number = contact_number;
  if (status) branch.status = status;
  if (capacity !== undefined) branch.capacity = parseInt(capacity) || branch.capacity;
  branch.updated_at = new Date().toISOString();

  db.save();
  return res.json({ data: branch });
});

// Delete Branch (SAFE-DELETE RULE: Section 5.2 / BR9)
app.delete(['/api/v1/admin/branches/:id', '/api/admin/branches/:id'], authMiddleware, adminOnly, (req, res) => {
  const { id } = req.params;
  const branch = db.data.branches.find(b => b.id === id);
  if (!branch) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Branch not found' } });

  const chosenStudents = db.data.students.filter(s => s.branch_id === id);
  if (chosenStudents.length > 0) {
    return res.status(409).json({
      error: {
        code: 'IN_USE',
        message: `Branch "${branch.name}" is chosen by ${chosenStudents.length} student(s) and cannot be hard-deleted. Use "Mark Inactive" instead.`
      }
    });
  }

  db.data.branches = db.data.branches.filter(b => b.id !== id);
  db.save();
  return res.json({ data: { message: `Branch "${branch.name}" successfully deleted.` } });
});

// --------------------------------------------------------------------------
// 3. Admin: Course Management (Full CRUD + Safe Delete + Pagination) (4.2)
// --------------------------------------------------------------------------
app.get(['/api/v1/admin/courses', '/api/admin/courses'], authMiddleware, adminOnly, (req, res) => {
  const { search = '', status = '', department = '', page = 1, pageSize = 10 } = req.query;

  let list = db.data.courses;

  if (status) list = list.filter(c => c.status === status);
  if (department) list = list.filter(c => c.department.toLowerCase() === department.toLowerCase());

  if (search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(c => c.course_code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q));
  }

  const enriched = list.map(c => {
    const assignedCount = db.data.course_assignments.filter(ca => ca.course_id === c.id).length;
    const slotCount = db.data.exam_slots.filter(s => s.course_id === c.id).length;
    return { ...c, assignedCount, slotCount };
  });

  return res.json(db.paginate(enriched, page, pageSize));
});

// Create Course
app.post(['/api/v1/admin/courses', '/api/admin/courses'], authMiddleware, adminOnly, (req, res) => {
  const { course_code, title, credit_hours = 3, department, status = 'active' } = req.body;

  if (!course_code || !title || !department) {
    return res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'Course code, title, and department are required.' } });
  }

  const upperCode = course_code.trim().toUpperCase();
  if (db.data.courses.some(c => c.course_code.toUpperCase() === upperCode)) {
    return res.status(409).json({ error: { code: 'DUPLICATE', message: `Course code '${upperCode}' is already registered.` } });
  }

  const newCourse = {
    id: 'crs_' + upperCode.toLowerCase(),
    course_code: upperCode,
    title: title.trim(),
    credit_hours: parseInt(credit_hours) || 3,
    department: department.trim(),
    status: status === 'inactive' ? 'inactive' : 'active',
    created_at: new Date().toISOString()
  };

  db.data.courses.push(newCourse);
  db.save();

  return res.status(201).json({ data: newCourse });
});

// Update Course
app.put(['/api/v1/admin/courses/:id', '/api/admin/courses/:id'], authMiddleware, adminOnly, (req, res) => {
  const { id } = req.params;
  const course = db.data.courses.find(c => c.id === id);
  if (!course) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Course not found' } });

  const { course_code, title, credit_hours, department, status } = req.body;

  if (course_code) {
    const upperCode = course_code.trim().toUpperCase();
    if (db.data.courses.some(c => c.id !== id && c.course_code.toUpperCase() === upperCode)) {
      return res.status(409).json({ error: { code: 'DUPLICATE', message: `Course code '${upperCode}' is already registered.` } });
    }
    course.course_code = upperCode;
  }

  if (title) course.title = title.trim();
  if (credit_hours) course.credit_hours = parseInt(credit_hours) || course.credit_hours;
  if (department) course.department = department.trim();
  if (status) course.status = status;
  course.updated_at = new Date().toISOString();

  db.save();
  return res.json({ data: course });
});

// Delete Course (Safe Delete Rule)
app.delete(['/api/v1/admin/courses/:id', '/api/admin/courses/:id'], authMiddleware, adminOnly, (req, res) => {
  const { id } = req.params;
  const course = db.data.courses.find(c => c.id === id);
  if (!course) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Course not found' } });

  const assigned = db.data.course_assignments.filter(ca => ca.course_id === id);
  const slots = db.data.exam_slots.filter(s => s.course_id === id);

  if (assigned.length > 0 || slots.length > 0) {
    return res.status(409).json({
      error: {
        code: 'IN_USE',
        message: `Course "${course.course_code}" has ${assigned.length} student assignment(s) and ${slots.length} scheduled slot(s). It cannot be deleted. Mark it inactive instead.`
      }
    });
  }

  db.data.courses = db.data.courses.filter(c => c.id !== id);
  db.save();
  return res.json({ data: { message: `Course "${course.course_code}" deleted successfully.` } });
});

// --------------------------------------------------------------------------
// 4. Admin: Student Management (Full 3 Groups CRUD + Setup Email) (4.3)
// --------------------------------------------------------------------------
app.get(['/api/v1/admin/students', '/api/admin/students'], authMiddleware, adminOnly, (req, res) => {
  const { search = '', program = '', semester = '', assignment = '', datesheet = '', page = 1, pageSize = 10 } = req.query;

  let list = db.data.students.map(s => db.populateStudent(s));

  if (program) list = list.filter(s => s.program.toLowerCase().includes(program.toLowerCase()));
  if (semester) list = list.filter(s => s.semester.toString() === semester.toString());
  if (assignment === 'complete') list = list.filter(s => s.assignmentCount >= 4);
  if (assignment === 'incomplete') list = list.filter(s => s.assignmentCount < 4);
  if (datesheet) list = list.filter(s => s.datesheet_status === datesheet);

  if (search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(s => 
      s.full_name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.registration_number.toLowerCase().includes(q) ||
      s.cnic.toLowerCase().includes(q)
    );
  }

  // Sort newest registered accounts first
  list.sort((a, b) => new Date(b.created_at || Date.now()) - new Date(a.created_at || Date.now()));

  return res.json(db.paginate(list, page, pageSize));
});

// Admin Users Endpoint (View All Registered Admin & Student Credentials)
app.get(['/api/v1/admin/users', '/api/admin/users'], authMiddleware, adminOnly, (req, res) => {
  const { search = '', role = '', page = 1, pageSize = 10 } = req.query;

  let list = db.data.users;

  if (role) {
    list = list.filter(u => u.role === role);
  }

  if (search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(u => 
      u.email.toLowerCase().includes(q) || 
      (u.vu_id && u.vu_id.toLowerCase().includes(q)) ||
      (u.full_name && u.full_name.toLowerCase().includes(q))
    );
  }

  list.sort((a, b) => new Date(b.created_at || Date.now()) - new Date(a.created_at || Date.now()));

  return res.json(db.paginate(list, page, pageSize));
});

// Create Student (All 3 Groups + Dispatches Setup Email)
app.post(['/api/v1/admin/students', '/api/admin/students'], authMiddleware, adminOnly, (req, res) => {
  const {
    // Group 1: Personal
    full_name, email, phone, cnic, dob, gender = 'Other', address,
    // Group 2: Parent / Guardian
    father_name, parent_cnic, parent_occupation, parent_contact, emergency_contact,
    // Group 3: Academic
    registration_number, program, semester = 1, session = 'Fall 2026',
    previous_qualification, previous_institute, marks_or_cgpa,
    // Group 4: Course Assignments (4 to 6 rule)
    course_ids
  } = req.body;

  // Validation
  if (!full_name || !email || !cnic || !father_name || !registration_number || !program) {
    return res.status(422).json({
      error: { code: 'VALIDATION_ERROR', message: 'Required fields: Full name, email, CNIC, Father name, Registration number, and Program.' }
    });
  }

  // Course assignment validation (4 to 6 rule)
  if (course_ids && Array.isArray(course_ids)) {
    if (course_ids.length < 4 || course_ids.length > 6) {
      return res.status(409).json({
        error: { code: 'ASSIGNMENT_LIMIT', message: `Must assign at least 4 and at most 6 courses. You selected ${course_ids.length}.` }
      });
    }
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanRegNo = registration_number.trim().toUpperCase();

  // Unique checks
  if (db.data.users.some(u => u.email.toLowerCase() === cleanEmail)) {
    return res.status(409).json({ error: { code: 'DUPLICATE', message: `Email '${cleanEmail}' is already registered.` } });
  }
  if (db.data.students.some(s => s.registration_number.toUpperCase() === cleanRegNo)) {
    return res.status(409).json({ error: { code: 'DUPLICATE', message: `Registration number '${cleanRegNo}' already exists.` } });
  }

  // 1. Create User entry
  const newUserId = 'usr_' + Date.now();
  const newUser = {
    id: newUserId,
    email: cleanEmail,
    vu_id: cleanRegNo,
    password: 'temp_' + crypto.randomBytes(4).toString('hex'), // Temporary random, student sets via setup link
    role: 'student',
    created_at: new Date().toISOString()
  };
  db.data.users.push(newUser);

  // 2. Create Student Record entry
  const newStudentId = 'std_' + Date.now();
  const newStudent = {
    id: newStudentId,
    user_id: newUserId,
    registration_number: cleanRegNo,
    full_name: full_name.trim(),
    email: cleanEmail,
    phone: phone || '',
    cnic: cnic.trim(),
    dob: dob || '2004-01-01',
    gender: gender || 'Other',
    address: address || '',
    father_name: father_name.trim(),
    parent_cnic: parent_cnic || '',
    parent_occupation: parent_occupation || '',
    parent_contact: parent_contact || '',
    emergency_contact: emergency_contact || '',
    program: program.trim(),
    semester: parseInt(semester) || 1,
    session: session || 'Fall 2026',
    previous_qualification: previous_qualification || '',
    previous_institute: previous_institute || '',
    marks_or_cgpa: marks_or_cgpa || '0.00',
    branch_id: null,
    branch_locked: false,
    datesheet_status: 'not_saved',
    datesheet_saved_at: null,
    branch_change_unlocked: 0,
    datesheet_change_unlocked: 0,
    created_at: new Date().toISOString()
  };
  db.data.students.push(newStudent);

  // 3. Assign 4 to 6 Courses in course_assignments table
  const selectedCourseIds = (course_ids && Array.isArray(course_ids) && course_ids.length >= 4 && course_ids.length <= 6)
    ? course_ids
    : db.data.courses.filter(c => c.status === 'active').slice(0, 4).map(c => c.id);

  selectedCourseIds.forEach(cid => {
    db.data.course_assignments.push({
      id: 'ca_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      student_id: newStudentId,
      course_id: cid,
      assigned_at: new Date().toISOString()
    });
  });

  // 4. Generate Single-Use 24h Setup Email Link in password_tokens table
  const { rawToken, expiresAt } = db.createPasswordToken(newUserId, 'setup');
  const setupUrl = `http://localhost:5000/set-password?token=${rawToken}`;
  const emailLog = db.logEmail(
    cleanEmail,
    'Your ExamSlot account is ready',
    `Hello ${full_name},\n\nYour ExamSlot portal account has been created with ${selectedCourseIds.length} course assignments. Click the link to set your password: ${setupUrl}\n\n(Link is valid for 24 hours and works once.)`,
    rawToken
  );

  // 5. Persist to JSON database file
  db.save();

  return res.status(201).json({
    data: {
      student: db.populateStudent(newStudent),
      setupLink: setupUrl,
      token: rawToken,
      assignedCount: selectedCourseIds.length,
      emailSent: true,
      emailLog
    }
  });
});

// Resend Setup Email
app.post(['/api/v1/admin/students/:id/resend-setup', '/api/admin/students/:id/resend-setup'], authMiddleware, adminOnly, (req, res) => {
  const { id } = req.params;
  const student = db.data.students.find(s => s.id === id);
  if (!student) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Student not found' } });

  const { rawToken } = db.createPasswordToken(student.user_id, 'setup');
  const setupUrl = `http://localhost:5000/set-password?token=${rawToken}`;
  const emailLog = db.logEmail(
    student.email,
    'Your ExamSlot account is ready (Resent)',
    `Hello ${student.full_name},\n\nYour account setup link has been re-issued. Set your password here: ${setupUrl}\n\n(Valid for 24 hours)`,
    rawToken
  );

  return res.json({
    data: {
      message: `Setup email resent to ${student.email}.`,
      setupLink: setupUrl,
      emailLog
    }
  });
});

// Update Student
app.put(['/api/v1/admin/students/:id', '/api/admin/students/:id'], authMiddleware, adminOnly, (req, res) => {
  const { id } = req.params;
  const student = db.data.students.find(s => s.id === id);
  if (!student) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Student not found' } });

  Object.assign(student, req.body, { updated_at: new Date().toISOString() });
  db.save();

  return res.json({ data: db.populateStudent(student) });
});

// Delete Student (Cascading Delete per Section 5.4 / [A7])
app.delete(['/api/v1/admin/students/:id', '/api/admin/students/:id'], authMiddleware, adminOnly, (req, res) => {
  const { id } = req.params;
  const student = db.data.students.find(s => s.id === id);
  if (!student) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Student not found' } });

  // Cascade
  db.data.course_assignments = db.data.course_assignments.filter(ca => ca.student_id !== id);
  db.data.date_sheet_selections = db.data.date_sheet_selections.filter(ds => ds.student_id !== id);
  db.data.change_requests = db.data.change_requests.filter(r => r.student_id !== id);
  db.data.users = db.data.users.filter(u => u.id !== student.user_id);
  db.data.students = db.data.students.filter(s => s.id !== id);

  db.save();
  return res.json({ data: { message: `Student ${student.full_name} and associated records successfully removed.` } });
});

// --------------------------------------------------------------------------
// 5. Admin: Course Assignment Management (4 to 6 Rule Enforced) (4.4)
// --------------------------------------------------------------------------
app.get(['/api/v1/admin/assignments', '/api/admin/assignments'], authMiddleware, adminOnly, (req, res) => {
  const { search = '', status = '', page = 1, pageSize = 10 } = req.query;

  let list = db.data.students.map(s => {
    const assignments = db.data.course_assignments.filter(ca => ca.student_id === s.id);
    const assignedCourses = db.data.courses.filter(c => assignments.some(ca => ca.course_id === c.id));
    return {
      studentId: s.id,
      studentName: s.full_name,
      registrationNumber: s.registration_number,
      email: s.email,
      courseCount: assignedCourses.length,
      status: assignedCourses.length >= 4 ? 'complete' : 'incomplete',
      datesheetStatus: s.datesheet_status,
      assignedCourses
    };
  });

  if (status) list = list.filter(item => item.status === status);
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(item => 
      item.studentName.toLowerCase().includes(q) ||
      item.registrationNumber.toLowerCase().includes(q)
    );
  }

  return res.json(db.paginate(list, page, pageSize));
});

// Bulk Replace Assignments for a Student (Enforces 4-6 Rule & Locks after Date Sheet saved)
app.put(['/api/v1/admin/students/:id/assignments', '/api/admin/students/:id/assignments'], authMiddleware, adminOnly, (req, res) => {
  const { id } = req.params;
  const { courseIds } = req.body;

  const student = db.data.students.find(s => s.id === id);
  if (!student) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Student not found' } });

  if (!Array.isArray(courseIds)) {
    return res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'courseIds must be an array of course IDs.' } });
  }

  // 1. Strict 4 to 6 Rule (Section 5.5 / BR1)
  if (courseIds.length < 4 || courseIds.length > 6) {
    return res.status(409).json({
      error: { code: 'ASSIGNMENT_LIMIT', message: `A student must have between 4 and 6 courses assigned. (Received: ${courseIds.length})` }
    });
  }

  // 2. Duplicate course check
  const uniqueIds = Array.from(new Set(courseIds));
  if (uniqueIds.length !== courseIds.length) {
    return res.status(409).json({
      error: { code: 'DUPLICATE', message: 'The same course cannot be assigned to the same student twice.' }
    });
  }

  // 3. Date sheet saved lock check (Section 5.5 / AD-AS-5 / [A9])
  if (student.datesheet_status === 'saved' && student.datesheet_change_unlocked !== 1) {
    return res.status(409).json({
      error: {
        code: 'LOCKED',
        message: 'Cannot modify course assignments after date sheet is saved unless a date sheet change request is approved.'
      }
    });
  }

  // Clear previous assignments and insert new set atomically
  db.data.course_assignments = db.data.course_assignments.filter(ca => ca.student_id !== id);
  uniqueIds.forEach(cId => {
    db.data.course_assignments.push({
      id: 'ca_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      student_id: id,
      course_id: cId,
      assigned_by: req.user.id,
      created_at: new Date().toISOString()
    });
  });

  db.save();

  return res.json({
    data: {
      message: `Course assignments updated successfully (${uniqueIds.length} courses assigned).`,
      student: db.populateStudent(student)
    }
  });
});

// --------------------------------------------------------------------------
// 6. Admin: Exam Slot Schedule Management (Full CRUD + Protection) (4.5)
// --------------------------------------------------------------------------
app.get(['/api/v1/admin/slots', '/api/admin/slots'], authMiddleware, adminOnly, (req, res) => {
  const { search = '', courseId = '', page = 1, pageSize = 10 } = req.query;

  let list = db.data.exam_slots.map(s => {
    const course = db.data.courses.find(c => c.id === s.course_id);
    const chosenCount = db.data.date_sheet_selections.filter(ds => ds.slot_id === s.id).length;
    return { ...s, course, chosenCount };
  });

  if (courseId) list = list.filter(s => s.course_id === courseId);

  if (search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(s => s.course && (s.course.course_code.toLowerCase().includes(q) || s.course.title.toLowerCase().includes(q)));
  }

  // Sort by date
  list.sort((a, b) => a.exam_date.localeCompare(b.exam_date));

  return res.json(db.paginate(list, page, pageSize));
});

// Create Slot
app.post(['/api/v1/admin/slots', '/api/admin/slots'], authMiddleware, adminOnly, (req, res) => {
  const { course_id, exam_date, start_time, end_time = '12:00', capacity = 60 } = req.body;

  if (!course_id || !exam_date || !start_time) {
    return res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'Course, exam date, and start time are required.' } });
  }

  // Validation: No past dates
  const todayStr = new Date().toISOString().split('T')[0];
  if (exam_date < todayStr) {
    return res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: "Exam date cannot be in the past." } });
  }

  // Validation: End time after start time
  if (end_time && end_time <= start_time) {
    return res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'End time must be after start time.' } });
  }

  // Duplicate slot for same course, date, start time
  if (db.data.exam_slots.some(s => s.course_id === course_id && s.exam_date === exam_date && s.start_time === start_time)) {
    return res.status(409).json({ error: { code: 'DUPLICATE', message: 'A slot for this course at this date and time already exists.' } });
  }

  const dateObj = new Date(exam_date + 'T00:00:00Z');
  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });

  const newSlot = {
    id: 's_' + Date.now(),
    course_id,
    exam_date,
    day_name: dayName,
    start_time,
    end_time: end_time || null,
    capacity: parseInt(capacity) || 60,
    booked_count: 0,
    created_at: new Date().toISOString()
  };

  db.data.exam_slots.push(newSlot);
  db.save();

  return res.status(201).json({ data: newSlot });
});

// Delete Slot (Protected Chosen Slots: Section 5.6 / [A10])
app.delete(['/api/v1/admin/slots/:id', '/api/admin/slots/:id'], authMiddleware, adminOnly, (req, res) => {
  const { id } = req.params;
  const slot = db.data.exam_slots.find(s => s.id === id);
  if (!slot) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Slot not found' } });

  const chosenCount = db.data.date_sheet_selections.filter(ds => ds.slot_id === id).length;
  if (chosenCount > 0) {
    return res.status(409).json({
      error: {
        code: 'IN_USE',
        message: `This slot has been chosen by ${chosenCount} student(s) and cannot be deleted.`
      }
    });
  }

  db.data.exam_slots = db.data.exam_slots.filter(s => s.id !== id);
  db.save();
  return res.json({ data: { message: 'Exam slot deleted successfully.' } });
});

// --------------------------------------------------------------------------
// 7. Admin: Student Requests Review & One-Time Unlock Engine (4.6 & 7)
// --------------------------------------------------------------------------
app.get(['/api/v1/admin/requests', '/api/admin/requests'], authMiddleware, adminOnly, (req, res) => {
  const { status = '', type = '', search = '', page = 1, pageSize = 10 } = req.query;

  let list = db.data.change_requests.map(r => {
    const student = db.data.students.find(s => s.id === r.student_id);
    const targetBranch = r.target_branch_id ? db.data.branches.find(b => b.id === r.target_branch_id) : null;
    return { ...r, student, targetBranch };
  });

  if (status) list = list.filter(r => r.status === status);
  if (type) list = list.filter(r => r.type === type);

  if (search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(r => 
      r.student && (r.student.full_name.toLowerCase().includes(q) || r.student.registration_number.toLowerCase().includes(q))
    );
  }

  list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return res.json(db.paginate(list, page, pageSize));
});

// Decide Request (Approve / Reject + Single-Use Unlock)
app.patch(['/api/v1/admin/requests/:id', '/api/admin/requests/:id'], authMiddleware, adminOnly, (req, res) => {
  const { id } = req.params;
  const { decision, remark = '' } = req.body;

  const request = db.data.change_requests.find(r => r.id === id);
  if (!request) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Request not found' } });

  // Only pending requests can be decided
  if (request.status !== 'pending') {
    return res.status(409).json({ error: { code: 'DUPLICATE', message: 'This request has already been reviewed.' } });
  }

  if (!['approved', 'rejected'].includes(decision)) {
    return res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'Decision must be approved or rejected.' } });
  }

  const student = db.data.students.find(s => s.id === request.student_id);

  request.status = decision;
  request.admin_remark = remark || (decision === 'approved' ? 'Approved by Examination Directorate.' : 'Request declined.');
  request.decided_by = req.user.id;
  request.decided_at = new Date().toISOString();

  // One-Time Unlock Engine (Section 7)
  if (decision === 'approved' && student) {
    if (request.type === 'change_branch') {
      student.branch_change_unlocked = 1;
      // Per [A17]: changing branch clears date sheet selections so student re-picks
      db.data.date_sheet_selections = db.data.date_sheet_selections.filter(ds => ds.student_id !== student.id);
      student.datesheet_status = 'not_saved';
      student.datesheet_change_unlocked = 1;
    } else if (request.type === 'change_datesheet') {
      student.datesheet_change_unlocked = 1;
      student.datesheet_status = 'not_saved';
    }
  }

  db.save();

  return res.json({
    data: {
      message: `Request marked as ${decision}.`,
      request
    }
  });
});

// Admin Stats
app.get(['/api/v1/admin/stats', '/api/admin/stats'], authMiddleware, adminOnly, (req, res) => {
  const totalStudents = db.data.students.length;
  const savedDateSheets = db.data.students.filter(s => s.datesheet_status === 'saved').length;
  const pendingRequests = db.data.change_requests.filter(r => r.status === 'pending').length;
  const incompleteAssignments = db.data.students.filter(s => {
    const count = db.data.course_assignments.filter(ca => ca.student_id === s.id).length;
    return count < 4;
  }).length;

  return res.json({
    data: {
      totalStudents,
      savedDateSheets,
      pendingRequests,
      incompleteAssignments,
      totalBranches: db.data.branches.length,
      totalCourses: db.data.courses.length
    }
  });
});

// --------------------------------------------------------------------------
// 8. Student Endpoints (PRD Section 10.3)
// --------------------------------------------------------------------------
// Student Profile & State
app.get(['/api/v1/student/profile', '/api/student/profile', '/api/student/me'], authMiddleware, studentOnly, (req, res) => {
  const user = db.data.users.find(u => u.id === req.user.id);
  const student = db.data.students.find(s => s.user_id === req.user.id || (user && s.email.toLowerCase() === user.email.toLowerCase()));
  if (!student) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Student record not found.' } });

  return res.json({ data: db.populateStudent(student) });
});

// Get Active Branches (Only active branches per Section 5.2 / 6.2)
app.get(['/api/v1/student/branches', '/api/student/branches', '/api/branches'], (req, res) => {
  const activeBranches = db.data.branches.filter(b => b.status === 'active');
  return res.json(activeBranches);
});

// One-Time Branch Selection (Section 5.2 / 6.2 / ST-BR)
app.post(['/api/v1/student/branch', '/api/student/branch'], authMiddleware, studentOnly, (req, res) => {
  const { branchId, branch_id } = req.body;
  const chosenBranchId = branchId || branch_id;

  const student = db.data.students.find(s => s.user_id === req.user.id);
  if (!student) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Student not found.' } });

  // 1. Incomplete assignment check
  const assignmentCount = db.data.course_assignments.filter(ca => ca.student_id === student.id).length;
  if (assignmentCount < 4) {
    return res.status(409).json({
      error: { code: 'ASSIGNMENT_INCOMPLETE', message: 'Your administrator has assigned fewer than 4 courses. At least 4 are needed before choosing an exam branch.' }
    });
  }

  // 2. One-Time Rule Enforcement (Section 6.2 / BR2)
  if (student.branch_id && student.branch_change_unlocked !== 1) {
    return res.status(409).json({
      error: { code: 'BRANCH_ALREADY_SELECTED', message: 'Branch selection has already been finalized and cannot be chosen again.' }
    });
  }

  const branch = db.data.branches.find(b => b.id === chosenBranchId && b.status === 'active');
  if (!branch) {
    return res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'Selected branch is invalid or inactive.' } });
  }

  student.branch_id = chosenBranchId;
  student.branch_locked = true;
  student.branch_change_unlocked = 0; // Consume unlock!

  // Consume change_branch request if pending consumption
  const approvedReq = db.data.change_requests.find(
    r => r.student_id === student.id && r.type === 'change_branch' && r.status === 'approved' && !r.consumed_at
  );
  if (approvedReq) approvedReq.consumed_at = new Date().toISOString();

  db.save();

  return res.json({
    data: {
      message: `Examination branch successfully set to ${branch.name}.`,
      student: db.populateStudent(student)
    }
  });
});

// Assigned Courses with Available Future Slots
app.get(['/api/v1/student/courses', '/api/student/courses'], authMiddleware, studentOnly, (req, res) => {
  const student = db.data.students.find(s => s.user_id === req.user.id);
  if (!student) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Student not found' } });

  const populated = db.populateStudent(student);
  return res.json({ data: populated.courses });
});

// Finalize Date Sheet (Conflict Check & One-Time Lock) (Section 6.3 / 6.4 / 10.5)
app.post(['/api/v1/student/datesheet', '/api/student/datesheet'], authMiddleware, studentOnly, (req, res) => {
  const { selections } = req.body; // Can be array [{ courseId, slotId }] or object { [courseId]: slotId }
  const student = db.data.students.find(s => s.user_id === req.user.id);
  if (!student) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Student not found' } });

  // 1. Check if allowed to save
  if (student.datesheet_status === 'saved' && student.datesheet_change_unlocked !== 1) {
    return res.status(409).json({
      error: { code: 'DATESHEET_ALREADY_SAVED', message: 'Your date sheet has already been finalized and locked.' }
    });
  }

  // 2. Must have branch chosen
  if (!student.branch_id) {
    return res.status(409).json({
      error: { code: 'BRANCH_PENDING', message: 'Please select your examination branch first.' }
    });
  }

  // Normalize selections array
  let selectionList = [];
  if (Array.isArray(selections)) {
    selectionList = selections;
  } else if (typeof selections === 'object' && selections !== null) {
    selectionList = Object.entries(selections).map(([courseId, slotId]) => ({ courseId, slotId }));
  }

  const assigned = db.data.course_assignments.filter(ca => ca.student_id === student.id);
  if (assigned.length < 4 || assigned.length > 6) {
    return res.status(409).json({
      error: { code: 'ASSIGNMENT_INCOMPLETE', message: 'Assignment incomplete. 4 to 6 courses required.' }
    });
  }

  // 3. Must cover every assigned course
  for (const ca of assigned) {
    if (!selectionList.some(s => s.courseId === ca.course_id && s.slotId)) {
      const crs = db.data.courses.find(c => c.id === ca.course_id);
      return res.status(422).json({
        error: { code: 'VALIDATION_ERROR', message: `Please select an exam slot for ${crs ? crs.course_code : ca.course_id}.` }
      });
    }
  }

  // 4. Validate slots & Conflict Rule (BR5 / ST-DS-5)
  const slotObjects = [];
  for (const item of selectionList) {
    const slot = db.data.exam_slots.find(s => s.id === item.slotId);
    if (!slot) {
      return res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: `Invalid slot: ${item.slotId}` } });
    }
    if (slot.course_id !== item.courseId) {
      return res.status(422).json({ error: { code: 'SLOT_NOT_FOR_COURSE', message: `Slot does not belong to course.` } });
    }
    const crs = db.data.courses.find(c => c.id === item.courseId);
    slotObjects.push({ ...slot, courseCode: crs ? crs.course_code : 'Course' });
  }

  // Helper function: Convert HH:MM into minutes from midnight
  const parseMins = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  // Conflict detection
  for (let i = 0; i < slotObjects.length; i++) {
    for (let j = i + 1; j < slotObjects.length; j++) {
      const a = slotObjects[i];
      const b = slotObjects[j];

      if (a.exam_date === b.exam_date) {
        const startA = parseMins(a.start_time);
        const endA = a.end_time ? parseMins(a.end_time) : startA + 180; // [A18] Treat missing end time as +3h
        const startB = parseMins(b.start_time);
        const endB = b.end_time ? parseMins(b.end_time) : startB + 180;

        // Overlap condition
        if (startA < endB && endA > startB) {
          return res.status(409).json({
            error: {
              code: 'SLOT_CONFLICT',
              message: `${a.courseCode} and ${b.courseCode} overlap on ${a.exam_date} (${a.start_time} - ${a.end_time || 'TBD'} vs ${b.start_time} - ${b.end_time || 'TBD'}). Choose a different slot.`
            }
          });
        }
      }
    }
  }

  // Atomically update selections in database
  db.data.date_sheet_selections = db.data.date_sheet_selections.filter(ds => ds.student_id !== student.id);
  selectionList.forEach(item => {
    db.data.date_sheet_selections.push({
      id: 'dss_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      student_id: student.id,
      course_id: item.courseId,
      slot_id: item.slotId
    });
  });

  student.datesheet_status = 'saved';
  student.datesheet_saved_at = new Date().toISOString();
  student.datesheet_change_unlocked = 0; // Consume unlock!

  // Consume change_datesheet request if pending consumption
  const approvedReq = db.data.change_requests.find(
    r => r.student_id === student.id && r.type === 'change_datesheet' && r.status === 'approved' && !r.consumed_at
  );
  if (approvedReq) approvedReq.consumed_at = new Date().toISOString();

  db.save();

  return res.json({
    data: {
      message: 'Examination date sheet saved successfully. You can print it now.',
      student: db.populateStudent(student)
    }
  });
});

// View Saved Date Sheet (Sorted by date per Section 6.4)
app.get(['/api/v1/student/datesheet', '/api/student/datesheet'], authMiddleware, studentOnly, (req, res) => {
  const student = db.data.students.find(s => s.user_id === req.user.id);
  if (!student) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Student not found' } });

  const populated = db.populateStudent(student);
  populated.selections.sort((a, b) => (a.slot?.exam_date || '').localeCompare(b.slot?.exam_date || ''));

  return res.json({ data: populated });
});

// Student Change Requests (Need Help: Section 6.5)
app.get(['/api/v1/student/requests', '/api/student/requests'], authMiddleware, studentOnly, (req, res) => {
  const student = db.data.students.find(s => s.user_id === req.user.id);
  if (!student) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Student not found' } });

  const reqs = db.data.change_requests.filter(r => r.student_id === student.id);
  return res.json({ data: reqs });
});

// Submit Change Request
app.post(['/api/v1/student/requests', '/api/student/requests'], authMiddleware, studentOnly, (req, res) => {
  const { type, request_type, reason, target_branch_id } = req.body;
  const reqType = type || request_type;

  const student = db.data.students.find(s => s.user_id === req.user.id);
  if (!student) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Student not found' } });

  if (!['change_branch', 'change_datesheet', 'branch_change', 'datesheet_change'].includes(reqType)) {
    return res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid request type.' } });
  }

  const normalizedType = reqType.includes('branch') ? 'change_branch' : 'change_datesheet';

  if (!reason || reason.trim().length < 10) {
    return res.status(422).json({ error: { code: 'VALIDATION_ERROR', message: 'Reason must be at least 10 characters long.' } });
  }

  // Rule: Cannot raise request for unlocked items (Section 6.5 / [A16])
  if (normalizedType === 'change_branch' && !student.branch_id) {
    return res.status(409).json({ error: { code: 'VALIDATION_ERROR', message: 'Branch has not yet been selected.' } });
  }
  if (normalizedType === 'change_datesheet' && student.datesheet_status !== 'saved') {
    return res.status(409).json({ error: { code: 'VALIDATION_ERROR', message: 'Date sheet has not yet been saved.' } });
  }

  // Rule: No two pending requests of the same type (Section 6.5 / BR10)
  const existingPending = db.data.change_requests.find(
    r => r.student_id === student.id && r.type === normalizedType && r.status === 'pending'
  );
  if (existingPending) {
    return res.status(409).json({
      error: { code: 'REQUEST_ALREADY_PENDING', message: 'You already have a pending request of this type.' }
    });
  }

  const newReq = {
    id: 'req_' + Date.now(),
    student_id: student.id,
    type: normalizedType,
    target_branch_id: target_branch_id || null,
    reason: reason.trim(),
    status: 'pending',
    admin_remark: null,
    decided_by: null,
    decided_at: null,
    consumed_at: null,
    created_at: new Date().toISOString()
  };

  db.data.change_requests.push(newReq);
  db.save();

  return res.status(201).json({
    data: {
      message: 'Request sent. We will show the decision here.',
      request: newReq
    }
  });
});

// --------------------------------------------------------------------------
// SPA Fallback
// --------------------------------------------------------------------------
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(DIST_PATH, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[ExamSlot / VULMS Server] Running securely on http://localhost:${PORT}`);
});
