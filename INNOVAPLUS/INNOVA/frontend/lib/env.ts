const DEFAULT_API_BASE = "https://api.innovaplus.africa";

export const AUTH_API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_URL ||
  DEFAULT_API_BASE
).replace(/\/+$/, "");

export const CHATLAYA_API_BASE = (
  process.env.NEXT_PUBLIC_CHATLAYA_URL ||
  AUTH_API_BASE
).replace(/\/+$/, "");

export const SITE_BASE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  "https://innovaplus.africa"
).replace(/\/+$/, "");
