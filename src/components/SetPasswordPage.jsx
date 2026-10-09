import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function SetPasswordPage({ token, onDone }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Password rules checklist
  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const matchesConfirm = password && password === confirmPassword;
  const isValid = hasMinLength && hasLetter && hasNumber && matchesConfirm;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password })
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.message || 'Failed to set password.');
        setSubmitting(false);
      } else {
        setSuccess(true);
        setTimeout(() => {
          onDone();
        }, 2500);
      }
    } catch (err) {
      setError('Connection error. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#320A14] via-[#6B1D2F] to-[#151823] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl space-y-6"
      >
        <div className="w-14 h-14 rounded-2xl bg-burgundy-50 border border-burgundy-200 text-burgundy-800 flex items-center justify-center mx-auto shadow-sm">
          <ShieldCheck className="w-7 h-7" />
        </div>

        <div className="text-center space-y-1">
          <h2 className="text-xl font-black text-gray-900">Set Your ExamSlot Password</h2>
          <p className="text-xs text-gray-500">
            Secure single-use onboarding link. Once saved, you can log in with your email and password.
          </p>
        </div>

        {success ? (
          <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-bold text-center space-y-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
            <p>Password set successfully!</p>
            <p className="text-[11px] font-normal text-emerald-700">Redirecting you to the login gateway...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="font-bold text-gray-700 uppercase tracking-wider text-[11px]">New Password</label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5" />
                <input
                  required
                  type="password"
                  placeholder="Create password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold focus:outline-none focus:border-burgundy-700"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-700 uppercase tracking-wider text-[11px]">Confirm New Password</label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5" />
                <input
                  required
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold focus:outline-none focus:border-burgundy-700"
                />
              </div>
            </div>

            {/* Password checklist */}
            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-1.5 text-[11px]">
              <span className="font-bold text-gray-600 block">Password Requirements:</span>
              <div className={`flex items-center gap-2 ${hasMinLength ? 'text-emerald-700 font-bold' : 'text-gray-400'}`}>
                <span>{hasMinLength ? '✓' : '•'} At least 8 characters</span>
              </div>
              <div className={`flex items-center gap-2 ${hasLetter ? 'text-emerald-700 font-bold' : 'text-gray-400'}`}>
                <span>{hasLetter ? '✓' : '•'} At least one letter</span>
              </div>
              <div className={`flex items-center gap-2 ${hasNumber ? 'text-emerald-700 font-bold' : 'text-gray-400'}`}>
                <span>{hasNumber ? '✓' : '•'} At least one number</span>
              </div>
              <div className={`flex items-center gap-2 ${matchesConfirm ? 'text-emerald-700 font-bold' : 'text-gray-400'}`}>
                <span>{matchesConfirm ? '✓' : '•'} Passwords match</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={!isValid || submitting}
              className="w-full py-3 bg-burgundy-700 text-white font-extrabold rounded-xl shadow-md hover:bg-burgundy-800 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
            >
              <span>{submitting ? 'Setting Password...' : 'Save Password & Continue'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
