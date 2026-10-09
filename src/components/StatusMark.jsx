import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * StatusMark Component (React Bits Inspired)
 * State changes from 'running' -> 'done' with SVG checkmark and label strike-through animation.
 */
export default function StatusMark({ status = 'running', label = 'Verifying credentials...', onComplete }) {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (status === 'done') {
      const timer = setTimeout(() => {
        onCompleteRef.current?.();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [status]);

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-4 font-sans">
      {/* Icon Mark Container */}
      <div className="relative w-16 h-16 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {status === 'running' && (
            <motion.div
              key="running"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative w-14 h-14"
            >
              <svg className="w-full h-full animate-spin" viewBox="0 0 50 50">
                <circle
                  cx="25"
                  cy="25"
                  r="20"
                  fill="none"
                  stroke="#FAF1F3"
                  strokeWidth="5"
                />
                <circle
                  cx="25"
                  cy="25"
                  r="20"
                  fill="none"
                  stroke="#6B1D2F"
                  strokeWidth="5"
                  strokeDasharray="80"
                  strokeDashoffset="40"
                  strokeLinecap="round"
                />
              </svg>
              {/* Center pulsing beacon */}
              <div className="absolute inset-0 m-auto w-3 h-3 bg-burgundy-700 rounded-full animate-ping opacity-75" />
            </motion.div>
          )}

          {status === 'done' && (
            <motion.div
              key="done"
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="w-14 h-14 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30"
            >
              <svg
                className="w-8 h-8"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <motion.path
                  d="M5 13l4 4L19 7"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
                />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Label with Strike-Through Animation */}
      <div className="relative text-center">
        {status === 'running' ? (
          <motion.p
            key="running-text"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-bold text-burgundy-800 tracking-wide"
          >
            {label}
          </motion.p>
        ) : (
          <motion.div
            key="done-text"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center"
          >
            {/* Strike-through previous step */}
            <span className="text-xs text-gray-400 line-through decoration-burgundy-700 decoration-2 font-bold">
              {label}
            </span>
            <span className="text-sm font-bold text-emerald-700 mt-0.5 flex items-center gap-1.5">
              <span>Identity Verified &bull; Access Authorized</span>
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
