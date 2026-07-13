"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, authApi, setToken, getToken, usersApi } from "./api";
import type { Role, User } from "./types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (fullName: string, email: string, password: string, role: Role) => Promise<User>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const profile = await usersApi.getProfile();
      setUser(profile);
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(async (email: string, password: string) => {
    const { user: loggedInUser, accessToken } = await authApi.login({ email, password });
    setToken(accessToken);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const register = useCallback(
    async (fullName: string, email: string, password: string, role: Role) => {
      const { user: newUser, accessToken } = await authApi.register({
        fullName,
        email,
        password,
        role,
      });
      setToken(accessToken);
      setUser(newUser);
      return newUser;
    },
    []
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    router.push("/login");
  }, [router]);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await usersApi.getProfile();
      setUser(profile);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setToken(null);
        setUser(null);
      }
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
