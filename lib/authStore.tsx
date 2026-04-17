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
}

// Hardcoded demo credentials
const CREDENTIALS: Record<string, { password: string; role: Role }> = {
  'admin@clypso.io': { password: 'LinkMe@Admin1', role: 'admin' },
  'client@clypso.io': { password: 'LinkMe@Client1', role: 'client' },
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('clypso_user');
      if (stored) setUser(JSON.parse(stored));
    } catch {}
  }, []);

  const login = (email: string, password: string): { success: boolean; error?: string } => {
    const match = CREDENTIALS[email.toLowerCase()];
    if (!match) return { success: false, error: 'Email not recognized.' };
    if (match.password !== password) return { success: false, error: 'Incorrect password.' };
    const u: User = { email, role: match.role };
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
