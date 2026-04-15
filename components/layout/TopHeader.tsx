'use client';

import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function TopHeader() {
  const [isSearchHovered, setIsSearchHovered] = useState(false);

  return (
    <div className="fixed top-8 left-0 right-0 z-[60] flex justify-center px-6">
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-3xl h-18 bg-black/12 backdrop-blur-[2px] border border-white/50 rounded-full flex items-center justify-between px-10 transition-all duration-500 relative overflow-hidden"
      >
        {/* The Silk Shimmer (High-End Shine) */}
        <motion.div
          animate={{ x: ['-100%', '200%'] }}
          transition={{ repeat: Infinity, duration: 3, ease: "linear", repeatDelay: 2 }}
          className="absolute inset-0 w-1/2 h-full skew-x-[45deg] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent pointer-events-none"
        />

        {/* Gloss Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none opacity-50" />

        {/* Left: Pure Minimalist Logo with Pulse Glory */}
        <div className="flex items-center group cursor-pointer z-10">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-white group-hover:scale-110 transition-all duration-500 shadow-[0_0_15px_rgba(255,255,255,0.05)] group-hover:shadow-[0_0_25px_rgba(255,255,255,0.15)]">
              <img src="/logo.jpg" alt="Command Center Logo" className="w-full h-full object-cover rounded-xl" />
            </div>
          </div>
          <div className="w-[1px] h-8 bg-white/10 mx-6 shadow-inner" />
        </div>

        {/* Right: Interactive Kinetic Search Hub */}
        <div
          className="relative flex items-center group cursor-pointer z-10"
          onMouseEnter={() => setIsSearchHovered(true)}
          onMouseLeave={() => setIsSearchHovered(false)}
        >
          <motion.div
            initial={false}
            animate={{
              x: isSearchHovered ? -120 : 0,
              backgroundColor: isSearchHovered ? "rgba(255,255,255,0.15)" : "transparent",
              borderColor: isSearchHovered ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)"
            }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="w-12 h-12 rounded-full border flex items-center justify-center text-slate-400 group-hover:text-slate-100 transition-all shadow-inner"
          >
            <Search className="w-5.5 h-5.5" />
          </motion.div>

          <AnimatePresence>
            {isSearchHovered && (
              <motion.div
                initial={{ opacity: 0, x: 20, scale: 0.9, filter: "blur(4px)" }}
                animate={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: 10, scale: 0.9, filter: "blur(4px)" }}
                className="absolute right-0 flex items-center"
              >
                <button className="px-8 py-3 bg-white text-black text-[10px] font-black uppercase tracking-[0.3em] rounded-full shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all hover:scale-105 active:scale-95">
                  Search
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.header>
    </div>
  );
}
