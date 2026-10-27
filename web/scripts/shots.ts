import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const base = process.env.BASE_URL ?? "http://127.0.0.1:3000";

const routes = [
  ["home", "/"],
  ["estadio", "/estadio/estadio-monumental"],
  ["evento", "/evento/mana-estadio-monumental"],
  ["ciudad", "/ciudad/buenos-aires"],
] as const;

const widths = [1440, 1024, 768, 390];

async function main() {
  const out = path.join(process.cwd(), ".shots");
  await mkdir(out, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage();

  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    for (const [name, route] of routes) {
      await page.goto(`${base}${route}`, { waitUntil: "domcontentloaded" });
      await page.waitForFunction(() => {
        const heading = document.querySelector("h1");
        return Boolean(heading && !heading.textContent?.includes("Un momento"));
      });
      const file = path.join(out, `${name}-${width}.png`);
      await page.screenshot({ path: file, fullPage: true });
      console.log(file);
    }
  }

  await browser.close();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
