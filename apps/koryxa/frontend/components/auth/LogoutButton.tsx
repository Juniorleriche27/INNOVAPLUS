"use client";

import clsx from "clsx";
import { MouseEvent } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

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

  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    clear();
    const redirect = normalizeRedirect(redirectTo);
    const target = `/logout?redirect=${encodeURIComponent(redirect)}`;
    window.location.assign(target);
  }

  return (
    <a
      href={`/logout?redirect=${encodeURIComponent(normalizeRedirect(redirectTo))}`}
      onClick={onClick}
      className={clsx(className)}
    >
      {label}
    </a>
  );
}
