'use client';

import React from 'react';
import { LogIn, LogOut, ShieldCheck, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/authStore';

export function TopHeader() {
  const { user, role, logout, isLoginModalOpen, setLoginModalOpen } = useAuth();

  return (
    <div className="fixed top-8 left-0 right-0 z-[60] flex justify-center px-6">
      <motion.header
        initial={{ y: -20, opacity: 0, maxWidth: '164px', height: '48px' }}
        animate={{ 
          y: 0, 
          opacity: 1,
          maxWidth: isLoginModalOpen ? '164px' : '896px',
          height: isLoginModalOpen ? '48px' : (user ? '68px' : '96px'),
        }}
        transition={{ 
          maxWidth: { duration: isLoginModalOpen ? 0.8 : 2.0, ease: "easeInOut" },
          height: { duration: isLoginModalOpen ? 0.8 : 2.0, ease: "easeInOut" },
          y: { type: "spring", stiffness: 300, damping: 25 },
          opacity: { duration: 0.5 }
        }}
        className="bg-black/20 backdrop-blur-[4px] border border-white/50 rounded-full overflow-hidden mx-auto shadow-2xl relative w-full"
      >
        <div className="flex items-center justify-end w-full h-full relative px-2 md:px-8">
          {/* Silk Shimmer */}
          <motion.div
            animate={{ x: ['-100%', '200%'] }}
            transition={{ repeat: Infinity, duration: 3, ease: "linear", repeatDelay: 2 }}
            className="absolute inset-0 w-1/2 h-full skew-x-[45deg] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent pointer-events-none"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none opacity-50" />

        {/* Left: Full Logo */}
        <motion.div
           className="absolute left-4 md:left-6"
           initial={false}
           animate={{ 
             opacity: isLoginModalOpen ? 0 : 1, 
             filter: isLoginModalOpen ? 'blur(5px)' : 'blur(0px)',
             scale: user ? 0.8 : 1,
             originX: 0
           }}
           transition={isLoginModalOpen ? { duration: 0.2 } : { duration: 0.8, delay: 1.5, ease: "easeOut" }}
        >
          <Link href="/" className="relative z-10 flex items-center">
            <Image
              src="/clypso-full-logo.png"
              alt="Clypso"
              width={240}
              height={80}
              className="object-contain h-12 md:h-20 w-auto drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
              priority
            />
          </Link>
        </motion.div>

        {/* Center: Role Badge (if logged in) */}
        {user && (
          <motion.div 
             initial={{ scale: 0, opacity: 0 }}
             animate={{ scale: isLoginModalOpen ? 0 : 1, opacity: isLoginModalOpen ? 0 : 1 }}
             transition={isLoginModalOpen ? { duration: 0.2 } : { type: 'spring', stiffness: 300, damping: 20, delay: 2.2 }}
             className="absolute left-1/2 -translate-x-1/2 hidden md:block"
          >
            <div className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-xs font-black tracking-[0.2em] uppercase shadow-[0_0_20px_rgba(255,255,255,0.1)] ${
                role === 'admin'
                  ? 'bg-white/10 border-white/30 text-white'
                  : 'bg-blue-500/20 border-blue-500/40 text-blue-200'
              }`}>
                {role === 'admin' ? <ShieldCheck className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                {role}
              </div>
            </motion.div>
        )}

        {/* Right: Login / Logout */}
        <motion.div className="z-10 relative">
          {user ? (
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-white/10 text-slate-400 hover:text-white hover:border-white/30 text-[10px] font-bold tracking-[0.15em] uppercase transition-all"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          ) : (
            <button
              onClick={() => setLoginModalOpen(true)}
              className="flex items-center gap-1.5 px-6 py-3 rounded-full bg-white text-black text-[11px] font-black tracking-[0.2em] uppercase hover:bg-slate-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              <LogIn className="w-4 h-4" />
              Login
            </button>
          )}
        </motion.div>
        </div>
      </motion.header>
    </div>
  );
}
