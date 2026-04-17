'use client';

import React, { useState } from 'react';
import { 
  Hash, 
  Search, 
  TrendingUp, 
  Globe, 
  Loader2, 
  Instagram, 
  Music2,
  ExternalLink,
  Eye,
  Heart,
  MessageCircle,
  BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_ROUTES } from '@/lib/apiConfig';
import { safeFetchJson } from '@/lib/fetchUtils';

interface HashtagResult {
  id: string;
  platform: string;
  views: number;
  likes: number;
  comments: number;
  link: string;
  thumbnail: string;
  owner: string;
  date: string;
}

export default function HashtagsPage() {
  const [tag, setTag] = useState('');
  const [platform, setPlatform] = useState<'instagram' | 'tiktok'>('instagram');
  const [results, setResults] = useState<HashtagResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tag) return;

    setLoading(true);
    setError(null);
    try {
      const data = await safeFetchJson(`${API_ROUTES.HASHTAG_SCAN}?tag=${tag.replace('#', '')}&platform=${platform}`);
      if (data && data.results) {
        setResults(data.results);
      } else {
        setError('No data found for this protocol.');
      }
    } catch (err) {
      setError('Neural link failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const totalReach = results.reduce((acc, r) => acc + r.views, 0);
  const avgEngagement = results.length > 0 
    ? (results.reduce((acc, r) => acc + (r.likes + r.comments), 0) / totalReach * 100).toFixed(2)
    : '0.00';

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <div className="flex items-center gap-3 text-blue-500 mb-2 px-1">
            <Hash className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Infiltration Intelligence</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter text-white uppercase">Hashtag <span className="text-blue-600">Audit</span></h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">Monitor network-wide reach through specific tags</p>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
           <div className="relative group min-w-[300px]">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text"
                placeholder="ENTER TAG (e.g. #LinkMe)..."
                className="w-full pl-12 pr-6 py-4 bg-white/[0.03] border border-white/10 rounded-2xl focus:border-white/30 text-xs font-black uppercase tracking-widest text-white outline-none transition-all"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
              />
           </div>
           <div className="flex bg-white/[0.03] border border-white/10 rounded-2xl p-1 p-y-1.5">
              {[
                { id: 'instagram', icon: Instagram },
                { id: 'tiktok', icon: Music2 }
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id as any)}
                  type="button"
                  className={`px-6 py-2 rounded-xl flex items-center gap-2 transition-all ${platform === p.id ? 'bg-white text-black shadow-xl ring-4 ring-white/10' : 'text-slate-500 hover:text-white'}`}
                >
                  <p.icon className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{p.id}</span>
                </button>
              ))}
           </div>
           <button 
             type="submit"
             disabled={loading}
             className="px-8 py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
           >
             {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
             Run Audit
           </button>
        </form>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-32 flex flex-col items-center justify-center gap-6"
          >
             <div className="w-24 h-24 rounded-full border-t-2 border-blue-600 animate-spin" />
             <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 animate-pulse">Syncing Planetary Data...</p>
          </motion.div>
        ) : results.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12"
          >
             {/* Stats Summary */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Aggregate Reach', value: totalReach.toLocaleString(), sub: 'Across 20 Samples', icon: Eye, color: 'text-blue-500' },
                  { label: 'Network Engagement', value: `${avgEngagement}%`, sub: 'Viral Potential', icon: TrendingUp, color: 'text-emerald-400' },
                  { label: 'Platform Status', value: platform.toUpperCase(), sub: 'Verified Sync', icon: Globe, color: 'text-slate-100' }
                ].map(stat => (
                  <div key={stat.label} className="glass-card p-8 bg-white/[0.01]">
                     <stat.icon className={`w-5 h-5 ${stat.color} mb-6`} />
                     <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">{stat.label}</p>
                     <p className="text-3xl font-black italic text-white uppercase tracking-tighter">{stat.value}</p>
                     <p className="text-[8px] font-bold text-slate-600 uppercase mt-2">{stat.sub}</p>
                  </div>
                ))}
             </div>

             {/* Content Grid */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {results.map((result, i) => (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="group"
                  >
                    <div className="glass-card bg-white/[0.01] overflow-hidden group-hover:bg-white/[0.03] transition-all">
                       <div className="h-48 relative overflow-hidden">
                          <img src={result.thumbnail} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                          <div className="absolute bottom-4 left-4">
                             <p className="text-[10px] font-black italic text-white group-hover:text-blue-400">@{result.owner}</p>
                          </div>
                          <a href={result.link} target="_blank" className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-md rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity">
                             <ExternalLink className="w-4 h-4" />
                          </a>
                       </div>
                       <div className="p-5 space-y-4">
                          <div className="flex justify-between items-center text-[10px] font-black text-white italic">
                             <div className="flex items-center gap-1.5">
                                <Eye className="w-3 h-3 text-blue-500" />
                                <span>{result.views.toLocaleString()}</span>
                             </div>
                             <div className="flex items-center gap-1.5">
                                <Heart className="w-3 h-3 text-pink-500" />
                                <span>{result.likes.toLocaleString()}</span>
                             </div>
                             <div className="flex items-center gap-1.5">
                                <MessageCircle className="w-3 h-3 text-emerald-400" />
                                <span>{result.comments.toLocaleString()}</span>
                             </div>
                          </div>
                       </div>
                    </div>
                  </motion.div>
                ))}
             </div>
          </motion.div>
        ) : error ? (
          <div className="py-32 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
             <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-xs">{error}</p>
          </div>
        ) : (
          <div className="py-32 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
             <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-xs underline underline-offset-8 decoration-blue-500">Awaiting Search Signal</p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
