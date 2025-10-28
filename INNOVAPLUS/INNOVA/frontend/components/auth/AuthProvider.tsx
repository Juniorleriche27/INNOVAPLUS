"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AUTH_API_BASE } from "@/lib/env";

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

function detectSessionCookie(): boolean {
  if (typeof document === "undefined") return false;
  try {
    return document.cookie.split(";").some((part) => part.trim().startsWith(`${SESSION_COOKIE}=`));
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoggedIn, setInitialLoggedIn] = useState<boolean>(() => detectSessionCookie());

  const syncCookiePresence = useCallback(() => {
    const present = detectSessionCookie();
    setInitialLoggedIn(present);
    return present;
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    const cookiePresent = syncCookiePresence();
    if (!cookiePresent) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${AUTH_API_BASE}/auth/me`, { cache: "no-store", credentials: "include" });
      if (!res.ok) throw new Error("not auth");
      const data = (await res.json()) as User;
      setUser(data);
      setInitialLoggedIn(true);
    } catch {
      setUser(null);
      setInitialLoggedIn(false);
    } finally {
      setLoading(false);
    }
  }, [syncCookiePresence]);

  const clear = useCallback(() => {
    setUser(null);
    setInitialLoggedIn(false);
  }, []);

  useEffect(() => {
    const present = syncCookiePresence();
    if (present) {
      void refresh();
    } else {
      setLoading(false);
    }
  }, [refresh, syncCookiePresence]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleVisibility = () => {
      const present = syncCookiePresence();
      if (present && !user) {
        void refresh();
      }
      if (!present) {
        setUser(null);
      }
    };
    window.addEventListener("focus", handleVisibility);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("focus", handleVisibility);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [refresh, syncCookiePresence, user]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, refresh, clear, initialLoggedIn }),
    [user, loading, refresh, clear, initialLoggedIn]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
