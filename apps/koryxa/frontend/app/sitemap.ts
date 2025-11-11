import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://innovaplus.africa";
  const now = new Date();
  const pages: Array<{ loc: string; priority: number }> = [
    { loc: "/", priority: 1.0 },
    { loc: "/opportunities", priority: 0.9 },
    { loc: "/chatlaya", priority: 0.8 },
    { loc: "/meet", priority: 0.7 },
    { loc: "/marketplace", priority: 0.7 },
    { loc: "/about", priority: 0.6 },
    { loc: "/resources", priority: 0.6 },
    { loc: "/privacy", priority: 0.5 },
  ];
  return pages.map((p) => ({
    url: `${base}${p.loc}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: p.priority,
  }));
}
