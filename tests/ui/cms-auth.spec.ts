import { expect, test } from "@playwright/test";

test.describe("CMS auth guards", () => {
  test("renderiza la pantalla de login", async ({ page }) => {
    await page.goto("/cms/login");

    await expect(page).toHaveURL(/\/cms\/login/);
    await expect(page.getByRole("heading", { level: 1, name: /Iniciar sesi[oó]n/i })).toBeVisible();
    await expect(page.locator("#cms-email")).toBeVisible();
    await expect(page.locator("#cms-password")).toBeVisible();
    await expect(page.locator("#cms-login-submit")).toBeVisible();
  });

  test("redirecciona a login al entrar a ruta CMS protegida", async ({ page }) => {
    await page.goto("/cms/blog/00000000-0000-0000-0000-000000000000");

    await expect(page).toHaveURL(/\/cms\/login(\?|$)/);
    await expect(page.locator("#cms-email")).toBeVisible();
    await expect(page.locator("#cms-password")).toBeVisible();
  });
});
