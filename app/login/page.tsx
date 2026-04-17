'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authStore';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = login(email, password);
    if (result.success) {
      router.push('/');
    } else {
      setError(result.error || 'Authentication failed.');
    }
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vh] bg-blue-500/[0.03] blur-[120px] rounded-full pointer-events-none" />
      
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-card p-10 relative overflow-hidden group">
          <div className="stats-gradient-silver group-hover:bg-white/10" />

          {/* Header */}
          <div className="mb-10 relative z-10 text-center">
            <h1 className="text-3xl font-black text-white italic tracking-tighter mb-2">CLYPSO</h1>
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-slate-400">Authentication Gate</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="space-y-2">
              <label className="text-[10px] font-bold tracking-[0.1em] text-slate-400 uppercase ml-2">Email Address</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  <Mail className="w-5 h-5" />
                </div>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@clypso.io"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-white/30 focus:bg-white/[0.05] transition-all duration-300"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold tracking-[0.1em] text-slate-400 uppercase ml-2">Password</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  <Lock className="w-5 h-5" />
                </div>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-white/30 focus:bg-white/[0.05] transition-all duration-300"
                  required
                />
              </div>
            </div>

            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}

            <button 
              type="submit"
              className="w-full flex items-center justify-center gap-2 mt-8 py-3.5 bg-white text-black text-[11px] font-black tracking-[0.15em] uppercase rounded-xl hover:bg-slate-200 transition-all group"
            >
              Authorize Node
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
          
          <div className="mt-6 text-center relative z-10 pt-6 border-t border-white/5">
            <p className="text-xs text-slate-600">Admin: admin@clypso.io · Client: client@clypso.io</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
