import { test, expect } from '@playwright/test';

const green = 'rgb(65, 98, 82)';

test('Header selection, hover and page destinations match requested behavior', async ({ page }) => {
  await page.setViewportSize({ width: 1400, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  const header = page.locator('.header');
  await expect(header.locator('.nav [data-nav="home"]')).toHaveCSS('color', green);
  await expect(header.locator('.nav [data-nav="home"]')).toHaveAttribute('aria-current', 'page');
  const projects = header.locator('.nav [data-nav="projects"]');
  await projects.hover();
  await expect(projects).toHaveCSS('color', green);
  await projects.click();
  await expect(page).toHaveURL(/#projetos$/);
  await expect(page.locator('#projects-title')).toBeInViewport();
  await header.scrollIntoViewIfNeeded();
  const about = header.locator('.nav [data-nav="about"]');
  await about.hover();
  await expect(about).toHaveCSS('color', green);
  await about.click();
  await expect(page).toHaveURL(/sobre-mim\.html$/);
  await page.mouse.move(0, 500);
  await expect(header.locator('.nav [data-nav="about"]')).toHaveAttribute('aria-current', 'page');
  await expect(header.locator('.nav [data-nav="about"]')).toHaveCSS('color', green);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Design com raízes em arquitetura');
  await page.reload();
  await expect(header.locator('.nav [data-nav="about"]')).toHaveCSS('color', green);
  await header.locator('.contact-nav').hover();
  await expect(header.locator('.contact-nav')).toHaveCSS('background-color', green);
  await header.locator('.contact-nav').click();
  await expect(page).toHaveURL(/contacto\.html$/);
  await page.mouse.move(0, 500);
  await expect(header.locator('.contact-nav')).toHaveCSS('background-color', green);
  await expect(header.locator('.contact-nav')).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('link', { name: 'Entrar em contacto', exact: true })).toHaveAttribute('href', 'mailto:anacontreiras.arch@gmail.com');
  await header.locator('.nav [data-nav="projects"]').click();
  await expect(page).toHaveURL(/index\.html#projetos$/);
  await expect(page.locator('#projects-title')).toBeInViewport();
  await page.goBack();
  await expect(header.locator('.contact-nav')).toHaveAttribute('aria-current', 'page');
  expect(errors).toEqual([]);
});

for (const filename of ['sobre-mim', 'contacto']) {
  for (const width of [320, 393, 700, 768, 1024, 1400]) {
    test(`${filename} is responsive and loads original assets at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('response', response => { if (response.status() >= 400) errors.push(response.url()); });
      await page.goto(`/${filename}.html`);
      await page.evaluate(async () => {
        document.querySelectorAll('img').forEach(image => image.loading = 'eager');
        await document.fonts.ready;
        await Promise.all([...document.images].map(image => image.decode()));
      });
      const result = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        missing: [...document.images].filter(image => !image.naturalWidth).map(image => image.src),
        badSvgSizes: [...document.images].filter(image => image.checkVisibility() && image.src.endsWith('.svg')).filter(image => {
          const style = getComputedStyle(image);
          return Math.abs(parseFloat(style.width) / parseFloat(style.height) - image.naturalWidth / image.naturalHeight) > 0.04;
        }).map(image => image.src),
      }));
      expect(result).toEqual({ overflow: false, missing: [], badSvgSizes: [] });
      expect(errors).toEqual([]);
      if ([393, 1400].includes(width)) await page.screenshot({ path: `test-results/${filename}-${width}.png`, fullPage: true });
    });
  }
}

test('Mobile menu changes pages and reflects current selection', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  for (const [label, filename] of [['Sobre mim', 'sobre-mim'], ['Contacto', 'contacto']]) {
    await page.getByRole('button', { name: 'Abrir menu' }).click();
    await page.locator('#mobile-nav').getByRole('link', { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${filename}\\.html$`));
    await expect(page.locator('#mobile-nav')).toBeHidden();
    await page.getByRole('button', { name: 'Abrir menu' }).click();
    await expect(page.locator('#mobile-nav').getByRole('link', { name: label, exact: true })).toHaveAttribute('aria-current', 'page');
    await page.keyboard.press('Escape');
  }
  expect(errors).toEqual([]);
});

test('About competencies carousel supports last item and keyboard navigation', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/sobre-mim.html');
  const dots = page.locator('[data-slide]');
  await dots.nth(5).click();
  await expect.poll(() => page.evaluate(() => {
    const grid = document.querySelector('#competency-grid').getBoundingClientRect();
    const last = document.querySelector('.competency-card:last-child').getBoundingClientRect();
    return Math.abs(last.left - grid.left - 32);
  })).toBeLessThan(2);
  await expect(dots.nth(5)).toHaveAttribute('aria-current', 'true');
  await page.locator('#competency-grid').focus();
  await page.keyboard.press('Home');
  await expect(dots.nth(0)).toHaveAttribute('aria-current', 'true');
});
