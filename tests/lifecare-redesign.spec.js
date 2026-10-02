import { test, expect } from '@playwright/test';

test('Research phones enlarge individually on desktop hover', async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/lifecare.html');
  await page.locator('.research-redesign-art').scrollIntoViewIfNeeded();
  await page.waitForTimeout(100);
  const sources = ['991b9.png', '309de.png', 'e613f.png'];
  for (const [index, source] of sources.entries()) {
    const trigger = page.locator(`.research-phone-trigger[data-phone="${index}"]`);
    await trigger.hover();
    await expect(page.locator('.research-phone-viewer')).toBeVisible();
    await expect(page.locator('.research-phone-model img')).toHaveAttribute('src', `./assets/${source}`);
    await expect.poll(() => page.locator('.research-phone-model img').evaluate(image => image.naturalWidth)).toBeGreaterThan(0);
    const large = await page.locator('.research-phone-model').boundingBox();
    const small = await trigger.boundingBox();
    expect(large.height).toBeGreaterThan(small.height * 2);
    await page.mouse.move(20, 100);
    await expect(page.locator('.research-phone-viewer')).toBeHidden();
  }
  await page.locator('.research-phone-trigger[data-phone="1"]').focus();
  await expect(page.locator('.research-phone-viewer')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.research-phone-viewer')).toBeHidden();
  await page.setViewportSize({ width: 393, height: 1000 });
  await expect(page.locator('.research-phone-trigger:visible')).toHaveCount(0);
});

test('Lifecare desktop redesign preserves comparisons and popups', async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/lifecare.html');
  await expect(page.locator('.case-research .case-heading')).toHaveText('Da primeira versão ao redesign', { useInnerText: true });
  await expect(page.locator('.case-insight-track > article:visible')).toHaveCount(3);
  await expect(page.locator('.case-outcomes > div:visible')).toHaveCount(3);
  await expect(page.locator('.case-architecture-list h3').first()).toHaveText('01 · Paciente', { useInnerText: true });
  await expect(page.locator('.lifecare-hero-image')).toHaveJSProperty('naturalWidth', 1296);

  for (const index of [0, 1]) {
    await page.locator(`#evolution-tab-${index}`).click();
    const comparison = page.locator(`#comparison-${index}`);
    await comparison.scrollIntoViewIfNeeded();
    const bounds = await comparison.boundingBox();
    expect(bounds.width).toBeGreaterThan(556);
    await page.mouse.move(bounds.x + bounds.width * 0.25, bounds.y + bounds.height / 2);
    await page.mouse.down();
    await page.mouse.move(bounds.x + bounds.width * 0.75, bounds.y + bounds.height / 2);
    await page.mouse.up();
    expect(Number(await page.locator(`#range-${index}`).inputValue())).toBeCloseTo(75, 0);
    await expect(comparison.locator('.case-compare-label.after')).toBeVisible();
    await expect(comparison.locator('.case-compare-hint')).toBeVisible();
  }

  const diary = page.locator('[data-device="mobile"][data-hotspot-title="Diário"]');
  await diary.click();
  await expect(page.locator('.lifecare-desktop-feature-dialog')).toHaveJSProperty('open', true);
  await expect(page.locator('.feature-popup-design')).toHaveAttribute('src', './assets/lifecare-popup-desktop-diary.png');
  await page.locator('.feature-popup-dismiss').click();
  await page.locator('[data-device="mobile"][data-hotspot-title="Medicação e lembretes"]').click();
  await expect(page.locator('.feature-popup-design')).not.toHaveAttribute('src', './assets/lifecare-popup-desktop-diary.png');
  await page.locator('.feature-popup-dismiss').click();
  await expect(page.locator('.feature-popup-design')).toHaveCount(0);
  await page.locator('[data-device="mobile"][data-hotspot-title="Conteúdos e recursos de apoio"]').click();
  await expect(page.locator('.lifecare-desktop-feature-dialog .mobile-feature-title')).toHaveText('Conteúdos e recursos de apoio');
  await expect(page.locator('.lifecare-desktop-feature-dialog .mobile-feature-screen')).toHaveAttribute('src', './assets/309de.png');
  await page.locator('.lifecare-desktop-feature-dialog .mobile-feature-close').click();
  await page.locator('[data-device="desktop"][data-hotspot-title="Gestão de pacientes"]').click();
  await expect(page.locator('.lifecare-desktop-feature-dialog .mobile-clinical-laptop')).toBeVisible();
  await page.locator('.lifecare-desktop-feature-dialog .mobile-feature-close').click();
  expect(errors).toEqual([]);
});

test('Lifecare mobile follows refreshed design and keeps interactions', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/lifecare.html');
  await expect(page.locator('.case-hero-mobile h1')).toHaveText('Lifecare Research');
  await expect(page.locator('.lifecare-mobile-banner-image')).toHaveJSProperty('naturalWidth', 1296);
  await expect(page.locator('.case-overview .overview-arrow')).toHaveCount(2);
  await page.locator('.case-overview .overview-next').click();
  await expect.poll(() => page.locator('.case-overview-track').evaluate(e => e.scrollLeft)).toBeGreaterThan(100);
  await expect(page.locator('.case-research .case-heading')).toHaveText('Da primeira versão ao redesign', { useInnerText: true });
  await expect(page.locator('.case-insight-track > article:visible')).toHaveCount(3);
  await expect(page.locator('.case-outcomes > div:visible')).toHaveCount(4);
  await expect(page.locator('.case-methods h3').first()).toHaveText('Origem clínica', { useInnerText: true });
  await expect(page.locator('.case-architecture-list article').first()).toHaveCSS('background-color', 'rgba(93, 147, 167, 0.1)');
  const comparison = page.locator('#comparison-0');
  await comparison.scrollIntoViewIfNeeded();
  const bounds = await comparison.boundingBox();
  expect(bounds.width).toBeGreaterThan(350);
  expect(bounds.height).toBeGreaterThan(500);
  await page.mouse.move(bounds.x + bounds.width * .25, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width * .75, bounds.y + bounds.height / 2);
  await page.mouse.up();
  expect(Number(await page.locator('#range-0').inputValue())).toBeCloseTo(75, 0);
  await page.locator('#evolution-tab-1').click();
  await expect(page.locator('#comparison-1')).toBeVisible();
  await expect(page.locator('#comparison-1 .mobile-comparison-screen[src="./assets/53361.jpg"]')).toBeVisible();
  await page.locator('[data-device="mobile"][data-hotspot-title="Conteúdos e recursos de apoio"]').click();
  await expect(page.locator('.lifecare-mobile-feature-dialog .mobile-feature-title')).toHaveText('Conteúdos e recursos de apoio');
  await expect(page.locator('.lifecare-mobile-feature-dialog .mobile-feature-screen')).toHaveAttribute('src', './assets/309de.png');
  await page.locator('.lifecare-mobile-feature-dialog .mobile-feature-close').click();
});

test('New Lifecare desktop copy follows language selection', async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/lifecare.html');
  await page.locator('#language-toggle').click();
  await page.locator('[data-language-option="en"]').click();
  await expect(page.locator('.case-research .lifecare-desktop-only').first()).toHaveText('From the first version to the redesign');
  await expect(page.locator('.case-solution > .case-heading h2')).toHaveText('The redesigned solution');
  await expect(page.locator('.case-closing .lifecare-desktop-only').first()).toContainText('more deliberate and structured UX decisions');
  await page.locator('#language-toggle').click();
  await page.locator('[data-language-option="pt"]').click();
  await expect(page.locator('.case-solution > .case-heading h2')).toHaveText('A solução redesenhada');
});
