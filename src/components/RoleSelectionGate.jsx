import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GraduationCap, 
  ShieldCheck, 
  ArrowRight, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  AlertCircle,
  Sparkles,
  Repeat,
  UserPlus,
  ArrowLeft,
  Mail,
  Phone,
  BookOpen,
  CheckCircle2,
  Briefcase,
  BadgeCheck
} from 'lucide-react';
import FlipCard from './FlipCard';
import StatusMark from './StatusMark';

/**
 * RoleSelectionGate Component
 * Features React Bits <FlipCard /> with 3D Y-axis flip animation:
 * - Front Face: Student Login with "Sign up?" button to switch to first-time 3-group registration
 * - Back Face: Admin Login with "Sign up?" button to switch to Admin registration
 * - Real database persistence for all user and admin accounts
 * - Typography in Arial Bold and Helvetica.
 */
export default function RoleSelectionGate({ onLoginSuccess }) {
  // FlipCard controlled state: false = Student (Front), true = Admin (Back)
  const [selectedRole, setSelectedRole] = useState('student'); // 'student' | 'admin'
  const isFlipped = selectedRole === 'admin';

  // Front face mode: 'login' | 'signup'
  const [studentMode, setStudentMode] = useState('login');
  
  // Back face mode: 'login' | 'signup'
  const [adminMode, setAdminMode] = useState('login');

  // Login Form states
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);

  // StatusMark state: 'idle' | 'running' | 'done'
  const [authStatus, setAuthStatus] = useState('idle');
  const [authStatusLabel, setAuthStatusLabel] = useState('');
  const [authResultData, setAuthResultData] = useState(null);

  // Forgot password modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotInput, setForgotInput] = useState('');
  const [forgotMessage, setForgotMessage] = useState(null);

  // Student Sign-Up form state (All 3 groups per Section 4.3)
  const [signupForm, setSignupForm] = useState({
    // Group 1: Personal
    full_name: '',
    email: '',
    phone: '',
    cnic: '',
    dob: '',
    gender: 'Male',
    address: '',
    // Group 2: Parent / Guardian
    father_name: '',
    parent_cnic: '',
    parent_occupation: '',
    parent_contact: '',
    emergency_contact: '',
    // Group 3: Academic
    registration_number: '',
    program: 'BS Computer Science',
    semester: '1',
    session: 'Fall 2026',
    previous_qualification: 'HSSC / Intermediate',
    previous_institute: '',
    marks_or_cgpa: '',
    // Security
    password: '',
    confirm_password: ''
  });

  // Admin Sign-Up form state
  const [adminSignupForm, setAdminSignupForm] = useState({
    full_name: '',
    email: '',
    department: 'Examination Authority',
    staff_id: '',
    password: '',
    confirm_password: ''
  });

  const handleSignupChange = (e) => {
    const { name, value } = e.target;
    setSignupForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAdminSignupChange = (e) => {
    const { name, value } = e.target;
    setAdminSignupForm(prev => ({ ...prev, [name]: value }));
  };

  // Switch between student and admin
  const handleToggleRole = (role) => {
    setSelectedRole(role);
    setErrorMessage(null);
  };

  // Submit Student or Admin Login
  const handleLoginSubmit = async (e, roleType) => {
    e.preventDefault();
    setErrorMessage(null);
    setAuthStatusLabel(roleType === 'student' ? 'Validating Student Credentials...' : 'Authenticating Administrative Officer...');
    setAuthStatus('running');

    const u = roleType === 'student' ? username : adminUsername;
    const p = roleType === 'student' ? password : adminPassword;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vu_id: u,
          password: p,
          role: roleType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setAuthStatus('idle');
        setErrorMessage(data.error?.message || data.error || 'Authentication failed. Please verify credentials.');
        return;
      }

      const payload = data.data || data;
      setAuthResultData(payload);
      setTimeout(() => {
        setAuthStatus('done');
      }, 400);

      // Transition into portal seamlessly
      setTimeout(() => {
        onLoginSuccess(payload);
      }, 900);

    } catch (err) {
      setAuthStatus('idle');
      setErrorMessage('Unable to connect to authentication server. Please verify your connection.');
    }
  };

  // Submit First-Time Student Sign-Up
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (signupForm.password !== signupForm.confirm_password) {
      setErrorMessage('Passwords do not match. Please ensure both passwords match.');
      return;
    }

    if (signupForm.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setAuthStatusLabel('Registering Student Profile & Persisting to Database...');
    setAuthStatus('running');

    try {
      const response = await fetch('/api/v1/auth/student-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupForm),
      });

      const data = await response.json();

      if (!response.ok) {
        setAuthStatus('idle');
        setErrorMessage(data.error?.message || data.error || 'Registration failed. Please check required fields.');
        return;
      }

      const payload = data.data || data;
      setAuthResultData(payload);
      setTimeout(() => {
        setAuthStatus('done');
      }, 400);

      // Transition into portal seamlessly
      setTimeout(() => {
        onLoginSuccess(payload);
      }, 900);

    } catch (err) {
      setAuthStatus('idle');
      setErrorMessage('Registration server error. Please try again.');
    }
  };

  // Submit Admin Sign-Up
  const handleAdminSignupSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (adminSignupForm.password !== adminSignupForm.confirm_password) {
      setErrorMessage('Passwords do not match. Please verify both passwords.');
      return;
    }

    if (adminSignupForm.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setAuthStatusLabel('Creating Administrative Account & Saving to Database...');
    setAuthStatus('running');

    try {
      const response = await fetch('/api/v1/auth/admin-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminSignupForm),
      });

      const data = await response.json();

      if (!response.ok) {
        setAuthStatus('idle');
        setErrorMessage(data.error?.message || data.error || 'Admin registration failed.');
        return;
      }

      const payload = data.data || data;
      setAuthResultData(payload);
      setTimeout(() => {
        setAuthStatus('done');
      }, 400);

      // Transition into portal seamlessly
      setTimeout(() => {
        onLoginSuccess(payload);
      }, 900);

    } catch (err) {
      setAuthStatus('idle');
      setErrorMessage('Server connection error. Please try again.');
    }
  };

  // Submit Forgot Password
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email_or_id: forgotInput }),
      });
      const data = await res.json();
      setForgotMessage(data.data?.message || 'Password reset link sent to your registered address.');
    } catch {
      setForgotMessage('Password reset request logged. Please check your registered email.');
    }
  };

  // Determine card height dynamically
  const cardHeight = (!isFlipped && studentMode === 'signup') || (isFlipped && adminMode === 'signup') ? 800 : 620;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 sm:py-14 font-sans">
      {/* Top Identity & Instruction Header */}
      <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-burgundy-50 border border-burgundy-200/80 text-burgundy-800 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-gold-500" />
          <span>Single Sign-On Security Gateway</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 tracking-tight">
          Are you a <span className="text-burgundy-700">Student</span> or an <span className="text-burgundy-900">Authority/Admin</span>?
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 font-bold">
          Flip the card to switch between Student Portal and Administrative Authority Console.
        </p>

        {/* Quick Role Toggle Bar */}
        <div className="pt-2 flex justify-center">
          <div className="inline-flex items-center p-1.5 bg-gray-200/80 rounded-2xl shadow-inner gap-1">
            <button
              type="button"
              onClick={() => handleToggleRole('student')}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                !isFlipped 
                  ? 'bg-burgundy-700 text-white shadow-md shadow-burgundy-900/20' 
                  : 'text-gray-700 hover:text-black hover:bg-white/60'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Student Portal</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleRole('admin')}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                isFlipped 
                  ? 'bg-burgundy-900 text-white shadow-md shadow-burgundy-950/30' 
                  : 'text-gray-700 hover:text-black hover:bg-white/60'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Authority / Admin</span>
              <Repeat className="w-3.5 h-3.5 opacity-70 ml-0.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main FlipCard Component Area */}
      <div className="flex justify-center items-center py-2">
        <FlipCard
          axis="y"
          flipped={isFlipped}
          onFlipChange={(flipped) => setSelectedRole(flipped ? 'admin' : 'student')}
          flipOnClick={false}
          draggable={true}
          tilt={true}
          tiltMax={10}
          glare={true}
          glareOpacity={0.16}
          hoverScale={1.01}
          perspective={1100}
          stiffness={160}
          damping={22}
          width={640}
          height={cardHeight}
          radius={24}
          background="#ffffff"
          color="#1e2024"
          shadow={true}
          shadowColor="#4D1321"
          shadowOpacity={0.25}
          className="w-full max-w-2xl"
          /* ------------------------------------------------------------- */
          /* FRONT FACE: STUDENT LOGIN & SIGN-UP RECTANGLE CARD           */
          /* ------------------------------------------------------------- */
          front={
            <div className="w-full h-full bg-white flex flex-col justify-between overflow-hidden relative">
              {/* Top Accent Strip */}
              <div className="h-2 bg-gradient-to-r from-burgundy-700 via-burgundy-600 to-burgundy-800 shrink-0" />

              {/* StatusMark Screen if validating */}
              {authStatus !== 'idle' && !isFlipped ? (
                <div className="flex-1 flex items-center justify-center p-8">
                  <StatusMark 
                    status={authStatus} 
                    label={authStatusLabel}
                    onComplete={() => onLoginSuccess(authResultData)}
                  />
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8 sm:py-8 space-y-5">
                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-burgundy-50 border border-burgundy-200/80 flex items-center justify-center text-burgundy-700 shadow-sm">
                        <GraduationCap className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-burgundy-700 block">
                          Official Student Portal
                        </span>
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                          {studentMode === 'login' ? 'Student Sign In' : 'New Student Sign Up'}
                        </h3>
                      </div>
                    </div>

                    {/* Button to flip to Admin */}
                    <button
                      type="button"
                      data-no-drag="true"
                      onClick={() => handleToggleRole('admin')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-burgundy-50 border border-gray-200 hover:border-burgundy-200 text-gray-700 hover:text-burgundy-800 text-xs font-bold transition-all"
                      title="Flip card to Admin Portal"
                    >
                      <span>Admin</span>
                      <Repeat className="w-3.5 h-3.5 text-burgundy-700" />
                    </button>
                  </div>

                  {errorMessage && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* ========================================================= */}
                  {/* MODE 1: STUDENT LOGIN                                    */}
                  {/* ========================================================= */}
                  {studentMode === 'login' ? (
                    <form onSubmit={(e) => handleLoginSubmit(e, 'student')} className="space-y-4">
                      {/* Student ID / Email */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-bold text-gray-700 uppercase">
                          <span>Student ID / Official Email</span>
                          <span className="text-gray-400 font-bold lowercase">e.g. std3@examslot.test or BC220201234</span>
                        </div>
                        <div className="relative flex items-center">
                          <User className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
                          <input
                            type="text"
                            required
                            data-no-drag="true"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter Student ID or Email"
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 text-sm font-bold text-gray-900 focus:outline-none focus:border-burgundy-700 focus:ring-2 focus:ring-burgundy-100 transition-all"
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold text-gray-700 uppercase">Password</label>
                          <button
                            type="button"
                            data-no-drag="true"
                            onClick={() => setShowForgotModal(true)}
                            className="text-xs font-bold text-burgundy-700 hover:text-burgundy-900 transition-colors"
                          >
                            Forgot Password?
                          </button>
                        </div>
                        <div className="relative flex items-center">
                          <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            data-no-drag="true"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            className="w-full pl-10 pr-11 py-3 rounded-xl border border-gray-300 text-sm font-bold text-gray-900 focus:outline-none focus:border-burgundy-700 focus:ring-2 focus:ring-burgundy-100 transition-all"
                          />
                          <button
                            type="button"
                            data-no-drag="true"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Login Submit Button */}
                      <button
                        type="submit"
                        data-no-drag="true"
                        className="w-full py-3.5 px-6 rounded-xl bg-burgundy-700 text-white font-bold text-sm sm:text-base shadow-lg shadow-burgundy-900/25 hover:bg-burgundy-800 transition-all flex items-center justify-center gap-2"
                      >
                        <span>Sign In to Student Portal</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>

                      {/* Prominent Underneath "Sign up?" Prompt */}
                      <div className="pt-4 pb-2 border-t border-gray-100 text-center space-y-2">
                        <div className="text-xs text-gray-600 font-bold">
                          First time accessing the portal or new student?
                        </div>
                        <button
                          type="button"
                          data-no-drag="true"
                          onClick={() => {
                            setErrorMessage(null);
                            setStudentMode('signup');
                          }}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-burgundy-50 hover:bg-burgundy-100 border border-burgundy-200 text-burgundy-800 text-xs sm:text-sm font-bold transition-all shadow-sm"
                        >
                          <UserPlus className="w-4 h-4 text-burgundy-700" />
                          <span>Sign up? (New Student Registration)</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* ========================================================= */
                    /* MODE 2: FIRST-TIME STUDENT SIGN-UP (3 GROUPS)            */
                    /* ========================================================= */
                    <form onSubmit={handleSignupSubmit} className="space-y-6">
                      <div className="p-3 bg-burgundy-50/70 border border-burgundy-200 rounded-xl text-xs text-burgundy-900 font-bold flex items-center justify-between">
                        <span>Fill in all details to initialize your official student account:</span>
                        <button
                          type="button"
                          data-no-drag="true"
                          onClick={() => {
                            setErrorMessage(null);
                            setStudentMode('login');
                          }}
                          className="inline-flex items-center gap-1 text-burgundy-700 hover:text-black underline font-bold"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>Back to Login</span>
                        </button>
                      </div>

                      {/* Group 1: Personal Information */}
                      <div className="space-y-3 bg-gray-50/70 p-4 rounded-2xl border border-gray-200">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-burgundy-800">
                          <User className="w-4 h-4 text-burgundy-700" />
                          <span>Group 1: Personal Information</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="font-bold text-gray-700 block mb-1">Full Name *</label>
                            <input
                              type="text"
                              required
                              name="full_name"
                              data-no-drag="true"
                              value={signupForm.full_name}
                              onChange={handleSignupChange}
                              placeholder="e.g. Fatima Ali"
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 font-bold text-gray-900 focus:outline-none focus:border-burgundy-700"
                            />
                          </div>
                          <div>
                            <label className="font-bold text-gray-700 block mb-1">Official Email *</label>
                            <input
                              type="email"
                              required
                              name="email"
                              data-no-drag="true"
                              value={signupForm.email}
                              onChange={handleSignupChange}
                              placeholder="e.g. fatima.ali@student.vu.edu.pk"
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 font-bold text-gray-900 focus:outline-none focus:border-burgundy-700"
                            />
                          </div>
                          <div>
                            <label className="font-bold text-gray-700 block mb-1">Phone Number *</label>
                            <input
                              type="text"
                              required
                              name="phone"
                              data-no-drag="true"
                              value={signupForm.phone}
                              onChange={handleSignupChange}
                              placeholder="e.g. +92 300 1234567"
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 font-bold text-gray-900 focus:outline-none focus:border-burgundy-700"
                            />
                          </div>
                          <div>
                            <label className="font-bold text-gray-700 block mb-1">CNIC / B-Form *</label>
                            <input
                              type="text"
                              required
                              name="cnic"
                              data-no-drag="true"
                              value={signupForm.cnic}
                              onChange={handleSignupChange}
                              placeholder="e.g. 35201-1234567-1"
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 font-bold text-gray-900 focus:outline-none focus:border-burgundy-700"
                            />
                          </div>
                          <div>
                            <label className="font-bold text-gray-700 block mb-1">Date of Birth *</label>
                            <input
                              type="date"
                              required
                              name="dob"
                              data-no-drag="true"
                              value={signupForm.dob}
                              onChange={handleSignupChange}
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 font-bold text-gray-900 focus:outline-none focus:border-burgundy-700"
                            />
                          </div>
                          <div>
                            <label className="font-bold text-gray-700 block mb-1">Gender *</label>
                            <select
                              name="gender"
                              data-no-drag="true"
                              value={signupForm.gender}
                              onChange={handleSignupChange}
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 font-bold text-gray-900 focus:outline-none focus:border-burgundy-700"
                            >
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                          <div className="sm:col-span-2">
                            <label className="font-bold text-gray-700 block mb-1">Residential Address *</label>
                            <input
                              type="text"
                              required
                              name="address"
                              data-no-drag="true"
                              value={signupForm.address}
                              onChange={handleSignupChange}
                              placeholder="e.g. House 42, Street 8, Sector G-10, Islamabad"
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 font-bold text-gray-900 focus:outline-none focus:border-burgundy-700"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Group 2: Parent / Guardian Information */}
                      <div className="space-y-3 bg-gray-50/70 p-4 rounded-2xl border border-gray-200">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-burgundy-800">
                          <ShieldCheck className="w-4 h-4 text-burgundy-700" />
                          <span>Group 2: Parent / Guardian Details</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="font-bold text-gray-700 block mb-1">Father / Guardian Name *</label>
                            <input
                              type="text"
                              required
                              name="father_name"
                              data-no-drag="true"
                              value={signupForm.father_name}
                              onChange={handleSignupChange}
                              placeholder="e.g. Muhammad Ali"
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 font-bold text-gray-900 focus:outline-none focus:border-burgundy-700"
                            />
                          </div>
                          <div>
                            <label className="font-bold text-gray-700 block mb-1">Parent CNIC *</label>
                            <input
                              type="text"
                              required
                              name="parent_cnic"
                              data-no-drag="true"
                              value={signupForm.parent_cnic}
                              onChange={handleSignupChange}
                              placeholder="e.g. 35201-7654321-1"
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 font-bold text-gray-900 focus:outline-none focus:border-burgundy-700"
                            />
                          </div>
                          <div>
                            <label className="font-bold text-gray-700 block mb-1">Parent Occupation *</label>
                            <input
                              type="text"
                              required
                              name="parent_occupation"
                              data-no-drag="true"
                              value={signupForm.parent_occupation}
                              onChange={handleSignupChange}
                              placeholder="e.g. Engineer / Officer"
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 font-bold text-gray-900 focus:outline-none focus:border-burgundy-700"
                            />
                          </div>
                          <div>
                            <label className="font-bold text-gray-700 block mb-1">Parent Contact Number *</label>
                            <input
                              type="text"
                              required
                              name="parent_contact"
                              data-no-drag="true"
                              value={signupForm.parent_contact}
                              onChange={handleSignupChange}
                              placeholder="e.g. +92 301 9876543"
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 font-bold text-gray-900 focus:outline-none focus:border-burgundy-700"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="font-bold text-gray-700 block mb-1">Emergency Contact Number *</label>
                            <input
                              type="text"
                              required
                              name="emergency_contact"
                              data-no-drag="true"
                              value={signupForm.emergency_contact}
                              onChange={handleSignupChange}
                              placeholder="e.g. +92 302 1122334"
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 font-bold text-gray-900 focus:outline-none focus:border-burgundy-700"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Group 3: Academic Information */}
                      <div className="space-y-3 bg-gray-50/70 p-4 rounded-2xl border border-gray-200">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-burgundy-800">
                          <BookOpen className="w-4 h-4 text-burgundy-700" />
                          <span>Group 3: Academic Profile</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="font-bold text-gray-700 block mb-1">Registration / VU ID (Optional)</label>
                            <input
                              type="text"
                              name="registration_number"
                              data-no-drag="true"
                              value={signupForm.registration_number}
                              onChange={handleSignupChange}
                              placeholder="Leave blank to auto-generate"
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 font-bold text-gray-900 focus:outline-none focus:border-burgundy-700"
                            />
                          </div>
                          <div>
                            <label className="font-bold text-gray-700 block mb-1">Degree Program *</label>
                            <select
                              name="program"
                              data-no-drag="true"
                              value={signupForm.program}
                              onChange={handleSignupChange}
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 font-bold text-gray-900 focus:outline-none focus:border-burgundy-700"
                            >
                              <option value="BS Computer Science">BS Computer Science</option>
                              <option value="BS Software Engineering">BS Software Engineering</option>
                              <option value="BS Information Technology">BS Information Technology</option>
                              <option value="Bachelor of Business Administration">Bachelor of Business Administration</option>
                            </select>
                          </div>
                          <div>
                            <label className="font-bold text-gray-700 block mb-1">Semester</label>
                            <select
                              name="semester"
                              data-no-drag="true"
                              value={signupForm.semester}
                              onChange={handleSignupChange}
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 font-bold text-gray-900 focus:outline-none focus:border-burgundy-700"
                            >
                              {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                                <option key={s} value={s}>Semester {s}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="font-bold text-gray-700 block mb-1">Session / Batch</label>
                            <input
                              type="text"
                              name="session"
                              data-no-drag="true"
                              value={signupForm.session}
                              onChange={handleSignupChange}
                              placeholder="e.g. Fall 2026"
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 font-bold text-gray-900 focus:outline-none focus:border-burgundy-700"
                            />
                          </div>
                          <div>
                            <label className="font-bold text-gray-700 block mb-1">Previous Institute *</label>
                            <input
                              type="text"
                              required
                              name="previous_institute"
                              data-no-drag="true"
                              value={signupForm.previous_institute}
                              onChange={handleSignupChange}
                              placeholder="e.g. Punjab Group of Colleges"
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 font-bold text-gray-900 focus:outline-none focus:border-burgundy-700"
                            />
                          </div>
                          <div>
                            <label className="font-bold text-gray-700 block mb-1">Marks / CGPA *</label>
                            <input
                              type="text"
                              required
                              name="marks_or_cgpa"
                              data-no-drag="true"
                              value={signupForm.marks_or_cgpa}
                              onChange={handleSignupChange}
                              placeholder="e.g. 85% or 3.70 CGPA"
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 font-bold text-gray-900 focus:outline-none focus:border-burgundy-700"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Security / Password */}
                      <div className="space-y-3 bg-gray-50/70 p-4 rounded-2xl border border-gray-200">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-burgundy-800">
                          <Lock className="w-4 h-4 text-burgundy-700" />
                          <span>Account Security</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="font-bold text-gray-700 block mb-1">Create Password *</label>
                            <input
                              type="password"
                              required
                              name="password"
                              data-no-drag="true"
                              value={signupForm.password}
                              onChange={handleSignupChange}
                              placeholder="Minimum 6 characters"
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 font-bold text-gray-900 focus:outline-none focus:border-burgundy-700"
                            />
                          </div>
                          <div>
                            <label className="font-bold text-gray-700 block mb-1">Confirm Password *</label>
                            <input
                              type="password"
                              required
                              name="confirm_password"
                              data-no-drag="true"
                              value={signupForm.confirm_password}
                              onChange={handleSignupChange}
                              placeholder="Re-enter password"
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 font-bold text-gray-900 focus:outline-none focus:border-burgundy-700"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Register Button */}
                      <button
                        type="submit"
                        data-no-drag="true"
                        className="w-full py-3.5 px-6 rounded-xl bg-burgundy-700 text-white font-bold text-sm sm:text-base shadow-lg shadow-burgundy-900/25 hover:bg-burgundy-800 transition-all flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                        <span>Complete Registration & Open Student Portal</span>
                      </button>

                      {/* Back to Login Link */}
                      <div className="text-center pt-2">
                        <button
                          type="button"
                          data-no-drag="true"
                          onClick={() => {
                            setErrorMessage(null);
                            setStudentMode('login');
                          }}
                          className="text-xs font-bold text-burgundy-700 hover:text-black underline"
                        >
                          Already have an account? Back to Student Login
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          }
          /* ------------------------------------------------------------- */
          /* BACK FACE: AUTHORITY / ADMIN LOGIN & SIGN-UP CARD            */
          /* ------------------------------------------------------------- */
          back={
            <div className="w-full h-full bg-white flex flex-col justify-between overflow-hidden relative">
              {/* Top Accent Strip */}
              <div className="h-2 bg-gradient-to-r from-burgundy-900 via-gray-900 to-burgundy-900 shrink-0" />

              {/* StatusMark Screen if validating */}
              {authStatus !== 'idle' && isFlipped ? (
                <div className="flex-1 flex items-center justify-center p-8">
                  <StatusMark 
                    status={authStatus} 
                    label={authStatusLabel}
                    onComplete={() => onLoginSuccess(authResultData)}
                  />
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8 sm:py-8 space-y-5">
                  {/* Card Header */}
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-burgundy-900 text-white flex items-center justify-center shadow-md shadow-burgundy-950/30">
                        <ShieldCheck className="w-6 h-6 text-gold-300" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-burgundy-800 block">
                          Administrative Gateway
                        </span>
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                          {adminMode === 'login' ? 'Authority & Admin Console' : 'New Admin Registration'}
                        </h3>
                      </div>
                    </div>

                    {/* Button to flip back to Student */}
                    <button
                      type="button"
                      data-no-drag="true"
                      onClick={() => handleToggleRole('student')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-burgundy-50 border border-gray-200 hover:border-burgundy-200 text-gray-700 hover:text-burgundy-800 text-xs font-bold transition-all"
                      title="Flip back to Student Portal"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 text-burgundy-700" />
                      <span>Student</span>
                    </button>
                  </div>

                  {errorMessage && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* ========================================================= */}
                  {/* ADMIN MODE 1: LOGIN                                       */}
                  {/* ========================================================= */}
                  {adminMode === 'login' ? (
                    <form onSubmit={(e) => handleLoginSubmit(e, 'admin')} className="space-y-4">
                      {/* Admin Email */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-bold text-gray-700 uppercase">
                          <span>Admin Identity / Email</span>
                          <span className="text-gray-400 font-bold lowercase">e.g. admin@examslot.test</span>
                        </div>
                        <div className="relative flex items-center">
                          <User className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
                          <input
                            type="text"
                            required
                            data-no-drag="true"
                            value={adminUsername}
                            onChange={(e) => setAdminUsername(e.target.value)}
                            placeholder="Enter Admin Email or Staff ID"
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 text-sm font-bold text-gray-900 focus:outline-none focus:border-burgundy-900 focus:ring-2 focus:ring-burgundy-100 transition-all"
                          />
                        </div>
                      </div>

                      {/* Admin Password */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-bold text-gray-700 uppercase">
                          <span>Admin Security Password</span>
                        </div>
                        <div className="relative flex items-center">
                          <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
                          <input
                            type="password"
                            required
                            data-no-drag="true"
                            value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                            placeholder="Enter admin password"
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 text-sm font-bold text-gray-900 focus:outline-none focus:border-burgundy-900 focus:ring-2 focus:ring-burgundy-100 transition-all"
                          />
                        </div>
                      </div>

                      {/* Admin Submit Button */}
                      <button
                        type="submit"
                        data-no-drag="true"
                        className="w-full py-3.5 px-6 rounded-xl bg-burgundy-900 hover:bg-black text-white font-bold text-sm sm:text-base shadow-lg shadow-burgundy-950/25 transition-all flex items-center justify-center gap-2"
                      >
                        <ShieldCheck className="w-4 h-4 text-gold-400" />
                        <span>Authorize & Enter Admin Console</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>

                      {/* Prominent Underneath "Admin Sign up?" Prompt */}
                      <div className="pt-4 pb-2 border-t border-gray-100 text-center space-y-2">
                        <div className="text-xs text-gray-600 font-bold">
                          New university authority officer or administrator?
                        </div>
                        <button
                          type="button"
                          data-no-drag="true"
                          onClick={() => {
                            setErrorMessage(null);
                            setAdminMode('signup');
                          }}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-burgundy-50 hover:bg-burgundy-100 border border-burgundy-200 text-burgundy-900 text-xs sm:text-sm font-bold transition-all shadow-sm"
                        >
                          <BadgeCheck className="w-4 h-4 text-burgundy-800" />
                          <span>Sign up? (New Authority / Admin Registration)</span>
                        </button>
                      </div>

                      {/* Flip back to Student portal */}
                      <div className="pt-2 text-center">
                        <button
                          type="button"
                          data-no-drag="true"
                          onClick={() => handleToggleRole('student')}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-burgundy-800 hover:text-black transition-colors"
                        >
                          <Repeat className="w-3.5 h-3.5 text-burgundy-700" />
                          <span>Need Student Portal? Flip card back to Student Login</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* ========================================================= */
                    /* ADMIN MODE 2: REGISTRATION / SIGN-UP                      */
                    /* ========================================================= */
                    <form onSubmit={handleAdminSignupSubmit} className="space-y-4">
                      <div className="p-3 bg-burgundy-50 border border-burgundy-200 rounded-xl text-xs text-burgundy-900 font-bold flex items-center justify-between">
                        <span>Register an administrative authority officer profile:</span>
                        <button
                          type="button"
                          data-no-drag="true"
                          onClick={() => {
                            setErrorMessage(null);
                            setAdminMode('login');
                          }}
                          className="inline-flex items-center gap-1 text-burgundy-800 hover:text-black underline font-bold"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>Back to Admin Login</span>
                        </button>
                      </div>

                      <div className="space-y-3 bg-gray-50/70 p-4 rounded-2xl border border-gray-200 text-xs">
                        <div>
                          <label className="font-bold text-gray-700 block mb-1">Full Name & Title *</label>
                          <input
                            type="text"
                            required
                            name="full_name"
                            data-no-drag="true"
                            value={adminSignupForm.full_name}
                            onChange={handleAdminSignupChange}
                            placeholder="e.g. Dr. Arshad Malik (Controller of Exams)"
                            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 font-bold text-gray-900 focus:outline-none focus:border-burgundy-900"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="font-bold text-gray-700 block mb-1">Official University Email *</label>
                            <input
                              type="email"
                              required
                              name="email"
                              data-no-drag="true"
                              value={adminSignupForm.email}
                              onChange={handleAdminSignupChange}
                              placeholder="e.g. arshad.malik@vu.edu.pk"
                              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 font-bold text-gray-900 focus:outline-none focus:border-burgundy-900"
                            />
                          </div>
                          <div>
                            <label className="font-bold text-gray-700 block mb-1">Staff / Employee ID (Optional)</label>
                            <input
                              type="text"
                              name="staff_id"
                              data-no-drag="true"
                              value={adminSignupForm.staff_id}
                              onChange={handleAdminSignupChange}
                              placeholder="e.g. EMP-9042"
                              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 font-bold text-gray-900 focus:outline-none focus:border-burgundy-900"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="font-bold text-gray-700 block mb-1">Department / Directorate *</label>
                          <select
                            name="department"
                            data-no-drag="true"
                            value={adminSignupForm.department}
                            onChange={handleAdminSignupChange}
                            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 font-bold text-gray-900 focus:outline-none focus:border-burgundy-900"
                          >
                            <option value="Examination Authority">Examination Authority & Conduct Directorate</option>
                            <option value="Controller of Examinations">Office of the Controller of Examinations</option>
                            <option value="Academic Affairs">Academic Affairs & Course Scheduling</option>
                            <option value="Campus Administration">Nationwide Campus Operations</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="font-bold text-gray-700 block mb-1">Password *</label>
                            <input
                              type="password"
                              required
                              name="password"
                              data-no-drag="true"
                              value={adminSignupForm.password}
                              onChange={handleAdminSignupChange}
                              placeholder="Minimum 6 characters"
                              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 font-bold text-gray-900 focus:outline-none focus:border-burgundy-900"
                            />
                          </div>
                          <div>
                            <label className="font-bold text-gray-700 block mb-1">Confirm Password *</label>
                            <input
                              type="password"
                              required
                              name="confirm_password"
                              data-no-drag="true"
                              value={adminSignupForm.confirm_password}
                              onChange={handleAdminSignupChange}
                              placeholder="Re-enter password"
                              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 font-bold text-gray-900 focus:outline-none focus:border-burgundy-900"
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        data-no-drag="true"
                        className="w-full py-3.5 px-6 rounded-xl bg-burgundy-900 hover:bg-black text-white font-bold text-sm sm:text-base shadow-lg shadow-burgundy-950/25 transition-all flex items-center justify-center gap-2"
                      >
                        <ShieldCheck className="w-5 h-5 text-gold-300" />
                        <span>Register Admin Profile & Open Console</span>
                      </button>

                      <div className="text-center pt-2">
                        <button
                          type="button"
                          data-no-drag="true"
                          onClick={() => {
                            setErrorMessage(null);
                            setAdminMode('login');
                          }}
                          className="text-xs font-bold text-burgundy-900 hover:text-black underline"
                        >
                          Already have an administrative account? Back to Admin Login
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          }
        />
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl relative"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-2">Password Recovery Assistance</h3>
              <p className="text-xs text-gray-500 font-bold mb-6 leading-relaxed">
                Enter your official student email or VU Registration ID to generate a secure, single-use 24-hour password recovery token.
              </p>

              {forgotMessage ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold mb-6">
                  {forgotMessage}
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="space-y-4 mb-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase">Student ID or Official Email</label>
                    <input
                      type="text"
                      required
                      value={forgotInput}
                      onChange={(e) => setForgotInput(e.target.value)}
                      placeholder="e.g. std3@examslot.test or BC220201234"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-bold text-gray-900 focus:outline-none focus:border-burgundy-700"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-burgundy-700 text-white text-xs font-bold hover:bg-burgundy-800 transition-colors"
                  >
                    Dispatch Password Reset Link
                  </button>
                </form>
              )}

              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotMessage(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
