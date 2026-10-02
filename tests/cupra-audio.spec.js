import { test, expect } from '@playwright/test';

for (const width of [393, 1400]) {
  test(`CUPRA sound controls start muted and toggle at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 950 });
    await page.goto('/cupra-raval.html');
    const version = width <= 700 ? '.case-panel-mobile' : '.case-panel-desktop';
    for (const index of [0, 1]) {
      await page.locator(`#tab-${index}`).click();
      const card = page.locator(`#panel-${index} > ${version}`);
      const video = card.locator('video');
      const button = page.locator(`#panel-${index} [data-audio-toggle]:visible`);
      await expect(button).toBeVisible();
      await expect.poll(() => video.evaluate(element => element.videoWidth)).toBeGreaterThan(0);
      await expect(button).toHaveAttribute('aria-pressed', 'false');
      expect(await video.evaluate(element => element.muted)).toBe(true);
      await button.click();
      await expect(button).toHaveAttribute('aria-pressed', 'true');
      expect(await video.evaluate(element => element.muted)).toBe(false);
      await button.click();
      await expect(button).toHaveAttribute('aria-pressed', 'false');
      expect(await video.evaluate(element => element.muted)).toBe(true);
    }
  });
}
