import { test, expect } from '@playwright/test';

const projects = [
  ['lifecare', 'Lifecare Research'],
  ['cupra-raval', 'CUPRA Raval'],
  ['aima', 'AIMA'],
  ['prime-video', 'Prime Video'],
];

for (const width of [393, 1400]) {
  test(`Entire project cards and arrows open corresponding local pages at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 950 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const [i, [slug, title]] of projects.entries()) {
      await page.goto('/index.html#projetos');
      const card = page.locator('.project-card').nth(i);
      // Click the title area, outside the circular arrow button.
      const heading = card.locator('h3');
      await heading.scrollIntoViewIfNeeded();
      const box = await heading.boundingBox();
      await page.mouse.click(box.x + 8, box.y + 8);
      await expect(page).toHaveURL(new RegExp(`/${slug}\\.html$`));
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
      await page.reload();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
      await page.getByRole('link', { name: '← Voltar aos projetos' }).click();
      await expect(page).toHaveURL(/index\.html#projetos$/);
      await page.locator('.project-card').nth(i).locator('.project-link').click();
      await expect(page).toHaveURL(new RegExp(`/${slug}\\.html$`));
    }
  });
}

for (const [slug, title] of projects) {
  for (const width of [320, 393, 768, 1400]) {
    test(`${title}: responsive layout, original assets and interactive sections at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 950 });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('response', response => { if (response.status() >= 400) errors.push(response.url()); });
      await page.goto(`/${slug}.html`);
      await page.evaluate(async () => {
        document.querySelectorAll('img').forEach(img => img.loading = 'eager');
        await document.fonts.ready;
        await Promise.all([...document.images].map(img => img.decode()));
      });
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
      expect(errors).toEqual([]);
      if (slug !== 'lifecare') {
        const tabs = page.getByRole('tab');
        for (let i = 0; i < await tabs.count(); i++) {
          await tabs.nth(i).click();
          await expect(tabs.nth(i)).toHaveAttribute('aria-selected', 'true');
          await expect(page.getByRole('tabpanel')).toHaveCount(1);
          await expect(page.getByRole('tabpanel')).toHaveAttribute('id', `panel-${i}`);
        }
        await tabs.last().press('Home');
        await expect(tabs.first()).toBeFocused();
        await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
      } else {
        const slider = page.locator('.case-range').first();
        await slider.focus();
        await slider.press('End');
        await expect(slider).toHaveValue('100');
        expect(await page.locator('#comparison-0').evaluate(el => el.style.getPropertyValue('--split'))).toBe('100%');
      }
    });
  }
}

test('Project card links support keyboard navigation', async ({ page }) => {
  await page.goto('/');
  const link = page.getByRole('link', { name: 'Ver projeto Lifecare Research', exact: true });
  await link.focus();
  await link.press('Enter');
  await expect(page).toHaveURL(/lifecare\.html$/);
});
