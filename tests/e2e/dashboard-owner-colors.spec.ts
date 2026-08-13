import path from "node:path";

import { expect, test } from "@playwright/test";

const owners = ["병민", "할머니", "아빠"] as const;

test("증권사 합계는 소유주 구분색을 따른다", async ({ page }) => {
  // Given: each owner section contains the wide-table and compact-card brokerage totals.
  await page.setContent(
    owners
      .map(
        (owner) => `
          <section class="ownerSection" data-owner="${owner}">
            <span class="ownerEyebrow">${owner}</span>
            <table class="table">
              <tbody>
                <tr class="brokerageTotalRow"><th>증권사 합계</th></tr>
              </tbody>
            </table>
            <aside class="brokerageTotals">증권사 합계</aside>
          </section>
        `,
      )
      .join(""),
  );
  await page.addStyleTag({ path: path.resolve("src/app/globals.css") });
  await page.addStyleTag({
    path: path.resolve("src/components/dashboard/dashboard.module.css"),
  });

  // When: the browser resolves the owner-scoped CSS custom property.
  const colors = await page.locator(".ownerSection").evaluateAll((sections) =>
    sections.map((section) => {
      const ownerLabel = section.querySelector(".ownerEyebrow") ?? section;
      const tableTotal = section.querySelector(".brokerageTotalRow th") ?? section;
      const cardTotal = section.querySelector(".brokerageTotals") ?? section;

      return {
        cardBackground: getComputedStyle(cardTotal).backgroundColor,
        cardBorder: getComputedStyle(cardTotal).borderTopColor,
        owner: getComputedStyle(ownerLabel).color,
        tableBackground: getComputedStyle(tableTotal).backgroundColor,
        tableBorder: getComputedStyle(tableTotal).borderTopColor,
      };
    }),
  );

  // Then: both layouts use each owner's color and produce distinct tinted backgrounds.
  for (const color of colors) {
    expect(color.cardBorder).toBe(color.owner);
    expect(color.tableBorder).toBe(color.owner);
  }
  expect(new Set(colors.map((color) => color.cardBackground)).size).toBe(owners.length);
  expect(new Set(colors.map((color) => color.tableBackground)).size).toBe(owners.length);
});
