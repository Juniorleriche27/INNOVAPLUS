export default function sitemap() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://innovaplus.vercel.app";
  const urls = [
    "/",
    "/opportunities",
    "/chatlaya",
    "/meet",
    "/marketplace",
    "/privacy"
  ];
  const now = new Date().toISOString();
  return urls.map((path) => ({ url: `${base}${path}`, lastModified: now, changeFrequency: "daily", priority: 0.8 }));
}

