import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:3010";
const OUT_DIR = process.env.OUT_DIR || path.resolve(process.cwd(), "../../../docs/proofs/koryxa-school-athena");

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

function safeName(value) {
  return value.replace(/[^a-z0-9._-]+/gi, "-").replace(/-+/g, "-").replace(/(^-|-$)/g, "");
}

async function main() {
  await ensureDir(OUT_DIR);

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  async function goto(pathname) {
    await page.goto(`${BASE_URL}${pathname}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(250);
  }

  async function injectUrlBanner() {
    await page.evaluate(() => {
      const existing = document.querySelector("[data-proof-url]");
      if (existing) existing.remove();
      const el = document.createElement("div");
      el.dataset.proofUrl = "1";
      el.textContent = window.location.href;
      Object.assign(el.style, {
        position: "fixed",
        top: "64px",
        left: "12px",
        right: "12px",
        zIndex: "999999",
        padding: "8px 10px",
        fontFamily:
          "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
        fontSize: "12px",
        borderRadius: "12px",
        background: "rgba(15, 23, 42, 0.92)",
        color: "white",
        border: "1px solid rgba(148, 163, 184, 0.35)",
      });
      document.body.appendChild(el);
    });
  }

  async function screenshot(name) {
    const out = path.join(OUT_DIR, `${safeName(name)}.png`);
    await page.screenshot({ path: out, fullPage: false });
  }

  // Step 1 — Fullscreen layout on /school/data-analyst (headbar visible)
  await goto("/school/data-analyst");
  await page.waitForSelector(".koryxa-school-athena", { timeout: 10000 });
  await screenshot("01-step1-fullscreen-school-data-analyst");

  // Step 2 — Dropdown Parcours open
  await page.getByRole("button", { name: "Parcours" }).click();
  await screenshot("02-step2-dropdown-parcours-open");

  // Step 2 — Dropdown Module open
  await page.keyboard.press("Escape").catch(() => void 0);
  await page.getByRole("button", { name: "Module" }).click();
  await screenshot("03-step2-dropdown-module-open");

  // Step 2 — Select another module, show different TOC
  await page.getByRole("button", { name: /Module 2/i }).click();
  await page.waitForSelector("[data-koryxa-school-sidebar]", { timeout: 10000 });
  await screenshot("04-step2-after-select-module-2-toc-changed");

  // Step 3 — Click a TOC item, highlight active (URL proof via banner)
  await goto("/school/data-analyst/module-1/theme-1/page/2");
  await page.getByRole("link", { name: /^Page 3 —/ }).click();
  await page.waitForTimeout(250);
  await injectUrlBanner();
  await screenshot("05-step3-click-toc-item-active-highlight-url-banner");

  // Step 4 — Independent scroll: body scroll while sidebar stays
  await goto("/school/data-analyst/module-1/theme-1/page/2");
  await page.evaluate(() => {
    const body = document.querySelector("[data-koryxa-school-body]");
    if (body) body.scrollTop = Math.max(800, Math.floor(body.scrollHeight * 0.35));
  });
  await injectUrlBanner();
  await screenshot("06-step4-body-scrolled-sidebar-still");

  // Step 4 — Independent scroll: sidebar scroll while body stays
  await goto("/school/data-analyst/module-1/theme-1/page/2");
  await page.evaluate(() => {
    const sidebar = document.querySelector("[data-koryxa-school-sidebar]");
    const body = document.querySelector("[data-koryxa-school-body]");
    if (body) body.scrollTop = 0;
    if (sidebar) sidebar.scrollTop = Math.max(400, Math.floor(sidebar.scrollHeight * 0.6));
  });
  await injectUrlBanner();
  await screenshot("07-step4-sidebar-scrolled-body-still");

  // Step 5 — Resources in-flow (FR/EN) visible (no right panel)
  await goto("/school/data-analyst/module-1/theme-4/page/1");
  await page.evaluate(() => {
    const body = document.querySelector("[data-koryxa-school-body]");
    if (!body) return;
    const headings = Array.from(body.querySelectorAll("h2, p")).filter((el) =>
      (el.textContent || "").includes("Ressources")
    );
    const target = headings[0];
    if (target) {
      const top = target.getBoundingClientRect().top + body.scrollTop - 140;
      body.scrollTop = Math.max(0, top);
    } else {
      body.scrollTop = Math.max(0, body.scrollHeight - body.clientHeight - 1);
    }
  });
  await injectUrlBanner();
  await screenshot("08-step5-resources-fr-en-in-flow");

  // Module 3 — Theme 1 Page 1: reading width + hierarchy + callouts + table
  await goto("/school/data-analyst/module-3/theme-1/page/1");
  await page.evaluate(() => {
    const body = document.querySelector("[data-koryxa-school-body]");
    if (!body) return;
    const table = body.querySelector("table");
    if (!table) return;
    const top = table.getBoundingClientRect().top + body.scrollTop - 160;
    body.scrollTop = Math.max(0, top);
  });
  await injectUrlBanner();
  await screenshot("09-module3-theme1-page1-reading-callouts-table");

  await browser.close();
  console.log(`Saved screenshots to: ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
