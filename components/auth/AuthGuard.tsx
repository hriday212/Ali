'use client';

import { useAuth } from '@/lib/authStore';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const publicRoutes = ['/'];
  
  useEffect(() => {
    if (mounted && !loading && !user && !publicRoutes.includes(pathname)) {
      router.push('/');
    }
  }, [user, loading, pathname, mounted, router]);

  // Prevent hydration mismatch and wait for auth check
  if (!mounted || loading) {
    return (
      <div className="fixed inset-0 bg-[#020617] flex items-center justify-center z-[9999]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-500/50 animate-pulse">Synchronizing Terminal...</p>
        </div>
      </div>
    );
  }

  if (!user && !publicRoutes.includes(pathname)) {
    return null;
  }

  return <>{children}</>;
}
