'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Youtube, 
  Instagram, 
  Music2,
  Trash2,
  ChevronRight,
  User,
  RefreshCw,
  Edit2,
  Check,
  X
} from 'lucide-react';
import { API_ROUTES } from '@/lib/apiConfig';
import { safeFetchJson } from '@/lib/fetchUtils';

interface AccountCardProps {
  account: {
    id: string;
    name: string;
    platform: string;
    followers: string;
    status: string;
    hasNew?: boolean;
    link: string;
    avatarUrl?: string; // High-fidelity PFP
  };
  onDelete: (id: string) => void;
  onUpdate?: (id: string, newLink: string) => void;
}

const PlatformIcon = ({ platform }: { platform: string }) => {
  if (platform === 'youtube') return <Youtube className="w-4 h-4 text-slate-100" />;
  if (platform === 'instagram') return <Instagram className="w-4 h-4 text-slate-100" />;
  if (platform === 'tiktok') return <Music2 className="w-4 h-4 text-slate-100" />;
  return null;
};

export default function AccountCard({ account, onDelete, onUpdate }: AccountCardProps) {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedLink, setEditedLink] = React.useState(account.link);
  const [isUpdating, setIsUpdating] = React.useState(false);

  const handleUpdate = async () => {
    if (!onUpdate || editedLink === account.link) {
      setIsEditing(false);
      return;
    }
    setIsUpdating(true);
    try {
      await onUpdate(account.id, editedLink);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const displayName = React.useMemo(() => {
    if (account.name && account.name !== 'New Account' && !account.name.includes('?')) return account.name;
    if (!account.link) return account.name;
    try {
      const url = new URL(account.link);
      let slug = url.pathname.split('/').filter(Boolean).pop() || '';
      slug = slug.replace('@', '');
      return slug || account.name;
    } catch(e) {
      return account.name;
    }
  }, [account.name, account.link]);

  const handleManualSync = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      // @ts-ignore
      const url = typeof API_ROUTES.SYNC_ACCOUNT === 'function' ? API_ROUTES.SYNC_ACCOUNT(account.id) : '';
      await fetch(url, { method: 'POST' });
    } catch (err) {
      console.error('Manual sync failed', err);
    } finally {
      setTimeout(() => setIsSyncing(false), 2000);
    }
  };

  return (
    <motion.div
      layout
      whileHover={{ y: -8, scale: 1.02 }}
      className="glass-card group relative p-6 flex flex-col items-center text-center cursor-pointer transition-all hover:bg-white/[0.03] active:scale-95 border-white/10 hover:border-white/40 overflow-hidden"
      onClick={() => router.push(`/accounts/${account.id}`)}
    >
      {/* The Silk Shimmer (Revealed on Hover) */}
      <motion.div 
        animate={{ x: ['-200%', '200%'] }}
        transition={{ repeat: Infinity, duration: 3, ease: "linear", repeatDelay: 1 }}
        className="absolute inset-0 w-full h-full skew-x-[45deg] bg-gradient-to-r from-transparent via-white/[0.05] to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
      />

      {/* Surface Gloss */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Notification Dot */}
      {account.hasNew && (
        <div className="absolute top-4 right-4 z-10 flex">
          <div className="w-2.5 h-2.5 bg-white rounded-full animate-ping absolute" />
          <div className="w-2.5 h-2.5 bg-white rounded-full ring-2 ring-slate-950 shadow-[0_0_15px_rgba(255,255,255,0.6)]" />
        </div>
      )}

      {/* Profile / Platform Badge Container */}
      <div className="relative mb-5 z-10">
        <div className="w-24 h-24 bg-slate-900 rounded-3xl flex items-center justify-center ring-1 ring-white/10 shadow-3xl overflow-hidden group-hover:ring-white/40 transition-all duration-500">
           {account.avatarUrl ? (
             <img 
               src={account.avatarUrl} 
               alt={displayName} 
               className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500"
             />
           ) : (
             <div className="w-full h-full bg-slate-800/50 flex items-center justify-center text-slate-500">
               <User className="w-12 h-12" />
             </div>
           )}
        </div>
        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-black border border-white/20 rounded-2xl flex items-center justify-center shadow-2xl transform group-hover:rotate-6 group-hover:scale-110 transition-all">
          <PlatformIcon platform={account.platform} />
        </div>
      </div>

      <div className="space-y-1 z-10">
        <h3 className="font-black text-white text-lg tracking-tight italic group-hover:text-white transition-colors uppercase">
          {displayName}
        </h3>
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-slate-300 transition-colors">
          {account.followers} <span className="text-[10px] text-slate-600 italic">Network Reach</span>
        </p>
      </div>

      {/* Action Suite (Optimized Visibility) */}
      <div className="mt-8 flex items-center justify-center w-full gap-2 z-20">
        <motion.button 
          whileHover={{ scale: 1.1, backgroundColor: 'rgba(52, 211, 153, 0.15)' }}
          whileTap={{ scale: 0.9 }}
          onClick={handleManualSync}
          disabled={isSyncing}
          className={`p-3 bg-white/5 ${isSyncing ? 'text-emerald-500 opacity-100' : 'text-slate-500 hover:text-emerald-400 opacity-30 group-hover:opacity-100'} rounded-2xl transition-all duration-300 shadow-xl`}
          title="Instant Sync"
        >
          <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
        </motion.button>

        <motion.button 
          whileHover={{ scale: 1.1, backgroundColor: 'rgba(59, 130, 246, 0.15)' }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(!isEditing);
          }}
          className={`p-3 bg-white/5 ${isEditing ? 'text-blue-500 opacity-100' : 'text-slate-500 hover:text-blue-400 opacity-30 group-hover:opacity-100'} rounded-2xl transition-all duration-300 shadow-xl`}
          title="Correct Link"
        >
          <Edit2 className="w-5 h-5" />
        </motion.button>

        <motion.button 
          whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.15)' }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(account.id);
          }}
          className="p-3 bg-white/5 text-slate-500 hover:text-red-500 opacity-30 group-hover:opacity-100 rounded-2xl transition-all duration-300 shadow-xl"
          title="Delete Node"
        >
          <Trash2 className="w-5 h-5" />
        </motion.button>

        <motion.div 
          onClick={() => router.push(`/accounts/${account.id}`)}
          whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
          className="p-3 bg-white/10 text-white rounded-2xl opacity-30 group-hover:opacity-100 duration-300 shadow-2xl"
        >
          <ChevronRight className="w-5 h-5" />
        </motion.div>
      </div>

      {isEditing && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-x-0 bottom-0 top-[180px] bg-slate-950/95 backdrop-blur-md p-6 z-40 rounded-b-3xl border-t border-white/10 flex flex-col justify-center"
          onClick={(e) => e.stopPropagation()}
        >
           <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-3">Correct Typo / Edit Link</p>
           <div className="space-y-4">
             <input
               type="text"
               value={editedLink}
               onChange={(e) => setEditedLink(e.target.value)}
               className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white font-bold focus:outline-none focus:border-blue-500 transition-all shadow-inner"
               placeholder="Enter corrected URL..."
               autoFocus
             />
             <div className="flex gap-2">
               <button
                 onClick={handleUpdate}
                 disabled={isUpdating}
                 className="flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3 text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
               >
                 {isUpdating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                 Update Link
               </button>
               <button
                 onClick={() => { setIsEditing(false); setEditedLink(account.link); }}
                 className="px-4 bg-white/5 hover:bg-white/10 text-slate-400 rounded-xl py-3 border border-white/10 transition-all font-black uppercase text-[10px] tracking-widest"
               >
                 <X className="w-4 h-4" />
               </button>
             </div>
           </div>
        </motion.div>
      )}

      <div className="mt-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] group-hover:opacity-0 transition-opacity z-10 italic">
        Connection Idle
      </div>

      {/* Gloss Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.08] to-transparent pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity" />
    </motion.div>
  );
}
