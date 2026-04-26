'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileDown, Layout, PieChart, Users, Type, Moon, Sun, Loader2 } from 'lucide-react';
import { ExportConfig } from '@/lib/exportUtils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (config: ExportConfig) => Promise<void>;
  currentPlatform: string;
}

export function ExportModal({ isOpen, onClose, onExport, currentPlatform }: ExportModalProps) {
  const [config, setConfig] = useState<ExportConfig>({
    includeKPIs: true,
    includeCharts: true,
    includeNodes: true,
    theme: 'light',
    title: 'Performance Intelligence Report',
    platform: currentPlatform
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsGenerating(true);
    setStatusMsg('Warming up PDF Engine...');
    try {
      // Simulate slight delay to ensure UI refits before capture if needed
      await new Promise(r => setTimeout(r, 500));
      await onExport(config);
      onClose();
    } catch (e) {
      console.error(e);
      setStatusMsg('Error generating PDF.');
      setTimeout(() => setStatusMsg(''), 3000);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => !isGenerating && onClose()}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ y: 20, scale: 0.95, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          exit={{ y: 10, scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-lg max-h-[85vh] flex flex-col glass-card border border-white/10 shadow-2xl overflow-hidden pointer-events-auto"
        >
          {/* Header */}
          <div className="flex-none flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <FileDown className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-black italic uppercase text-white tracking-widest">Generate Report</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-0.5">PDF Export Engine</p>
              </div>
            </div>
            {!isGenerating && (
              <button onClick={onClose} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex-1 p-6 space-y-8 overflow-y-auto hide-scrollbar">
            {/* Report Title */}
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                <Type className="w-3 h-3" /> Report Title
              </label>
              <input 
                type="text"
                value={config.title}
                onChange={e => setConfig(prev => ({ ...prev, title: e.target.value }))}
                className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>

            {/* Checklist */}
            <div className="space-y-3">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">Components to Include</label>
              
              <div className="grid grid-cols-1 gap-3">
                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${config.includeKPIs ? 'bg-blue-500/10 border-blue-500/30' : 'bg-white/[0.02] border-white/5'}`}>
                  <input type="checkbox" checked={config.includeKPIs} onChange={e => setConfig(prev => ({ ...prev, includeKPIs: e.target.checked }))} className="hidden" />
                  <Layout className={`w-5 h-5 ${config.includeKPIs ? 'text-blue-400' : 'text-slate-500'}`} />
                  <div>
                    <p className={`text-sm font-black uppercase tracking-widest ${config.includeKPIs ? 'text-blue-100' : 'text-slate-300'}`}>Core Analytics (KPIs)</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Top-level metrics: Total Views, Likes, Comments, Shares.</p>
                  </div>
                </label>

                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${config.includeCharts ? 'bg-pink-500/10 border-pink-500/30' : 'bg-white/[0.02] border-white/5'}`}>
                  <input type="checkbox" checked={config.includeCharts} onChange={e => setConfig(prev => ({ ...prev, includeCharts: e.target.checked }))} className="hidden" />
                  <PieChart className={`w-5 h-5 ${config.includeCharts ? 'text-pink-400' : 'text-slate-500'}`} />
                  <div>
                    <p className={`text-sm font-black uppercase tracking-widest ${config.includeCharts ? 'text-pink-100' : 'text-slate-300'}`}>Financial Charts</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Hourly activity patterns and period comparison graphs.</p>
                  </div>
                </label>

                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${config.includeNodes ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/[0.02] border-white/5'}`}>
                  <input type="checkbox" checked={config.includeNodes} onChange={e => setConfig(prev => ({ ...prev, includeNodes: e.target.checked }))} className="hidden" />
                  <Users className={`w-5 h-5 ${config.includeNodes ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <div>
                    <p className={`text-sm font-black uppercase tracking-widest ${config.includeNodes ? 'text-emerald-100' : 'text-slate-300'}`}>Per-Account Breakdown</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Specific account performance tables based on active filter.</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Theme Toggle */}
            <div className="space-y-3 pt-4 border-t border-white/5">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">PDF Print Theme</label>
              <div className="flex bg-white/[0.02] border border-white/10 rounded-xl p-1">
                <button
                  onClick={() => setConfig(prev => ({ ...prev, theme: 'light' }))}
                  className={`flex-1 py-2 flex justify-center items-center gap-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${config.theme === 'light' ? 'bg-white text-black shadow-md' : 'text-slate-500 hover:text-white'}`}
                >
                  <Sun className="w-3.5 h-3.5" /> Paper (Light)
                </button>
                <button
                  onClick={() => setConfig(prev => ({ ...prev, theme: 'dark' }))}
                  className={`flex-1 py-2 flex justify-center items-center gap-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${config.theme === 'dark' ? 'bg-black border border-white/10 text-white shadow-md' : 'text-slate-500 hover:text-white'}`}
                >
                  <Moon className="w-3.5 h-3.5" /> Digital (Dark)
                </button>
              </div>
            </div>
            
            <p className="text-[9px] text-center text-slate-500 uppercase tracking-widest leading-relaxed">
              Note: The report captures the data currently visible on your dashboard for the active Date Range.
            </p>
          </div>

          <div className="flex-none p-6 border-t border-white/5 flex flex-col gap-3 relative">
            {isGenerating ? (
              <div className="w-full flex flex-col items-center justify-center gap-3 py-3">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 animate-pulse">{statusMsg || 'Generating...'}</span>
              </div>
            ) : (
              <button
                onClick={handleExport}
                className="w-full flex items-center justify-center gap-2 py-4 bg-white text-black text-[11px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-slate-200 transition-all border border-transparent hover:border-white/20 active:scale-[0.98]"
              >
                <FileDown className="w-4 h-4" />
                Download PDF Report
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
