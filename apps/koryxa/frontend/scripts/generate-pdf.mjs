import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";

const baseUrl = (process.env.PDF_BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
const outDir = "public/course-pdfs/data-analyst/module-3/theme-1";
const url = `${baseUrl}/school/data-analyst/module-3/theme-1/page/1`;
const outFile = path.join(outDir, "page-1.pdf");
const token = process.env.PDF_RENDER_TOKEN || "";

fs.mkdirSync(outDir, { recursive: true });

const run = async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  if (token) {
    await page.setExtraHTTPHeaders({ "x-koryxa-pdf-token": token });
  }

  await page.goto(url, { waitUntil: "networkidle" });

  // Attendre un élément stable du cours
  await page.waitForSelector("[data-koryxa-school-body]", { timeout: 30_000 });

  await page.pdf({
    path: outFile,
    format: "A4",
    printBackground: true,
    margin: { top: "12mm", right: "12mm", bottom: "14mm", left: "12mm" },
  });

  await browser.close();
  console.log("PDF OK:", outFile);
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

