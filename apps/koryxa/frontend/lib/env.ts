// Default to the same domain as the app unless explicitly overridden in env.
// This avoids prod breakage when api.* is not configured.
const DEFAULT_API_BASE = "https://innovaplus.africa";
const LEGACY_API_HOST = "https://api.innovaplus.africa";

function normalize(base: string | undefined, fallback: string): string {
  const raw = (base && base.trim() ? base : fallback).replace(/\/+$/, "");
  // Safety fallback: if legacy api host has TLS issues, route through main domain.
  if (raw.startsWith(LEGACY_API_HOST)) {
    return raw.replace(LEGACY_API_HOST, DEFAULT_API_BASE);
  }
  return raw;
}

export const AUTH_API_BASE = normalize(
  process.env.NEXT_PUBLIC_API_URL || process.env.API_URL,
  DEFAULT_API_BASE,
);

function normalizeInnovaBase(authBase: string): string {
  let base = authBase.replace(/\/+$/, "");
  // If the env already contains multiple /innova/api segments, reduce to a single occurrence.
  base = base.replace(/(\/innova\/api)+$/, "/innova/api");
  if (!base.endsWith("/innova/api")) {
    base = `${base}/innova/api`;
  }
  return base;
}

export const INNOVA_API_BASE = normalizeInnovaBase(AUTH_API_BASE);

export const CHATLAYA_API_BASE = normalize(
  process.env.NEXT_PUBLIC_CHATLAYA_URL,
  AUTH_API_BASE,
);

export const SITE_BASE_URL = normalize(
  process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL,
  "https://innovaplus.africa",
);

export const IS_V1_SIMPLE =
  (process.env.NEXT_PUBLIC_V1_SIMPLE || "").toLowerCase() === "true" ||
  (process.env.NEXT_PUBLIC_APP_MODE || "").toUpperCase() === "V1";
