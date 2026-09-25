// Scale composed Figma illustrations without changing individual SVG dimensions.
document.querySelectorAll('[data-history-back]').forEach(link => {
  link.addEventListener('click', event => {
    if (window.history.length <= 1) return;
    event.preventDefault();
    sessionStorage.setItem('portfolio-return-to-top', String(Date.now()));
    window.history.back();
  });
});

const caseArtObserver = new ResizeObserver(entries => {
  for (const { target } of entries) {
    const scale = target.clientWidth / Number(target.dataset.caseWidth);
    const canvas = target.querySelector('.case-canvas');
    if (document.body.classList.contains('case-lifecare')) {
      canvas.style.zoom = scale;
      canvas.style.transform = 'none';
    } else {
      canvas.style.zoom = '';
      canvas.style.transform = Math.abs(scale - 1) < 0.005 ? 'none' : `scale(${scale})`;
    }
  }
});
document.querySelectorAll('[data-case-width]').forEach(el => caseArtObserver.observe(el));

document.querySelectorAll('[data-case-tabs]').forEach(group => {
  const tabs = [...group.querySelectorAll('[role="tab"]')];
  const panels = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')));
  const syncPanelVideos = () => {
    const mobile = window.matchMedia('(max-width: 700px)').matches;
    panels.forEach(panel => {
      panel.querySelectorAll('.case-screen-video').forEach(video => {
        const visibleVersion = mobile
          ? video.closest('.case-panel-mobile')
          : video.closest('.case-panel-desktop');
        if (panel.hidden || !visibleVersion) {
          video.pause();
          return;
        }
        video.play().catch(() => {});
      });
    });
  };
  function activate(index, focus = false) {
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      document.getElementById(tab.getAttribute('aria-controls')).hidden = i !== index;
    });
    syncPanelVideos();
    if (focus) tabs[index].focus();
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => activate(i));
    tab.addEventListener('keydown', event => {
      const key = event.key;
      if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(key)) return;
      event.preventDefault();
      const index = key === 'Home' ? 0 : key === 'End' ? tabs.length - 1 : (i + (['ArrowRight', 'ArrowDown'].includes(key) ? 1 : -1) + tabs.length) % tabs.length;
      activate(index, true);
    });
  });
  window.addEventListener('resize', syncPanelVideos, { passive: true });
  syncPanelVideos();
});
document.querySelectorAll('.case-range').forEach(input => {
  const comparison = document.getElementById(input.dataset.comparison);
  const setSplit = value => {
    const split = Math.max(0, Math.min(100, value));
    input.value = String(split);
    comparison.style.setProperty('--split', `${split}%`);
  };
  input.addEventListener('input', () => setSplit(input.value));
  comparison.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    comparison.setPointerCapture(event.pointerId);
    const rect = comparison.getBoundingClientRect();
    setSplit(((event.clientX - rect.left) / rect.width) * 100);
  });
  comparison.addEventListener('pointermove', event => {
    if (!comparison.hasPointerCapture(event.pointerId)) return;
    const rect = comparison.getBoundingClientRect();
    setSplit(((event.clientX - rect.left) / rect.width) * 100);
  });
});

const featurePopupFiles = {
  mobile: {
    'Questionário semanal': './assets/lifecare-popup-desktop-questionnaire.png',
    'Medicação e lembretes': './assets/lifecare-popup-desktop-medication.png',
    'Diário': './assets/lifecare-popup-desktop-diary.png',
    'Apoio ao cuidador': './assets/lifecare-popup-desktop-caregiver.png',
    'TriaCare': './assets/lifecare-popup-desktop-triacare.png'
  },
  desktop: {
    'Gestão de pacientes': './assets/lifecare-popup-clinical-management.png',
    'Avaliação e monitorização': './assets/lifecare-popup-clinical-assessment.png',
    'Questionários personalizados': './assets/lifecare-popup-clinical-questionnaires.png',
    'Registo de pacientes': './assets/lifecare-popup-clinical-patients.png'
  }
};

let activeFeaturePopupPanel = null;
let activeFeaturePopupTrigger = null;
let activeFeaturePopupStage = null;
let activeFeaturePopupArticle = null;
let activeFeaturePopupAnchorBottom = null;

function alignFeaturePopupToTrigger() {
  if (!activeFeaturePopupPanel) return;
  activeFeaturePopupAnchorBottom = activeFeaturePopupTrigger?.closest('.lifecare-device-card')?.getBoundingClientRect().bottom ?? null;
  if (activeFeaturePopupAnchorBottom === null) return;
  activeFeaturePopupPanel.style.removeProperty('--popup-y-offset');
  const popupBottom = activeFeaturePopupPanel.getBoundingClientRect().bottom;
  const desktopScale = parseFloat(getComputedStyle(document.body).zoom) || 1;
  activeFeaturePopupPanel.style.setProperty('--popup-y-offset', `${(activeFeaturePopupAnchorBottom - popupBottom) / desktopScale}px`);
}

