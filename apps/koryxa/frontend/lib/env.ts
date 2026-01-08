const DEFAULT_API_BASE = "https://api.innovaplus.africa";

function normalize(base: string | undefined, fallback: string): string {
  return (base && base.trim() ? base : fallback).replace(/\/+$/, "");
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
