
import { test, expect } from '@playwright/test';

const protectedRoutes = [
  '/',
  '/absensi',
  '/jadwal',
  '/keuangan',
  '/keuangan/audit-log',
  '/keuangan/buku-kas',
  '/keuangan/honor-pelatih',
  '/laporan-siswa',
  '/paket-pembayaran',
  '/paket-pembayaran/katalog',
  '/paket-pembayaran/spp',
  '/pelatih',
  '/pengaturan',
  '/penilaian',
  '/riwayat',
  '/siswa/pendaftaran',
  '/siswa/rekapan',
];

test.describe('KESIT - Smoke Test', () => {
  test('1. Halaman login dapat dibuka', async ({ page }) => {
    const response = await page.goto('/login', {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });

    expect(response?.status()).toBe(200);

    await expect(page.locator('#loginForm')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Masuk' }),
    ).toBeVisible();

    console.log('LULUS: halaman login dapat dibuka');
  });

  test('2. Validasi email dan password wajib diisi', async ({ page }) => {
    await page.goto('/login', {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });

    const email = page.locator('#email');
    const password = page.locator('#password');

    await expect(email).toBeVisible();
    await expect(password).toBeVisible();

    await expect(email).toHaveAttribute('required', '');
    await expect(password).toHaveAttribute('required', '');

    const emailValid = await email.evaluate(
      (element: HTMLInputElement) => element.checkValidity(),
    );

    const passwordValid = await password.evaluate(
      (element: HTMLInputElement) => element.checkValidity(),
    );

    expect(emailValid).toBe(false);
    expect(passwordValid).toBe(false);

    console.log('LULUS: email dan password wajib diisi');
  });

  test(
    '3. Halaman privat mengarahkan pengguna yang belum login',
    async ({ page }) => {
      test.setTimeout(90000);

      for (const route of protectedRoutes) {
        await page.goto(route, {
          waitUntil: 'domcontentloaded',
          timeout: 15000,
        });

        await expect(
          page,
          `${route} seharusnya mengarahkan pengguna ke login`,
        ).toHaveURL(/\/login(?:[/?#]|$)/, {
          timeout: 10000,
        });

        console.log(`LULUS: ${route} mengarahkan ke login`);
      }
    },
  );
});
