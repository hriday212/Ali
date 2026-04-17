'use client';

import React from 'react';
import { LogIn, LogOut, ShieldCheck, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/authStore';

export function TopHeader() {
  const { user, role, logout } = useAuth();

  return (
    <div className="fixed top-8 left-0 right-0 z-[60] flex justify-center px-6">
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-3xl h-18 bg-black/12 backdrop-blur-[2px] border border-white/50 rounded-full flex items-center justify-between px-8 transition-all duration-500 relative overflow-hidden"
      >
        {/* Silk Shimmer */}
        <motion.div
          animate={{ x: ['-100%', '200%'] }}
          transition={{ repeat: Infinity, duration: 3, ease: "linear", repeatDelay: 2 }}
          className="absolute inset-0 w-1/2 h-full skew-x-[45deg] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none opacity-50" />

        {/* Left: Full Logo */}
        <Link href="/" className="relative z-10 flex items-center">
          <Image
            src="/clypso-full-logo.png"
            alt="Clypso"
            width={120}
            height={40}
            className="object-contain h-10 w-auto"
            priority
          />
        </Link>

        {/* Center: Role Badge (if logged in) */}
        {user && (
          <div className="absolute left-1/2 -translate-x-1/2 z-10">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-black tracking-[0.15em] uppercase ${
              role === 'admin'
                ? 'bg-white/10 border-white/20 text-white'
                : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
            }`}>
              {role === 'admin' ? <ShieldCheck className="w-3 h-3" /> : <Users className="w-3 h-3" />}
              {role}
            </div>
          </div>
        )}

        {/* Right: Login / Logout */}
        <div className="z-10">
          {user ? (
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/10 text-slate-400 hover:text-white hover:border-white/30 text-[10px] font-bold tracking-[0.15em] uppercase transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white text-black text-[10px] font-black tracking-[0.15em] uppercase hover:bg-slate-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              <LogIn className="w-3.5 h-3.5" />
              Login
            </Link>
          )}
        </div>
      </motion.header>
    </div>
  );
}
