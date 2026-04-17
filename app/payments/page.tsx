'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Youtube, 
  Instagram, 
  Music2,
  ChevronDown,
  ChevronUp,
  Loader2,
  User,
  Film,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { addPayout, getTotalPaid, getLatestPayoutForVideo, type PayoutRecord } from '@/lib/payoutsStore';
import { getAccounts } from '@/lib/accountsStore';
import { useAuth } from '@/lib/authStore';
import { API_ROUTES } from '@/lib/apiConfig';

const PlatformIcon = ({ platform }: { platform: string }) => {
  if (platform === 'youtube') return <Youtube className="w-5 h-5 text-red-500" />;
  if (platform === 'instagram') return <Instagram className="w-5 h-5 text-pink-500" />;
  if (platform === 'tiktok') return <Music2 className="w-5 h-5 text-slate-100" />;
  return null;
};

interface VideoEntry {
  id: string;
  title: string;
  thumbnail: string;
  views: number;
  likes: number;
  platform: string;
  link: string;
  accountId: string;
  accountName: string;
}

interface AccountGroup {
  accountId: string;
  accountName: string;
  platform: string;
  videos: VideoEntry[];
  totalViews: number;
  unpaidGrowth: number;
}

export default function PaymentsPage() {
  const { isClient } = useAuth();

  // Client access guard
  if (isClient) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-[70vh] flex flex-col items-center justify-center"
      >
        <div className="glass-card p-16 text-center max-w-md relative overflow-hidden">
          <div className="absolute inset-0 bg-red-500/[0.03] pointer-events-none" />
          <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-8">
            <ShieldAlert className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-2xl font-black italic tracking-tighter mb-3">Restricted Zone</h2>
          <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-slate-500">Administrator Privileges Required</p>
          <p className="text-slate-600 text-sm mt-4">The Payout Ledger is only accessible to Admin nodes.</p>
        </div>
      </motion.div>
    );
  }

  const [groupedData, setGroupedData] = useState<AccountGroup[]>([]);

  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [totalPaid, setTotalPaid] = useState(0);

  const loadData = async () => {
    setLoading(true);
    const accounts = getAccounts();
    const groups: Record<string, AccountGroup> = {};

    for (const acc of accounts) {
      try {
        const res = await fetch(`${API_ROUTES.STATUS}?accountId=${acc.id}`);
        if (res.ok) {
          const result = await res.json();
          const videos = result.data?.posts || [];
          
          let accountUnpaidSteps = 0;
          videos.forEach((v: any) => {
            const lp = getLatestPayoutForVideo(v.id);
            accountUnpaidSteps += lp ? Math.max(0, v.views - lp.viewsAtPayment) : v.views;
          });

          groups[acc.id] = {
            accountId: acc.id,
            accountName: acc.name,
            platform: acc.platform,
            videos: videos.map((p: any) => ({
              id: p.id,
              title: p.title,
              thumbnail: p.thumbnail,
              views: p.views,
              likes: p.likes,
              platform: acc.platform,
              link: p.link,
              accountId: acc.id,
              accountName: acc.name
            })),
            totalViews: videos.reduce((s: number, p: any) => s + p.views, 0),
            unpaidGrowth: accountUnpaidSteps
          };
        }
      } catch (err) {
        console.error(`Failed to fetch scan data for ${acc.name}`, err);
      }
    }

    setGroupedData(Object.values(groups));
    setTotalPaid(getTotalPaid());
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleAccount = (id: string) => {
    const next = new Set(expandedAccounts);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedAccounts(next);
  };

  const handlePay = (video: VideoEntry) => {
    const amount = (video.views / 1000) * 1.5; 
    const record: PayoutRecord = {
      id: Date.now().toString(),
      videoId: video.id,
      videoTitle: video.title,
      platform: video.platform,
      amount,
      viewsAtPayment: video.views,
      paidAt: new Date().toISOString(),
      thumbnail: video.thumbnail,
      accountId: video.accountId, // CRITICAL: Link it to the account for the graph
    };
    addPayout(record);
    setTotalPaid(getTotalPaid());
    loadData(); 
  };

  const filteredGroups = groupedData.filter(g => 
    g.accountName.toLowerCase().includes(filter.toLowerCase()) ||
    g.videos.some(v => v.title.toLowerCase().includes(filter.toLowerCase()))
  );

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-20">
      {/* Header Cards */}
      <div className="flex flex-col md:flex-row items-stretch justify-between gap-6">
        <div className="flex-1 bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-xl">
           <h1 className="text-3xl font-black italic tracking-tighter uppercase mb-2">Payout Ledger</h1>
           <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Grouped by Account (Node)</p>
        </div>
        
        <div className="bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-xl flex items-center gap-6 min-w-[300px]">
           <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
             <DollarSign className="w-7 h-7" />
           </div>
           <div>
             <p className="text-[10px] font-black uppercase tracking-widest opacity-30 mb-1 leading-none">Total Distributed</p>
             <p className="text-3xl font-black italic tracking-tighter">${totalPaid.toLocaleString()}</p>
           </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
          <input 
            type="text" 
            placeholder="FILTER NODES OR VIDEOS..."
            className="w-full bg-white/[0.03] border border-white/10 focus:border-white/20 rounded-[1.5rem] py-4 pl-14 pr-6 text-[10px] font-black uppercase tracking-widest outline-none transition-all"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <button onClick={loadData} className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all flex items-center gap-3">
          <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="text-[9px] font-black tracking-widest uppercase">Sync Engine</span>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4 opacity-30">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-[9px] uppercase font-black tracking-widest">Aggregating Node Data...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredGroups.map((group) => (
            <motion.div 
              key={group.accountId} 
              layout
              className="bg-white/[0.02] border border-white/10 rounded-[2.5rem] overflow-hidden transition-all"
            >
              {/* Account Header */}
              <div 
                onClick={() => toggleAccount(group.accountId)}
                className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-6 min-w-0">
                  <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center">
                    <User className="w-6 h-6 opacity-40 text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <PlatformIcon platform={group.platform} />
                      <h3 className="text-xl font-black italic tracking-tighter uppercase truncate">{group.accountName}</h3>
                    </div>
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-30">Node ID: {group.accountId}</p>
                  </div>
                </div>

                <div className="flex items-center gap-10">
                  <div className="text-center">
                    <p className="text-[9px] font-black opacity-30 uppercase italic mb-1">Assets</p>
                    <p className="text-lg font-black italic tracking-tighter">{group.videos.length}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] font-black opacity-30 uppercase italic mb-1">Total Views</p>
                    <p className="text-lg font-black italic tracking-tighter">{(group.totalViews / 1000).toFixed(1)}K</p>
                  </div>
                  <div className="text-center px-6 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <p className="text-[9px] font-black text-emerald-400 uppercase italic mb-0.5">Unpaid Growth</p>
                    <p className="text-lg font-black italic tracking-tighter text-emerald-400">+{group.unpaidGrowth.toLocaleString()}</p>
                  </div>
                  {expandedAccounts.has(group.accountId) ? <ChevronUp className="w-5 s-5 opacity-20" /> : <ChevronDown className="w-5 h-5 opacity-20" />}
                </div>
              </div>

              {/* Expanded Video List */}
              <AnimatePresence>
                {expandedAccounts.has(group.accountId) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-white/5 bg-black/20"
                  >
                    <div className="p-8 space-y-4">
                      {group.videos.map((video) => {
                        const lp = getLatestPayoutForVideo(video.id);
                        const unpaid = lp ? Math.max(0, video.views - lp.viewsAtPayment) : video.views;
                        
                        return (
                          <div key={video.id} className="flex flex-col md:flex-row items-center justify-between p-6 bg-white/[0.03] border border-white/5 rounded-2xl gap-6 group/video">
                            <div className="flex items-center gap-5 min-w-0 flex-1">
                               <div className="w-20 h-12 rounded-lg overflow-hidden border border-white/10 shrink-0">
                                 <img src={video.thumbnail} className="w-full h-full object-cover" />
                               </div>
                               <div className="min-w-0">
                                 <p className="font-black italic uppercase tracking-tight truncate text-sm">{video.title}</p>
                                 <div className="flex items-center gap-3 mt-1 opacity-40">
                                    <Film className="w-3 h-3" />
                                    <span className="text-[8px] font-black uppercase tracking-widest">{video.id}</span>
                                 </div>
                               </div>
                            </div>

                            <div className="flex items-center gap-12 shrink-0">
                               <div className="text-right">
                                 <p className="text-[8px] font-black opacity-20 uppercase">Lifetime</p>
                                 <p className="text-sm font-black italic leading-none">{video.views.toLocaleString()}</p>
                               </div>
                               <div className="text-right min-w-[80px]">
                                 <p className="text-[8px] font-black text-emerald-400 uppercase italic">New Cycle</p>
                                 <p className="text-sm font-black italic leading-none text-emerald-400">+{unpaid.toLocaleString()}</p>
                               </div>
                               
                               <div className="flex items-center gap-3">
                                  <button 
                                    onClick={() => handlePay(video)}
                                    className="px-6 py-2.5 bg-white text-black font-black uppercase text-[8px] tracking-widest rounded-xl hover:bg-slate-200 transition-all"
                                  >
                                    Mark Paid
                                  </button>
                                  <a href={video.link} target="_blank" className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all opacity-40 hover:opacity-100">
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                               </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}

      {!loading && filteredGroups.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 border border-white/5 rounded-[2.5rem] opacity-20">
          <p className="text-[10px] font-black uppercase tracking-widest italic">No matching node data found.</p>
        </div>
      )}
    </div>
  );
}
