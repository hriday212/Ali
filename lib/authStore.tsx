'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Role = 'admin' | 'client';

interface User {
  email: string;
  role: Role;
}

interface AuthContextType {
  user: User | null;
  role: Role | null;
  login: (email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  isAdmin: boolean;
  isClient: boolean;
  isLoginModalOpen: boolean;
  setLoginModalOpen: (open: boolean) => void;
}

// Secure credentials pulled from environment variables for handover
// Secure credentials pulled from environment variables for handover
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_USER || '';
const ADMIN_PASS  = process.env.NEXT_PUBLIC_ADMIN_PASS || '';
const CLIENT_EMAIL = process.env.NEXT_PUBLIC_CLIENT_USER || '';
const CLIENT_PASS  = process.env.NEXT_PUBLIC_CLIENT_PASS || '';

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [user, setUser] = useState<User | null>(null);
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('clypso_user');
      if (stored) {
        setTimeout(() => setUser(JSON.parse(stored)), 0);
      }
    } catch {}
  }, []);

  const login = (email: string, password: string): { success: boolean; error?: string } => {
    const inputEmail = email.toLowerCase();
    let role: Role | null = null;

    if (inputEmail === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASS) {
      role = 'admin';
    } else if (inputEmail === CLIENT_EMAIL.toLowerCase() && password === CLIENT_PASS) {
      role = 'client';
    }

    if (!role) return { success: false, error: 'Invalid email or password.' };
    
    const u: User = { email: inputEmail, role };
    setUser(u);
    localStorage.setItem('clypso_user', JSON.stringify(u));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('clypso_user');
  };

  return (
    <AuthContext.Provider value={{
      user,
      role: user?.role ?? null,
      login,
      logout,
      isAdmin: user?.role === 'admin',
      isClient: user?.role === 'client',
      isLoginModalOpen,
      setLoginModalOpen,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
