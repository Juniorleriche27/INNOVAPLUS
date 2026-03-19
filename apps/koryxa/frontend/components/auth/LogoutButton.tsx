"use client";

import clsx from "clsx";
import { MouseEvent, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { INNOVA_API_BASE } from "@/lib/env";

type LogoutButtonProps = {
  redirectTo?: string;
  label?: string;
  className?: string;
};

function normalizeRedirect(value: string | undefined): string {
  if (!value) return "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export default function LogoutButton({
  redirectTo = "/",
  label = "Déconnexion",
  className,
}: LogoutButtonProps) {
  const { clear } = useAuth();
  const [pending, setPending] = useState(false);

  async function onClick(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    const redirect = normalizeRedirect(redirectTo);
    if (pending) return;
    setPending(true);
    let apiLogoutOk = false;

    try {
      const response = await fetch(`${INNOVA_API_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
      apiLogoutOk = response.ok;
    } catch {
      apiLogoutOk = false;
    } finally {
      clear();
    }

    if (apiLogoutOk) {
      window.location.replace(redirect);
      return;
    }

    const fallbackTarget = `/logout?redirect=${encodeURIComponent(redirect)}`;
    window.location.replace(fallbackTarget);
  }

  return (
    <a
      href={`/logout?redirect=${encodeURIComponent(normalizeRedirect(redirectTo))}`}
      onClick={onClick}
      aria-disabled={pending}
      className={clsx(className, pending ? "pointer-events-none opacity-70" : "")}
    >
      {label}
    </a>
  );
}
