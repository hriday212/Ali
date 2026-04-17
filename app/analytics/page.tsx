'use client';

import React, { useState } from 'react';
import { 
  BarChart3, 
  Search, 
  Filter, 
  ArrowUpRight, 
  Globe, 
  Youtube, 
  Instagram, 
  Music2,
  Clock,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExpandedAnalyticsView } from '@/components/dashboard/ExpandedAnalyticsView';
import { MOCK_STATS_24H, PLATFORM_DISTRIBUTION } from '@/lib/mockData';

const ACCOUNTS = [
  { id: '1', name: 'LinkMeTalks YT', platform: 'YouTube', icon: Youtube, color: 'text-red-500', totalViews: '2.4M', growth: '+12.5%', data: MOCK_STATS_24H, distribution: PLATFORM_DISTRIBUTION },
  { id: '2', name: 'LinkMePrime TT', platform: 'TikTok', icon: Music2, color: 'text-slate-100', totalViews: '890k', growth: '+8.2%', data: MOCK_STATS_24H.map(d => ({ ...d, views: d.views * 0.4 })), distribution: PLATFORM_DISTRIBUTION },
  { id: '3', name: 'LinkMeSnipes TT', platform: 'TikTok', icon: Music2, color: 'text-slate-100', totalViews: '1.2M', growth: '+15.8%', data: MOCK_STATS_24H.map(d => ({ ...d, views: d.views * 0.7 })), distribution: PLATFORM_DISTRIBUTION },
];

export default function AnalyticsPage() {
  const [search, setSearch] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<typeof ACCOUNTS[0] | null>(null);

  const filteredAccounts = ACCOUNTS.filter(a => 
    a.name.toLowerCase().includes(search.toLowerCase()) || 
    a.platform.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 min-h-[80vh]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-blue-500 mb-2">
            <BarChart3 className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Neural Analytics</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black italic text-white tracking-tighter uppercase">Channel Intelligence</h1>
          <p className="text-slate-400 mt-2 text-sm font-bold uppercase tracking-wider opacity-60">Deep Audit of LinkMe Nodes</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
            <input 
              type="text" 
              placeholder="FILTER NODES..."
              className="pl-11 pr-6 py-4 bg-white/[0.03] border border-white/10 focus:border-white/30 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white placeholder:text-slate-600 outline-none transition-all w-72"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Account Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence>
          {filteredAccounts.map((account, index) => (
            <motion.div
              key={account.id}
              layoutId={`card-${account.id}`}
              onClick={() => setSelectedAccount(account)}
              className="group cursor-pointer relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="glass-card p-8 h-full relative overflow-hidden transition-all duration-500 group-hover:bg-white/[0.05] group-hover:border-white/20">
                <div className="absolute -right-4 -top-4 w-32 h-32 bg-blue-500/5 blur-[40px] rounded-full group-hover:bg-blue-500/10 transition-all" />
                
                <div className="flex items-start justify-between mb-10">
                  <div className={`p-5 bg-white/[0.03] rounded-2xl border border-white/5 ${account.color} group-hover:scale-110 transition-transform duration-500`}>
                    <account.icon className="w-8 h-8" />
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-blue-500/20">
                      Syncing
                    </span>
                    <div className="flex items-center gap-1.5 mt-3 text-emerald-400">
                      <ArrowUpRight className="w-3 h-3" />
                      <span className="text-xs font-black italic">{account.growth}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-black italic tracking-tighter text-white uppercase mb-3 group-hover:text-blue-400 transition-colors">{account.name}</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Globe className="w-3.5 h-3.5" />
                      <span className="text-[9px] font-black uppercase tracking-widest">{account.platform}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-[9px] font-black uppercase tracking-widest italic">Live Feed</span>
                    </div>
                  </div>
                </div>

                <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] uppercase font-black text-slate-600 tracking-widest mb-1 italic">Total Reach</p>
                    <p className="text-xl font-black italic text-white tracking-tighter">{account.totalViews}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-black transition-all">
                    <ChevronRight className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Full-Screen Detailed View */}
      <AnimatePresence>
        {selectedAccount && (
          <ExpandedAnalyticsView 
            account={selectedAccount} 
            onClose={() => setSelectedAccount(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
