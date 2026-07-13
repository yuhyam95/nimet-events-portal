"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/lib/types';
import { authenticateUser } from '@/lib/actions';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  user: User | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('adminUser');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('adminUser');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
<<<<<<< HEAD
      const result = await authenticateUser(email, password);
      
      if (result) {
        setUser(result.user);
        setIsAuthenticated(true);
        localStorage.setItem('adminUser', JSON.stringify(result.user));
        localStorage.setItem('adminToken', result.token);
=======
      const userData = await authenticateUser(email, password);
      
      if (userData) {
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('adminUser', JSON.stringify(userData));
>>>>>>> 6b8d2698d05877becfca6b9699a253c973cf9ce0
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error in auth context:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('adminUser');
<<<<<<< HEAD
    localStorage.removeItem('adminToken');
=======
>>>>>>> 6b8d2698d05877becfca6b9699a253c973cf9ce0
    
    // Redirect to login page
    router.push('/admin/login');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout, user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
