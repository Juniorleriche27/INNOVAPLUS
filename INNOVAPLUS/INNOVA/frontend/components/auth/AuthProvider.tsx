"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
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
const pendingRefresh = new WeakMap<Window | Document, Promise<void>>();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoggedIn, setInitialLoggedIn] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const res = await fetch(`${AUTH_API_BASE}/auth/me`, {
        cache: "no-store",
        credentials: "include",
        signal: controller.signal,
      });
      if (!res.ok) throw new Error("not auth");
      const data = (await res.json()) as User;
      setUser(data);
      setInitialLoggedIn(true);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setUser(null);
        setInitialLoggedIn(false);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  const clear = useCallback(() => {
    abortRef.current?.abort();
    setUser(null);
    setInitialLoggedIn(false);
  }, []);

  useEffect(() => {
    void refresh();
    return () => abortRef.current?.abort();
  }, [refresh]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const targetWindow = window;
    const targetDocument = document;

    const scheduleRefresh = () => {
      const existing = pendingRefresh.get(targetWindow);
      if (existing) return;
      const promise = refresh().finally(() => pendingRefresh.delete(targetWindow));
      pendingRefresh.set(targetWindow, promise);
    };

    const handleVisibility = () => {
      if (targetDocument.visibilityState === "visible") {
        scheduleRefresh();
      }
    };

    targetWindow.addEventListener("focus", scheduleRefresh);
    targetDocument.addEventListener("visibilitychange", handleVisibility);
    return () => {
      targetWindow.removeEventListener("focus", scheduleRefresh);
      targetDocument.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [refresh]);

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
