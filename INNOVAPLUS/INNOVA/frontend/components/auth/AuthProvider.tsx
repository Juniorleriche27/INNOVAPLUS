"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type User = { id: string; name?: string | null; email?: string } | null;

type AuthContextValue = {
  user: User;
  loading: boolean;
  refresh: () => Promise<void>;
  clear: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  // Bootstrap hint from non-HTTPOnly cookie to reduce UI clignotement
  const hasLoginFlag = useMemo(() => {
    try {
      if (typeof document === "undefined") return false;
      return /(?:^|; )innova_logged_in=1(?:;|$)/.test(document.cookie);
    } catch {
      return false;
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store", credentials: "include" });
      if (!res.ok) throw new Error("not auth");
      const u = await res.json();
      setUser(u);
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
    // Si on a l'indicateur, tente immédiatement un rafraîchissement
    // Sinon, marque l'état comme non connecté sans flash
    if (hasLoginFlag) {
      void refresh();
    } else {
      setLoading(false);
      setUser(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasLoginFlag]);

  return (
    <AuthContext.Provider value={{ user, loading, refresh, clear }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
