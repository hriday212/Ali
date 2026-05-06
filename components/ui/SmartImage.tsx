'use client';

import React from 'react';
import { ImageOff } from 'lucide-react';

interface SmartImageProps {
  src: string;
  alt?: string;
  className?: string;
  aspectRatio?: 'video' | 'portrait' | 'square';
}

export function SmartImage({ src, alt = "", className = "", aspectRatio = 'video' }: SmartImageProps) {
  const [errorCount, setErrorCount] = React.useState(0);
  const [isLoaded, setIsLoaded] = React.useState(false);

  // Multi-stage proxying
  const getSource = (attempt: number) => {
    if (!src) return '';
    
    let cleanSrc = src;
    // If it's already proxied, extract the original URL
    if (src.includes('wsrv.nl/?url=')) {
      const urlParam = new URL(src).searchParams.get('url');
      if (urlParam) cleanSrc = urlParam;
    }
    
    switch (attempt) {
      case 0: // Primary Proxy
        return `https://wsrv.nl/?url=${encodeURIComponent(cleanSrc)}&w=600&output=webp&n=-1`;
      case 1: // Secondary Mirror
        return `https://images.weserv.nl/?url=${encodeURIComponent(cleanSrc)}&w=600&output=webp`;
      case 2: // Direct with Referrer bypass
        return cleanSrc;
      default:
        return '';
    }
  };

  const currentSrc = getSource(errorCount);

  if (errorCount >= 3 || !src) {
    return (
      <div className={`flex flex-col items-center justify-center bg-slate-900 border border-white/5 rounded-lg opacity-30 ${className}`}>
        <ImageOff className="w-5 h-5 mb-1" />
        <span className="text-[7px] font-black uppercase tracking-tighter">Media Unavailable</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-slate-950 ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 animate-pulse bg-white/5" />
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