function closeFeaturePopup(restoreFocus = true) {
  if (!activeFeaturePopupPanel) return;
  activeFeaturePopupPanel.hidden = true;
  activeFeaturePopupPanel.replaceChildren();
  activeFeaturePopupStage?.classList.remove('has-feature-popup');
  activeFeaturePopupStage?.querySelector('.lifecare-device-card')?.removeAttribute('hidden');
  activeFeaturePopupArticle?.classList.remove('feature-popup-target');
  activeFeaturePopupPanel = null;
  activeFeaturePopupStage = null;
  activeFeaturePopupArticle = null;
  activeFeaturePopupAnchorBottom = null;
  if (restoreFocus) activeFeaturePopupTrigger?.focus();
  activeFeaturePopupTrigger = null;
}

function createFeaturePanel(device, title, trigger) {
  const imagePath = featurePopupFiles[device]?.[title];
  if (!imagePath) return;
  closeFeaturePopup(false);
  const stage = document.querySelector(device === 'mobile' ? '.desktop-stage' : '.mobile-stage');
  const panel = stage?.querySelector('.hotspot-feature-panel');
  if (!stage || !panel) return;
  activeFeaturePopupAnchorBottom = trigger.closest('.lifecare-device-card')?.getBoundingClientRect().bottom ?? null;
  const article = stage.closest('article');
  stage.querySelector('.lifecare-device-card')?.setAttribute('hidden', '');
  article?.classList.add('feature-popup-target');
  panel.classList.toggle('mobile-popup', device === 'mobile');
  panel.classList.toggle('desktop-popup', device === 'desktop');
  panel.setAttribute('role', 'region');
  panel.setAttribute('aria-label', title);
  const preview = document.createElement('div');
  preview.className = `feature-popup-preview ${device === 'mobile' ? 'feature-popup-desktop-design' : 'feature-popup-clinical-design'}`;
  const design = document.createElement('img');
  design.className = 'feature-popup-design';
  design.src = imagePath;
  design.alt = `Pop-up desktop: ${title}`;
  const close = document.createElement('button');
  close.className = 'feature-popup-dismiss';
  close.type = 'button';
  close.setAttribute('aria-label', 'Fechar pop-up');
  close.textContent = '×';
  close.addEventListener('click', closeFeaturePopup);
  preview.append(design, close);
  panel.replaceChildren(preview);
  panel.hidden = false;
  stage?.classList.add('has-feature-popup');
  activeFeaturePopupPanel = panel;
  activeFeaturePopupStage = stage;
  activeFeaturePopupArticle = article;
  activeFeaturePopupTrigger = trigger;
  alignFeaturePopupToTrigger();
  close.focus();
}

document.querySelectorAll('[data-hotspot-title]').forEach(button => {
  button.addEventListener('click', () => {
    createFeaturePanel(button.dataset.device, button.dataset.hotspotTitle, button);
  });
});

window.addEventListener('resize', () => {
  if (!activeFeaturePopupPanel || window.matchMedia('(max-width: 700px)').matches) return;
  requestAnimationFrame(() => {
    alignFeaturePopupToTrigger();
  });
  setTimeout(() => {
    if (activeFeaturePopupPanel) alignFeaturePopupToTrigger();
  }, 150);
}, { passive: true });

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeFeaturePopup();
});

document.querySelectorAll('[data-insights-carousel]').forEach(carousel => {
  const track = carousel.querySelector('.case-insight-track');
  const previous = carousel.querySelector('.insights-prev');
  const next = carousel.querySelector('.insights-next');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const maxScroll = () => Math.max(0, track.scrollWidth - track.clientWidth);
  function updateControls() {
    previous.disabled = track.scrollLeft <= 1;
    next.disabled = track.scrollLeft >= maxScroll() - 1;
  }
  function move(direction) {
    const step = track.firstElementChild.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap);
    track.scrollTo({ left: Math.max(0, Math.min(maxScroll(), track.scrollLeft + direction * step)), behavior: motion.matches ? 'instant' : 'smooth' });
  }
  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  track.addEventListener('scroll', updateControls, { passive: true });
  track.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home' || event.key === 'End') {
      track.scrollTo({ left: event.key === 'Home' ? 0 : maxScroll(), behavior: motion.matches ? 'instant' : 'smooth' });
    } else move(event.key === 'ArrowRight' ? 1 : -1);
  });
  carousel.dataset.enhanced = '';
  previous.hidden = next.hidden = false;
  new ResizeObserver(updateControls).observe(track);
  updateControls();
});
