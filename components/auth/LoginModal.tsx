'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowRight, AlertCircle, X } from 'lucide-react';
import { useAuth } from '@/lib/authStore';

export function LoginModal() {
  const { login, isLoginModalOpen, setLoginModalOpen } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = login(email, password);
    if (result.success) {
      setLoginModalOpen(false);
    } else {
      setError(result.error || 'Authentication failed.');
    }
  };

  return (
    <AnimatePresence>
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLoginModalOpen(false)}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm pointer-events-auto"
          />

          {/* Modal */}
          <motion.div
            initial={{ y: 50, scale: 0.95, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 20, scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="w-full max-w-md relative z-10 pointer-events-auto"
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-500/[0.1] blur-3xl rounded-full pointer-events-none" />
            
            <div className="glass-card p-10 relative overflow-hidden group border border-white/20 shadow-2xl bg-black/40 backdrop-blur-xl">
              <button 
                onClick={() => setLoginModalOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="mb-8 relative z-10 text-center">
                <h2 className="text-2xl font-black text-white italic tracking-tighter mb-1">CLYPSO</h2>
                <p className="text-[9px] font-semibold tracking-[0.2em] uppercase text-slate-400">Authentication Gate</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold tracking-[0.1em] text-slate-400 uppercase ml-2">Email Address</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input 
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@clypso.io"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-white/30 focus:bg-white/[0.05] transition-all duration-300"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-bold tracking-[0.1em] text-slate-400 uppercase ml-2">Password</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input 
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-white/30 focus:bg-white/[0.05] transition-all duration-300"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {error}
                  </motion.div>
                )}

                <button 
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 mt-6 py-3.5 bg-white text-black text-[10px] font-black tracking-[0.15em] uppercase rounded-xl hover:bg-slate-200 transition-all group"
                >
                  Authorize Node
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </form>
              
              <div className="mt-5 text-center relative z-10 pt-5 border-t border-white/5">
                <p className="text-[10px] text-slate-600 tracking-wider">Admin: admin@clypso.io · Client: client@clypso.io</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
