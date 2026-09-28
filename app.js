const menuToggle = document.querySelector('#menu-toggle');
const mobileNav = document.querySelector('#mobile-nav');
const languageToggle = document.querySelector('#language-toggle');
const languagePanel = document.querySelector('#language-panel');
const mobile = window.matchMedia('(max-width: 700px)');
document.querySelectorAll('.inner-page .contact .button').forEach(button => {
  const desktopHref = button.getAttribute('href');
  const syncContactDestination = () => {
    button.setAttribute('href', mobile.matches ? 'mailto:anacontreiras.arch@gmail.com' : desktopHref);
  };
  mobile.addEventListener('change', syncContactDestination);
  syncContactDestination();
});
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// Keep the current desktop layout as the floor, then scale it with wider viewports.
function syncDesktopScale() {
  document.body.style.zoom = mobile.matches ? '' : String(Math.max(1, window.innerWidth / 1440));
}
syncDesktopScale();
window.addEventListener('resize', syncDesktopScale, { passive: true });

window.addEventListener('pageshow', () => {
  const returnToTopAt = Number(sessionStorage.getItem('portfolio-return-to-top'));
  if (!returnToTopAt) return;
  sessionStorage.removeItem('portfolio-return-to-top');
  if (Date.now() - returnToTopAt > 10000) return;
  requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'instant' }));
});

function setMenu(open) {
  mobileNav.hidden = !open;
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
}
function setLanguage(open) {
  languagePanel.hidden = !open;
  languageToggle.setAttribute('aria-expanded', String(open));
}
menuToggle.addEventListener('click', () => {
  setLanguage(false);
  setMenu(mobileNav.hidden);
});
languageToggle.addEventListener('click', () => {
  setMenu(false);
  setLanguage(languagePanel.hidden);
});
mobileNav.addEventListener('click', event => {
  const link = event.target.closest('a');
  if (!link) return;
  setMenu(false);
  const target = new URL(link.href);
  if (target.pathname === window.location.pathname && target.hash) {
    const destination = document.getElementById(decodeURIComponent(target.hash.slice(1)));
    if (destination) {
      destination.setAttribute('tabindex', '-1');
      destination.focus({ preventScroll: true });
    }
  }
});
document.addEventListener('click', event => {
  if (!event.target.closest('.header')) setMenu(false);
  if (!event.target.closest('.language')) setLanguage(false);
});
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  if (!mobileNav.hidden) { setMenu(false); menuToggle.focus(); }
  if (!languagePanel.hidden) { setLanguage(false); languageToggle.focus(); }
});
mobile.addEventListener('change', () => setMenu(false));

const revealSelector = [
  'main > section', 'main > .case-back', 'footer.footer',
  '.about-heading', '.bio', '.portrait', '.projects-heading', '.section-heading', '.section-description',
  '.contact-page > h1', '.contact-intro', '.project-card',
  '.value-card', '.competency-card', '.timeline > article', '.tool-group',
  '.case-heading', '.case-overview > article', '.case-research-grid > *',
  '.case-methods > article', '.case-stats > *', '.case-insight-track > article',
  '.case-architecture-list > article', '.case-tabs', '.case-compare-grid > article',
  '.case-hotspots > article', '.case-impact-grid > article', '.case-closing blockquote',
  '.case-project-nav', '.contact-panels > *', '.contact-seeking'
].join(',');

if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const revealTargets = [...document.querySelectorAll(revealSelector)];
  const revealGroups = new Map();
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('scroll-reveal-visible');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -32px 0px' });

  revealTargets
    .filter(target => !target.querySelector(revealSelector))
    .forEach(target => {
      const groupIndex = revealGroups.get(target.parentElement) || 0;
      revealGroups.set(target.parentElement, groupIndex + 1);
      const stagger = mobile.matches ? 50 : 70;
      target.style.setProperty('--scroll-reveal-delay', `${Math.min(groupIndex * stagger, mobile.matches ? 200 : 280)}ms`);
      target.classList.add('scroll-reveal');
      revealObserver.observe(target);
    });
}

