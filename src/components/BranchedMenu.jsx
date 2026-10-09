import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  CalendarDays, 
  HelpCircle, 
  Bell, 
  MapPin, 
  FileText, 
  Printer, 
  ChevronRight, 
  LogOut,
  GraduationCap
} from 'lucide-react';

/**
 * BranchedMenu Component (React Bits Inspired)
 * Navigation sidebar featuring expandable sections, smooth SVG branch line drawing, and active tracking.
 */
export default function BranchedMenu({ activeTab, onSelectTab, onLogout, studentInfo }) {
  const [expanded, setExpanded] = useState({
    datesheet: true,
    help: true,
  });

  const toggleExpand = (key) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <aside className="w-72 bg-white border-r border-burgundy-100 flex flex-col h-full shadow-sm select-none">
      {/* University Monogram Header */}
      <div className="p-5 border-b border-burgundy-100/60 bg-gradient-to-b from-burgundy-50/50 to-white">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-burgundy-800 to-burgundy-600 flex items-center justify-center text-white shadow-md shadow-burgundy-900/20">
            <GraduationCap className="w-6 h-6 text-gold-300" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-burgundy-900 leading-tight">ExamSlot Portal</h2>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Examination Directorate</p>
          </div>
        </div>

        {studentInfo && (
          <div className="mt-4 p-2.5 bg-white rounded-xl border border-burgundy-100/80 shadow-xs">
            <p className="text-xs font-bold text-gray-800 truncate">{studentInfo.full_name}</p>
            <p className="text-[11px] font-mono text-burgundy-700 font-semibold">{studentInfo.vu_id}</p>
          </div>
        )}
      </div>

      {/* Navigation Tree with SVG Branch Lines */}
      <nav className="flex-1 p-4 overflow-y-auto space-y-1.5">
        {/* Item: Profile */}
        <button
          onClick={() => onSelectTab('profile')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'profile'
              ? 'bg-burgundy-700 text-white shadow-sm shadow-burgundy-900/20'
              : 'text-gray-700 hover:bg-burgundy-50 hover:text-burgundy-900'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Student Profile</span>
        </button>

        {/* Group: Examination & Date Sheet */}
        <div className="pt-2">
          <button
            onClick={() => toggleExpand('datesheet')}
            className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-extrabold text-gray-400 uppercase tracking-wider hover:text-burgundy-800"
          >
            <div className="flex items-center gap-2">
              <CalendarDays className="w-3.5 h-3.5 text-burgundy-700" />
              <span>Examination</span>
            </div>
            <motion.div animate={{ rotate: expanded.datesheet ? 90 : 0 }}>
              <ChevronRight className="w-3.5 h-3.5" />
            </motion.div>
          </button>

          <AnimatePresence>
            {expanded.datesheet && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="relative pl-6 mt-1 space-y-1"
              >
                {/* SVG Branch Connector Line */}
                <svg
                  className="absolute left-3 top-0 bottom-2 w-3.5 h-full pointer-events-none stroke-burgundy-200"
                  fill="none"
                >
                  <motion.path
                    d="M 6 0 V 90"
                    strokeWidth="1.5"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.4 }}
                  />
                </svg>

                {/* Sub-item: Branch Selection */}
                <div className="relative">
                  <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-2.5 h-[1.5px] bg-burgundy-200" />
                  <button
                    onClick={() => onSelectTab('branch')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === 'branch'
                        ? 'bg-burgundy-100/70 text-burgundy-900 font-bold border-l-2 border-burgundy-700'
                        : 'text-gray-600 hover:text-burgundy-900 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-burgundy-600" />
                      <span>Exam Branch</span>
                    </div>
                    {studentInfo?.branch_id && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">Locked</span>
                    )}
                  </button>
                </div>

                {/* Sub-item: Date Sheet Slot Picker */}
                <div className="relative">
                  <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-2.5 h-[1.5px] bg-burgundy-200" />
                  <button
                    onClick={() => onSelectTab('datesheet')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === 'datesheet'
                        ? 'bg-burgundy-100/70 text-burgundy-900 font-bold border-l-2 border-burgundy-700'
                        : 'text-gray-600 hover:text-burgundy-900 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-burgundy-600" />
                      <span>Design Date Sheet</span>
                    </div>
                    {studentInfo?.datesheet_finalized === 1 && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">Finalized</span>
                    )}
                  </button>
                </div>

                {/* Sub-item: View & Print Date Sheet */}
                <div className="relative">
                  <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-2.5 h-[1.5px] bg-burgundy-200" />
                  <button
                    onClick={() => onSelectTab('print')}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === 'print'
                        ? 'bg-burgundy-100/70 text-burgundy-900 font-bold border-l-2 border-burgundy-700'
                        : 'text-gray-600 hover:text-burgundy-900 hover:bg-gray-50'
                    }`}
                  >
                    <Printer className="w-3.5 h-3.5 text-burgundy-600" />
                    <span>Print Exam Slip</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Group: Need Help & Change Requests */}
        <div className="pt-2">
          <button
            onClick={() => toggleExpand('help')}
            className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-extrabold text-gray-400 uppercase tracking-wider hover:text-burgundy-800"
          >
            <div className="flex items-center gap-2">
              <HelpCircle className="w-3.5 h-3.5 text-burgundy-700" />
              <span>Need Help</span>
            </div>
            <motion.div animate={{ rotate: expanded.help ? 90 : 0 }}>
              <ChevronRight className="w-3.5 h-3.5" />
            </motion.div>
          </button>

          <AnimatePresence>
            {expanded.help && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="relative pl-6 mt-1 space-y-1"
              >
                {/* SVG Branch Connector Line */}
                <svg
                  className="absolute left-3 top-0 bottom-2 w-3.5 h-full pointer-events-none stroke-burgundy-200"
                  fill="none"
                >
                  <motion.path
                    d="M 6 0 V 60"
                    strokeWidth="1.5"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.4 }}
                  />
                </svg>

                {/* Sub-item: Submit Request */}
                <div className="relative">
                  <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-2.5 h-[1.5px] bg-burgundy-200" />
                  <button
                    onClick={() => onSelectTab('request')}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === 'request'
                        ? 'bg-burgundy-100/70 text-burgundy-900 font-bold border-l-2 border-burgundy-700'
                        : 'text-gray-600 hover:text-burgundy-900 hover:bg-gray-50'
                    }`}
                  >
                    <span>Request Change</span>
                  </button>
                </div>

                {/* Sub-item: Track Status */}
                <div className="relative">
                  <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-2.5 h-[1.5px] bg-burgundy-200" />
                  <button
                    onClick={() => onSelectTab('track')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === 'track'
                        ? 'bg-burgundy-100/70 text-burgundy-900 font-bold border-l-2 border-burgundy-700'
                        : 'text-gray-600 hover:text-burgundy-900 hover:bg-gray-50'
                    }`}
                  >
                    <span>Request Status</span>
                    {studentInfo?.requests?.some(r => r.status === 'pending') && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Notices */}
        <div className="pt-2">
          <button
            onClick={() => onSelectTab('notices')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'notices'
                ? 'bg-burgundy-700 text-white shadow-sm shadow-burgundy-900/20'
                : 'text-gray-700 hover:bg-burgundy-50 hover:text-burgundy-900'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Notice Board</span>
          </button>
        </div>
      </nav>

      {/* Logout Action */}
      <div className="p-4 border-t border-burgundy-100/80 bg-gray-50/50">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-burgundy-800 hover:text-white hover:bg-burgundy-700 rounded-xl transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
