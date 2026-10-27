import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const routes = [
  "/",
  "/estadio/estadio-monumental",
  "/evento/mana-estadio-monumental",
  "/ciudad/buenos-aires",
];

for (const route of routes) {
  test(`${route} no tiene violaciones serias ni críticas`, async ({ page }) => {
    await page.goto(route);
    await page.waitForFunction(() => {
      const heading = document.querySelector("h1");
      return Boolean(heading && !heading.textContent?.includes("Un momento"));
    });

    const results = await new AxeBuilder({ page }).analyze();
    const blocking = results.violations.filter(
      (violation) => violation.impact === "serious" || violation.impact === "critical",
    );

    expect(
      blocking.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        help: violation.help,
        nodes: violation.nodes.slice(0, 3).map((node) => node.target),
      })),
    ).toEqual([]);

    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h2").first()).toBeVisible();
  });

  test(`${route} no desborda a 390 px`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(route);
    await page.waitForFunction(() => {
      const heading = document.querySelector("h1");
      return Boolean(heading && !heading.textContent?.includes("Un momento"));
    });

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(390);
  });
}
