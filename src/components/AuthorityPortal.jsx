import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Users, 
  Building2, 
  BookOpen, 
  Calendar, 
  Clock, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  LogOut, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Mail, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Layers,
  ArrowRight,
  Send,
  Eye,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import LineSidebar from './LineSidebar';

export default function AuthorityPortal({ token, onLogout }) {
  // Navigation tabs: 'dashboard' | 'branches' | 'courses' | 'students' | 'assignments' | 'slots' | 'requests'
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Notification Toast
  const [toast, setToast] = useState(null);

  // --------------------------------------------------------------------------
  // Server-Side Paginated Resources State
  // --------------------------------------------------------------------------
  const [stats, setStats] = useState(null);

  // Branches
  const [branchData, setBranchData] = useState({ data: [], meta: { page: 1, pageSize: 10, total: 0, totalPages: 1 } });
  const [branchSearch, setBranchSearch] = useState('');
  const [branchStatus, setBranchStatus] = useState('');
  const [branchPage, setBranchPage] = useState(1);
  const [branchModal, setBranchModal] = useState({ open: false, mode: 'create', data: null });

  // Courses
  const [courseData, setCourseData] = useState({ data: [], meta: { page: 1, pageSize: 10, total: 0, totalPages: 1 } });
  const [courseSearch, setCourseSearch] = useState('');
  const [courseStatus, setCourseStatus] = useState('');
  const [coursePage, setCoursePage] = useState(1);
  const [courseModal, setCourseModal] = useState({ open: false, mode: 'create', data: null });

  // Students
  const [studentData, setStudentData] = useState({ data: [], meta: { page: 1, pageSize: 10, total: 0, totalPages: 1 } });
  const [studentSearch, setStudentSearch] = useState('');
  const [studentProgram, setStudentProgram] = useState('');
  const [studentPage, setStudentPage] = useState(1);
  const [studentModal, setStudentModal] = useState({ open: false, mode: 'create', data: null });
  const [setupLinkModal, setSetupLinkModal] = useState(null);
  const [copiedSetupLink, setCopiedSetupLink] = useState(false);

  // Assignments
  const [assignData, setAssignData] = useState({ data: [], meta: { page: 1, pageSize: 10, total: 0, totalPages: 1 } });
  const [assignSearch, setAssignSearch] = useState('');
  const [assignPage, setAssignPage] = useState(1);
  const [assignModal, setAssignModal] = useState({ open: false, student: null, selectedCourses: [] });

  // Slots
  const [slotData, setSlotData] = useState({ data: [], meta: { page: 1, pageSize: 10, total: 0, totalPages: 1 } });
  const [slotSearch, setSlotSearch] = useState('');
  const [slotPage, setSlotPage] = useState(1);
  const [slotModal, setSlotModal] = useState({ open: false, mode: 'create', data: null });

  // Requests
  const [reqData, setReqData] = useState({ data: [], meta: { page: 1, pageSize: 10, total: 0, totalPages: 1 } });
  const [reqStatus, setReqStatus] = useState('pending');
  const [reqSearch, setReqSearch] = useState('');
  const [reqPage, setReqPage] = useState(1);
  const [reqModal, setReqModal] = useState({ open: false, request: null, decision: 'approved', remark: '' });

  // Registered System Accounts (Admin & Student Users)
  const [userData, setUserData] = useState({ data: [], meta: { page: 1, pageSize: 10, total: 0, totalPages: 1 } });
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userPage, setUserPage] = useState(1);

  // All active courses & branches helper list for selects
  const [allCourses, setAllCourses] = useState([]);
  const [allBranches, setAllBranches] = useState([]);

  // Fetch stats & helpers
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/v1/admin/stats', { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (json.data) setStats(json.data);
    } catch (e) { console.error(e); }
  };

  const fetchHelpers = async () => {
    try {
      const [cRes, bRes] = await Promise.all([
        fetch('/api/v1/admin/courses?pageSize=100', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/v1/admin/branches?pageSize=100', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const cJson = await cRes.json();
      const bJson = await bRes.json();
      if (cJson.data) setAllCourses(cJson.data);
      if (bJson.data) setAllBranches(bJson.data);
    } catch (e) { console.error(e); }
  };

  // --------------------------------------------------------------------------
  // Server-Side Fetchers with Pagination & Search
  // --------------------------------------------------------------------------
  const fetchBranches = async () => {
    try {
      const params = new URLSearchParams({ page: branchPage, pageSize: 10, search: branchSearch, status: branchStatus });
      const res = await fetch(`/api/v1/admin/branches?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      setBranchData(json);
    } catch (e) { console.error(e); }
  };

  const fetchCourses = async () => {
    try {
      const params = new URLSearchParams({ page: coursePage, pageSize: 10, search: courseSearch, status: courseStatus });
      const res = await fetch(`/api/v1/admin/courses?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      setCourseData(json);
    } catch (e) { console.error(e); }
  };

  const fetchStudents = async () => {
    try {
      const params = new URLSearchParams({ page: studentPage, pageSize: 10, search: studentSearch, program: studentProgram });
      const res = await fetch(`/api/v1/admin/students?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      setStudentData(json);
    } catch (e) { console.error(e); }
  };

  const fetchAssignments = async () => {
    try {
      const params = new URLSearchParams({ page: assignPage, pageSize: 10, search: assignSearch });
      const res = await fetch(`/api/v1/admin/assignments?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      setAssignData(json);
    } catch (e) { console.error(e); }
  };

  const fetchSlots = async () => {
    try {
      const params = new URLSearchParams({ page: slotPage, pageSize: 10, search: slotSearch });
      const res = await fetch(`/api/v1/admin/slots?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      setSlotData(json);
    } catch (e) { console.error(e); }
  };

  const fetchRequests = async () => {
    try {
      const params = new URLSearchParams({ page: reqPage, pageSize: 10, search: reqSearch, status: reqStatus });
      const res = await fetch(`/api/v1/admin/requests?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      setReqData(json);
    } catch (e) { console.error(e); }
  };

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams({ page: userPage, pageSize: 10, search: userSearch, role: userRoleFilter });
      const res = await fetch(`/api/v1/admin/users?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      setUserData(json);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchStats();
    fetchHelpers();
  }, []);

  useEffect(() => { fetchBranches(); }, [branchPage, branchSearch, branchStatus]);
  useEffect(() => { fetchCourses(); }, [coursePage, courseSearch, courseStatus]);
  useEffect(() => { fetchStudents(); }, [studentPage, studentSearch, studentProgram]);
  useEffect(() => { fetchAssignments(); }, [assignPage, assignSearch]);
  useEffect(() => { fetchSlots(); }, [slotPage, slotSearch]);
  useEffect(() => { fetchRequests(); }, [reqPage, reqSearch, reqStatus]);
  useEffect(() => { fetchUsers(); }, [userPage, userSearch, userRoleFilter]);

  // Show Toast
  const notify = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // --------------------------------------------------------------------------
  // Action Handlers
  // --------------------------------------------------------------------------
  // Delete Branch (Safe Delete)
  const handleDeleteBranch = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete branch "${name}"?`)) return;
    try {
      const res = await fetch(`/api/v1/admin/branches/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (!res.ok) {
        notify('error', json.error?.message || 'Cannot delete branch.');
      } else {
        notify('success', json.data?.message || 'Branch deleted successfully.');
        fetchBranches();
        fetchStats();
      }
    } catch (e) { notify('error', 'Network error.'); }
  };

  // Delete Course (Safe Delete)
  const handleDeleteCourse = async (id, code) => {
    if (!window.confirm(`Are you sure you want to delete course "${code}"?`)) return;
    try {
      const res = await fetch(`/api/v1/admin/courses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (!res.ok) {
        notify('error', json.error?.message || 'Cannot delete course.');
      } else {
        notify('success', json.data?.message || 'Course deleted successfully.');
        fetchCourses();
        fetchStats();
      }
    } catch (e) { notify('error', 'Network error.'); }
  };

  // Delete Slot (Protected Chosen Slot)
  const handleDeleteSlot = async (id) => {
    if (!window.confirm('Delete this exam slot?')) return;
    try {
      const res = await fetch(`/api/v1/admin/slots/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (!res.ok) {
        notify('error', json.error?.message || 'Cannot delete chosen slot.');
      } else {
        notify('success', 'Exam slot removed.');
        fetchSlots();
      }
    } catch (e) { notify('error', 'Network error.'); }
  };

  // Resend Setup Email for Student
  const handleResendSetup = async (id) => {
    try {
      const res = await fetch(`/api/v1/admin/students/${id}/resend-setup`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (res.ok) {
        setSetupLinkModal({
          link: json.data.setupLink,
          email: json.data.emailLog.to,
          title: 'Account Setup Email Re-issued'
        });
        notify('success', 'Setup email link generated.');
      }
    } catch (e) { notify('error', 'Failed to resend email.'); }
  };

  // Save Assignment 4-6 Rule
  const handleSaveAssignments = async () => {
    const { student, selectedCourses } = assignModal;
    if (selectedCourses.length < 4 || selectedCourses.length > 6) {
      notify('error', 'Student must have at least 4 and at most 6 courses assigned.');
      return;
    }
    try {
      const res = await fetch(`/api/v1/admin/students/${student.studentId}/assignments`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ courseIds: selectedCourses })
      });
      const json = await res.json();
      if (!res.ok) {
        notify('error', json.error?.message || 'Failed to update assignments.');
      } else {
        notify('success', json.data?.message || 'Assignments updated.');
        setAssignModal({ open: false, student: null, selectedCourses: [] });
        fetchAssignments();
        fetchStats();
      }
    } catch (e) { notify('error', 'Network error.'); }
  };

  // Decide Request
  const handleDecideRequest = async (e) => {
    e.preventDefault();
    const { request, decision, remark } = reqModal;
    try {
      const res = await fetch(`/api/v1/admin/requests/${request.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ decision, remark })
      });
      const json = await res.json();
      if (!res.ok) {
        notify('error', json.error?.message || 'Error processing request.');
      } else {
        notify('success', json.data?.message || 'Request processed.');
        setReqModal({ open: false, request: null, decision: 'approved', remark: '' });
        fetchRequests();
        fetchStats();
      }
    } catch (e) { notify('error', 'Network error.'); }
  };

  return (
    <div className="admin-portal-wrapper font-admin min-h-screen bg-[#F7F8FB] text-[#151823] flex flex-col">
      {/* Top Notification Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-bold border ${
              toast.type === 'error'
                ? 'bg-red-50 text-red-900 border-red-300'
                : 'bg-emerald-50 text-emerald-900 border-emerald-300'
            }`}
          >
            {toast.type === 'error' ? <AlertTriangle className="w-4 h-4 text-red-600" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            <span>{toast.message}</span>
          </motion.div>
        </div>
      )}

      {/* Top Navbar */}
      <header className="bg-gradient-to-r from-burgundy-950 via-burgundy-900 to-burgundy-800 text-white px-6 sm:px-10 py-4 shadow-lg flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white">
            <ShieldCheck className="w-6 h-6 text-gold-300" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight leading-tight">
              ExamSlot &bull; Admin Directorate
            </h1>
            <p className="text-[11px] text-pink-200">ExamSlot Examination & Date Sheet Authority</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden md:inline-flex text-[11px] font-bold px-3 py-1 bg-white/10 rounded-full border border-white/20 text-gold-300">
            Official Access &bull; admin@examslot.test
          </span>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white text-burgundy-900 hover:bg-gold-300 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Layout with Animated LineSidebar Navigation */}
      <div className="flex-1 flex flex-col lg:flex-row w-full">
        {/* Left Desktop Rail: Interactive LineSidebar */}
        <aside className="hidden lg:flex w-72 shrink-0 bg-white border-r border-gray-200 p-6 flex-col justify-between min-h-[calc(100vh-73px)] shadow-xs">
          <div className="space-y-6">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-burgundy-800 block mb-1">
                EXAMINATION CONTROLLER
              </span>
              <h2 className="text-sm font-black text-gray-900 tracking-tight">
                Directorate Navigation
              </h2>
            </div>

            <LineSidebar
              items={[
                'Overview & Metrics',
                'User Accounts & Credentials',
                'Branch Management (4.1)',
                'Course Management (4.2)',
                'Student Accounts (4.3)',
                'Course Assignments (4.4)',
                'Exam Slots & Capacity (4.5)',
                'Petitions & Unlocks (4.6)'
              ]}
              accentColor="#6B1D2F"
              textColor="#4b5563"
              markerColor="#cbd5e1"
              showIndex={true}
              showMarker={true}
              proximityRadius={85}
              maxShift={20}
              falloff="smooth"
              markerLength={38}
              markerGap={6}
              itemGap={15}
              fontSize={0.88}
              activeTab={['dashboard', 'users', 'branches', 'courses', 'students', 'assignments', 'slots', 'requests'].indexOf(activeTab)}
              onItemClick={(idx) => {
                const tabs = ['dashboard', 'users', 'branches', 'courses', 'students', 'assignments', 'slots', 'requests'];
                setActiveTab(tabs[idx]);
              }}
            />
          </div>

          <div className="pt-6 border-t border-gray-100 space-y-2 text-[11px] font-bold text-gray-500">

            <div className="flex justify-between items-center">
              <span>Semester:</span>
              <span className="text-burgundy-900">Fall 2026</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Course Boundary:</span>
              <span className="text-emerald-700">4 to 6 Rules</span>
            </div>
          </div>
        </aside>

        {/* Mobile / Tablet Horizontal Navigation Strip */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 overflow-x-auto no-scrollbar shadow-xs">
          <nav className="flex space-x-2 py-2 text-xs font-bold">
            {[
              { id: 'dashboard', label: 'Metrics', icon: Layers },
              { id: 'users', label: 'All Accounts', icon: ShieldCheck },
              { id: 'branches', label: 'Branches', icon: Building2 },
              { id: 'courses', label: 'Courses', icon: BookOpen },
              { id: 'students', label: 'Students', icon: Users },
              { id: 'assignments', label: 'Assignments', icon: CheckCircle2 },
              { id: 'slots', label: 'Slots', icon: Clock },
              { id: 'requests', label: 'Petitions', icon: HelpCircle, badge: stats?.pendingRequests }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-burgundy-700 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-burgundy-50 hover:text-burgundy-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-burgundy-950 text-[10px] font-black">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <main className="flex-1 p-6 sm:p-10 max-w-7xl mx-auto w-full space-y-8 overflow-x-hidden">
        
        {/* =========================================================================
            TAB 0: DASHBOARD & METRICS
           ========================================================================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-burgundy-50 text-burgundy-800 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Total Students</span>
                  <span className="text-2xl font-black text-gray-900">{stats?.totalStudents || 0}</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Finalized Date Sheets</span>
                  <span className="text-2xl font-black text-gray-900">{stats?.savedDateSheets || 0}</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Pending Petitions</span>
                  <span className="text-2xl font-black text-amber-700">{stats?.pendingRequests || 0}</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-800 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Incomplete Assignments</span>
                  <span className="text-2xl font-black text-rose-700">{stats?.incompleteAssignments || 0}</span>
                </div>
              </div>
            </div>


          </div>
        )}

        {/* =========================================================================
            TAB 1: USER ACCOUNTS & SYSTEM CREDENTIALS
           ========================================================================= */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-black text-gray-900">System User Accounts & Credentials</h2>
                <p className="text-xs text-gray-500">Live registry of all registered Admin officers, Student accounts, and system credentials.</p>
              </div>
              <button
                onClick={() => fetchUsers()}
                className="px-4 py-2.5 bg-burgundy-700 text-white rounded-xl text-xs font-bold hover:bg-burgundy-800 transition-all flex items-center gap-2 shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh Live Registry</span>
              </button>
            </div>

            {/* Search & Role Filter Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search accounts by email, VU ID, or name..."
                  value={userSearch}
                  onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:border-burgundy-700"
                />
              </div>
              <select
                value={userRoleFilter}
                onChange={(e) => { setUserRoleFilter(e.target.value); setUserPage(1); }}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none"
              >
                <option value="">All Account Roles</option>
                <option value="admin">Admin / Authority Only</option>
                <option value="student">Student Accounts Only</option>
              </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-gray-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F1F3F8] text-gray-600 font-bold uppercase text-[10px] border-b border-gray-200">
                  <tr>
                    <th className="p-3.5">User Identity / Email</th>
                    <th className="p-3.5">Registration / Staff ID</th>
                    <th className="p-3.5">Account Role</th>
                    <th className="p-3.5">Registered Password</th>
                    <th className="p-3.5">Registered Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 font-medium">
                  {userData.data.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50/60">
                      <td className="p-3.5 font-bold text-gray-900">
                        <div>{u.email}</div>
                        {u.full_name && <div className="text-[11px] text-gray-400 font-normal">{u.full_name}</div>}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-burgundy-900">{u.vu_id || 'N/A'}</td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          u.role === 'admin' 
                            ? 'bg-burgundy-100 text-burgundy-900 border border-burgundy-200' 
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-gray-600 font-bold">{u.password || '••••••••'}</td>
                      <td className="p-3.5 text-gray-400 text-[11px]">
                        {u.created_at ? new Date(u.created_at).toLocaleString() : 'Recent'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
              <span>Showing {userData.data.length} of {userData.meta?.total} registered accounts (Newest first)</span>
              <div className="flex gap-2">
                <button
                  disabled={userPage <= 1}
                  onClick={() => setUserPage(p => p - 1)}
                  className="px-3 py-1.5 border rounded-lg disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="px-3 py-1.5 font-bold">Page {userPage} of {userData.meta?.totalPages}</span>
                <button
                  disabled={userPage >= userData.meta?.totalPages}
                  onClick={() => setUserPage(p => p + 1)}
                  className="px-3 py-1.5 border rounded-lg disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 1: 4.1 BRANCH MANAGEMENT (FULL CRUD + SAFE DELETE)
           ========================================================================= */}
        {activeTab === 'branches' && (
          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-black text-gray-900">4.1 Examination Branch Management</h2>
                <p className="text-xs text-gray-500">Create, view, update, and safe-delete examination campuses nationwide.</p>
              </div>
              <button
                onClick={() => setBranchModal({ open: true, mode: 'create', data: { code: '', name: '', city: '', address: '', contact_number: '', status: 'active', capacity: 500 } })}
                className="px-4 py-2.5 bg-burgundy-700 text-white rounded-xl text-xs font-bold hover:bg-burgundy-800 transition-all flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Branch</span>
              </button>
            </div>

            {/* Toolbar: Search + Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search branches by name, city, code..."
                  value={branchSearch}
                  onChange={(e) => { setBranchSearch(e.target.value); setBranchPage(1); }}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:border-burgundy-700"
                />
              </div>
              <select
                value={branchStatus}
                onChange={(e) => { setBranchStatus(e.target.value); setBranchPage(1); }}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-gray-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F1F3F8] text-gray-600 font-bold uppercase text-[10px] border-b border-gray-200">
                  <tr>
                    <th className="p-3.5">Code</th>
                    <th className="p-3.5">Branch Name</th>
                    <th className="p-3.5">City</th>
                    <th className="p-3.5">Contact</th>
                    <th className="p-3.5">Chosen Count</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 font-medium">
                  {branchData.data.map(b => (
                    <tr key={b.id} className="hover:bg-gray-50/60">
                      <td className="p-3.5 font-mono font-bold text-burgundy-900">{b.code}</td>
                      <td className="p-3.5">
                        <div className="font-bold text-gray-900">{b.name}</div>
                        <div className="text-[11px] text-gray-400">{b.address}</div>
                      </td>
                      <td className="p-3.5">{b.city}</td>
                      <td className="p-3.5 font-mono text-[11px]">{b.contact_number}</td>
                      <td className="p-3.5 font-bold text-emerald-800">{b.studentCount || 0} Students</td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${b.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => setBranchModal({ open: true, mode: 'edit', data: { ...b } })}
                          className="p-1.5 text-gray-600 hover:text-burgundy-800 rounded-lg hover:bg-gray-100"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteBranch(b.id, b.name)}
                          className="p-1.5 text-red-600 hover:text-red-800 rounded-lg hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Server-Side Pagination Footer */}
            <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
              <span>Showing {branchData.data.length} of {branchData.meta?.total} branches (Server-side paginated)</span>
              <div className="flex gap-2">
                <button
                  disabled={branchPage <= 1}
                  onClick={() => setBranchPage(p => p - 1)}
                  className="px-3 py-1.5 border rounded-lg disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="px-3 py-1.5 font-bold">Page {branchPage} of {branchData.meta?.totalPages}</span>
                <button
                  disabled={branchPage >= branchData.meta?.totalPages}
                  onClick={() => setBranchPage(p => p + 1)}
                  className="px-3 py-1.5 border rounded-lg disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: 4.2 COURSE MANAGEMENT (FULL CRUD + SAFE DELETE)
           ========================================================================= */}
        {activeTab === 'courses' && (
          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-black text-gray-900">4.2 Academic Course Management</h2>
                <p className="text-xs text-gray-500">Create, view, update, and safe-delete courses with unique codes.</p>
              </div>
              <button
                onClick={() => setCourseModal({ open: true, mode: 'create', data: { course_code: '', title: '', credit_hours: 3, department: 'Computer Science', status: 'active' } })}
                className="px-4 py-2.5 bg-burgundy-700 text-white rounded-xl text-xs font-bold hover:bg-burgundy-800 transition-all flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Course</span>
              </button>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search courses by code or title..."
                  value={courseSearch}
                  onChange={(e) => { setCourseSearch(e.target.value); setCoursePage(1); }}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:border-burgundy-700"
                />
              </div>
              <select
                value={courseStatus}
                onChange={(e) => { setCourseStatus(e.target.value); setCoursePage(1); }}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-gray-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F1F3F8] text-gray-600 font-bold uppercase text-[10px] border-b border-gray-200">
                  <tr>
                    <th className="p-3.5">Course Code</th>
                    <th className="p-3.5">Title</th>
                    <th className="p-3.5">Department</th>
                    <th className="p-3.5">Credits</th>
                    <th className="p-3.5">Assigned / Slots</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 font-medium">
                  {courseData.data.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50/60">
                      <td className="p-3.5 font-mono font-bold text-burgundy-900">{c.course_code}</td>
                      <td className="p-3.5 font-bold text-gray-900">{c.title}</td>
                      <td className="p-3.5">{c.department}</td>
                      <td className="p-3.5 font-semibold">{c.credit_hours} Cr</td>
                      <td className="p-3.5 text-gray-500">{c.assignedCount} students &bull; {c.slotCount} slots</td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${c.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => setCourseModal({ open: true, mode: 'edit', data: { ...c } })}
                          className="p-1.5 text-gray-600 hover:text-burgundy-800 rounded-lg hover:bg-gray-100"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(c.id, c.course_code)}
                          className="p-1.5 text-red-600 hover:text-red-800 rounded-lg hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
              <span>Showing {courseData.data.length} of {courseData.meta?.total} courses</span>
              <div className="flex gap-2">
                <button
                  disabled={coursePage <= 1}
                  onClick={() => setCoursePage(p => p - 1)}
                  className="px-3 py-1.5 border rounded-lg disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="px-3 py-1.5 font-bold">Page {coursePage} of {courseData.meta?.totalPages}</span>
                <button
                  disabled={coursePage >= courseData.meta?.totalPages}
                  onClick={() => setCoursePage(p => p + 1)}
                  className="px-3 py-1.5 border rounded-lg disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: 4.3 STUDENT MANAGEMENT (FULL 3 GROUPS + SETUP EMAIL)
           ========================================================================= */}
        {activeTab === 'students' && (
          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-black text-gray-900">4.3 Student Management (3 Groups)</h2>
                <p className="text-xs text-gray-500">
                  Full student records (Personal, Parent/Guardian, Academic) with automatic setup email links.
                </p>
              </div>
              <button
                onClick={() => {
                  const defaultCourses = allCourses.filter(c => c.status === 'active').slice(0, 4).map(c => c.id);
                  setStudentModal({
                    open: true,
                    mode: 'create',
                    data: {
                      semester: 1,
                      program: 'BS Computer Science',
                      gender: 'Male',
                      course_ids: defaultCourses
                    }
                  });
                }}
                className="px-4 py-2.5 bg-burgundy-700 text-white rounded-xl text-xs font-bold hover:bg-burgundy-800 transition-all flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Student</span>
              </button>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search by name, reg number, email, CNIC..."
                  value={studentSearch}
                  onChange={(e) => { setStudentSearch(e.target.value); setStudentPage(1); }}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:border-burgundy-700"
                />
              </div>
              <input
                type="text"
                placeholder="Filter Program..."
                value={studentProgram}
                onChange={(e) => { setStudentProgram(e.target.value); setStudentPage(1); }}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none"
              />
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-gray-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F1F3F8] text-gray-600 font-bold uppercase text-[10px] border-b border-gray-200">
                  <tr>
                    <th className="p-3.5">Reg. Number</th>
                    <th className="p-3.5">Student Details</th>
                    <th className="p-3.5">Parent / Guardian</th>
                    <th className="p-3.5">Academic</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 font-medium">
                  {studentData.data.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50/60">
                      <td className="p-3.5 font-mono font-bold text-burgundy-900">{s.registration_number}</td>
                      <td className="p-3.5">
                        <div className="font-bold text-gray-900">{s.full_name}</div>
                        <div className="text-[11px] text-gray-400 font-mono">{s.email}</div>
                        <div className="text-[10px] text-gray-400">CNIC: {s.cnic}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-gray-800">{s.father_name}</div>
                        <div className="text-[11px] text-gray-400">{s.parent_contact}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-gray-800">{s.program}</div>
                        <div className="text-[11px] text-gray-400">Sem {s.semester} &bull; CGPA {s.marks_or_cgpa}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="space-y-1">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${s.assignmentCount >= 4 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                            {s.assignmentCount} / 6 Courses
                          </span>
                          <div>
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${s.datesheet_status === 'saved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                              {s.datesheet_status === 'saved' ? 'Date Sheet Saved' : 'Not Saved'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 text-right space-x-1.5">
                        <button
                          onClick={() => handleResendSetup(s.id)}
                          title="Resend Setup Email Link"
                          className="p-1.5 text-burgundy-700 hover:text-burgundy-900 rounded-lg hover:bg-burgundy-50"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setStudentModal({ open: true, mode: 'edit', data: { ...s } })}
                          className="p-1.5 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
              <span>Showing {studentData.data.length} of {studentData.meta?.total} students</span>
              <div className="flex gap-2">
                <button
                  disabled={studentPage <= 1}
                  onClick={() => setStudentPage(p => p - 1)}
                  className="px-3 py-1.5 border rounded-lg disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="px-3 py-1.5 font-bold">Page {studentPage} of {studentData.meta?.totalPages}</span>
                <button
                  disabled={studentPage >= studentData.meta?.totalPages}
                  onClick={() => setStudentPage(p => p + 1)}
                  className="px-3 py-1.5 border rounded-lg disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: 4.4 COURSE ASSIGNMENTS (4 TO 6 RULE ENFORCED)
           ========================================================================= */}
        {activeTab === 'assignments' && (
          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-black text-gray-900">4.4 Course Assignment Management (4 to 6 Rule)</h2>
                <p className="text-xs text-gray-500">
                  Every student must have at least 4 and at most 6 courses. Students with &lt; 4 courses are marked "Assignment Incomplete".
                </p>
              </div>
            </div>

            {/* Toolbar */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search students by name or reg number..."
                value={assignSearch}
                onChange={(e) => { setAssignSearch(e.target.value); setAssignPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:border-burgundy-700"
              />
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-gray-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F1F3F8] text-gray-600 font-bold uppercase text-[10px] border-b border-gray-200">
                  <tr>
                    <th className="p-3.5">Registration No</th>
                    <th className="p-3.5">Student Name</th>
                    <th className="p-3.5">Enrolled Courses (4 to 6)</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 font-medium">
                  {assignData.data.map(item => (
                    <tr key={item.studentId} className="hover:bg-gray-50/60">
                      <td className="p-3.5 font-mono font-bold text-burgundy-900">{item.registrationNumber}</td>
                      <td className="p-3.5 font-bold text-gray-900">{item.studentName}</td>
                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1.5">
                          {item.assignedCourses.map(c => (
                            <span key={c.id} className="px-2 py-0.5 rounded-md bg-gray-100 font-mono text-[10px] font-bold text-gray-700">
                              {c.course_code}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3.5">
                        {item.status === 'complete' ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            Complete ({item.courseCount}/6)
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                            Assignment Incomplete ({item.courseCount}/4 min)
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => {
                            setAssignModal({
                              open: true,
                              student: item,
                              selectedCourses: item.assignedCourses.map(c => c.id)
                            });
                          }}
                          className="px-3 py-1.5 bg-burgundy-700 text-white rounded-lg text-xs font-bold hover:bg-burgundy-800 transition-colors"
                        >
                          Modify Courses (4-6)
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
              <span>Showing {assignData.data.length} of {assignData.meta?.total} records</span>
              <div className="flex gap-2">
                <button
                  disabled={assignPage <= 1}
                  onClick={() => setAssignPage(p => p - 1)}
                  className="px-3 py-1.5 border rounded-lg disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="px-3 py-1.5 font-bold">Page {assignPage} of {assignData.meta?.totalPages}</span>
                <button
                  disabled={assignPage >= assignData.meta?.totalPages}
                  onClick={() => setAssignPage(p => p + 1)}
                  className="px-3 py-1.5 border rounded-lg disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 5: 4.5 EXAM SCHEDULE SLOTS (PROTECTED CHOSEN SLOTS)
           ========================================================================= */}
        {activeTab === 'slots' && (
          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-black text-gray-900">4.5 Examination Slot Schedule Management</h2>
                <p className="text-xs text-gray-500">Configure multiple exam slots per course. Slots already chosen by students are protected against deletion.</p>
              </div>
              <button
                onClick={() => setSlotModal({ open: true, mode: 'create', data: { course_id: allCourses[0]?.id || '', exam_date: '2026-11-10', start_time: '09:00', end_time: '12:00', capacity: 60 } })}
                className="px-4 py-2.5 bg-burgundy-700 text-white rounded-xl text-xs font-bold hover:bg-burgundy-800 transition-all flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Create Exam Slot</span>
              </button>
            </div>

            {/* Toolbar */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search slots by course code or title..."
                value={slotSearch}
                onChange={(e) => { setSlotSearch(e.target.value); setSlotPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:border-burgundy-700"
              />
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-gray-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F1F3F8] text-gray-600 font-bold uppercase text-[10px] border-b border-gray-200">
                  <tr>
                    <th className="p-3.5">Course</th>
                    <th className="p-3.5">Exam Date & Day</th>
                    <th className="p-3.5">Time Interval</th>
                    <th className="p-3.5">Capacity</th>
                    <th className="p-3.5">Chosen Count</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 font-medium">
                  {slotData.data.map(slot => (
                    <tr key={slot.id} className="hover:bg-gray-50/60">
                      <td className="p-3.5">
                        <span className="font-mono font-bold text-burgundy-900 block">{slot.course?.course_code}</span>
                        <span className="text-[11px] text-gray-500">{slot.course?.title}</span>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-gray-900">{slot.exam_date}</div>
                        <div className="text-[11px] text-gray-400">{slot.day_name}</div>
                      </td>
                      <td className="p-3.5 font-mono text-[11px] font-bold text-gray-800">
                        {slot.start_time} &ndash; {slot.end_time || 'TBD'}
                      </td>
                      <td className="p-3.5">{slot.capacity} seats</td>
                      <td className="p-3.5">
                        {slot.chosenCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            {slot.chosenCount} Chosen (Protected)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px]">
                            0 Chosen
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleDeleteSlot(slot.id)}
                          className="p-1.5 text-red-600 hover:text-red-800 rounded-lg hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
              <span>Showing {slotData.data.length} of {slotData.meta?.total} slots</span>
              <div className="flex gap-2">
                <button
                  disabled={slotPage <= 1}
                  onClick={() => setSlotPage(p => p - 1)}
                  className="px-3 py-1.5 border rounded-lg disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="px-3 py-1.5 font-bold">Page {slotPage} of {slotData.meta?.totalPages}</span>
                <button
                  disabled={slotPage >= slotData.meta?.totalPages}
                  onClick={() => setSlotPage(p => p + 1)}
                  className="px-3 py-1.5 border rounded-lg disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 6: 4.6 STUDENT REQUESTS (APPROVE / REJECT & ONE-TIME UNLOCK)
           ========================================================================= */}
        {activeTab === 'requests' && (
          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-black text-gray-900">4.6 Student Petitions & One-Time Unlock Queue</h2>
                <p className="text-xs text-gray-500">
                  Review student petitions for branch or date sheet modifications. Approving grants a single one-time unlock.
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search by student name or reg number..."
                  value={reqSearch}
                  onChange={(e) => { setReqSearch(e.target.value); setReqPage(1); }}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none focus:border-burgundy-700"
                />
              </div>
              <select
                value={reqStatus}
                onChange={(e) => { setReqStatus(e.target.value); setReqPage(1); }}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending Only</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-gray-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F1F3F8] text-gray-600 font-bold uppercase text-[10px] border-b border-gray-200">
                  <tr>
                    <th className="p-3.5">Student</th>
                    <th className="p-3.5">Petition Type</th>
                    <th className="p-3.5">Student Reason</th>
                    <th className="p-3.5">Date Raised</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Administrative Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 font-medium">
                  {reqData.data.map(req => (
                    <tr key={req.id} className="hover:bg-gray-50/60">
                      <td className="p-3.5">
                        <div className="font-bold text-gray-900">{req.student?.full_name}</div>
                        <div className="font-mono text-[11px] text-burgundy-800">{req.student?.registration_number}</div>
                      </td>
                      <td className="p-3.5 font-bold text-burgundy-900">
                        {req.type === 'change_branch' ? 'Change Branch' : 'Change Date Sheet'}
                        {req.targetBranch && <div className="text-[10px] text-gray-400 font-normal">Target: {req.targetBranch.name}</div>}
                      </td>
                      <td className="p-3.5 max-w-xs text-gray-600">
                        <p className="line-clamp-2">{req.reason}</p>
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-gray-400">
                        {new Date(req.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          req.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                          req.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        {req.status === 'pending' ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setReqModal({ open: true, request: req, decision: 'approved', remark: 'Approved by Controller. Modification unlocked once.' })}
                              className="px-3 py-1 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setReqModal({ open: true, request: req, decision: 'rejected', remark: 'Request declined due to seat limits.' })}
                              className="px-3 py-1 bg-red-700 text-white rounded-lg text-xs font-bold hover:bg-red-800"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-400 italic">Decided</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
              <span>Showing {reqData.data.length} of {reqData.meta?.total} requests</span>
              <div className="flex gap-2">
                <button
                  disabled={reqPage <= 1}
                  onClick={() => setReqPage(p => p - 1)}
                  className="px-3 py-1.5 border rounded-lg disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="px-3 py-1.5 font-bold">Page {reqPage} of {reqData.meta?.totalPages}</span>
                <button
                  disabled={reqPage >= reqData.meta?.totalPages}
                  onClick={() => setReqPage(p => p + 1)}
                  className="px-3 py-1.5 border rounded-lg disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
      </div>

      {/* =========================================================================
          MODALS
         ========================================================================= */}
      
      {/* 1. Branch Form Modal */}
      {branchModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-gray-900">{branchModal.mode === 'create' ? 'Add Examination Branch' : 'Edit Branch'}</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const url = branchModal.mode === 'create' ? '/api/v1/admin/branches' : `/api/v1/admin/branches/${branchModal.data.id}`;
              const method = branchModal.mode === 'create' ? 'POST' : 'PUT';
              const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(branchModal.data)
              });
              const json = await res.json();
              if (res.ok) {
                notify('success', 'Branch saved.');
                setBranchModal({ open: false, mode: 'create', data: null });
                fetchBranches();
                fetchStats();
              } else {
                notify('error', json.error?.message || 'Failed to save branch.');
              }
            }} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Branch Code (Unique, e.g. LHR, ISB)</label>
                <input
                  required
                  type="text"
                  value={branchModal.data.code}
                  onChange={(e) => setBranchModal({ ...branchModal, data: { ...branchModal.data, code: e.target.value.toUpperCase() } })}
                  className="w-full p-2.5 border rounded-xl font-mono uppercase"
                />
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-1">Campus Name</label>
                <input
                  required
                  type="text"
                  value={branchModal.data.name}
                  onChange={(e) => setBranchModal({ ...branchModal, data: { ...branchModal.data, name: e.target.value } })}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-1">City</label>
                <input
                  required
                  type="text"
                  value={branchModal.data.city}
                  onChange={(e) => setBranchModal({ ...branchModal, data: { ...branchModal.data, city: e.target.value } })}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-1">Address</label>
                <input
                  required
                  type="text"
                  value={branchModal.data.address}
                  onChange={(e) => setBranchModal({ ...branchModal, data: { ...branchModal.data, address: e.target.value } })}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Status</label>
                  <select
                    value={branchModal.data.status}
                    onChange={(e) => setBranchModal({ ...branchModal, data: { ...branchModal.data, status: e.target.value } })}
                    className="w-full p-2.5 border rounded-xl"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Capacity</label>
                  <input
                    type="number"
                    value={branchModal.data.capacity}
                    onChange={(e) => setBranchModal({ ...branchModal, data: { ...branchModal.data, capacity: e.target.value } })}
                    className="w-full p-2.5 border rounded-xl"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setBranchModal({ open: false, mode: 'create', data: null })} className="px-4 py-2 border rounded-xl font-bold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-burgundy-700 text-white rounded-xl font-bold">Save Branch</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Course Form Modal */}
      {courseModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-gray-900">{courseModal.mode === 'create' ? 'Add Course' : 'Edit Course'}</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const url = courseModal.mode === 'create' ? '/api/v1/admin/courses' : `/api/v1/admin/courses/${courseModal.data.id}`;
              const method = courseModal.mode === 'create' ? 'POST' : 'PUT';
              const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(courseModal.data)
              });
              const json = await res.json();
              if (res.ok) {
                notify('success', 'Course saved.');
                setCourseModal({ open: false, mode: 'create', data: null });
                fetchCourses();
                fetchStats();
              } else {
                notify('error', json.error?.message || 'Failed to save course.');
              }
            }} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Course Code (Unique, e.g. CS101)</label>
                <input
                  required
                  type="text"
                  value={courseModal.data.course_code}
                  onChange={(e) => setCourseModal({ ...courseModal, data: { ...courseModal.data, course_code: e.target.value.toUpperCase() } })}
                  className="w-full p-2.5 border rounded-xl font-mono uppercase"
                />
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-1">Course Title</label>
                <input
                  required
                  type="text"
                  value={courseModal.data.title}
                  onChange={(e) => setCourseModal({ ...courseModal, data: { ...courseModal.data, title: e.target.value } })}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Credit Hours</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={courseModal.data.credit_hours}
                    onChange={(e) => setCourseModal({ ...courseModal, data: { ...courseModal.data, credit_hours: e.target.value } })}
                    className="w-full p-2.5 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Department</label>
                  <input
                    required
                    type="text"
                    value={courseModal.data.department}
                    onChange={(e) => setCourseModal({ ...courseModal, data: { ...courseModal.data, department: e.target.value } })}
                    className="w-full p-2.5 border rounded-xl"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setCourseModal({ open: false, mode: 'create', data: null })} className="px-4 py-2 border rounded-xl font-bold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-burgundy-700 text-white rounded-xl font-bold">Save Course</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Student Form Modal (Section 4.3: Three Groups Form) */}
      {studentModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl my-8 space-y-6">
            <h3 className="text-xl font-black text-gray-900">
              {studentModal.mode === 'create' ? 'Create Student Record & Send Setup Email' : 'Edit Student Record'}
            </h3>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const url = studentModal.mode === 'create' ? '/api/v1/admin/students' : `/api/v1/admin/students/${studentModal.data.id}`;
              const method = studentModal.mode === 'create' ? 'POST' : 'PUT';
              const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(studentModal.data)
              });
              const json = await res.json();
              if (res.ok) {
                notify('success', 'Student record saved.');
                setStudentModal({ open: false, mode: 'create', data: null });
                fetchStudents();
                fetchStats();
                if (json.data?.setupLink) {
                  setSetupLinkModal({
                    link: json.data.setupLink,
                    email: studentModal.data.email,
                    title: 'Account Created & Setup Email Dispatched'
                  });
                }
              } else {
                notify('error', json.error?.message || 'Failed to save student.');
              }
            }} className="space-y-6 text-xs">
              
              {/* Group 1: Personal Information */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                <h4 className="font-black text-burgundy-900 uppercase tracking-wider text-[11px]">1. Personal Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Full Name *</label>
                    <input required type="text" value={studentModal.data.full_name || ''} onChange={(e) => setStudentModal({ ...studentModal, data: { ...studentModal.data, full_name: e.target.value } })} className="w-full p-2.5 border rounded-xl" />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Official Email * (Unique)</label>
                    <input required type="email" value={studentModal.data.email || ''} onChange={(e) => setStudentModal({ ...studentModal, data: { ...studentModal.data, email: e.target.value } })} className="w-full p-2.5 border rounded-xl" />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Phone Number (03XX-XXXXXXX)</label>
                    <input type="text" placeholder="0300-1234567" value={studentModal.data.phone || ''} onChange={(e) => setStudentModal({ ...studentModal, data: { ...studentModal.data, phone: e.target.value } })} className="w-full p-2.5 border rounded-xl font-mono" />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">CNIC / B-Form Number * (13 digits)</label>
                    <input required type="text" placeholder="35201-1234567-1" value={studentModal.data.cnic || ''} onChange={(e) => setStudentModal({ ...studentModal, data: { ...studentModal.data, cnic: e.target.value } })} className="w-full p-2.5 border rounded-xl font-mono" />
                  </div>
                </div>
              </div>

              {/* Group 2: Parent / Guardian Information */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                <h4 className="font-black text-burgundy-900 uppercase tracking-wider text-[11px]">2. Parent / Guardian Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Father or Guardian Name *</label>
                    <input required type="text" value={studentModal.data.father_name || ''} onChange={(e) => setStudentModal({ ...studentModal, data: { ...studentModal.data, father_name: e.target.value } })} className="w-full p-2.5 border rounded-xl" />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Parent CNIC</label>
                    <input type="text" placeholder="35201-7654321-1" value={studentModal.data.parent_cnic || ''} onChange={(e) => setStudentModal({ ...studentModal, data: { ...studentModal.data, parent_cnic: e.target.value } })} className="w-full p-2.5 border rounded-xl font-mono" />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Parent Occupation</label>
                    <input type="text" value={studentModal.data.parent_occupation || ''} onChange={(e) => setStudentModal({ ...studentModal, data: { ...studentModal.data, parent_occupation: e.target.value } })} className="w-full p-2.5 border rounded-xl" />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Parent Contact Number</label>
                    <input type="text" value={studentModal.data.parent_contact || ''} onChange={(e) => setStudentModal({ ...studentModal, data: { ...studentModal.data, parent_contact: e.target.value } })} className="w-full p-2.5 border rounded-xl font-mono" />
                  </div>
                </div>
              </div>

              {/* Group 3: Academic Information */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                <h4 className="font-black text-burgundy-900 uppercase tracking-wider text-[11px]">3. Academic Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Registration Number * (Unique)</label>
                    <input required type="text" placeholder="BC220201099" value={studentModal.data.registration_number || ''} onChange={(e) => setStudentModal({ ...studentModal, data: { ...studentModal.data, registration_number: e.target.value.toUpperCase() } })} className="w-full p-2.5 border rounded-xl font-mono uppercase" />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Degree Program *</label>
                    <input required type="text" placeholder="BS Computer Science" value={studentModal.data.program || ''} onChange={(e) => setStudentModal({ ...studentModal, data: { ...studentModal.data, program: e.target.value } })} className="w-full p-2.5 border rounded-xl" />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Semester</label>
                    <input type="number" min="1" max="8" value={studentModal.data.semester || 1} onChange={(e) => setStudentModal({ ...studentModal, data: { ...studentModal.data, semester: e.target.value } })} className="w-full p-2.5 border rounded-xl" />
                  </div>
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">Marks or CGPA (0.00 - 4.00)</label>
                    <input type="text" placeholder="3.50" value={studentModal.data.marks_or_cgpa || ''} onChange={(e) => setStudentModal({ ...studentModal, data: { ...studentModal.data, marks_or_cgpa: e.target.value } })} className="w-full p-2.5 border rounded-xl" />
                  </div>
                </div>
              </div>

              {/* Group 4: Course Assignments (4 to 6 required per Section 4.4) */}
              {studentModal.mode === 'create' && (
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-black text-burgundy-900 uppercase tracking-wider text-[11px]">
                        4. Course Assignments (4 to 6 Required)
                      </h4>
                      <p className="text-[11px] text-gray-500 font-bold">
                        Enforced by backend. Minimum 4 and maximum 6 courses must be assigned.
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 ${
                      ((studentModal.data.course_ids || []).length >= 4 && (studentModal.data.course_ids || []).length <= 6)
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {(studentModal.data.course_ids || []).length} / 6 Selected (4–6 Required)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 bg-white rounded-xl border border-gray-200">
                    {allCourses.filter(c => c.status === 'active').map(c => {
                      const isChecked = (studentModal.data.course_ids || []).includes(c.id);
                      return (
                        <label
                          key={c.id}
                          className={`flex items-center gap-2.5 p-2 rounded-xl border cursor-pointer text-xs transition-all ${
                            isChecked ? 'bg-burgundy-50 border-burgundy-300 text-burgundy-900 font-bold' : 'bg-white border-gray-100 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const current = studentModal.data.course_ids || [];
                              const next = e.target.checked
                                ? [...current, c.id]
                                : current.filter(id => id !== c.id);
                              setStudentModal({ ...studentModal, data: { ...studentModal.data, course_ids: next } });
                            }}
                            className="accent-burgundy-700 w-4 h-4 rounded"
                          />
                          <div className="flex-1 truncate">
                            <span className="font-mono font-bold text-burgundy-800 mr-1.5">{c.course_code}</span>
                            <span className="truncate">{c.title}</span>
                          </div>
                          <span className="text-[10px] text-gray-400 shrink-0 font-mono">{c.credit_hours} Cr</span>
                        </label>
                      );
                    })}
                  </div>

                  {((studentModal.data.course_ids || []).length < 4 || (studentModal.data.course_ids || []).length > 6) && (
                    <div className="text-[11px] text-rose-600 font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Rule Enforcement: Select between 4 and 6 courses to enable registration.</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setStudentModal({ open: false, mode: 'create', data: null })} className="px-4 py-2 border rounded-xl font-bold">Cancel</button>
                <button 
                  type="submit" 
                  disabled={studentModal.mode === 'create' && ((studentModal.data.course_ids || []).length < 4 || (studentModal.data.course_ids || []).length > 6)}
                  className="px-6 py-2.5 bg-burgundy-700 text-white rounded-xl font-bold shadow-md hover:bg-burgundy-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {studentModal.mode === 'create' ? 'Create Student & Dispatch Email' : 'Update Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Setup Email Token Display Dialog */}
      {setupLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-center text-gray-900">{setupLinkModal.title}</h3>
            <p className="text-xs text-gray-600 text-center leading-relaxed">
              In accordance with Section 5.4 / 11.1 of the PRD, an account creation email was dispatched to <strong>{setupLinkModal.email}</strong> containing this single-use 24-hour setup link:
            </p>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs font-mono break-all text-burgundy-900 select-all">
              {setupLinkModal.link}
            </div>
            <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(setupLinkModal.link);
                  setCopiedSetupLink(true);
                  setTimeout(() => setCopiedSetupLink(false), 2000);
                }}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-all"
              >
                {copiedSetupLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-gray-600" />}
                <span>{copiedSetupLink ? 'Copied Link!' : 'Copy Setup Link'}</span>
              </button>
              <a
                href={setupLinkModal.link}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-burgundy-50 hover:bg-burgundy-100 text-burgundy-900 border border-burgundy-200 rounded-xl text-xs font-bold transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5 text-burgundy-700" />
                <span>Test Link in Tab</span>
              </a>
              <button
                type="button"
                onClick={() => setSetupLinkModal(null)}
                className="px-6 py-2 bg-burgundy-700 text-white rounded-xl text-xs font-bold hover:bg-burgundy-800 transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Assignment Editor Modal (4 to 6 Rule Enforced) */}
      {assignModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
            <div>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-black text-gray-900">Assign Courses (4 to 6 Rule)</h3>
                <span className={`px-2.5 py-1 rounded-full font-bold text-xs ${
                  assignModal.selectedCourses.length >= 4 && assignModal.selectedCourses.length <= 6
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {assignModal.selectedCourses.length} of 6 Selected
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Student: <strong>{assignModal.student?.studentName}</strong> ({assignModal.student?.registrationNumber})
              </p>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {allCourses.map(c => {
                const isSelected = assignModal.selectedCourses.includes(c.id);
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      if (isSelected) {
                        setAssignModal({
                          ...assignModal,
                          selectedCourses: assignModal.selectedCourses.filter(id => id !== c.id)
                        });
                      } else {
                        if (assignModal.selectedCourses.length >= 6) {
                          notify('error', 'A student can have at most 6 courses assigned.');
                          return;
                        }
                        setAssignModal({
                          ...assignModal,
                          selectedCourses: [...assignModal.selectedCourses, c.id]
                        });
                      }
                    }}
                    className={`cursor-pointer p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                      isSelected
                        ? 'border-burgundy-700 bg-burgundy-50 text-burgundy-900 font-bold'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div>
                      <span className="font-mono text-burgundy-800 mr-2">{c.course_code}</span>
                      <span>{c.title}</span>
                    </div>
                    <span>{isSelected ? '✓ Assigned' : '+ Add'}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-[11px] text-gray-400">Rule: 4 minimum, 6 maximum</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAssignModal({ open: false, student: null, selectedCourses: [] })}
                  className="px-4 py-2 border rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveAssignments}
                  className="px-5 py-2 bg-burgundy-700 text-white rounded-xl text-xs font-bold"
                >
                  Save Assignments
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Slot Modal */}
      {slotModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4 text-xs">
            <h3 className="text-lg font-black text-gray-900">Create Examination Slot</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const res = await fetch('/api/v1/admin/slots', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(slotModal.data)
              });
              const json = await res.json();
              if (res.ok) {
                notify('success', 'Exam slot created.');
                setSlotModal({ open: false, mode: 'create', data: null });
                fetchSlots();
              } else {
                notify('error', json.error?.message || 'Failed to create slot.');
              }
            }} className="space-y-3">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Course</label>
                <select
                  required
                  value={slotModal.data.course_id}
                  onChange={(e) => setSlotModal({ ...slotModal, data: { ...slotModal.data, course_id: e.target.value } })}
                  className="w-full p-2.5 border rounded-xl"
                >
                  {allCourses.map(c => (
                    <option key={c.id} value={c.id}>{c.course_code} - {c.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-1">Exam Date (Cannot be in the past)</label>
                <input
                  required
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={slotModal.data.exam_date}
                  onChange={(e) => setSlotModal({ ...slotModal, data: { ...slotModal.data, exam_date: e.target.value } })}
                  className="w-full p-2.5 border rounded-xl font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Start Time (24h)</label>
                  <input
                    required
                    type="time"
                    value={slotModal.data.start_time}
                    onChange={(e) => setSlotModal({ ...slotModal, data: { ...slotModal.data, start_time: e.target.value } })}
                    className="w-full p-2.5 border rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">End Time (24h)</label>
                  <input
                    type="time"
                    value={slotModal.data.end_time}
                    onChange={(e) => setSlotModal({ ...slotModal, data: { ...slotModal.data, end_time: e.target.value } })}
                    className="w-full p-2.5 border rounded-xl font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-gray-700 block mb-1">Seating Capacity</label>
                <input
                  type="number"
                  value={slotModal.data.capacity}
                  onChange={(e) => setSlotModal({ ...slotModal, data: { ...slotModal.data, capacity: e.target.value } })}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setSlotModal({ open: false, mode: 'create', data: null })} className="px-4 py-2 border rounded-xl font-bold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-burgundy-700 text-white rounded-xl font-bold">Create Slot</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Request Decision Modal (Section 4.6 & 7) */}
      {reqModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4 text-xs">
            <h3 className="text-lg font-black text-gray-900">
              {reqModal.decision === 'approved' ? 'Approve Petition & Grant Unlock' : 'Reject Petition'}
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Student: <strong>{reqModal.request?.student?.full_name}</strong> ({reqModal.request?.student?.registration_number})<br />
              Type: <strong>{reqModal.request?.type === 'change_branch' ? 'Branch Change' : 'Date Sheet Change'}</strong>
            </p>

            <form onSubmit={handleDecideRequest} className="space-y-3">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Administrative Remark</label>
                <textarea
                  rows={3}
                  value={reqModal.remark}
                  onChange={(e) => setReqModal({ ...reqModal, remark: e.target.value })}
                  className="w-full p-3 border rounded-xl"
                />
              </div>

              {reqModal.decision === 'approved' && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl">
                  ★ Approving grants a single <strong>one-time unlock</strong>. On their next visit, the student can modify their selection once, after which it locks again.
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setReqModal({ open: false, request: null, decision: 'approved', remark: '' })} className="px-4 py-2 border rounded-xl font-bold">Cancel</button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-white rounded-xl font-bold ${
                    reqModal.decision === 'approved' ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-red-700 hover:bg-red-800'
                  }`}
                >
                  Confirm {reqModal.decision === 'approved' ? 'Approval' : 'Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
