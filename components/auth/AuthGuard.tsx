'use client';

import { useAuth } from '@/lib/authStore';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const publicRoutes = ['/'];
  
  useEffect(() => {
    if (mounted && !user && !publicRoutes.includes(pathname)) {
      router.push('/');
    }
  }, [user, pathname, mounted, router]);

  if (!mounted) return <>{children}</>;

  if (!user && !publicRoutes.includes(pathname)) {
    return null;
  }

  return <>{children}</>;
}
