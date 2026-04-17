'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Youtube, Instagram, Music2, ArrowUpRight, Globe, Clock, Subtitles, Eye, Heart, MessageCircle, Share2 } from 'lucide-react';
import { AnalyticsCharts } from './AnalyticsCharts';

interface ExpandedAnalyticsViewProps {
  account: any;
  onClose: () => void;
}

export function ExpandedAnalyticsView({ account, onClose }: ExpandedAnalyticsViewProps) {
  // Lock scroll when expanded
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const Icon = account.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/95 backdrop-blur-2xl pointer-events-auto"
      />
      
      {/* Container */}
      <motion.div 
        layoutId={`card-${account.id}`}
        className="relative w-full h-full bg-[#020617] overflow-hidden shadow-2xl pointer-events-auto flex flex-col"
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.05] via-transparent to-transparent pointer-events-none" />
        
        {/* Header */}
        <div className="relative z-10 flex items-center justify-between p-8 md:p-12 border-b border-white/5 bg-white/[0.01]">
          <div className="flex items-center gap-6">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={`p-5 bg-white/[0.03] rounded-3xl border border-white/10 ${account.color}`}
            >
              <Icon className="w-10 h-10" />
            </motion.div>
            <div>
              <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-3 mb-2"
              >
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">{account.platform}</span>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Live Sync Active</span>
              </motion.div>
              <motion.h2 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-4xl md:text-5xl font-black italic tracking-tighter text-white uppercase"
              >
                {account.name}
              </motion.h2>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="w-14 h-14 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl flex items-center justify-center transition-all group"
          >
            <X className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12 space-y-12">
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Total Reach', value: account.totalViews, sub: 'Lifetime Views', icon: Eye, color: 'text-blue-400' },
              { label: 'Growth', value: account.growth, sub: 'Last 30 Days', icon: ArrowUpRight, color: 'text-emerald-400' },
              { label: 'Engagement', value: '8.4%', sub: 'High Health', icon: Heart, color: 'text-pink-400' },
              { label: 'Active Node', value: 'Online', sub: 'Syncing every 30m', icon: Globe, color: 'text-blue-500' }
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 + (i * 0.1) }}
                className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 hover:bg-white/[0.04] transition-all group"
              >
                <stat.icon className={`w-5 h-5 ${stat.color} mb-6`} />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">{stat.label}</p>
                <p className="text-3xl font-black italic tracking-tight text-white mb-1">{stat.value}</p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600">{stat.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* Detailed Charts */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <AnalyticsCharts 
              data={account.data} 
              platformDistribution={account.distribution}
              title="Trajectory Analysis"
              description={`Auditing engagement velocity for ${account.name}.`}
            />
          </motion.div>

          {/* Bottom Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">
             <motion.div 
               initial={{ x: -20, opacity: 0 }}
               animate={{ x: 0, opacity: 1 }}
               transition={{ delay: 1.1 }}
               className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-10"
             >
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <Subtitles className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold italic tracking-tight text-white uppercase">Viral Candidates</h3>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Based on current view velocity, we've identified 3 clips with high engagement probability. Suggesting re-sharing on TikTok for maximum yield.
                </p>
                <div className="flex gap-4">
                  <button className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Download Audit</button>
                  <button className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Optimize Node</button>
                </div>
             </motion.div>

             <motion.div 
               initial={{ x: 20, opacity: 0 }}
               animate={{ x: 0, opacity: 1 }}
               transition={{ delay: 1.2 }}
               className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-10"
             >
                <h3 className="text-xl font-bold italic tracking-tight text-white uppercase mb-8">Performance Mix</h3>
                <div className="space-y-6">
                   {[
                     { label: 'Retention Rate', val: 78, color: 'bg-blue-500' },
                     { label: 'Click Through', val: 12, color: 'bg-emerald-500' },
                     { label: 'Shareability', val: 64, color: 'bg-pink-500' }
                   ].map(bar => (
                     <div key={bar.label}>
                       <div className="flex justify-between items-center mb-2">
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{bar.label}</span>
                         <span className="text-xs font-black italic text-white">{bar.val}%</span>
                       </div>
                       <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                         <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: `${bar.val}%` }}
                           transition={{ duration: 1.5, ease: "easeOut", delay: 1.4 }}
                           className={`h-full ${bar.color}`}
                         />
                       </div>
                     </div>
                   ))}
                </div>
             </motion.div>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
