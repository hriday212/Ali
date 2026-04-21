'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StatsCardProps {
  title: string;
  value: string | number;
  growth: number;
  icon: LucideIcon;
  variant?: 'silver' | 'charcoal';
}

export function StatsCard({ title, value, growth, icon: Icon, variant = 'silver' }: StatsCardProps) {
  const isPositive = growth >= 0;

  const gradients = {
    silver: 'from-white/10 to-transparent',
    charcoal: 'from-slate-700/20 to-transparent',
  };

  const ringColors = {
    silver: 'ring-white/20 bg-white/5 text-white',
    charcoal: 'ring-slate-700/30 bg-slate-800/10 text-slate-400',
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="stats-card p-6 relative overflow-hidden group"
    >
      <div className={cn(variant === 'silver' ? "stats-gradient-silver" : "stats-gradient-charcoal")} />
      
      <div className="flex justify-between items-start mb-4">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center ring-1", ringColors[variant])}>
          <Icon className="w-6 h-6" />
        </div>
        <div className={cn(
          "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold",
          isPositive ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-800 text-slate-400"
        )}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(growth)}%
        </div>
      </div>

      <div>
        <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold tracking-tight text-white">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </h3>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-800/50">
        <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">
          vs last 24 hours
        </p>
      </div>
    </motion.div>
  );
}
