'use client';

import React from 'react';
import { Eye, Heart, MessageCircle, DollarSign, TrendingUp, Filter, Calendar } from 'lucide-react';
import dynamic from 'next/dynamic';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { SUMMARY_STATS } from '@/lib/mockData';
import { motion } from 'framer-motion';

const AnalyticsCharts = dynamic(() => import('@/components/dashboard/AnalyticsCharts').then(mod => mod.AnalyticsCharts), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-slate-900/10 rounded-2xl animate-pulse flex items-center justify-center text-slate-500">Initializing Analytics...</div>
});

export default function Home() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center relative">
      <div className="relative w-full max-w-full flex flex-col items-center justify-center overflow-hidden py-20 px-8">
        
        {/* Hero Branding - Clypso Kinetic Identity (Soft Diffusion) */}
        <div className="relative text-center z-10">
          <div className="flex items-center justify-center flex-wrap sm:flex-nowrap gap-x-2 sm:gap-x-0">
            {"CLYPSO".split("").map((letter, i) => (
              <motion.span
                key={i}
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ 
                  duration: 1.4, 
                  delay: i * 0.1, 
                  ease: [0.16, 1, 0.3, 1] 
                }}
                className="text-[clamp(4rem,18vw,16rem)] font-black text-white italic uppercase tracking-tighter leading-none select-none inline-block relative py-12 px-4 overflow-visible"
              >
                {letter}
                {/* Diffusion Glimmer (Soft Gaussian Bloom) */}
                <motion.div
                  animate={{ x: ['-250%', '250%'] }}
                  transition={{ repeat: Infinity, duration: 6, ease: "linear", delay: 2 + (i * 0.1) }}
                  className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[35deg] pointer-events-none mix-blend-overlay blur-[15px]" 
                />
              </motion.span>
            ))}
          </div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8, duration: 1.5 }}
            className="flex flex-col items-center gap-4 mt-2 sm:-mt-4"
          >
            <div className="w-12 h-[1px] bg-white/10 shadow-inner" />
            <p className="text-[9px] sm:text-[11px] font-black tracking-[0.6em] uppercase text-slate-500 ml-[0.6em] italic">
              Monetization Protocol v1.4
            </p>
          </motion.div>
        </div>

        {/* Gloss Aura Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[75vw] h-[75vh] bg-white/[0.012] blur-[150px] rounded-full pointer-events-none" />
      </div>
    </div>
  );
}
