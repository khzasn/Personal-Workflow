import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } }); // iPhone 12/13/14 viewport

test.describe("Mobile Viewport Tests (390px)", () => {
  test("Login page is responsive without horizontal overflow", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /Selamat datang kembali/i })).toBeVisible();

    const isNoOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= window.innerWidth;
    });
    expect(isNoOverflow).toBe(true);
  });

  test("Register page is responsive without horizontal overflow", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: /Buat Akun/i })).toBeVisible();

    const isNoOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= window.innerWidth;
    });
    expect(isNoOverflow).toBe(true);
  });
});
