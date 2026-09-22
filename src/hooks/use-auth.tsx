'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { UserProfile, KesitRole } from '@/types/auth';
import { getCurrentUserAction, logoutAction } from '@/server/actions/auth.actions';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  role: KesitRole | null;
  isLoading: boolean;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  role: null,
  isLoading: true,
  logout: async () => {},
  refreshAuth: async () => {},
});

export function AuthProvider({
  children,
  initialProfile,
  initialUser,
}: {
  children: React.ReactNode;
  initialProfile?: UserProfile | null;
  initialUser?: User | null;
}) {
  const [user, setUser] = useState<User | null>(initialUser || null);
  const [profile, setProfile] = useState<UserProfile | null>(initialProfile || null);
  const [isLoading, setIsLoading] = useState<boolean>(!initialProfile);
  const router = useRouter();

  const fetchAuth = async () => {
    try {
      const res = await getCurrentUserAction();
      setUser(res.user);
      setProfile(res.profile);
    } catch (err) {
      console.error('Error fetching auth:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!initialProfile) {
      fetchAuth();
    }
  }, [initialProfile]);

  const handleLogout = async () => {
    await logoutAction();
    setUser(null);
    setProfile(null);
    router.push('/login');
    router.refresh();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role: profile?.role || null,
        isLoading,
        logout: handleLogout,
        refreshAuth: fetchAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
