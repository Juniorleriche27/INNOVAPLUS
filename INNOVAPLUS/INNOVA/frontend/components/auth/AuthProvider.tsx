"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type User = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  roles?: string[];
  created_at?: string;
} | null;

type AuthContextValue = {
  user: User;
  loading: boolean;
  refresh: () => Promise<void>;
  clear: () => void;
  initialLoggedIn: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const SESSION_COOKIE = "innova_session";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  const hasSessionCookie = useMemo(() => {
    if (typeof document === "undefined") return false;
    try {
      return document.cookie.split(";").some((part) => part.trim().startsWith(`${SESSION_COOKIE}=`));
    } catch {
      return false;
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store", credentials: "include" });
      if (!res.ok) throw new Error("not auth");
      const data = (await res.json()) as User;
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setUser(null);
  }, []);

  useEffect(() => {
    if (hasSessionCookie) {
      void refresh();
      return;
    }
    setLoading(false);
    setUser(null);
  }, [hasSessionCookie, refresh]);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, clear, initialLoggedIn: hasSessionCookie }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
