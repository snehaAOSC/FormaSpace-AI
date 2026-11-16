import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, getStoredToken, setStoredToken } from "../lib/api";
import type { User } from "../types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, fullName: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateLocalCredits: (credits: number) => void;
  // Modal & Access Conditioning
  isLoginModalOpen: boolean;
  loginModalTarget: string;
  loginModalAction: string;
  openLoginModal: (targetUrl?: string, actionName?: string) => void;
  closeLoginModal: () => void;
  requireAuth: (targetUrl?: string, actionName?: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Login Prompt Modal state
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [loginModalTarget, setLoginModalTarget] = useState<string>("/studio");
  const [loginModalAction, setLoginModalAction] = useState<string>("");

  const refreshUser = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get<{ user: User }>("/api/auth/me");
      setUser(res.user);
    } catch {
      setStoredToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.post<{ access_token: string; user: User }>("/api/auth/login", {
      email,
      password,
    });
    setStoredToken(res.access_token);
    setUser(res.user);
    return res.user;
  };

  const register = async (email: string, password: string, fullName: string): Promise<User> => {
    const res = await api.post<{ access_token: string; user: User }>("/api/auth/register", {
      email,
      password,
      full_name: fullName,
    });
    setStoredToken(res.access_token);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    api.post("/api/auth/logout").catch(() => {});
    setStoredToken(null);
    setUser(null);
  };

  const updateLocalCredits = (credits: number) => {
    setUser((prev) => (prev ? { ...prev, credits } : prev));
  };

  const openLoginModal = (targetUrl?: string, actionName?: string) => {
    if (targetUrl) setLoginModalTarget(targetUrl);
    if (actionName) setLoginModalAction(actionName);
    setIsLoginModalOpen(true);
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
  };

  const requireAuth = (targetUrl: string = "/studio", actionName: string = "use this feature"): boolean => {
    if (user) {
      return true;
    }
    openLoginModal(targetUrl, actionName);
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
        updateLocalCredits,
        isLoginModalOpen,
        loginModalTarget,
        loginModalAction,
        openLoginModal,
        closeLoginModal,
        requireAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
