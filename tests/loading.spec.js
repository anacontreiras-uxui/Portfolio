import { test, expect } from '@playwright/test';

test('First visit shows loading state until visible image arrives', async ({ page }) => {
  let releaseImage;
  const imageGate = new Promise(resolve => { releaseImage = resolve; });
  await page.route('**/assets/70ef3.svg', async route => {
    await imageGate;
    await route.continue();
  });
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.page-loading')).toBeVisible();
  await expect(page.locator('.page-loading')).toContainText('A carregar portefólio…');
  releaseImage();
  await expect(page.locator('.page-loading')).toBeHidden();
  await expect(page.locator('h1')).toBeVisible();
});

test('Project videos wait until their card approaches the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 800 });
  const videoRequests = [];
  page.on('request', request => {
    if (request.url().includes('/assets/cupra-descobrir.mp4')) videoRequests.push(request.url());
  });
  await page.goto('/cupra-raval.html', { waitUntil: 'domcontentloaded' });
  const video = page.locator('#panel-0 .case-panel-mobile video');
  expect(await video.evaluate(element => element.paused)).toBe(true);
  expect(videoRequests).toHaveLength(0);
  await video.scrollIntoViewIfNeeded();
  await expect.poll(() => video.evaluate(element => element.paused)).toBe(false);
  await expect.poll(() => videoRequests.length).toBeGreaterThan(0);
});
