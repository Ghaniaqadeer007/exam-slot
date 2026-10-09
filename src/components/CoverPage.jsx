import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ChevronDown, ShieldCheck, Award, GraduationCap, ArrowDownCircle } from 'lucide-react';
import SplitText from './SplitText';

/**
 * CoverPage Component
 * Full-screen fixed background with user campus photo, rich burgundy overlay (#6B1D2F),
 * crisp white logo and university title, with Framer Motion curtain-lift scroll transition.
 */
export default function CoverPage({ onEnterGate, isLifted }) {
  // Listen to wheel/scroll to auto-trigger curtain lift
  useEffect(() => {
    let lastY = 0;
    const handleWheel = (e) => {
      if (e.deltaY > 20 && !isLifted) {
        onEnterGate();
      }
    };

    const handleTouchStart = (e) => {
      lastY = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      const currentY = e.touches[0].clientY;
      if (lastY - currentY > 30 && !isLifted) {
        onEnterGate();
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isLifted, onEnterGate]);

  return (
    <motion.section
      className="fixed inset-0 w-full h-full z-50 overflow-hidden flex flex-col justify-between"
      animate={{
        y: isLifted ? '-100%' : '0%',
        opacity: isLifted ? 0 : 1,
      }}
      transition={{
        duration: 0.9,
        ease: [0.77, 0, 0.175, 1],
      }}
    >
      {/* 1. Fixed Campus Background Image */}
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-fixed transform scale-105"
        style={{
          backgroundImage: `url('/assets/campus_bg.jpg')`,
        }}
      />

      {/* 2. Rich Deep Burgundy Overlay (Multi-stop gradient + vignette) */}
      <div 
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at 50% 40%, rgba(107, 29, 47, 0.72) 0%, rgba(50, 10, 20, 0.94) 85%),
            linear-gradient(135deg, rgba(77, 19, 33, 0.90) 0%, rgba(107, 29, 47, 0.82) 50%, rgba(30, 6, 12, 0.96) 100%)
          `,
        }}
      />

      {/* Subtle Grid Accent Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}
      />

      {/* 3. Top Banner Navigation Accent */}
      <header className="relative z-10 w-full px-6 sm:px-12 py-6 flex justify-between items-center text-white">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-bold tracking-widest uppercase text-pink-100/90">
            ExamSlot &bull; Examination & Date Sheet Portal
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-6 text-xs font-semibold text-pink-100/80">
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-gold-400" /> HEC Category 'W'</span>
          <span className="flex items-center gap-1.5"><Award className="w-4 h-4 text-gold-400" /> Federal Chartered</span>
        </div>
      </header>

      {/* 4. Center Stage: Official White Logo & Typography */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 max-w-4xl mx-auto">
        {/* Crisp White Official University Crest SVG */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="relative mb-6"
        >
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-white/10 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-2xl shadow-burgundy-950/60 p-4">
            {/* University Crest Vector Graphic */}
            <svg 
              className="w-full h-full text-white" 
              viewBox="0 0 100 100" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Outer Shield Outline */}
              <path 
                d="M50 8 L85 22 V54 C85 75 50 92 50 92 C50 92 15 75 15 54 V22 L50 8 Z" 
                stroke="white" 
                strokeWidth="3.5" 
                strokeLinejoin="round" 
              />
              {/* Inner Shield Accent */}
              <path 
                d="M50 15 L78 26 V52 C78 69 50 83 50 83 C50 83 22 69 22 52 V26 L50 15 Z" 
                stroke="white" 
                strokeWidth="1.5" 
                strokeOpacity="0.6" 
              />
              {/* Graduation Cap Monogram */}
              <path 
                d="M50 28 L72 38 L50 48 L28 38 L50 28 Z" 
                fill="white" 
              />
              <path 
                d="M36 43 V56 C36 62 50 66 50 66 C50 66 64 62 64 56 V43" 
                stroke="white" 
                strokeWidth="3" 
                strokeLinecap="round" 
              />
              {/* Star of Excellence */}
              <path 
                d="M50 71 L52 76 L57 76 L53 79 L55 84 L50 81 L45 84 L47 79 L43 76 L48 76 Z" 
                fill="#C99726" 
              />
            </svg>
          </div>
          {/* Outer glow ring */}
          <div className="absolute inset-0 rounded-3xl bg-white/15 filter blur-xl -z-10" />
        </motion.div>

        {/* Prominent White University Name */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="space-y-3"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-gold-300 text-xs font-extrabold tracking-widest uppercase">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Islamic Republic of Pakistan</span>
          </div>

          <div className="block">
            <SplitText
              text="ExamSlot"
              tag="h1"
              className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight uppercase drop-shadow-md"
              delay={60}
              duration={0.8}
              ease="power3.out"
              splitType="chars"
              from={{ opacity: 0, y: 40 }}
              to={{ opacity: 1, y: 0 }}
              threshold={0.1}
              textAlign="center"
            />
            <div className="block text-2xl sm:text-4xl md:text-5xl font-extrabold text-pink-100 uppercase tracking-tight mt-1">
              Examination Portal
            </div>
          </div>


        </motion.div>

        {/* Call to Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-8 flex flex-col sm:flex-row items-center gap-4"
        >
          <button
            onClick={onEnterGate}
            className="group px-8 py-4 rounded-full bg-white text-burgundy-900 font-extrabold text-sm sm:text-base shadow-2xl shadow-burgundy-950/70 hover:bg-gold-300 transition-all transform hover:-translate-y-0.5 flex items-center gap-3"
          >
            <span>Access Portal Gateway</span>
            <ChevronDown className="w-5 h-5 text-burgundy-800 group-hover:translate-y-1 transition-transform" />
          </button>
        </motion.div>
      </main>

      {/* 5. Bottom Scroll Curtain-Lift Trigger Indicator */}
      <footer className="relative z-10 w-full pb-8 flex flex-col items-center justify-center text-white/80 cursor-pointer" onClick={onEnterGate}>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-xs font-bold tracking-widest uppercase text-pink-200/90">
            Scroll down or click to enter
          </span>
          <div className="w-6 h-10 rounded-full border-2 border-white/40 flex justify-center p-1.5 backdrop-blur-xs">
            <div className="w-1.5 h-2.5 bg-white rounded-full animate-bounce" />
          </div>
        </motion.div>
      </footer>
    </motion.section>
  );
}
