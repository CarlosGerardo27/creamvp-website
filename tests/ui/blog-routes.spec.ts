import { expect, test } from "@playwright/test";

const LEGACY_SLUG = "automatiza-tu-negocio-multiplicar-resultados";
const CATEGORY_SLUG = "automatizacion";
const CANONICAL_PATH = `/blog/${CATEGORY_SLUG}/${LEGACY_SLUG}`;

test.describe("Blog public routes", () => {
  test("/blog listado general usa links canonicos por categoria", async ({ page }) => {
    await page.goto("/blog");

    await expect(page).toHaveURL(/\/blog$/);
    await expect(page.getByRole("heading", { level: 1, name: "Blog" })).toBeVisible();
    await expect(page.locator(`a[href="${CANONICAL_PATH}"]`).first()).toBeVisible();
  });

  test("/blog/[categoria] muestra listado filtrado", async ({ page }) => {
    await page.goto(`/blog/${CATEGORY_SLUG}`);

    await expect(page).toHaveURL(new RegExp(`/blog/${CATEGORY_SLUG}$`));
    await expect(page.locator(`a[href="${CANONICAL_PATH}"]`).first()).toBeVisible();
  });

  test("/blog/[categoria]/[slug] mantiene estructura editorial y SEO", async ({ page }) => {
    await page.goto(CANONICAL_PATH);

    await expect(page).toHaveURL(new RegExp(`${CANONICAL_PATH}$`));
    await expect(
      page.getByRole("heading", { level: 1, name: /Automatiza tu negocio para multiplicar tus resultados/i }),
    ).toBeVisible();
    await expect(page.locator("#reading-progress")).toBeVisible();
    await expect(page.locator("meta[property='og:image']")).toHaveAttribute("content", /automatizacion-negocio/);
    await expect(page.getByText(/Claves/i)).toBeVisible();
    await expect(page.getByTestId("blog-author-card")).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: /Sobre el autor/i })).toBeVisible();
  });

  test("/blog/[slug] legacy redirige al path canonico", async ({ page }) => {
    await page.goto(`/blog/${LEGACY_SLUG}`);

    await expect(page).toHaveURL(new RegExp(`/blog/[^/]+/${LEGACY_SLUG}$`));
  });
});
