import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";

const manifestPath = process.env.PDF_MANIFEST || "course-pdf-manifest.json";
const manifestRaw = fs.readFileSync(manifestPath, "utf-8");
const manifest = JSON.parse(manifestRaw);

const baseUrl = (process.env.PDF_BASE_URL || manifest.baseUrl || "http://localhost:3000").replace(/\/+$/, "");
const exportsList = Array.isArray(manifest.exports) ? manifest.exports : [];
const token = process.env.PDF_RENDER_TOKEN || "";

async function run() {
  if (!exportsList.length) {
    throw new Error(`No exports found in manifest: ${manifestPath}`);
  }

  const browser = await chromium.launch();

  for (const item of exportsList) {
    const urlPath = String(item.url || "");
    const out = String(item.out || "");
    if (!urlPath || !out) continue;

    const fullUrl = `${baseUrl}${urlPath.startsWith("/") ? "" : "/"}${urlPath}`;
    const outDir = path.dirname(out);
    fs.mkdirSync(outDir, { recursive: true });

    const page = await browser.newPage();
    if (token) {
      await page.setExtraHTTPHeaders({ "x-koryxa-pdf-token": token });
    }

    await page.goto(fullUrl, { waitUntil: "networkidle" });
    await page.waitForSelector("[data-koryxa-school-body]", { timeout: 30_000 });

    await page.pdf({
      path: out,
      format: "A4",
      printBackground: true,
      margin: { top: "12mm", right: "12mm", bottom: "14mm", left: "12mm" },
    });
    await page.close();
    console.log("PDF OK:", out);
  }

  await browser.close();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

