'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { checkAuthStatus } from '@/lib/api';

interface User {
  _id: string;
  email: string;
  provider: string;
  providerId: string;
  name?: string;
  isRegistrationComplete: boolean;
  createdAt: string;
  updatedAt: string;
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
  const [lastChecked, setLastChecked] = useState<number>(0);

  const checkSession = async (force: boolean = false) => {
    try {
      const now = Date.now();
      // Only check if forced or if last check was more than 4.5 minutes ago
      if (!force && lastChecked && now - lastChecked < 4.5 * 60 * 1000) {
        return !!user;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        return false;
      }

      const response = await checkAuthStatus();
      setLastChecked(now);

      if (!response.isAuthenticated || !response.user) {
        setUser(null);
        localStorage.removeItem('token');
        return false;
      }

      setUser(response.user);
      return true;
    } catch (error) {
      console.error('Error checking session:', error);
      setUser(null);
      localStorage.removeItem('token');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setLastChecked(0);
  };

  // Initial session check
  useEffect(() => {
    const initializeUser = async () => {
      try {
        await checkSession(true);
      } finally {
        setLoading(false);
      }
    };

    initializeUser();
  }, []);

  // Periodic session check (every 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        checkSession();
      }
    }, 5 * 60 * 1000);

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