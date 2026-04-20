'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Youtube, Instagram, Music2, ArrowUpRight, Globe, Clock, Subtitles, Eye, Heart, MessageCircle, Share2 } from 'lucide-react';
import { AnalyticsCharts } from './AnalyticsCharts';
import { MonetizationFunnel, ViralVelocityRadar } from './VisualizationSuite';

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
              { label: 'Growth', value: account.growth, sub: 'vs Previous Scan', icon: ArrowUpRight, color: 'text-emerald-400' },
              { label: 'Engagement', value: account.engagement || '0.0%', sub: 'Avg Health', icon: Heart, color: 'text-pink-400' },
              { label: 'Active Node', value: 'Online', sub: `${account.data?.length || 0} scans recorded`, icon: Globe, color: 'text-blue-500' }
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
              data={(account.data || []).map((h: any) => ({
                time: new Date(h.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                views: h.totalViews || 0,
              }))} 
              platformDistribution={[{ name: account.platform || 'Unknown', value: 100 }]}
              postMarkers={(account.posts || []).slice(0, 5).map((p: any) => ({
                time: new Date(p.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                label: 'POST'
              }))}
              title="Impact Evaluation"
              description={`Auditing content-driven growth for ${account.name}.`}
            />
          </motion.div>

          {/* Bottom Insights */}
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">
             <motion.div 
               initial={{ x: -20, opacity: 0 }}
               animate={{ x: 0, opacity: 1 }}
               transition={{ delay: 1.1 }}
               className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-10 min-h-[450px]"
             >
                <ViralVelocityRadar history={account.data} posts={account.posts} />
             </motion.div>

             <motion.div 
               initial={{ x: 20, opacity: 0 }}
               animate={{ x: 0, opacity: 1 }}
               transition={{ delay: 1.2 }}
               className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-10 min-h-[450px]"
             >
                <MonetizationFunnel 
                  views={parseInt(account.totalViews.replace(/[^0-9.]/g, '')) * (account.totalViews.includes('M') ? 1000000 : 1000)} 
                  likes={account.lastLikes || 0} 
                  comments={account.lastComments || 0} 
                />
             </motion.div>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
