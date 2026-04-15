'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { AnalyticsCharts } from './AnalyticsCharts';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelName: string;
  platform: string;
  data: any[];
  platformDistribution: any[];
}

export function AnalyticsModal({ isOpen, onClose, channelName, platform, data, platformDistribution }: AnalyticsModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
          />
          
          {/* Modal Content */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-10 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-500">{platform}</span>
                  <div className="w-1 h-1 rounded-full bg-slate-700" />
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">Live Performance</span>
                </div>
                <h2 className="text-3xl font-bold text-white">{channelName} Analytics</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-3 bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white rounded-2xl transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Charts */}
            <AnalyticsCharts 
              data={data} 
              platformDistribution={platformDistribution} 
              title="Growth Metrics"
              description={`Viewing performance for ${channelName} across the selected timeline.`}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
