import { test, expect } from '@playwright/test';

async function chooseLanguage(page, language) {
  await page.locator('#language-toggle').click();
  await page.locator(`[data-language-option="${language}"]`).click();
}

for (const width of [393, 1400]) {
  test(`Language selection persists and restores Portuguese at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/index.html');
    await chooseLanguage(page, 'en');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-GB');
    await expect(page.locator('#language-toggle')).toHaveAttribute('aria-label', 'Language: English');
    await expect(page.locator('#language-panel')).toBeHidden();
    await expect(page.locator('.nav [data-nav="about"]')).toHaveText('About me');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-GB');

    for (const file of ['sobre-mim', 'contacto', 'lifecare', 'cupra-raval', 'aima', 'prime-video']) {
      await page.goto(`/${file}.html`);
      await expect(page.locator('html')).toHaveAttribute('lang', 'en-GB');
      await expect(page.locator('.footer-nav [data-nav="contact"]')).toHaveText('Contact');
      if (['aima', 'prime-video', 'cupra-raval'].includes(file)) {
        await page.locator('#tab-1').click();
        await expect(page.locator('#panel-1')).toBeVisible();
      }
    }
    await expect(page.locator('#tab-1')).toHaveText('Cancellation');
    await chooseLanguage(page, 'pt');
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-PT');
    await expect(page.locator('#tab-1')).toHaveText('Cancelamento');
    await expect(page.locator('.prime-mobile-card--cancelamento h3')).toHaveText('Cancelamento com mais controlo');
    await page.goto('/index.html');
    await expect(page.locator('#cv-button')).toHaveText('Descarregar CV');
    expect(errors).toEqual([]);
  });

  test(`Dynamic popup text follows language at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/lifecare.html');
    await chooseLanguage(page, 'en');
    const trigger = page.locator('[data-hotspot-title="Diário"]');
    await trigger.click();
    const popup = width < 700 ? page.locator('.lifecare-mobile-feature-dialog') : page.locator('.feature-popup-english');
    await expect(popup.locator('.mobile-feature-title')).toHaveText('Diary');
    await expect(popup.locator('.mobile-feature-label')).toHaveText('FEATURE');
    await expect(popup.locator('button')).toHaveAttribute('aria-label', 'Close pop-up');
    await popup.locator('button').click();
    await expect(popup).toBeHidden();
    await chooseLanguage(page, 'pt');
    await trigger.click();
    if (width < 700) await expect(page.locator('#mobile-feature-title')).toHaveText('Diário');
    else await expect(page.locator('.feature-popup-design')).toHaveAttribute('src', './assets/lifecare-popup-desktop-diary.png');
  });
}
