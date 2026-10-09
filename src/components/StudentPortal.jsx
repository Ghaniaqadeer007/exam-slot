import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  MapPin, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  Printer, 
  HelpCircle, 
  Send, 
  Building2, 
  BookOpen, 
  ShieldCheck, 
  GraduationCap,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import BranchedMenu from './BranchedMenu';
import RubberSegment from './RubberSegment';

export default function StudentPortal({ initialStudent, token, onLogout }) {
  const [student, setStudent] = useState(initialStudent || {});
  const [activeTab, setActiveTab] = useState(
    // If student has no branch selected yet, start at branch selection view!
    !initialStudent?.branch_id ? 'branch' : 'profile'
  );

  // Fetch full student profile if not populated yet
  useEffect(() => {
    if (!student?.id || !student?.courses) {
      fetch('/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        const s = data.data?.student || data.student;
        if (s) {
          setStudent(s);
          if (!s.branch_id) setActiveTab('branch');
        }
      })
      .catch(console.error);
    }
  }, [token]);

  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [branchConfirmOpen, setBranchConfirmOpen] = useState(false);
  const [branchSubmitting, setBranchSubmitting] = useState(false);
  const [branchError, setBranchError] = useState(null);

  // Date sheet slot picker states
  const [slotView, setSlotView] = useState('Day'); // Day, Week, Month, Year
  const [selectedSlots, setSelectedSlots] = useState({}); // { [courseId]: slotId }
  const [conflictWarning, setConflictWarning] = useState(null);
  const [datesheetSubmitting, setDatesheetSubmitting] = useState(false);
  const [datesheetError, setDatesheetError] = useState(null);
  const [datesheetSuccess, setDatesheetSuccess] = useState(false);

  // Change request states
  const [reqType, setReqType] = useState('branch_change'); // 'branch_change' | 'datesheet_change'
  const [reqTargetBranch, setReqTargetBranch] = useState('');
  const [reqReason, setReqReason] = useState('');
  const [reqSubmitting, setReqSubmitting] = useState(false);
  const [reqError, setReqError] = useState(null);
  const [reqSuccess, setReqSuccess] = useState(null);

  // Fetch branches on mount
  useEffect(() => {
    fetch('/api/branches')
      .then(res => res.json())
      .then(data => {
        setBranches(data);
        if (data.length > 0) {
          setSelectedBranchId(data[0].id);
          setReqTargetBranch(data[0].id);
        }
      })
      .catch(console.error);
  }, []);

  // Pre-fill selected slots if student already finalized
  useEffect(() => {
    if (student?.selections && student.selections.length > 0) {
      const map = {};
      student.selections.forEach(ds => {
        map[ds.course_id] = ds.slot_id;
      });
      setSelectedSlots(map);
    }
  }, [student]);

  // Real-time Conflict Detection Rule Engine
  useEffect(() => {
    if (!student?.courses) return;

    const chosenList = [];
    for (const [courseId, slotId] of Object.entries(selectedSlots)) {
      const course = student.courses.find(c => c.id === courseId);
      const slot = course?.slots?.find(s => s.id === slotId);
      if (course && slot) {
        chosenList.push({
          courseCode: course.code,
          exam_date: slot.exam_date,
          day_name: slot.day_name,
          start_time: slot.start_time,
          end_time: slot.end_time,
          time_minutes_start: slot.time_minutes_start,
          time_minutes_end: slot.time_minutes_end,
        });
      }
    }

    let conflict = null;
    for (let i = 0; i < chosenList.length; i++) {
      for (let j = i + 1; j < chosenList.length; j++) {
        const a = chosenList[i];
        const b = chosenList[j];

        if (a.exam_date === b.exam_date) {
          // Check overlap: (startA < endB) && (endA > startB)
          if (a.time_minutes_start < b.time_minutes_end && a.time_minutes_end > b.time_minutes_start) {
            conflict = `Examination Conflict Detected: Course ${a.courseCode} and ${b.courseCode} both occur on ${a.exam_date} (${a.day_name}) during overlapping hours (${a.start_time} - ${a.end_time} vs ${b.start_time} - ${b.end_time}). Please adjust your slots.`;
            break;
          }
        }
      }
      if (conflict) break;
    }

    setConflictWarning(conflict);
  }, [selectedSlots, student]);

  // Refresh student profile from server
  const refreshStudent = async () => {
    try {
      const res = await fetch('/api/student/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStudent(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // --- 1. Handle One-Time Branch Selection ---
  const handleSaveBranch = async () => {
    setBranchError(null);
    setBranchSubmitting(true);

    try {
      const res = await fetch('/api/student/branch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ branch_id: selectedBranchId })
      });

      const data = await res.json();

      if (!res.ok) {
        setBranchError(data.error || 'Failed to finalize examination branch.');
        setBranchSubmitting(false);
        setBranchConfirmOpen(false);
        return;
      }

      setStudent(data.student);
      setBranchConfirmOpen(false);
      setBranchSubmitting(false);
      // Advance to Dashboard / Date Sheet
      setActiveTab('datesheet');
    } catch (err) {
      setBranchError('Connection error while saving branch selection.');
      setBranchSubmitting(false);
      setBranchConfirmOpen(false);
    }
  };

  // --- 2. Handle Date Sheet Finalization ---
  const handleSaveDateSheet = async () => {
    setDatesheetError(null);
    setDatesheetSuccess(false);

    // Validate that all courses are selected
    const unselected = student.courses.filter(c => !selectedSlots[c.id]);
    if (unselected.length > 0) {
      setDatesheetError(`Please select an examination slot for all assigned courses. (${unselected.map(c => c.code).join(', ')} missing)`);
      return;
    }

    if (conflictWarning) {
      setDatesheetError('Cannot finalize date sheet while schedule conflicts exist.');
      return;
    }

    setDatesheetSubmitting(true);

    try {
      const res = await fetch('/api/student/datesheet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ selections: selectedSlots })
      });

      const data = await res.json();

      if (!res.ok) {
        setDatesheetError(data.error || 'Failed to save date sheet.');
        setDatesheetSubmitting(false);
        return;
      }

      setStudent(data.student);
      setDatesheetSuccess(true);
      setDatesheetSubmitting(false);
      // Switch to print view
      setActiveTab('print');
    } catch (err) {
      setDatesheetError('Connection error saving date sheet.');
      setDatesheetSubmitting(false);
    }
  };

  // --- 3. Handle Submit Change Request ---
  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setReqError(null);
    setReqSuccess(null);
    setReqSubmitting(true);

    try {
      const res = await fetch('/api/student/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          request_type: reqType,
          target_branch_id: reqType === 'branch_change' ? reqTargetBranch : null,
          reason: reqReason
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setReqError(data.error || 'Failed to submit request.');
        setReqSubmitting(false);
        return;
      }

      setReqSuccess('Your official request has been logged and forwarded to the Examination Directorate for review.');
      setReqReason('');
      setStudent(data.student);
      setReqSubmitting(false);
    } catch (err) {
      setReqError('Network error submitting request.');
      setReqSubmitting(false);
    }
  };

  const isBranchLocked = student?.branch_id && student?.branch_change_unlocked !== 1;
  const isDatesheetLocked = student?.datesheet_finalized === 1 && student?.datesheet_change_unlocked !== 1;

  return (
    <div className="student-portal-wrapper font-student flex h-screen w-screen overflow-hidden bg-[#F8F9FB]">
      {/* 1. React Bits BranchedMenu Navigation Sidebar */}
      <div className="no-print">
        <BranchedMenu
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onLogout={onLogout}
          studentInfo={student}
        />
      </div>

      {/* 2. Main Content Canvas */}
      <main className="flex-1 overflow-y-auto">
        {/* Top Header */}
        <header className="no-print sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200/80 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <h1 className="text-base font-extrabold text-gray-900 tracking-tight">
              {activeTab === 'profile' && 'Student Profile & Academic Record'}
              {activeTab === 'branch' && 'Examination Branch Selection'}
              {activeTab === 'datesheet' && 'Examination Date Sheet Design'}
              {activeTab === 'print' && 'Official Examination Roll Number Slip'}
              {activeTab === 'request' && 'Need Help & Change Requests'}
              {activeTab === 'track' && 'Request Tracker & History'}
              {activeTab === 'notices' && 'University Notice Board'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {student?.branch ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-burgundy-50 border border-burgundy-200/60 text-burgundy-900 text-xs font-bold">
                <MapPin className="w-3.5 h-3.5 text-burgundy-700" />
                <span>{student.branch.name}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Exam Center Pending</span>
              </span>
            )}
          </div>
        </header>

        {/* Dynamic Body Content */}
        <div className="p-6 sm:p-10 max-w-6xl mx-auto space-y-8">
          
          {/* Assignment Incomplete Alert Banner (PRD Section 4.1 / 6.2 / BR1) */}
          {(student?.courses?.length < 4 || student?.state === 'ASSIGNMENT_INCOMPLETE') && (
            <div className="no-print p-4 bg-rose-50 border-2 border-rose-300 text-rose-900 rounded-2xl flex items-center gap-3 shadow-xs">
              <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
              <div>
                <h4 className="font-extrabold text-xs sm:text-sm">Course Assignment Incomplete ({student?.courses?.length || 0} of 4 minimum courses)</h4>
                <p className="text-xs text-rose-700">
                  Your administrator has assigned {student?.courses?.length || 0} courses. At least 4 courses are needed before you can choose an exam branch or select datesheet slots.
                </p>
              </div>
            </div>
          )}

          {/* Unlock Notification Alert Banner (If Admin granted one-time unlock!) */}
          {(student?.branch_change_unlocked === 1 || student?.datesheet_change_unlocked === 1) && (
            <div className="no-print p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <Unlock className="w-6 h-6 text-emerald-700 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-900">One-Time Modification Granted!</h4>
                  <p className="text-xs text-emerald-700">
                    The Examination Controller has approved your change request. You may modify your {student?.branch_change_unlocked === 1 ? 'Examination Branch' : 'Date Sheet'} <strong>one time only</strong>.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab(student?.branch_change_unlocked === 1 ? 'branch' : 'datesheet')}
                className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition-colors shrink-0"
              >
                Proceed to Edit
              </button>
            </div>
          )}

          {/* =========================================================================
              VIEW 1: READ-ONLY STUDENT PROFILE
             ========================================================================= */}
          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
                <div className="p-6 sm:p-8 bg-gradient-to-r from-burgundy-900 via-burgundy-800 to-burgundy-700 text-white flex flex-col sm:flex-row items-center sm:items-start gap-6">
                  <div className="w-24 h-24 rounded-2xl bg-white/10 backdrop-blur-md border-2 border-white/30 flex items-center justify-center text-white text-3xl font-black shadow-lg">
                    <User className="w-12 h-12 text-gold-300" />
                  </div>
                  <div className="text-center sm:text-left space-y-1">
                    <div className="inline-block px-3 py-1 bg-white/15 rounded-full text-[11px] font-bold text-gold-300 uppercase tracking-widest">
                      Registered Student &bull; Active
                    </div>
                    <h2 className="text-2xl font-black">{student?.full_name || 'Enrolled Student'}</h2>
                    <p className="text-sm text-pink-100 font-mono font-semibold">{student?.vu_id || student?.registration_number || 'BC-VU'}</p>
                    <p className="text-xs text-pink-200/90">{student?.program || 'BS Computer Science'} &bull; Semester {student?.semester || 1}</p>
                  </div>
                </div>

                <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Personal & Guardian Info */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-burgundy-700" />
                      <span>Personal & Guardian Information (Read-Only)</span>
                    </h3>
                    <div className="space-y-3 bg-gray-50/80 p-5 rounded-2xl border border-gray-200/60 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-gray-200/60">
                        <span className="font-semibold text-gray-500">Father's / Guardian Name</span>
                        <span className="font-bold text-gray-900">{student?.father_name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-gray-200/60">
                        <span className="font-semibold text-gray-500">National CNIC / B-Form</span>
                        <span className="font-bold text-gray-900 font-mono">{student?.cnic || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-gray-200/60">
                        <span className="font-semibold text-gray-500">Guardian Contact Number</span>
                        <span className="font-bold text-gray-900 font-mono">{student?.guardian_contact || student?.parent_contact || student?.emergency_contact || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="font-semibold text-gray-500">Official Student Email</span>
                        <span className="font-bold text-burgundy-800 font-mono">{student?.email || ((student?.registration_number || student?.vu_id || 'student').toLowerCase() + '@vu.edu.pk')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Academic & Examination Info */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <GraduationCap className="w-3.5 h-3.5 text-burgundy-700" />
                      <span>Academic & Center Status (Read-Only)</span>
                    </h3>
                    <div className="space-y-3 bg-gray-50/80 p-5 rounded-2xl border border-gray-200/60 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-gray-200/60">
                        <span className="font-semibold text-gray-500">Cumulative GPA (CGPA)</span>
                        <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          {student?.cgpa != null ? (typeof student.cgpa === 'number' ? student.cgpa.toFixed(2) : student.cgpa) : (student?.marks_or_cgpa || '3.50')} / 4.00
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-gray-200/60">
                        <span className="font-semibold text-gray-500">Examination Center Branch</span>
                        <span className="font-bold text-gray-900">
                          {student?.branch ? student.branch.name : 'Not finalized'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-gray-200/60">
                        <span className="font-semibold text-gray-500">Date Sheet Status</span>
                        <span className="font-bold text-gray-900">
                          {student?.datesheet_finalized === 1 || student?.datesheet_status === 'saved' || (student?.selections && student.selections.length > 0) ? (
                            <span className="text-emerald-700 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Finalized & Confirmed
                            </span>
                          ) : (
                            <span className="text-amber-700">Pending Configuration</span>
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="font-semibold text-gray-500">Total Enrolled Courses</span>
                        <span className="font-bold text-gray-900">{student?.courses?.length || 0} Courses</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Banner to proceed */}
              <div className="flex justify-end gap-3">
                {!student.branch_id ? (
                  <button
                    onClick={() => setActiveTab('branch')}
                    className="px-6 py-3 rounded-2xl bg-burgundy-700 text-white font-extrabold text-xs shadow-md shadow-burgundy-900/20 hover:bg-burgundy-800 transition-all flex items-center gap-2"
                  >
                    <span>Proceed to Select Exam Branch</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : student.datesheet_finalized === 0 ? (
                  <button
                    onClick={() => setActiveTab('datesheet')}
                    className="px-6 py-3 rounded-2xl bg-burgundy-700 text-white font-extrabold text-xs shadow-md shadow-burgundy-900/20 hover:bg-burgundy-800 transition-all flex items-center gap-2"
                  >
                    <span>Proceed to Design Date Sheet</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveTab('print')}
                    className="px-6 py-3 rounded-2xl bg-burgundy-700 text-white font-extrabold text-xs shadow-md shadow-burgundy-900/20 hover:bg-burgundy-800 transition-all flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    <span>View & Print Official Slip</span>
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* =========================================================================
              VIEW 2: BRANCH SELECTION (ONE-TIME ONLY ENFORCED)
             ========================================================================= */}
          {activeTab === 'branch' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* If branch is locked already */}
              {isBranchLocked ? (
                <div className="bg-white rounded-3xl border border-gray-200/80 p-8 shadow-sm text-center max-w-xl mx-auto space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 mx-auto">
                    <Lock className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900">Examination Branch Finalized</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    You have already finalized your examination center at:
                  </p>
                  <div className="p-4 bg-burgundy-50 border border-burgundy-200/80 rounded-2xl text-burgundy-900 font-bold text-sm">
                    {student.branch?.name}
                    <div className="text-xs text-gray-500 font-normal mt-1">{student.branch?.address}</div>
                  </div>
                  <p className="text-xs text-gray-400">
                    As per university policy, this selection is permanent. To request a transfer, submit an official request under the <strong>Need Help</strong> desk.
                  </p>
                  <button
                    onClick={() => setActiveTab('datesheet')}
                    className="mt-4 px-6 py-2.5 bg-burgundy-700 text-white text-xs font-bold rounded-xl hover:bg-burgundy-800 transition-colors"
                  >
                    Go to Date Sheet Configuration
                  </button>
                </div>
              ) : (
                /* One-Time Branch Selection Form */
                <div className="bg-white rounded-3xl border border-gray-200/80 p-8 shadow-sm space-y-6">
                  <div className="max-w-2xl">
                    <span className="text-xs font-bold text-burgundy-700 uppercase tracking-wider">Mandatory One-Time Action</span>
                    <h2 className="text-2xl font-black text-gray-900 mt-1">Select Your Examination Branch</h2>
                    <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                      Please choose the physical Virtual University campus where you intend to take your Midterm and Final examinations. 
                      <strong className="text-burgundy-900"> Note: This selection can be made only once and will lock immediately.</strong>
                    </p>
                  </div>

                  {branchError && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>{branchError}</span>
                    </div>
                  )}

                  {/* Branches Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {branches.map(b => (
                      <div
                        key={b.id}
                        onClick={() => setSelectedBranchId(b.id)}
                        className={`cursor-pointer p-5 rounded-2xl border-2 transition-all ${
                          selectedBranchId === b.id
                            ? 'border-burgundy-700 bg-burgundy-50/40 shadow-md shadow-burgundy-900/10'
                            : 'border-gray-200 hover:border-burgundy-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <Building2 className={`w-5 h-5 ${selectedBranchId === b.id ? 'text-burgundy-700' : 'text-gray-400'}`} />
                            <h4 className="text-sm font-bold text-gray-900">{b.name}</h4>
                          </div>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-bold">
                            {b.code}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">{b.address}</p>
                        <div className="mt-3 flex items-center justify-between text-[11px] text-gray-400">
                          <span>City: {b.city}</span>
                          <span className="font-semibold text-emerald-700">Seating Capacity: {b.capacity}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    {student?.courses?.length < 4 ? (
                      <span className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Assignment incomplete: Administrator must assign at least 4 courses before you can select branch.</span>
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Review carefully &bull; One-time choice</span>
                    )}
                    <button
                      type="button"
                      onClick={() => setBranchConfirmOpen(true)}
                      disabled={!selectedBranchId || student?.courses?.length < 4}
                      className="px-8 py-3.5 bg-burgundy-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-burgundy-900/20 hover:bg-burgundy-800 disabled:opacity-40 transition-all flex items-center gap-2"
                    >
                      <span>Finalize Examination Branch</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Confirmation Modal */}
              <AnimatePresence>
                {branchConfirmOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 mx-auto">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-black text-center text-gray-900">Confirm Branch Finalization</h3>
                      <p className="text-xs text-gray-600 text-center leading-relaxed">
                        Are you sure you want to finalize this exam center? Once saved, you <strong>cannot change it freely</strong> and will take all examinations at this location.
                      </p>

                      <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-xs font-bold text-center text-burgundy-900">
                        {branches.find(b => b.id === selectedBranchId)?.name}
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setBranchConfirmOpen(false)}
                          className="flex-1 py-2.5 rounded-xl border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveBranch}
                          disabled={branchSubmitting}
                          className="flex-1 py-2.5 rounded-xl bg-burgundy-700 text-white text-xs font-extrabold shadow-md hover:bg-burgundy-800 transition-colors"
                        >
                          {branchSubmitting ? 'Finalizing...' : 'Yes, Confirm & Lock'}
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* =========================================================================
              VIEW 3: DATE SHEET DESIGN PAGE & SLOT PICKER
             ========================================================================= */}
          {activeTab === 'datesheet' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Header with React Bits RubberSegment */}
              <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <span className="text-xs font-bold text-burgundy-700 uppercase tracking-wider">Exam Scheduler</span>
                  <h2 className="text-2xl font-black text-gray-900 mt-1">Design Your Examination Date Sheet</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Select your preferred date and time for each course. Ensure no two papers overlap.
                  </p>
                </div>

                {/* RubberSegment Component */}
                <div className="flex flex-col items-end gap-1.5">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Calendar Slot View</span>
                  <RubberSegment
                    options={['Day', 'Week', 'Month', 'Year']}
                    value={slotView}
                    onChange={setSlotView}
                  />
                </div>
              </div>

              {/* Conflict Error Banner */}
              {conflictWarning && (
                <div className="p-4 bg-red-50 border-2 border-red-300 text-red-900 rounded-2xl text-xs sm:text-sm font-bold flex items-start gap-3 shadow-xs">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-black text-red-800">Exam Slot Conflict!</span>
                    <span className="font-medium text-red-700">{conflictWarning}</span>
                  </div>
                </div>
              )}

              {datesheetError && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs font-semibold">
                  {datesheetError}
                </div>
              )}

              {/* Already locked banner */}
              {isDatesheetLocked && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-xs text-amber-900 font-bold">
                    <Lock className="w-4 h-4 text-amber-700" />
                    <span>Your Date Sheet is already finalized and confirmed. To make changes, submit a request via Need Help.</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('print')}
                    className="px-4 py-1.5 bg-burgundy-700 text-white rounded-lg text-xs font-bold hover:bg-burgundy-800"
                  >
                    View / Print Slip
                  </button>
                </div>
              )}

              {/* Assigned Courses Slot Selection Cards */}
              <div className="space-y-4">
                {student.courses?.map((course) => {
                  const currentSlotId = selectedSlots[course.id];
                  const currentSlot = course.slots?.find(s => s.id === currentSlotId);

                  return (
                    <div 
                      key={course.id}
                      className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs transition-all hover:border-burgundy-200"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Course Info */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-burgundy-50 border border-burgundy-200 text-burgundy-900 font-extrabold font-mono text-xs">
                              {course.code}
                            </span>
                            <span className="text-xs text-gray-400 font-semibold">{course.credit_hours} Credits &bull; {course.department}</span>
                          </div>
                          <h4 className="text-base font-extrabold text-gray-900">{course.title}</h4>
                        </div>

                        {/* Slot Selector */}
                        <div className="flex items-center gap-3">
                          <div className="w-full sm:w-auto">
                            <select
                              disabled={isDatesheetLocked}
                              value={currentSlotId || ''}
                              onChange={(e) => {
                                setSelectedSlots(prev => ({
                                  ...prev,
                                  [course.id]: e.target.value
                                }));
                              }}
                              className={`w-full sm:w-80 px-3.5 py-2.5 rounded-xl text-xs font-bold border ${
                                currentSlotId 
                                  ? 'border-burgundy-700 bg-burgundy-50/40 text-burgundy-900' 
                                  : 'border-gray-300 text-gray-600 bg-gray-50'
                              } focus:outline-none focus:ring-2 focus:ring-burgundy-700/20`}
                            >
                              <option value="">-- Select Exam Date & Time --</option>
                              {course.slots?.map(slot => (
                                <option key={slot.id} value={slot.id}>
                                  {slot.exam_date} ({slot.day_name}) &bull; {slot.start_time} - {slot.end_time}
                                </option>
                              ))}
                            </select>
                          </div>

                          {currentSlotId ? (
                            <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                              <CheckCircle2 className="w-4 h-4" />
                            </span>
                          ) : (
                            <span className="w-7 h-7 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center shrink-0">
                              <Clock className="w-4 h-4" />
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Selected Slot Feedback */}
                      {currentSlot && (
                        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                          <span className="flex items-center gap-1.5 text-burgundy-800 font-semibold">
                            <Calendar className="w-3.5 h-3.5" />
                            Scheduled: {currentSlot.exam_date} ({currentSlot.day_name}) at {currentSlot.start_time}
                          </span>
                          <span className="text-gray-400 font-mono text-[11px]">Center: {student.branch?.name || 'Assigned Branch'}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Save & Finalize Date Sheet Action */}
              {!isDatesheetLocked && (
                <div className="bg-white rounded-3xl border border-gray-200/80 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                  <div>
                    <h4 className="text-sm font-extrabold text-gray-900">Ready to Finalize?</h4>
                    <p className="text-xs text-gray-500">
                      Once confirmed, your date sheet will be locked. Subsequent changes require administrative approval.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveDateSheet}
                    disabled={datesheetSubmitting || Boolean(conflictWarning)}
                    className={`px-8 py-3.5 rounded-xl font-extrabold text-xs sm:text-sm text-white shadow-lg transition-all ${
                      conflictWarning
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-burgundy-700 hover:bg-burgundy-800 shadow-burgundy-900/20'
                    }`}
                  >
                    {datesheetSubmitting ? 'Validating & Finalizing...' : 'Save & Generate Official Date Sheet'}
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* =========================================================================
              VIEW 4: OFFICIAL PRINTABLE DATE SHEET SLIP (PRINT & PDF)
             ========================================================================= */}
          {activeTab === 'print' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Actions Header (Hidden in Print) */}
              <div className="no-print flex items-center justify-between bg-white rounded-2xl p-4 border border-gray-200 shadow-xs">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900">Examination Roll Number Slip</h3>
                  <p className="text-xs text-gray-500">Authorized document for entry into the university exam hall.</p>
                </div>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2.5 bg-burgundy-700 text-white rounded-xl text-xs font-bold hover:bg-burgundy-800 transition-all flex items-center gap-2 shadow-md shadow-burgundy-900/20"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Date Sheet (PDF)</span>
                </button>
              </div>

              {/* Printable Examination Slip Card */}
              <div className="print-card bg-white rounded-3xl border border-gray-300 p-8 sm:p-12 shadow-md space-y-8">
                {/* University Header */}
                <div className="border-b-2 border-burgundy-900 pb-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-burgundy-900 flex items-center justify-center text-white shadow-md">
                      <GraduationCap className="w-9 h-9 text-gold-300" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-burgundy-900 uppercase tracking-tight">
                        EXAMSLOT — EXAMINATION PORTAL
                      </h2>
                      <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                        Office of the Controller of Examinations &bull; Midterm Fall 2026
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 bg-burgundy-50 border border-burgundy-200 text-burgundy-900 rounded-full font-bold text-xs">
                      Official Exam Slip
                    </span>
                    <p className="text-[11px] text-gray-400 font-mono mt-1">Date: {new Date().toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Candidate & Center Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-xs bg-gray-50/80 p-6 rounded-2xl border border-gray-200">
                  <div>
                    <span className="text-gray-400 font-bold block uppercase text-[10px]">Student Name</span>
                    <span className="font-extrabold text-gray-900 text-sm">{student?.full_name || 'Student Candidate'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-bold block uppercase text-[10px]">Student ID (Roll No)</span>
                    <span className="font-mono font-extrabold text-burgundy-800 text-sm">{student?.vu_id || student?.registration_number || 'BC-VU'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-bold block uppercase text-[10px]">Father's Name</span>
                    <span className="font-bold text-gray-900">{student?.father_name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-bold block uppercase text-[10px]">Degree Program</span>
                    <span className="font-bold text-gray-900">{student?.program || 'BS Computer Science'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-400 font-bold block uppercase text-[10px]">Examination Center & City</span>
                    <span className="font-extrabold text-gray-900">{student?.branch?.name || 'Campus Center'} ({student?.branch?.city || 'Pakistan'})</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-400 font-bold block uppercase text-[10px]">Campus Address</span>
                    <span className="text-gray-600 font-medium">{student?.branch?.address || 'Designated Examination Hall'}</span>
                  </div>
                </div>

                {/* Date Sheet Table */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Confirmed Examination Schedule</h4>
                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-burgundy-900 text-white font-bold uppercase text-[11px]">
                        <tr>
                          <th className="p-3">Course Code</th>
                          <th className="p-3">Course Title</th>
                          <th className="p-3">Exam Date</th>
                          <th className="p-3">Day</th>
                          <th className="p-3">Time</th>
                          <th className="p-3">Room / Lab</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 font-medium text-gray-800">
                        {student?.courses?.map(course => {
                          const slot = course.selectedSlot || course.slots?.find(s => s.id === selectedSlots[course.id]);
                          return (
                            <tr key={course.id} className="hover:bg-gray-50">
                              <td className="p-3 font-mono font-bold text-burgundy-800">{course.code}</td>
                              <td className="p-3 font-semibold">{course.title}</td>
                              <td className="p-3 font-bold">{slot?.exam_date || 'TBD'}</td>
                              <td className="p-3">{slot?.day_name || 'TBD'}</td>
                              <td className="p-3 font-mono font-bold">{slot ? `${slot.start_time} - ${slot.end_time}` : 'TBD'}</td>
                              <td className="p-3 font-mono text-gray-500">Lab #02</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Examination Guidelines */}
                <div className="border-t border-gray-200 pt-6 text-[11px] text-gray-500 space-y-1.5">
                  <h5 className="font-bold text-gray-800 uppercase">Instructions for Candidates:</h5>
                  <p>&bull; Candidates must bring their original Computerized National Identity Card (CNIC) and this printed Examination Slip.</p>
                  <p>&bull; Mobile phones, smartwatches, and programmable devices are strictly prohibited inside the examination center.</p>
                  <p>&bull; Candidates must report to the examination hall at least 15 minutes before the scheduled start time.</p>
                </div>

                {/* Stamp & Verification */}
                <div className="pt-8 flex justify-between items-end border-t border-gray-200">
                  <div className="text-[11px] text-gray-400 font-mono">
                    System Generated Slip &bull; Verification Hash: EXAMSLOT-{student?.vu_id || student?.registration_number || '2026'}-2026
                  </div>
                  <div className="text-center space-y-1">
                    <div className="w-32 border-b border-gray-400 mx-auto" />
                    <span className="text-xs font-bold text-gray-800 uppercase block">Controller of Examinations</span>
                    <span className="text-[10px] text-gray-400">ExamSlot &bull; Virtual University</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* =========================================================================
              VIEW 5: NEED HELP & CHANGE REQUESTS WORKFLOW
             ========================================================================= */}
          {activeTab === 'request' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-sm space-y-6">
                <div>
                  <span className="text-xs font-bold text-burgundy-700 uppercase tracking-wider">Help Desk & Petitions</span>
                  <h2 className="text-2xl font-black text-gray-900 mt-1">Submit Change Request</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    If you have already finalized your branch or date sheet and require an official change due to extenuating circumstances, submit a formal request for administrative review.
                  </p>
                </div>

                {reqSuccess && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{reqSuccess}</span>
                  </div>
                )}

                {reqError && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span>{reqError}</span>
                  </div>
                )}

                <form onSubmit={handleSubmitRequest} className="space-y-5">
                  {/* Choice 1 & 2 */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 uppercase">Select Request Type</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div
                        onClick={() => setReqType('branch_change')}
                        className={`cursor-pointer p-4 rounded-2xl border-2 transition-all ${
                          reqType === 'branch_change'
                            ? 'border-burgundy-700 bg-burgundy-50 text-burgundy-900 font-bold'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <MapPin className="w-4 h-4 text-burgundy-700" />
                          <span className="text-xs sm:text-sm">1. Request to Change Branch</span>
                        </div>
                      </div>

                      <div
                        onClick={() => setReqType('datesheet_change')}
                        className={`cursor-pointer p-4 rounded-2xl border-2 transition-all ${
                          reqType === 'datesheet_change'
                            ? 'border-burgundy-700 bg-burgundy-50 text-burgundy-900 font-bold'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Calendar className="w-4 h-4 text-burgundy-700" />
                          <span className="text-xs sm:text-sm">2. Request to Change Date Sheet</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Target Branch Dropdown if branch change */}
                  {reqType === 'branch_change' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase">Desired Target Branch</label>
                      <select
                        value={reqTargetBranch}
                        onChange={(e) => setReqTargetBranch(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 text-xs font-semibold focus:outline-none focus:border-burgundy-700"
                      >
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>{b.name} ({b.city})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Reason Textarea */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase">
                      Substantive Reason & Justification (Minimum 10 characters)
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={reqReason}
                      onChange={(e) => setReqReason(e.target.value)}
                      placeholder="Explain your relocation, medical, or official requirement necessitating this change..."
                      className="w-full p-4 rounded-xl border border-gray-300 text-xs font-medium focus:outline-none focus:border-burgundy-700 focus:ring-2 focus:ring-burgundy-100"
                    />
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-[11px] text-gray-400">
                      Rule: Only one pending request per type is permitted at a time.
                    </span>
                    <button
                      type="submit"
                      disabled={reqSubmitting || reqReason.trim().length < 10}
                      className="px-6 py-3 bg-burgundy-700 text-white rounded-xl text-xs font-bold shadow-md hover:bg-burgundy-800 transition-colors flex items-center gap-2 disabled:bg-gray-400"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{reqSubmitting ? 'Submitting...' : 'Submit Official Request'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* View Past Requests Button */}
              <div className="flex justify-end">
                <button
                  onClick={() => setActiveTab('track')}
                  className="text-xs font-bold text-burgundy-700 hover:underline flex items-center gap-1"
                >
                  <span>View your submitted request statuses & history &rarr;</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* =========================================================================
              VIEW 6: TRACK REQUEST STATUS & ADMIN REMARKS
             ========================================================================= */}
          {activeTab === 'track' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-sm space-y-6">
                <div>
                  <span className="text-xs font-bold text-burgundy-700 uppercase tracking-wider">Request Tracker</span>
                  <h2 className="text-2xl font-black text-gray-900 mt-1">Status of Submitted Petitions</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Live status and official remarks from the examination directorate.
                  </p>
                </div>

                {student.requests?.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 text-xs">
                    You have not submitted any change requests yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {student.requests?.map(r => (
                      <div key={r.id} className="p-5 rounded-2xl border border-gray-200/80 bg-gray-50/50 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold uppercase text-burgundy-900">
                              {r.request_type === 'branch_change' ? 'Branch Change' : 'Date Sheet Change'}
                            </span>
                            <span className="text-[11px] text-gray-400 font-mono">
                              &bull; Submitted on {new Date(r.created_at).toLocaleDateString()}
                            </span>
                          </div>

                          {/* Status Badge */}
                          {r.status === 'pending' && (
                            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" /> Pending Review
                            </span>
                          )}
                          {r.status === 'approved' && (
                            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                            </span>
                          )}
                          {r.status === 'rejected' && (
                            <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 text-[11px] font-bold">
                              Rejected
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-gray-600 bg-white p-3 rounded-xl border border-gray-100">
                          <strong className="text-gray-700">Student Justification:</strong> {r.reason}
                        </p>

                        {r.admin_remarks && (
                          <div className="p-3 bg-burgundy-50 border border-burgundy-200/60 rounded-xl text-xs text-burgundy-900">
                            <strong>Controller Remarks:</strong> {r.admin_remarks}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* =========================================================================
              VIEW 7: NOTICES
             ========================================================================= */}
          {activeTab === 'notices' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="bg-white rounded-3xl border border-gray-200/80 p-8 shadow-sm space-y-4">
                <h3 className="text-xl font-black text-gray-900">University Examination Directorate Notices</h3>
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs space-y-1">
                    <span className="font-bold text-burgundy-800 uppercase text-[10px]">Oct 14, 2026 &bull; Priority</span>
                    <h5 className="font-bold text-gray-900 text-sm">Fall 2026 Examination Date Sheet Making Interface Active</h5>
                    <p className="text-gray-600">The online date sheet interface is now open for all students. Ensure there are no exam conflicts before locking your schedule.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs space-y-1">
                    <span className="font-bold text-gray-800 uppercase text-[10px]">Oct 08, 2026 &bull; Center Guidelines</span>
                    <h5 className="font-bold text-gray-900 text-sm">One-Time Examination Branch Selection Enforced</h5>
                    <p className="text-gray-600">Students must select their preferred center carefully. Modifying finalized centers will require formal petition approval.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </div>
      </main>
    </div>
  );
}
