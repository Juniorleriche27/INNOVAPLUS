/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

async function checkUrl(url, isVideo) {
  if (isVideo) {
    const oembed = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`;
    const res = await fetch(oembed, { method: "GET" });
    if (!res.ok) throw new Error(`Video unavailable: ${url}`);
    return true;
  }
  let res = await fetch(url, { method: "HEAD", redirect: "follow" });
  if (!res.ok || res.status >= 400) {
    res = await fetch(url, { method: "GET", redirect: "follow" });
  }
  if (!res.ok || res.status >= 400) {
    throw new Error(`Article unavailable: ${url}`);
  }
  return true;
}

async function main() {
  const resourcePath = path.join(__dirname, "../app/school/data-analyst/module-1/resources.json");
  const raw = fs.readFileSync(resourcePath, "utf-8");
  const data = JSON.parse(raw);

  const videos = data.videos || [];
  const articles = data.articles || [];

  console.log(`Checking ${videos.length} videos and ${articles.length} articles...`);

  for (const url of videos) {
    await checkUrl(url, true);
    console.log(`OK video: ${url}`);
  }
  for (const url of articles) {
    await checkUrl(url, false);
    console.log(`OK article: ${url}`);
  }

  console.log("All resources OK.");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
