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
import { AnalyticsModal } from '@/components/dashboard/AnalyticsModal';
import { MOCK_STATS_24H, PLATFORM_DISTRIBUTION } from '@/lib/mockData';

const ACCOUNTS = [
  { id: '1', name: 'ClipperMaster YT', platform: 'YouTube', icon: Youtube, color: 'text-red-500', totalViews: '2.4M', growth: '+12.5%', data: MOCK_STATS_24H, distribution: PLATFORM_DISTRIBUTION },
  { id: '2', name: 'TrendingReels IG', platform: 'Instagram', icon: Instagram, color: 'text-pink-500', totalViews: '890k', growth: '+8.2%', data: MOCK_STATS_24H.map(d => ({ ...d, views: d.views * 0.4 })), distribution: PLATFORM_DISTRIBUTION },
  { id: '3', name: 'FastClips TikTok', platform: 'TikTok', icon: Music2, color: 'text-slate-100', totalViews: '1.2M', growth: '+15.8%', data: MOCK_STATS_24H.map(d => ({ ...d, views: d.views * 0.7 })), distribution: PLATFORM_DISTRIBUTION },
];

export default function AnalyticsPage() {
  const [search, setSearch] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<typeof ACCOUNTS[0] | null>(null);

  const filteredAccounts = ACCOUNTS.filter(a => 
    a.name.toLowerCase().includes(search.toLowerCase()) || 
    a.platform.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-blue-500 mb-2">
            <BarChart3 className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-[0.2em]">Insights Central</span>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Channel Analytics</h1>
          <p className="text-slate-400 mt-2 text-lg">Detailed performance tracking per account.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
            <input 
              type="text" 
              placeholder="Search channels..."
              className="pl-11 pr-6 py-3 bg-slate-900 border border-slate-800 focus:border-blue-500/50 rounded-2xl text-white placeholder:text-slate-600 outline-none transition-all w-64 shadow-inner"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="p-3 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-2xl transition-all hover:bg-slate-800">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Account Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredAccounts.map((account, index) => (
            <motion.div
              key={account.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setSelectedAccount(account)}
              className="group cursor-pointer"
            >
              <div className="glass-card p-6 h-full relative overflow-hidden transition-all duration-300 group-hover:border-blue-500/30 group-hover:bg-blue-500/5 group-hover:-translate-y-1">
                <div className="absolute -right-4 -top-4 w-32 h-32 bg-blue-500/5 blur-[40px] rounded-full group-hover:bg-blue-500/10 transition-all" />
                
                <div className="flex items-start justify-between mb-8">
                  <div className={`p-4 bg-slate-900/50 rounded-2xl border border-slate-800/50 ${account.color} group-hover:scale-110 transition-transform duration-500`}>
                    <account.icon className="w-8 h-8" />
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-widest rounded-full border border-blue-500/20">
                      Live
                    </span>
                    <div className="flex items-center gap-1.5 mt-2 text-emerald-400">
                      <ArrowUpRight className="w-3 h-3" />
                      <span className="text-xs font-bold tracking-tight">{account.growth}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">{account.name}</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Globe className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium uppercase tracking-widest">{account.platform}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium uppercase tracking-widest">Auto-Synced</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-800/50 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">Total Views</p>
                    <p className="text-xl font-bold text-white tracking-tight">{account.totalViews}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-slate-800/50 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Detailed Modal */}
      <AnalyticsModal 
        isOpen={!!selectedAccount} 
        onClose={() => setSelectedAccount(null)}
        channelName={selectedAccount?.name || ''}
        platform={selectedAccount?.platform || ''}
        data={selectedAccount?.data || []}
        platformDistribution={selectedAccount?.distribution || []}
      />
    </div>
  );
}
