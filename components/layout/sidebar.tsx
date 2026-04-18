'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  BarChart3, 
  Settings, 
  TrendingUp,
  LogOut
} from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { name: 'Accounts', icon: Users, href: '/accounts' },
  { name: 'Payments', icon: CreditCard, href: '/payments' },
  { name: 'Analytics', icon: BarChart3, href: '/analytics' },
  { name: 'Settings', icon: Settings, href: '/settings' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen bg-[#0f172a] border-r border-[#1e293b] flex flex-col fixed left-0 top-0 z-50">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
          <TrendingUp className="text-white w-6 h-6" />
        </div>
        <span className="text-xl font-bold text-white tracking-tight">Clipper.io</span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                isActive 
                  ? "bg-blue-600/10 text-blue-400" 
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5",
                isActive ? "text-blue-400" : "text-slate-400 group-hover:text-slate-200"
              )} />
              <span className="font-medium">{item.name}</span>
              {isActive && (
                <motion.div 
                  layoutId="active-pill"
                  className="absolute left-0 w-1 h-6 bg-blue-500 rounded-r-full"
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#1e293b]">
        <button className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-red-400 hover:bg-red-400/5 rounded-xl transition-all">
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>

      <div className="p-4 m-4 bg-[#1e293b]/50 rounded-2xl border border-[#334155]/50">
        <p className="text-[10px] uppercase font-bold text-slate-500 mb-2 tracking-widest text-center">Pro Plan</p>
        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-6 h-6 rounded-full border-2 border-[#1e293b] bg-slate-700" />
            ))}
          </div>
          <span className="text-xs text-slate-300 font-medium">+15 Accounts</span>
        </div>
      </div>
    </aside>
  );
}
