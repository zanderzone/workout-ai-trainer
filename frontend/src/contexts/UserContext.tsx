'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  preferences?: {
    workoutTime?: string;
    workoutDuration?: string;
    notifications?: {
      email: boolean;
      reminders: boolean;
    };
  };
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  updateUser: (data: Partial<User>) => void;
  checkSession: () => Promise<boolean>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/session');
      if (!response.ok) {
        setUser(null);
        return false;
      }
      const data = await response.json();
      if (!data.user) {
        setUser(null);
        return false;
      }
      setUser(data.user);
      return true;
    } catch (error) {
      console.error('Error checking session:', error);
      setUser(null);
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setUser(null);
    }
  };

  // Initial session check
  useEffect(() => {
    const initializeUser = async () => {
      try {
        await checkSession();
      } finally {
        setLoading(false);
      }
    };

    initializeUser();
  }, []);

  // Periodic session check (every 5 minutes)
  useEffect(() => {
    const interval = setInterval(async () => {
      if (user) {
        await checkSession();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [user]);

  const updateUser = (data: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : null));
  };

  return (
    <UserContext.Provider value={{ user, loading, updateUser, checkSession, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
} 