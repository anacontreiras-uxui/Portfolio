import { test, expect } from '@playwright/test';

for (const width of [320, 393, 700, 768, 1024, 1400, 1920]) {
  test(`Homepage fits ${width}px and loads every visible asset`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const failures = [];
    page.on('pageerror', error => failures.push(error.message));
    page.on('response', response => { if (response.status() >= 400) failures.push(response.url()); });
    await page.goto('/');
    await page.evaluate(async () => {
      document.querySelectorAll('img').forEach(img => img.loading = 'eager');
      await document.fonts.ready;
      await Promise.all([...document.images].map(img => img.decode()));
    });
    await expect(page.locator('h1')).toContainText('complexidade em clareza');
    const geometry = await page.evaluate(() => ({
      width: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
      badImages: [...document.images].filter(img => !img.complete || !img.naturalWidth).map(img => img.src),
      visibleImages: [...document.images].filter(img => img.checkVisibility()).map(img => ({ src: img.getAttribute('src'), width: img.getBoundingClientRect().width, height: img.getBoundingClientRect().height })),
      distortedVectors: [...document.images].filter(img => img.checkVisibility() && img.src.endsWith('.svg')).filter(img => {
        // Measure before intentional Figma rotations/skews transform the bounding box.
        const style = getComputedStyle(img);
        return Math.abs(parseFloat(style.width) / parseFloat(style.height) - img.naturalWidth / img.naturalHeight) > 0.04;
      }).map(img => img.src),
    }));
    expect(geometry.content).toBeLessThanOrEqual(geometry.width);
    expect(geometry.badImages).toEqual([]);
    expect(geometry.distortedVectors).toEqual([]);
    expect(geometry.visibleImages.every(image => image.width > 0 && image.height > 0)).toBe(true);
    expect(failures).toEqual([]);
    if ([393, 1400].includes(width)) {
      await page.screenshot({ path: `test-results/home-${width}.png`, fullPage: true });
    }
  });
}

test('Mobile menu works with keyboard, closes on navigation and restores focus', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Abrir menu' });
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#mobile-nav')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(toggle).toBeFocused();
  await expect(page.locator('#mobile-nav')).toBeHidden();
  await toggle.click();
  await page.locator('#mobile-nav').getByRole('link', { name: 'Projetos' }).click();
  await expect(page.locator('#mobile-nav')).toBeHidden();
  await expect(page).toHaveURL(/#projetos$/);
  await expect(page.locator('#projetos')).toBeFocused();
  await page.setViewportSize({ width: 1400, height: 900 });
  await expect(page.locator('.nav')).toBeVisible();
});

test('Inspect all project artwork in desktop and mobile slots', async ({ page }) => {
  for (const width of [393, 1400]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.evaluate(async () => {
      await document.fonts.ready;
      document.querySelectorAll('img').forEach(img => img.loading = 'eager');
      await Promise.all([...document.images].map(img => img.decode()));
    });
    for (let i = 0; i < 4; i++) {
      if (width === 393) await page.locator('[data-slide]').nth(i).click();
      await page.locator('.art').nth(i).screenshot({ path: `test-results/art-${width}-${i}.png` });
    }
  }
});

for (const width of [393, 700]) {
  test(`Carousel supports dots, keyboard and direct scrolling at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 852 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const dots = page.locator('[data-slide]');
    await dots.nth(3).click();
    await expect.poll(() => page.evaluate(() => {
      const grid = document.querySelector('#project-grid').getBoundingClientRect();
      const last = document.querySelector('#projeto-4').getBoundingClientRect();
      return Math.abs(last.left - grid.left - 32);
    })).toBeLessThan(2);
    await expect(dots.nth(3)).toHaveAttribute('aria-current', 'true');
    const grid = page.locator('#project-grid');
    await grid.focus();
    await page.keyboard.press('Home');
    await expect(dots.nth(0)).toHaveAttribute('aria-current', 'true');
    await page.keyboard.press('ArrowRight');
    await expect(dots.nth(1)).toHaveAttribute('aria-current', 'true');
    await page.evaluate(() => document.querySelector('#project-grid').scrollTo({ left: 0, behavior: 'instant' }));
    await expect(dots.nth(0)).toHaveAttribute('aria-current', 'true');
  });
}

test('Contact destinations, pending CV and language control work', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Entrar em contacto', exact: true })).toHaveAttribute('href', './contacto.html');
  for (const link of await page.locator('.project-card-link').all()) {
    await expect(link).toHaveAttribute('href', /^\.\/(lifecare|cupra-raval|aima|prime-video)\.html$/);
    await expect(link).not.toHaveAttribute('target', '_blank');
  }
  const cv = page.getByRole('button', { name: 'Descarregar CV' });
  await cv.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'CV em atualização' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(cv).toBeFocused();
  await page.getByRole('button', { name: 'Idioma: português' }).click();
  await expect(page.locator('#language-panel')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#language-panel')).toBeHidden();
});
