'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Eye, Heart, MessageCircle, ExternalLink, Youtube, Music2, Instagram } from 'lucide-react';
import { API_ROUTES } from '@/lib/apiConfig';
import { safeFetchJson } from '@/lib/fetchUtils';

interface Post {
  id: string;
  title: string;
  thumbnail: string;
  views: number;
  likes: number;
  comments: number;
  platform: string;
  link: string;
  nodeId: string;
  date: string;
}

export function ContentPulse({ filterNodeId }: { filterNodeId?: string }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPosts() {
      const data = await safeFetchJson(`${API_ROUTES.LATEST_POSTS}?limit=20`);
      if (data && data.posts) {
        let filtered = data.posts;
        if (filterNodeId) {
          filtered = filtered.filter((p: Post) => p.nodeId === filterNodeId);
        }
        setPosts(filtered);
      }
      setLoading(false);
    }
    loadPosts();
  }, [filterNodeId]);

  if (loading) {
    return (
      <div className="flex gap-6 overflow-hidden py-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="min-w-[300px] h-[400px] bg-white/5 rounded-[2rem] animate-pulse border border-white/5" />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
        <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-xs">No Recent Signal Detected</p>
      </div>
    );
  }

  return (
    <div className="flex gap-6 overflow-x-auto pb-8 pt-4 custom-scrollbar snap-x">
      {posts.map((post, i) => (
        <ContentCard key={post.id} post={post} index={i} />
      ))}
    </div>
  );
}

function ContentCard({ post, index }: { post: Post, index: number }) {
  const PlatformIcon = post.platform === 'youtube' ? Youtube : post.platform === 'tiktok' ? Music2 : Instagram;

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="min-w-[320px] group relative snap-start"
    >
      <div className="glass-card overflow-hidden h-[420px] flex flex-col transition-all duration-500 group-hover:bg-white/[0.05] group-hover:border-white/20">
        {/* Thumbnail Area */}
        <div className="relative h-56 overflow-hidden">
          <img 
            src={post.thumbnail || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=225&fit=crop'} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            alt={post.title}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          
          <div className="absolute top-4 left-4">
            <div className="p-2 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 text-white">
              <PlatformIcon className="w-4 h-4" />
            </div>
          </div>

          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition-transform">
              <Play className="w-6 h-6 fill-current" />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[8px] font-black uppercase tracking-widest text-blue-500">{post.nodeId}</span>
              <div className="w-1 h-1 rounded-full bg-slate-800" />
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">
                {new Date(post.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </span>
            </div>
            <h3 className="text-sm font-black italic uppercase leading-relaxed text-white line-clamp-2 group-hover:text-blue-400 transition-colors">
              {post.title || 'Untitled Content Protocol'}
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-6">
            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-2 text-center">
              <Eye className="w-3 h-3 text-blue-400 mx-auto mb-1" />
              <span className="text-[10px] font-black italic text-white">{(post.views / 1000).toFixed(1)}k</span>
            </div>
            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-2 text-center">
              <Heart className="w-3 h-3 text-pink-500 mx-auto mb-1" />
              <span className="text-[10px] font-black italic text-white">{(post.likes / 1000).toFixed(1)}k</span>
            </div>
            <div className="bg-white/[0.03] border border-white/5 rounded-xl p-2 text-center">
              <MessageCircle className="w-3 h-3 text-emerald-400 mx-auto mb-1" />
              <span className="text-[10px] font-black italic text-white">{post.comments}</span>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <a 
          href={post.link} 
          target="_blank" 
          rel="noopener noreferrer"
          className="p-4 bg-white/5 border-t border-white/5 flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:bg-white hover:text-black transition-all"
        >
          View Source Protocol <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </motion.div>
  );
}
