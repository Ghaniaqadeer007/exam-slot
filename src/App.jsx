import React, { useState, useEffect } from 'react';
import CoverPage from './components/CoverPage';
import RoleSelectionGate from './components/RoleSelectionGate';
import StudentPortal from './components/StudentPortal';
import AuthorityPortal from './components/AuthorityPortal';
import SetPasswordPage from './components/SetPasswordPage';

export default function App() {
  const [isCoverLifted, setIsCoverLifted] = useState(false);
  const [userSession, setUserSession] = useState(null); // { token, user, student }
  const [setupToken, setSetupToken] = useState(null);

  // Check URL parameters for single-use token (?token=...) and restore active session
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const t = urlParams.get('token');
    if (t) {
      setSetupToken(t);
    }

    try {
      const saved = sessionStorage.getItem('vu_session');
      if (saved) {
        setUserSession(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Handle successful login from RoleSelectionGate (triggered after StatusMark done state)
  const handleLoginSuccess = (authData) => {
    const session = authData?.data || authData;
    try {
      sessionStorage.setItem('vu_session', JSON.stringify(session));
    } catch (e) {
      console.error(e);
    }
    setUserSession(session);
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem('vu_session');
    } catch {}
    setUserSession(null);
    setIsCoverLifted(false);
  };

  // If opening a password setup link
  if (setupToken) {
    return (
      <SetPasswordPage
        token={setupToken}
        onDone={() => {
          setSetupToken(null);
          window.history.replaceState({}, document.title, '/');
          setIsCoverLifted(true);
        }}
      />
    );
  }

  // Extract session details cleanly regardless of wrapping
  const session = userSession?.data || userSession;
  const user = session?.user;
  const role = user?.role || session?.role;
  const token = session?.token || (user && role ? `${role}:${user.id}` : null);
  const student = session?.student || (role === 'student' ? session : null);

  // If authenticated as Student
  if (session && role === 'student') {
    return (
      <StudentPortal
        initialStudent={student}
        token={token}
        onLogout={handleLogout}
      />
    );
  }

  // If authenticated as Authority / Admin
  if (session && role === 'admin') {
    return (
      <AuthorityPortal
        token={token}
        onLogout={handleLogout}
      />
    );
  }

  // Gateway View: Cover Page with Framer Motion Curtain-Lift revealing RoleSelectionGate
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100 overflow-x-hidden font-sans">
      {/* 1. Full-screen Cover Page with Framer Motion Curtain-Lift */}
      <CoverPage
        isLifted={isCoverLifted}
        onEnterGate={() => setIsCoverLifted(true)}
      />

      {/* 2. Interactive Role Selection Gate Underneath */}
      <div className="relative z-10 pt-12 pb-24 min-h-screen flex flex-col justify-center">
        {/* Top return back to cover button */}
        <div className="max-w-5xl mx-auto w-full px-4 mb-4 flex justify-between items-center text-xs">
          <button
            onClick={() => setIsCoverLifted(false)}
            className="text-burgundy-800 font-bold hover:underline flex items-center gap-1.5"
          >
            &uarr; Back to University Cover
          </button>
          <span className="text-gray-400 font-mono font-bold">ExamSlot</span>
        </div>

        <RoleSelectionGate onLoginSuccess={handleLoginSuccess} />
      </div>
    </div>
  );
}
