'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Film, Play, Search, Loader2, ArrowUpRight, TrendingUp, Youtube, Instagram, Music2, Eye, Filter } from 'lucide-react';
import { API_ROUTES } from '@/lib/apiConfig';
import { safeFetchJson } from '@/lib/fetchUtils';

interface PostData {
  id: string;
  title: string;
  thumbnail: string;
  views: number | string;
  likes: number | string;
  comments: number | string;
  link: string;
  date?: string;
  type?: string;
  platform?: string;
  nodeId?: string;
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return 'Unknown';
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function formatNumber(n: number | string): string {
  const num = typeof n === 'string' ? parseInt(n) : n;
  if (isNaN(num)) return String(n);
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}

export default function GlobalVideosPage() {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activePlatform, setActivePlatform] = useState<string>('all');
  const [activeType, setActiveType] = useState<'all' | 'video' | 'short' | 'viral'>('all');
  const [visibleCount, setVisibleCount] = useState(30);

  useEffect(() => {
    async function loadLatest() {
      setLoading(true);
      try {
        const data = await safeFetchJson(`${API_ROUTES.SCANS}/latest-posts?limit=500`);
        if (data && data.posts) {
          // Identify shorts vs videos
          const mappedPosts = data.posts.map((p: any) => ({
            ...p,
            isShort: p.type === 'short' || p.platform === 'tiktok' || p.type === 'reel'
          }));
          setPosts(mappedPosts);
        }
      } catch (err) {
        console.error('Failed to load global posts', err);
      } finally {
        setLoading(false);
      }
    }
    loadLatest();
  }, []);

