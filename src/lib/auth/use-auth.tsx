'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth/client';

export interface UserProfile {
  id: string;
  authUserId: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: 'CITIZEN' | 'STUDENT' | 'FACULTY' | 'COMPANY_REP' | 'ADMIN';
  isVerified: boolean;
  universityId: string | null;
  city: string;
  state: string;
  formattedAddress: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  university?: {
    id: string;
    name: string;
  } | null;
}

export interface SessionUser {
  id: string;
  email: string;
  name?: string;
  image?: string | null;
}

interface AuthContextType {
  user: SessionUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAuthenticated: false,
  signOut: async () => {},
  refetch: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/session', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && data.user) {
          setUser(data.user);
          setProfile(data.profile || null);
        } else {
          setUser(null);
          setProfile(null);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
    } catch (error) {
      console.warn('Failed to fetch auth session:', error);
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSession();
  }, [fetchSession]);

  const signOut = async () => {
    try {
      await authClient.signOut();
    } catch (err) {
      console.warn('Sign out client error:', err);
    } finally {
      setUser(null);
      setProfile(null);
      router.push('/login');
      router.refresh();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isAuthenticated: !!user,
        signOut,
        refetch: fetchSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
