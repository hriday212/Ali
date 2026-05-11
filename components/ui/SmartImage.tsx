'use client';

import React from 'react';
import { ImageOff, Youtube, Instagram, Music2 } from 'lucide-react';

interface SmartImageProps {
  src: string;
  alt?: string;
  className?: string;
  aspectRatio?: 'video' | 'portrait' | 'square';
  platform?: string;
}

export function SmartImage({ src, alt = "", className = "", aspectRatio = 'video', platform = 'youtube' }: SmartImageProps) {
  const [errorCount, setErrorCount] = React.useState(0);
  const [isLoaded, setIsLoaded] = React.useState(false);

  // Multi-stage proxying with Direct Fallback
  const getSource = (attempt: number) => {
    if (!src) return '';
    
    let cleanSrc = src;
    if (src.includes('wsrv.nl/?url=')) {
      try {
        const urlParam = new URL(src).searchParams.get('url');
        if (urlParam) cleanSrc = urlParam;
      } catch(e) { cleanSrc = src; }
    }
    
    switch (attempt) {
      case 0: // Primary Proxy
        return `https://wsrv.nl/?url=${encodeURIComponent(cleanSrc)}&w=600&output=webp&n=-1`;
      case 1: // Direct with Referrer bypass (Strongest for TT/IG)
        return cleanSrc;
      case 2: // Secondary Mirror
        return `https://images.weserv.nl/?url=${encodeURIComponent(cleanSrc)}&w=600&output=webp`;
      default:
        return '';
    }
  };

  const currentSrc = getSource(errorCount);

  if (errorCount >= 3 || !src) {
    return (
      <div className={`flex flex-col items-center justify-center bg-slate-900 border border-white/5 rounded-lg opacity-40 ${className}`}>
        {platform === 'youtube' && <Youtube className="w-5 h-5 mb-1 text-red-500/50" />}
        {platform === 'tiktok' && <Music2 className="w-5 h-5 mb-1 text-white/50" />}
        {platform === 'instagram' && <Instagram className="w-5 h-5 mb-1 text-pink-500/50" />}
        {!['youtube', 'tiktok', 'instagram'].includes(platform) && <ImageOff className="w-5 h-5 mb-1" />}
        <span className="text-[6px] font-black uppercase tracking-widest opacity-50">Offline</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-slate-950 ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 animate-pulse bg-white/5 flex items-center justify-center">
            {platform === 'youtube' && <Youtube className="w-4 h-4 text-white/10" />}
            {platform === 'tiktok' && <Music2 className="w-4 h-4 text-white/10" />}
            {platform === 'instagram' && <Instagram className="w-4 h-4 text-white/10" />}
        </div>
      )}
      <img
        src={currentSrc}
        alt={alt}
        referrerPolicy="no-referrer"
        onLoad={() => setIsLoaded(true)}
        onError={() => setErrorCount(prev => prev + 1)}
        className={`w-full h-full object-cover transition-all duration-700 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}`}
      />
    </div>
  );
}
