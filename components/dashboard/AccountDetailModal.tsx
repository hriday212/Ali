'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  TrendingUp, 
  DollarSign, 
  PieChart as PieChartIcon, 
  Calendar,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  User,
  Database
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  PieChart,
  Pie, 
  Cell,
  ComposedChart,
  Line
} from 'recharts';

interface AccountDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: any;
}

const MOCK_DETAIL_STATS = [
  { time: 'Day 1', views: 4000 },
  { time: 'Day 5', views: 12000 },
  { time: 'Day 10', views: 8000 },
  { time: 'Day 15', views: 25000 },
  { time: 'Day 20', views: 18000 },
  { time: 'Day 25', views: 42000 },
  { time: 'Day 30', views: 35000 },
];

const MOCK_RECENT_POSTS = [
  { id: '1', title: 'Why I started a faceless channel...', views: '1.2M', date: '2h ago', link: '#' },
  { id: '2', title: 'The secret to 10k subscribers in 30 days', views: '850K', date: 'Yesterday', link: '#' },
  { id: '3', title: 'Editing workflow for viral shorts', views: '2.4M', date: '3 days ago', link: '#' },
];

const ENGAGEMENT_DATA = [
  { name: 'Views', value: 55, color: '#ffffff' }, // Full White
  { name: 'Likes', value: 30, color: '#94a3b8' }, // Light Gray
  { name: 'Comments', value: 15, color: '#475569' }, // Gray
];

