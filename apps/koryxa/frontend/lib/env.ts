const DEFAULT_API_BASE = "https://api.innovaplus.africa";

function normalize(base: string | undefined, fallback: string): string {
  return (base && base.trim() ? base : fallback).replace(/\/+$/, "");
}

export const AUTH_API_BASE = normalize(
  process.env.NEXT_PUBLIC_API_URL || process.env.API_URL,
  DEFAULT_API_BASE,
);

export const INNOVA_API_BASE = `${AUTH_API_BASE}/innova/api`;

export const CHATLAYA_API_BASE = normalize(
  process.env.NEXT_PUBLIC_CHATLAYA_URL,
  AUTH_API_BASE,
);

export const SITE_BASE_URL = normalize(
  process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL,
  "https://innovaplus.africa",
);
