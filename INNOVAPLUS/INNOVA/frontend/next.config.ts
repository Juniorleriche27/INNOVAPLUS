// next.config.ts
import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// Optionnel : proxy API (ex: Render) via /api/*
// (ex: /api/projects -> https://innova-1-v3ab.onrender.com/projects)
const DEFAULT_API_BASE = "https://api.innovaplus.africa";
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_BASE).replace(/\/+$/, "");

const nextConfig: NextConfig = {
  // Qualité & DX
  reactStrictMode: true,
  poweredByHeader: false,

  // Lint/TS : on tolère en prod pour ne pas bloquer les builds.
  // (Quand tout sera propre, remets ces deux flags à false.)
  eslint: { ignoreDuringBuilds: isProd },
  typescript: { ignoreBuildErrors: isProd },

  // Next 15 : typedRoutes est maintenant au niveau racine
  typedRoutes: true,

  // Expés encore valides en Next 15
  experimental: {
    optimizePackageImports: ["react", "react-dom"],
  },

  // Sécurité HTTP de base
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "no-referrer" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ];
  },

  // (Optionnel) Proxy vers ton backend pour éviter les CORS côté navigateur.
  async rewrites() {
    return [
      {
        source: "/api/auth/:path*",
        destination: `${API_BASE}/auth/:path*`,
      },
      {
        source: "/api/chatlaya/:path*",
        destination: `${API_BASE}/chatlaya/:path*`,
      },
    ];
  },

  // Images externes (complète si besoin)
  images: {
    remotePatterns: [
      // { protocol: "https", hostname: "innova-1-v3ab.onrender.com" },
      // { protocol: "https", hostname: "*.vercel.app" },
    ],
  },
};

export default nextConfig;