export default function AccountDetailModal({ isOpen, onClose, account }: AccountDetailModalProps) {
  const [activeSubHUD, setActiveSubHUD] = React.useState<'performance' | 'engagement' | null>(null);
  const [selectedPost, setSelectedPost] = React.useState<any>(null);

  if (!account) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-8">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-6xl h-[90vh] bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header HUD */}
            <div className="flex items-center justify-between p-8 border-b border-slate-800/50 bg-slate-900/50 relative z-[60]">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center ring-1 ring-slate-700 overflow-hidden shadow-inner transform -rotate-2">
                  {account.avatarUrl ? (
                    <img src={account.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-900/50 flex items-center justify-center text-slate-700">
                      <User className="w-10 h-10" />
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">{account.name}</h2>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">{account.followers} Subscribers</span>
                    <div className="w-1 h-1 bg-white/20 rounded-full" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Active HUD Tracking</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-3 bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white rounded-2xl transition-all active:scale-95 border border-white/5"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content Scroll Area */}
            <div className="flex-1 overflow-y-auto p-8 space-y-12 custom-scrollbar bg-slate-900/40 relative">
              
              {/* Row 1: Analytics Hud */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <motion.div 
                  whileHover={{ scale: 1.01 }}
                  onClick={() => setActiveSubHUD('performance')}
                  className="lg:col-span-2 glass-card p-10 flex flex-col h-[420px] cursor-pointer group hover:border-white/20 transition-all"
                >
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <TrendingUp className="w-5 h-5 text-white" />
                      <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Performance Matrix</h3>
                    </div>
                    <div className="px-5 py-2 bg-white/5 border border-white/10 rounded-full text-[9px] font-black text-white uppercase tracking-widest italic flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      Live HUD Pulse
                    </div>
                  </div>
                  
                  <div className="flex-1 w-full min-h-0 pointer-events-none">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={MOCK_DETAIL_STATS}>
                        <defs>
                          <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ffffff" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                        <XAxis dataKey="time" stroke="#4a5568" fontSize={9} tickLine={false} axisLine={false} dy={10} tick={{fontWeight: 'black'}} />
                        <YAxis stroke="#4a5568" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(val) => `${val/1000}k`} tick={{fontWeight: 'black'}} />
                        <Area type="monotone" dataKey="views" stroke="#ffffff" strokeWidth={2} fillOpacity={1} fill="url(#viewsGradient)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                <div className="flex flex-col gap-6">
                  <motion.div 
                    whileHover={{ scale: 1.01 }}
                    onClick={() => setActiveSubHUD('engagement')}
                    className="glass-card p-8 h-[300px] flex flex-col cursor-pointer group hover:border-white/20 transition-all"
                  >
                    <div className="flex items-center gap-4 mb-8">
                      <PieChartIcon className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                      <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Efficiency Protocol</h3>
                    </div>
                    <div className="flex-1 relative flex items-center justify-center pointer-events-none min-h-[160px]">
                      <ResponsiveContainer width="100%" height={160}>
                        <PieChart>
                          <Pie data={ENGAGEMENT_DATA} innerRadius={45} outerRadius={65} paddingAngle={10} dataKey="value" stroke="none">
                            {ENGAGEMENT_DATA.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-xl font-black text-white italic tracking-tighter">72%</span>
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">Aggregate</span>
                      </div>
                    </div>
                  </motion.div>

                  <div 
                    onClick={() => window.open(account.link, '_blank')}
                    className="glass-card p-6 h-[94px] border-white/20 hover:border-white/40 group cursor-pointer transition-all active:scale-95 flex flex-col justify-center"
                  >
                     <div className="flex items-center justify-between mb-2">
                        <span className="text-[8px] font-black text-white uppercase tracking-[0.4em] italic opacity-40">Systemic Outlier</span>
                        <ExternalLink className="w-3 h-3 text-white/40 group-hover:text-white" />
                     </div>
                     <div className="flex gap-4 items-center">
                        <div className="w-10 h-10 bg-white/5 rounded-lg flex-shrink-0 flex items-center justify-center italic text-white/20 font-black text-xs">V</div>
                        <div className="min-w-0">
                           <p className="text-[10px] font-black text-white uppercase truncate italic tracking-tighter leading-none">Systemic Breakout Network...</p>
                           <p className="text-[10px] font-black text-white italic mt-1 leading-none">2.4M <span className="text-slate-600 lowercase tracking-normal">reach</span></p>
                        </div>
                     </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Secondary Hub */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
                <div className="glass-card p-10 h-[400px] flex flex-col">
                  <div className="flex items-center gap-4 mb-10 flex-shrink-0">
                    <DollarSign className="w-5 h-5 text-white" />
                    <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Payout Ledger</h3>
                  </div>
                  <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
                    {account.payouts?.length > 0 ? (
                      account.payouts.map((p: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-6 bg-black/40 border border-white/5 rounded-3xl group hover:border-white/20 transition-all">
                          <div className="flex items-center gap-6">
                            <Calendar className="w-5 h-5 text-slate-500" />
                            <div>
                                <p className="text-[11px] font-black text-white uppercase italic tracking-tighter">{new Date(p.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} Cycle</p>
                                <p className="text-[9px] font-black text-slate-600 uppercase">Verified Payout</p>
                            </div>
                          </div>
                          <p className="text-2xl font-black text-white italic tracking-tighter">${p.amount.toFixed(0)}</p>
                        </div>
                      ))
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-700 italic text-[11px] uppercase font-black tracking-[0.4em] opacity-30">Zero Ledger Entries</div>
                    )}
                  </div>
                </div>

                <div className="glass-card p-10 h-[400px] flex flex-col">
                  <div className="flex items-center gap-4 mb-10 flex-shrink-0">
                    <ChevronRight className="w-5 h-5 text-white" />
                    <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Protocol Feed</h3>
                  </div>
                  <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
                    {MOCK_RECENT_POSTS.map((post) => (
                      <div 
                        key={post.id} 
                        onClick={() => setSelectedPost(post)}
                        className="flex items-center justify-between p-6 bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 rounded-3xl cursor-pointer transition-all group"
                      >
                         <div className="flex items-center gap-6 min-w-0">
                            <div className="w-10 h-10 bg-black border border-white/10 rounded-xl flex items-center justify-center flex-shrink-0 italic font-black text-xs text-slate-600 group-hover:text-white transition-colors">{post.id}</div>
                            <div className="truncate">
                               <p className="text-[11px] font-black text-white uppercase italic tracking-tighter truncate group-hover:text-white transition-colors">{post.title}</p>
                               <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">{post.date}</p>
                            </div>
                         </div>
                         <div className="text-right flex-shrink-0 ml-4">
                            <p className="text-sm font-black text-white italic">{post.views}</p>
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 3: Asset Registry (Scroll down for all posts) */}
              <div className="pt-8">
                 <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                          <Database className="w-5 h-5 text-white" />
                       </div>
                       <div>
                          <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none">Asset Registry</h3>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mt-2">Deep-Archive Retrieval</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-3xl font-black text-white italic tracking-tighter">{MOCK_RECENT_POSTS.length * 4}<span className="text-[10px] text-slate-600 ml-2 uppercase font-sans font-normal tracking-widest">Total Assets</span></p>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                    {/* Repeated for demonstration */}
                    {[...MOCK_RECENT_POSTS, ...MOCK_RECENT_POSTS, ...MOCK_RECENT_POSTS, ...MOCK_RECENT_POSTS].map((post, i) => (
                       <motion.div 
                        key={`${post.id}-${i}`}
                        whileHover={{ y: -6, scale: 1.02 }}
                        onClick={() => setSelectedPost(post)}
                        className="glass-card group p-6 flex flex-col gap-6 cursor-pointer border-white/5 hover:border-white/20 transition-all overflow-hidden relative"
                       >
                          <div className="h-40 bg-slate-900 border border-white/5 rounded-2xl flex items-center justify-center relative overflow-hidden">
                             <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.02] to-transparent" />
                             <User className="w-10 h-10 text-slate-800" />
                          </div>
                          <div className="space-y-2">
                             <p className="text-[11px] font-black text-white italic uppercase tracking-tighter truncate leading-none">{post.title}</p>
                             <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{post.date}</span>
                                <span className="text-[10px] font-black text-white italic opacity-40 group-hover:opacity-100 transition-opacity">{post.views} reach</span>
                             </div>
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                       </motion.div>
                    ))}
                 </div>
              </div>

              {/* Forensic Sub-HUD Overlays */}
              <AnimatePresence>
                {activeSubHUD && (
                  <motion.div 
                    initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                    animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
                    exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                    className="absolute inset-0 z-[100] flex items-center justify-center p-8 bg-black/60"
                  >
                    <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-2xl bg-black border border-white/10 rounded-[3rem] p-12 shadow-2xl relative">
                      <button onClick={() => setActiveSubHUD(null)} className="absolute top-8 right-8 p-3 bg-white/5 rounded-2xl text-slate-500 hover:text-white transition-all"><X className="w-5 h-5" /></button>
                      {activeSubHUD === 'performance' ? (
                        <div>
                          <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2">Forensic Performance</h3>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mb-12">Telemetry View-Log</p>
                          <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-4">
                             {MOCK_DETAIL_STATS.map((s, i) => (
                               <div key={i} className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                                  <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{s.time}</span>
                                  <span className="text-xl font-black text-white italic">{s.views.toLocaleString()}</span>
                               </div>
                             ))}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2">Engagement Protocol</h3>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mb-12">Interaction Deep-Scan</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {ENGAGEMENT_DATA.map((item, i) => (
                              <div key={i} className="p-8 bg-white/[0.02] border border-white/5 rounded-[2rem]">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">{item.name}</p>
                                <p className="text-4xl font-black text-white italic leading-none">{item.value}%</p>
                                <div className="w-full h-1.5 bg-white/5 mt-6 rounded-full overflow-hidden">
                                   <motion.div initial={{ width: 0 }} animate={{ width: `${item.value}%` }} transition={{ duration: 1, delay: 0.1 }} className="h-full bg-white/30" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </motion.div>
                )}

                {/* Post Forensic Sub-HUD (Responsive Fix + Navigation) */}
                {selectedPost && (
                  <motion.div 
                    initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                    animate={{ opacity: 1, backdropFilter: "blur(20px)" }}
                    exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                    className="absolute inset-0 z-[120] flex items-center justify-center p-4 md:p-12 bg-black/80"
                  >
                    <motion.div 
                        initial={{ scale: 0.9, y: 50, opacity: 0 }} 
                        animate={{ scale: 1, y: 0, opacity: 1 }} 
                        className="w-full max-w-5xl bg-slate-950 border border-white/10 rounded-[3rem] p-10 md:p-14 shadow-[0_0_100px_rgba(255,255,255,0.05)] relative overflow-hidden flex flex-col max-h-[90vh]"
                    >
                       <div className="absolute top-0 right-0 p-12 pointer-events-none opacity-5"><Database className="w-[300px] h-[300px] text-white" /></div>
                       
                       <div className="absolute top-8 right-8 flex items-center gap-4 z-20">
                          {/* Registry Navigation HUD */}
                          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl p-1.5 backdrop-blur-xl">
                             <button 
                                onClick={(e) => {
                                   e.stopPropagation();
                                   const idx = MOCK_RECENT_POSTS.findIndex(p => p.id === selectedPost.id);
                                   if (idx > 0) setSelectedPost(MOCK_RECENT_POSTS[idx - 1]);
                                }}
                                className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                                disabled={MOCK_RECENT_POSTS.findIndex(p => p.id === selectedPost.id) === 0}
                             >
                                <ChevronLeft className="w-4 h-4" />
                             </button>
                             <div className="w-px h-4 bg-white/10 mx-1" />
                             <button 
                                onClick={(e) => {
                                   e.stopPropagation();
                                   const idx = MOCK_RECENT_POSTS.findIndex(p => p.id === selectedPost.id);
                                   if (idx < MOCK_RECENT_POSTS.length - 1) setSelectedPost(MOCK_RECENT_POSTS[idx + 1]);
                                }}
                                className="p-2 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                                disabled={MOCK_RECENT_POSTS.findIndex(p => p.id === selectedPost.id) === MOCK_RECENT_POSTS.length - 1}
                             >
                                <ChevronRight className="w-4 h-4" />
                             </button>
                          </div>
                          <button onClick={() => setSelectedPost(null)} className="p-3 bg-white/5 rounded-2xl text-slate-500 hover:text-white transition-all"><X className="w-5 h-5" /></button>
                       </div>
                       
                       <div className="relative z-10 flex flex-col h-full overflow-hidden">
                          <div className="flex-shrink-0 flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                             <div className="min-w-0">
                                <h3 className="text-2xl md:text-3xl font-black text-white italic uppercase tracking-tighter leading-tight mb-3 truncate pr-32">{selectedPost.title}</h3>
                                <div className="flex items-center gap-4">
                                   <div className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{selectedPost.date}</div>
                                   <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Asset ID: {selectedPost.id}</div>
                                   <div className="px-3 py-1.5 bg-white/[0.02] border border-white/5 rounded-full text-[8px] font-black text-slate-700 uppercase tracking-widest italic">
                                      Registry Node {MOCK_RECENT_POSTS.findIndex(p => p.id === selectedPost.id) + 1} / {MOCK_RECENT_POSTS.length}
                                   </div>
                                </div>
                             </div>
                             <div className="text-left md:text-right flex-shrink-0">
                                <p className="text-[9px] font-black text-white uppercase tracking-[0.4em] mb-1 opacity-40 italic">Viral Integrity</p>
                                <p className="text-3xl font-black text-white italic">8.4<span className="text-sm text-slate-600 ml-1 italic tracking-normal">/10</span></p>
                             </div>
                          </div>

                          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-y-auto custom-scrollbar pr-2 lg:pr-4">
                             {/* Mini Forensic Chart (Stabilized Viewport) */}
                             <div className="lg:col-span-2 min-h-[350px] lg:h-[420px] bg-black/40 border border-white/10 rounded-[2.5rem] p-8 flex flex-col relative overflow-hidden group">
                                <div className="flex items-center justify-between mb-8 flex-shrink-0">
                                   <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] leading-none">Reach Velocity Analysis</p>
                                   <div className="flex gap-4">
                                      <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-white" /><span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">Actual Reach</span></div>
                                      <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full border border-white/40" /><span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none">Protocol Baseline</span></div>
                                   </div>
                                </div>
                                <div className="flex-1 w-full h-full min-h-0 relative">
                                   <ResponsiveContainer width="99%" height="100%">
                                      <ComposedChart data={MOCK_DETAIL_STATS}>
                                         <defs>
                                           <linearGradient id="postReach" x1="0" y1="0" x2="0" y2="1">
                                             <stop offset="5%" stopColor="#ffffff" stopOpacity={0.1}/>
                                             <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                                           </linearGradient>
                                         </defs>
                                         <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                                         <XAxis dataKey="time" stroke="#4a5568" fontSize={9} tickLine={false} axisLine={false} tick={{fontWeight: 'black'}} />
                                         <YAxis stroke="#4a5568" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(val) => `${val/1000}k`} tick={{fontWeight: 'black'}} />
                                         <Area type="monotone" dataKey="views" fill="url(#postReach)" stroke="#ffffff" strokeWidth={2} />
                                         <Line type="monotone" dataKey={(val) => val.views * 0.75} stroke="#ffffff20" strokeDasharray="4 4" dot={false} strokeWidth={1} />
                                      </ComposedChart>
                                   </ResponsiveContainer>
                                </div>
                             </div>

                             {/* Metadata Cluster */}
                             <div className="space-y-6 min-h-0 flex flex-col">
                                <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] flex flex-col group hover:border-white/20 transition-all">
                                   <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 italic">Accumulated Reach</p>
                                   <p className="text-4xl md:text-5xl font-black text-white italic tracking-tighter leading-none">{selectedPost.views.toUpperCase()}</p>
                                   <div className="flex items-center gap-2 mt-4">
                                      <TrendingUp className="w-3 h-3 text-white animate-bounce" />
                                      <p className="text-[9px] font-black text-white italic uppercase tracking-[0.2em]">+14% Surge Spike</p>
                                   </div>
                                </div>

                                <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] space-y-8 flex-1">
                                   <div>
                                      <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-5 italic">Interaction Protocol</p>
                                      <div className="grid grid-cols-2 gap-4">
                                         <div className="flex flex-col">
                                            <p className="text-sm font-black text-white italic tracking-tight">84.2K</p>
                                            <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em] mt-1">Likes Found</p>
                                         </div>
                                         <div className="flex flex-col">
                                            <p className="text-sm font-black text-white italic tracking-tight">3.2K</p>
                                            <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em] mt-1">Direct Shares</p>
                                         </div>
                                      </div>
                                   </div>
                                   <div className="h-px bg-white/5 w-full" />
                                   <div>
                                      <div className="flex items-center justify-between mb-4">
                                         <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">Retention Index</span>
                                         <span className="text-[10px] font-black text-white italic tracking-widest">92%</span>
                                      </div>
                                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                         <motion.div initial={{ width: 0 }} animate={{ width: "92%" }} transition={{ duration: 1.5, delay: 0.5 }} className="h-full bg-white/20" />
                                      </div>
                                      <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest mt-4 italic">Device: Android/iOS Dominance</p>
                                   </div>
                                </div>
                             </div>
                          </div>

                          <div className="flex-shrink-0 mt-8 flex items-center justify-between border-t border-white/5 pt-8">
                             <div className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" />
                                <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.5em] italic">Forensic Sequence: Post_{selectedPost.id}_Alpha</p>
                             </div>
                             <button 
                              onClick={() => window.open(account.link, '_blank')}
                              className="px-10 py-4 bg-white text-black font-black uppercase text-[9px] tracking-[0.4em] rounded-2xl shadow-2xl hover:bg-slate-200 transition-all flex items-center gap-5 group"
                             >
                                <ExternalLink className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" /> Open source pipeline 
                             </button>
                          </div>
                       </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Modal Footer */}
            <div className="p-8 bg-slate-950 border-t border-white/5 flex items-center justify-between relative z-[60]">
               <div className="flex items-center gap-4">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_10px_white]" />
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] italic leading-none">Network Node Synchronized: Dec 2023</p>
               </div>
              <div className="flex gap-4">
                <button onClick={onClose} className="px-8 py-4 bg-slate-900 border border-white/10 hover:bg-slate-800 text-slate-400 font-bold rounded-2xl transition-all text-[10px] uppercase tracking-widest">Close Command Console</button>
                <a href={account.link} target="_blank" className="flex items-center gap-3 px-10 py-4 bg-white hover:bg-slate-200 text-black font-black rounded-2xl shadow-xl shadow-white/5 transition-all text-[10px] uppercase tracking-[0.2em] group">View Channel <ExternalLink className="w-4 h-4 group-hover:scale-110 transition-transform" /></a>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
