const menuToggle = document.querySelector('#menu-toggle');
const mobileNav = document.querySelector('#mobile-nav');
const languageToggle = document.querySelector('#language-toggle');
const languagePanel = document.querySelector('#language-panel');
const mobile = window.matchMedia('(max-width: 700px)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

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

// Preserve the composition of the original Figma artwork at every card width.
// SVGs keep their intrinsic dimensions; only their containing artboard scales.
const artworks = document.querySelectorAll('.art');
function resizeArtwork() {
  artworks.forEach(art => {
    const mode = mobile.matches ? 'mobile' : 'desktop';
    const canvas = art.querySelector(`.art-${mode}`);
    const scale = art.clientWidth / (mode === 'mobile' ? 324 : 499);
    canvas.style.transform = `scale(${scale})`;
    art.style.height = `${201 * scale}px`;
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

// Replace pending destinations when Ana supplies the final public links.
const notice = document.querySelector('#notice');
function showNotice(title, description) {
  document.querySelector('#notice-title').textContent = title;
  document.querySelector('#notice-description').textContent = description;
  notice.showModal();
}
document.querySelector('#cv-button')?.addEventListener('click', () => showNotice('CV em atualização', 'O CV estará disponível em breve. Entretanto, podes contactar-me através de anacontreiras.arch@gmail.com.'));
document.querySelectorAll('#linkedin-button, [data-linkedin]').forEach(button => button.addEventListener('click', () => showNotice('LinkedIn', 'O link do perfil estará disponível em breve. Podes contactar-me através de anacontreiras.arch@gmail.com.')));
notice.addEventListener('click', event => {
  const rect = notice.getBoundingClientRect();
  if (event.target === notice && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) notice.close();
});
