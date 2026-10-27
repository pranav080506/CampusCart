import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, College } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  college: College | null;
  availableUsers: User[];
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  switchUser: (userId: string) => Promise<void>;
  switchCollege: (collegeId: string) => Promise<void>;
  signup: (data: {
    fullName: string;
    email: string;
    password: string;
    studentId?: string;
    department?: string;
    hostel?: string;
    phone?: string;
  }) => Promise<{ success: boolean; error?: string; message?: string }>;
  login: (data: { email: string; password: string }) => Promise<{ success: boolean; error?: string; message?: string }>;
  loginWithGoogle: (data: { email: string; fullName?: string; studentId?: string; department?: string }) => Promise<{ success: boolean; error?: string; message?: string }>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [college, setCollege] = useState<College | null>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchAuth = async () => {
    try {
      const [meRes, usersRes] = await Promise.all([
        api.getCurrentUser(),
        api.getUsers()
      ]);

      if (meRes.success) {
        setUser(meRes.user);
        setCollege(meRes.college);
      }
      if (usersRes.success) {
        setAvailableUsers(usersRes.users);
      }
    } catch (err) {
      console.error('Failed to load auth:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuth();
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  };

  const switchUser = async (userId: string) => {
    try {
      setIsLoading(true);
      const res = await api.switchUser(userId);
      if (res.success) {
        setUser(res.user);
        setCollege(res.college);
      }
    } catch (err) {
      console.error('Failed to switch user:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const switchCollege = async (collegeId: string) => {
    try {
      setIsLoading(true);
      const res = await api.switchCollege(collegeId);
      if (res.success) {
        setCollege(res.college);
      }
    } catch (err) {
      console.error('Failed to switch college:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: {
    fullName: string;
    email: string;
    password: string;
    studentId?: string;
    department?: string;
    hostel?: string;
    phone?: string;
  }) => {
    try {
      setIsLoading(true);
      const res = await api.signup(data);
      if (res.success && res.user) {
        setUser(res.user);
        if (res.college) setCollege(res.college);
        setAvailableUsers(prev => [...prev.filter(u => u.id !== res.user!.id), res.user!]);
        return { success: true, message: res.message };
      }
      return { success: false, error: res.error || 'Failed to register account' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (data: { email: string; password: string }) => {
    try {
      setIsLoading(true);
      const res = await api.login(data);
      if (res.success && res.user) {
        setUser(res.user);
        if (res.college) setCollege(res.college);
        return { success: true, message: res.message };
      }
      return { success: false, error: res.error || 'Failed to sign in' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (data: { email: string; fullName?: string; studentId?: string; department?: string }) => {
    try {
      setIsLoading(true);
      const res = await api.loginWithGoogle(data);
      if (res.success && res.user) {
        setUser(res.user);
        if (res.college) setCollege(res.college);
        setAvailableUsers(prev => [...prev.filter(u => u.id !== res.user!.id), res.user!]);
        return { success: true, message: res.message };
      }
      return { success: false, error: res.error || 'Google login failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Google login failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        college,
        availableUsers,
        isDarkMode,
        toggleDarkMode,
        switchUser,
        switchCollege,
        signup,
        login,
        loginWithGoogle,
        logout,
        refreshAuth: fetchAuth,
        isLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
