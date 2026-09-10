import { test, expect } from "@playwright/test";

test("Homepage redirects to /login when not authenticated", async ({ page }) => {
  await page.goto("/");
  
  // Harus di-redirect ke halaman login
  await expect(page).toHaveURL(/.*\/login/);
  
  // Teks "Selamat Datang" (dari LoginForm) harus muncul
  await expect(page.getByRole("heading", { name: /Selamat Datang/i })).toBeVisible();
});

test("Can navigate to /register", async ({ page }) => {
  await page.goto("/login");
  
  // Klik link Daftar
  await page.click("text=Daftar sekarang");
  
  // Harus pindah ke halaman register
  await expect(page).toHaveURL(/.*\/register/);
  await expect(page.getByRole("heading", { name: /Buat Akun/i })).toBeVisible();
});

// Catatan: E2E untuk login/dashboard diloncati karena membutuhkan 
// dummy credentials Supabase yang valid, yang di luar cakupan test dasar ini.