  let filteredPosts = posts.filter(post => {
    if (searchQuery && !post.title.toLowerCase().includes(searchQuery.toLowerCase()) && !post.nodeId?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (activePlatform !== 'all' && post.platform !== activePlatform) return false;
    
    // @ts-ignore
    if (activeType === 'short' && !post.isShort) return false;
    // @ts-ignore
    if (activeType === 'video' && post.isShort) return false;

    return true;
  });

  // Rank-wise sorting for Viral tab
  if (activeType === 'viral') {
    filteredPosts = [...filteredPosts].sort((a, b) => {
      const vA = typeof a.views === 'string' ? parseInt(a.views) : a.views;
      const vB = typeof b.views === 'string' ? parseInt(b.views) : b.views;
      return (vB || 0) - (vA || 0);
    });
  }

  const visiblePosts = filteredPosts.slice(0, visibleCount);

  return (
    <div className="space-y-8 min-h-[80vh] pb-24">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 mb-4">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 text-emerald-400 mb-3">
            <Film className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Content Library</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black italic text-white tracking-tighter uppercase mb-4">The Global Registry</h1>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed uppercase tracking-widest font-black italic opacity-60">Complete audit trail of all scraped network media assets.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
          {/* Platform Filters */}
          <div className="flex bg-white/[0.03] p-1.5 rounded-2xl border border-white/10 shrink-0 w-full sm:w-auto">
            {['all', 'youtube', 'tiktok', 'instagram'].map(p => (
              <button
                key={p}
                onClick={() => setActivePlatform(p)}
                className={`flex-1 sm:flex-none px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activePlatform === p ? 'bg-white/10 text-white shadow-lg border border-white/20' : 'text-slate-500 hover:text-white hover:bg-white/5 border border-transparent'}`}
              >
                {p === 'all' ? 'All' : p}
              </button>
            ))}
          </div>

          <div className="relative group w-full sm:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
            <input 
              type="text" 
              placeholder="SEARCH ASSETS..."
              className="w-full pl-11 pr-6 py-4 bg-white/[0.03] border border-white/10 focus:border-emerald-500/30 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white placeholder:text-slate-600 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Type Filters */}
      <div className="flex items-center gap-2 pb-6 border-b border-white/5">
        <Filter className="w-4 h-4 text-slate-600 mr-2" />
        <button
          onClick={() => setActiveType('all')}
          className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${activeType === 'all' ? 'bg-white/10 text-white border-white/20' : 'bg-transparent text-slate-500 border-white/5 hover:border-white/10'}`}
        >
          Everything
        </button>
        <button
          onClick={() => setActiveType('video')}
          className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${activeType === 'video' ? 'bg-white/10 text-white border-white/20' : 'bg-transparent text-slate-500 border-white/5 hover:border-white/10'}`}
        >
          Longform Vectors
        </button>
        <button
          onClick={() => setActiveType('short')}
          className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${activeType === 'short' ? 'bg-white/10 text-white border-white/20' : 'bg-transparent text-slate-500 border-white/5 hover:border-white/10'}`}
        >
          Short-Form Feeds
        </button>
        <button
          onClick={() => setActiveType('viral')}
          className={`px-4 py-2 flex items-center gap-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${activeType === 'viral' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-transparent text-slate-500 border-white/5 hover:border-white/10 hover:text-emerald-400'}`}
        >
          <TrendingUp className="w-3 h-3" />
          Ranked Viral
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-32 flex flex-col items-center justify-center gap-6">
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin opacity-50" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 animate-pulse">Syncing Global Datastore...</p>
        </div>
      ) : visiblePosts.length === 0 ? (
        <div className="py-32 flex flex-col items-center justify-center gap-6 border-2 border-dashed border-white/5 rounded-[3rem]">
          <Film className="w-12 h-12 text-slate-700" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">No assets detected</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            <AnimatePresence>
              {visiblePosts.map((post, i) => {
                const isShort = (post as any).isShort;
                const viewsNum = typeof post.views === 'string' ? parseInt(post.views) : post.views;
                const likesNum = typeof post.likes === 'string' ? parseInt(post.likes) : post.likes;
                const commentsNum = typeof post.comments === 'string' ? parseInt(post.comments) : post.comments;
                const engRate = viewsNum > 0 ? (((likesNum + commentsNum) / viewsNum) * 100).toFixed(1) : '0';

                return (
                  <motion.div
                    key={`${post.id}-${i}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="group"
                  >
                    <div className="glass-card overflow-hidden border-white/10 hover:border-emerald-500/30 transition-all duration-500 cursor-pointer h-full flex flex-col group/card" onClick={() => window.open(post.link, '_blank')}>
                      {/* Thumbnail Container */}
                      <div className={`relative w-full ${isShort ? 'aspect-[3/4]' : 'aspect-video'} bg-slate-900 overflow-hidden`}>
                        {post.thumbnail ? (
                          <img src={post.thumbnail} alt="" className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-700" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center opacity-30"><Film className="w-6 h-6" /></div>
                        )}
                        
                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent opacity-90" />
                        
                        {/* Rank Badge for Viral Tab */}
                        {activeType === 'viral' && (
                          <div className="absolute top-2 left-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-[10px] font-black text-black z-20 shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                            #{i + 1}
                          </div>
                        )}
                        
                        {/* Status Badges */}
                        <div className={`absolute top-2 ${activeType === 'viral' ? 'left-10' : 'left-2'} flex items-center gap-2 z-10`}>
                          <div className={`px-1.5 py-0.5 bg-black/60 backdrop-blur-md rounded-[4px] flex items-center gap-1 border border-white/10`}>
                            {post.platform === 'youtube' && <Youtube className="w-2.5 h-2.5 text-red-500" />}
                            {post.platform === 'instagram' && <Instagram className="w-2.5 h-2.5 text-pink-500" />}
                            {post.platform === 'tiktok' && <Music2 className="w-2.5 h-2.5 text-slate-100" />}
                          </div>
                        </div>
                        
                        <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
                          <div className={`px-1.5 py-0.5 bg-black/60 backdrop-blur-md rounded-[4px] border border-white/10 text-[6px] font-black uppercase tracking-widest text-white`}>
                            {isShort ? 'SHORT' : 'VID'}
                          </div>
                        </div>

                        {/* Text Overlay on Image */}
                        <div className="absolute bottom-2 left-2 right-2 z-10">
                          <h3 className="text-[10px] font-black uppercase italic tracking-tighter text-white leading-tight line-clamp-2 drop-shadow-md mb-1 group-hover/card:text-emerald-400 transition-colors">
                            {post.title || 'UNTITLED ASSET'}
                          </h3>
                          <span className="text-[7px] font-black text-emerald-400/80 uppercase tracking-widest inline-flex items-center gap-1 bg-emerald-500/10 px-1 py-0.5 rounded backdrop-blur border border-emerald-500/20">
                            {post.nodeId}
                          </span>
                        </div>

                        {/* Floating Node Tag */}
                        {post.nodeId && (
                          <div className="absolute bottom-3 left-3 px-2 py-1 bg-emerald-500/20 text-emerald-400 backdrop-blur-md rounded-md border border-emerald-500/30 text-[7px] font-black uppercase tracking-widest flex items-center gap-1">
                            {post.nodeId}
                          </div>
                        )}
                      </div>

                      {/* Analytics Footer */}
                      <div className="p-2 bg-white/[0.01]">
                        <div className="grid grid-cols-2 gap-1 mb-2">
                          <div className="bg-slate-900/60 p-2 rounded-lg flex flex-col items-center justify-center">
                            <span className="text-[6px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1"><Eye className="w-2 h-2" /> Reach</span>
                            <span className={`text-[10px] font-black italic tracking-tighter ${activeType === 'viral' ? 'text-emerald-400' : 'text-white'}`}>{formatNumber(post.views)}</span>
                          </div>
                          <div className="bg-slate-900/60 p-2 rounded-lg flex flex-col items-center justify-center">
                            <span className="text-[6px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1"><TrendingUp className="w-2 h-2" /> Eng</span>
                            <span className={`text-[10px] font-black italic tracking-tighter ${parseFloat(engRate) > 5 ? 'text-emerald-400' : 'text-slate-300'}`}>{engRate}%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between px-1">
                          <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">{timeAgo(post.date)}</span>
                          <div className="flex items-center gap-1 text-slate-500 group-hover/card:text-emerald-400 transition-colors">
                            <span className="text-[6px] font-black uppercase tracking-widest">Src</span>
                            <ArrowUpRight className="w-2.5 h-2.5" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Load More */}
          {visibleCount < filteredPosts.length && (
             <div className="mt-12 flex justify-center">
                <button
                  onClick={() => setVisibleCount(v => Math.min(v + 30, filteredPosts.length))}
                  className="px-12 py-5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/30 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all group"
                >
                  <span className="group-hover:text-emerald-400 transition-colors">Load More Archives</span>
                </button>
             </div>
          )}
        </>
      )}
    </div>
  );
}