// Preserve the composition of the original Figma artwork at every card width.
// SVGs keep their intrinsic dimensions; only their containing artboard scales.
const artworks = document.querySelectorAll('.art');
function resizeArtwork() {
  artworks.forEach(art => {
    const mode = mobile.matches ? 'mobile' : 'desktop';
    const canvas = art.querySelector(`.art-${mode}`);
    const design = canvas.firstElementChild;
    const designWidth = parseFloat(getComputedStyle(design).width);
    const designHeight = parseFloat(getComputedStyle(design).height);
    const scale = art.clientWidth / designWidth;
    canvas.style.transform = `scale(${scale})`;
    const height = designHeight * scale;
    if (Math.abs(art.getBoundingClientRect().height - height) > 0.5) {
      art.style.height = `${height}px`;
    }
  });
}
const artObserver = new ResizeObserver(resizeArtwork);
artworks.forEach(art => artObserver.observe(art));
mobile.addEventListener('change', resizeArtwork);
resizeArtwork();

function initCarousel(section) {
  const grid = section.querySelector('[data-carousel-track]');
  const cards = [...grid.children];
  const dots = [...section.querySelectorAll('[data-slide]')];
  let activeSlide = 0;
  function markSlide(index) {
    activeSlide = index;
    dots.forEach((dot, i) => dot.setAttribute('aria-current', String(i === index)));
  }
  function goToSlide(index) {
    const next = Math.max(0, Math.min(cards.length - 1, index));
    markSlide(next);
    const left = cards[next].offsetLeft - cards[0].offsetLeft;
    grid.scrollTo({ left, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
    section.querySelector('[data-carousel-status]').textContent = `${next + 1} de ${cards.length}: ${cards[next].querySelector('h3').textContent}`;
  }
  dots.forEach((dot, i) => dot.addEventListener('click', () => goToSlide(i)));
  grid.addEventListener('keydown', event => {
    if (!mobile.matches || !['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? cards.length - 1 : activeSlide + (event.key === 'ArrowRight' ? 1 : -1);
    goToSlide(next);
  });
  let scrollFrame;
  grid.addEventListener('scroll', () => {
    cancelAnimationFrame(scrollFrame);
    scrollFrame = requestAnimationFrame(() => {
      if (!mobile.matches) return;
      const step = cards[1].offsetLeft - cards[0].offsetLeft;
      markSlide(Math.max(0, Math.min(cards.length - 1, Math.round(grid.scrollLeft / step))));
    });
  }, { passive: true });
}
document.querySelectorAll('[data-carousel]').forEach(initCarousel);

// Scale the original timeline vectors through their wrappers, preserving SVG dimensions.
const ruleObserver = new ResizeObserver(entries => {
  entries.forEach(({ target }) => {
    target.querySelector('.rule-art').style.transform = `scale(${target.clientWidth / Number(target.dataset.ruleWidth)})`;
  });
});
document.querySelectorAll('[data-rule-width]').forEach(rule => ruleObserver.observe(rule));

const journeyTimeline = document.querySelector('.about-page .timeline');
if (journeyTimeline) {
  const points = [...journeyTimeline.querySelectorAll(':scope > article')];
  const line = document.createElement('span');
  line.className = 'timeline-reading-line';
  line.setAttribute('aria-hidden', 'true');
  const dot = document.createElement('span');
  dot.className = 'timeline-reading-dot';
  dot.setAttribute('aria-hidden', 'true');
  journeyTimeline.append(line, dot);
  let journeyFrame;
  let readingPosition;
  let lastJourneyTime;
  let pausedPoint = null;
  let lastPausedPoint = null;
  let pauseUntil = 0;
  const updateJourney = () => {
    journeyFrame = undefined;
    if (!mobile.matches || !points.length) return;
    const positions = points.map(point => point.offsetTop + 11);
    const first = positions[0];
    const lastPoint = points[points.length - 1];
    const end = lastPoint.offsetTop + lastPoint.offsetHeight;
    const readingTarget = Math.max(first, Math.min(end, innerHeight * .38 - journeyTimeline.getBoundingClientRect().top));
    const now = performance.now();
    const elapsed = Math.min(48, Math.max(8, now - (lastJourneyTime ?? now - 16)));
    lastJourneyTime = now;
    readingPosition ??= first;
    if (pausedPoint !== null && now >= pauseUntil) pausedPoint = null;
    if (lastPausedPoint !== null && Math.abs(readingPosition - positions[lastPausedPoint]) > 60) lastPausedPoint = null;
    if (reducedMotion.matches) {
      readingPosition = readingTarget;
      pausedPoint = null;
    } else if (pausedPoint === null) {
      const previous = readingPosition;
      const distance = readingTarget - previous;
      const step = Math.min(Math.abs(distance) * (1 - Math.exp(-elapsed / 550)), elapsed * .12);
      readingPosition = previous + Math.sign(distance) * step;
      const arrivals = positions.map((position, index) => ({ position, index })).filter(({ position, index }) => index > 0 && index !== lastPausedPoint && (
        (previous < position && readingPosition >= position) ||
        (previous > position && readingPosition <= position) ||
        (Math.abs(previous - position) > 1 && Math.abs(readingPosition - position) <= 1)));
      if (arrivals.length) {
        arrivals.sort((a, b) => Math.abs(a.position - previous) - Math.abs(b.position - previous));
        pausedPoint = arrivals[0].index;
        lastPausedPoint = pausedPoint;
        readingPosition = positions[pausedPoint];
        pauseUntil = now + 600;
      }
      if (Math.abs(readingTarget - readingPosition) < .2 && pausedPoint === null) readingPosition = readingTarget;
    }
    journeyTimeline.style.setProperty('--timeline-line-height', `${end - first}px`);
    journeyTimeline.style.setProperty('--timeline-reading-position', `${readingPosition}px`);
    const nearest = positions.reduce((best, position, index) =>
      Math.abs(position - readingPosition) < Math.abs(positions[best] - readingPosition) ? index : best, 0);
    const atPoint = Math.abs(positions[nearest] - readingPosition) <= 20;
    dot.classList.toggle('is-at-point', atPoint);
    points.forEach((point, index) => point.classList.toggle('timeline-point-active', atPoint && index === nearest));
    if (!reducedMotion.matches && (pausedPoint !== null || Math.abs(readingTarget - readingPosition) > .2)) scheduleJourney();
  };
  const scheduleJourney = () => {
    if (journeyFrame === undefined) journeyFrame = requestAnimationFrame(updateJourney);
  };
  window.addEventListener('scroll', scheduleJourney, { passive: true });
  window.addEventListener('resize', scheduleJourney, { passive: true });
  new ResizeObserver(scheduleJourney).observe(journeyTimeline);
  scheduleJourney();
}

const toolIcons = document.querySelectorAll('.tool-logo');
if (toolIcons.length) {
  const desktopHover = window.matchMedia('(min-width: 701px) and (hover: hover) and (pointer: fine)');
  const tooltip = document.createElement('div');
  tooltip.className = 'tool-tooltip';
  tooltip.hidden = true;
  tooltip.setAttribute('aria-hidden', 'true');
  document.body.appendChild(tooltip);
  const hideTooltip = () => { tooltip.hidden = true; };
  const moveTooltip = event => {
    if (tooltip.hidden) return;
    tooltip.style.left = `${Math.max(8, Math.min(event.clientX + 12, innerWidth - tooltip.offsetWidth - 8))}px`;
    tooltip.style.top = `${Math.max(8, Math.min(event.clientY + 18, innerHeight - tooltip.offsetHeight - 8))}px`;
  };
  toolIcons.forEach(icon => {
    icon.addEventListener('pointerenter', event => {
      if (!desktopHover.matches) return;
      const image = [...icon.querySelectorAll('img')].find(img => img.offsetWidth);
      tooltip.textContent = image?.alt || '';
      tooltip.hidden = !tooltip.textContent;
      moveTooltip(event);
    });
    icon.addEventListener('pointermove', moveTooltip);
    icon.addEventListener('pointerleave', hideTooltip);
  });
  window.addEventListener('scroll', hideTooltip, { passive: true, capture: true });
  window.addEventListener('blur', hideTooltip);
  desktopHover.addEventListener('change', hideTooltip);
}

// Replace pending destinations when Ana supplies the final public links.
const notice = document.querySelector('#notice');
function showNotice(title, description) {
  document.querySelector('#notice-title').textContent = title;
  document.querySelector('#notice-description').textContent = description;
  notice.showModal();
}
document.querySelector('#cv-button')?.addEventListener('click', () => {
  window.open('./assets/cv/ana-contreiras-cv.pdf', '_blank', 'noopener,noreferrer');
});
notice.addEventListener('click', event => {
  const rect = notice.getBoundingClientRect();
  if (event.target === notice && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) notice.close();
});
