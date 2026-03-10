import { expect, test } from "@playwright/test";

const LEGACY_SLUG = "automatiza-tu-negocio-multiplicar-resultados";
const CATEGORY_SLUG = "automatizacion";
const DETAIL_PATH = `/blog/${CATEGORY_SLUG}/${LEGACY_SLUG}`;

test.describe("Blog SEO metadata", () => {
  test("/blog expone canonical estable", async ({ page }) => {
    await page.goto("/blog");

    await expect(page.locator("link[rel='canonical']")).toHaveAttribute(
      "href",
      "https://creamvp.com/blog",
    );
  });

  test("/blog/[categoria] expone canonical por categoria", async ({ page }) => {
    await page.goto(`/blog/${CATEGORY_SLUG}`);

    await expect(page.locator("link[rel='canonical']")).toHaveAttribute(
      "href",
      `https://creamvp.com/blog/${CATEGORY_SLUG}`,
    );
  });

  test("/blog/[categoria]/[slug] expone canonical, OpenGraph y schema de articulo", async ({
    page,
  }) => {
    await page.goto(DETAIL_PATH);

    await expect(page.locator("link[rel='canonical']")).toHaveAttribute(
      "href",
      `https://creamvp.com${DETAIL_PATH}`,
    );
    await expect(page.locator("meta[property='og:url']")).toHaveAttribute(
      "content",
      `https://creamvp.com${DETAIL_PATH}`,
    );
    await expect(page.locator("meta[property='og:type']")).toHaveAttribute("content", "article");

    const jsonLdTypes = await page.locator("script[type='application/ld+json']").evaluateAll((nodes) =>
      nodes
        .map((node) => {
          try {
            const parsed = JSON.parse(node.textContent ?? "{}");
            return typeof parsed?.["@type"] === "string" ? parsed["@type"] : null;
          } catch {
            return null;
          }
        })
        .filter(Boolean),
    );

    expect(jsonLdTypes).toContain("BlogPosting");
    expect(jsonLdTypes).toContain("BreadcrumbList");
    await expect(
      page.locator('[itemtype="https://schema.org/FAQPage"]'),
    ).toBeVisible();
  });
});

