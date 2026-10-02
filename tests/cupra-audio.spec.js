import { test, expect } from '@playwright/test';

for (const width of [320, 393, 1400]) {
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
      await expect(button.locator('svg')).toBeVisible();
      if (width <= 700) {
        const buttonBox = await button.boundingBox();
        const summaryBox = await card.locator('.cupra-mobile-summary').boundingBox();
        const descriptionBox = await card.locator('.cupra-mobile-heading p').boundingBox();
        await expect(button).toHaveCSS('top', '16px');
        await expect(button).toHaveCSS('right', '16px');
        expect(descriptionBox.x + descriptionBox.width + 12).toBeLessThanOrEqual(buttonBox.x);
        expect(buttonBox.y + buttonBox.height).toBeLessThan(summaryBox.y);
      }
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
