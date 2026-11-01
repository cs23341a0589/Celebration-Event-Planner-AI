import React, { createContext, useContext, useState, useEffect } from "react";
import { UserProfile } from "../types/index.ts";
import { api, setAuthToken, clearAuthToken, getAuthToken } from "../services/api.ts";

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  register: (name: string, email: string, password?: string) => Promise<void>;
  demoLogin: () => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  resetPassword: (email: string) => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initAuth() {
      const existingToken = getAuthToken();
      if (existingToken) {
        try {
          const res = await api.getMe();
          setUser(res.user);
        } catch (err) {
          console.warn("Failed to load user session, attempting demo user fallback", err);
          // Try demo login
          try {
            const demoRes = await api.demoLogin();
            setAuthToken(demoRes.token);
            setUser(demoRes.user);
          } catch {
            clearAuthToken();
          }
        }
      } else {
        // Auto-seed demo session for smooth instant preview
        try {
          const demoRes = await api.demoLogin();
          setAuthToken(demoRes.token);
          setUser(demoRes.user);
        } catch (e) {
          console.warn("No default session available", e);
        }
      }
      setLoading(false);
    }
    initAuth();
  }, []);

  const login = async (email: string, password?: string) => {
    const res = await api.login({ email, password });
    setAuthToken(res.token);
    setUser(res.user);
  };

  const register = async (name: string, email: string, password?: string) => {
    const res = await api.register({ name, email, password });
    setAuthToken(res.token);
    setUser(res.user);
  };

  const demoLogin = async () => {
    const res = await api.demoLogin();
    setAuthToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    clearAuthToken();
    setUser(null);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    const res = await api.updateProfile(updates);
    setUser(res.user);
  };

  const resetPassword = async (email: string) => {
    const res = await api.resetPassword(email);
    return res.message;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        demoLogin,
        logout,
        updateProfile,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
