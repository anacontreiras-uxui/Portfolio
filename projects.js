// Scale composed Figma illustrations without changing individual SVG dimensions.
const researchArtwork = document.querySelector('.case-lifecare .research-redesign-art');
if (researchArtwork) {
  const desktopHover = window.matchMedia('(min-width: 701px) and (hover: hover)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const screens = [
    { title: 'TriaCare', image: './assets/991b9.png', angle: -16 },
    { title: 'Conteúdos de apoio', image: './assets/309de.png', angle: 12 },
    { title: 'Questionário semanal', image: './assets/e613f.png', angle: 16 }
  ];
  const viewer = document.createElement('div');
  viewer.className = 'research-phone-viewer';
  viewer.hidden = true;
  viewer.setAttribute('aria-hidden', 'true');
  const model = document.createElement('div');
  model.className = 'research-phone-model';
  const screen = document.createElement('img');
  screen.alt = '';
  const shell = document.createElement('div');
  shell.className = 'research-phone-shell';
  model.append(shell);
  // Join actual side faces around the rounded perimeter, rather than stacking images.
  const buildPhoneShell = () => {
    const width = model.offsetWidth;
    const height = model.offsetHeight;
    const inset = 2;
    const radius = width * .19;
    const depth = 24;
    model.style.setProperty('--phone-radius', `${radius}px`);
    model.style.setProperty('--phone-thickness', `${depth}px`);
    const points = [];
    const corners = [
      [width - inset - radius, inset + radius, -90],
      [width - inset - radius, height - inset - radius, 0],
      [inset + radius, height - inset - radius, 90],
      [inset + radius, inset + radius, 180]
    ];
    for (const [cx, cy, start] of corners) {
      for (let step = 0; step <= 16; step++) {
        const angle = (start + step * 90 / 16) * Math.PI / 180;
        points.push([cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius]);
      }
    }
    const faces = points.map(([x, y], index) => {
      const next = points[(index + 1) % points.length];
      const length = Math.hypot(next[0] - x, next[1] - y);
      const dx = (next[0] - x) / length;
      const dy = (next[1] - y) / length;
      const face = document.createElement('span');
      face.className = 'research-phone-side';
      face.style.width = `${length + .5}px`;
      face.style.height = `${depth}px`;
      face.style.filter = `brightness(${.65 + (dy + 1) * .25})`;
      face.style.transform = `matrix3d(${dx},${dy},0,0,0,0,1,0,${dy},${-dx},0,0,${x},${y},${-depth},1)`;
      return face;
    });
    shell.replaceChildren(...faces);
  };
  model.append(screen);
  viewer.append(model);
  document.body.append(viewer);
  let active = null;
  const hide = () => {
    viewer.hidden = true;
    active?.removeAttribute('data-preview-active');
    active = null;
  };
  screens.forEach((item, index) => {
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'research-phone-trigger';
    trigger.dataset.phone = index;
    trigger.setAttribute('aria-label', `Ampliar ecrã: ${item.title}`);
    const show = () => {
      if (!desktopHover.matches) return;
      active?.removeAttribute('data-preview-active');
      active = trigger;
      trigger.dataset.previewActive = '';
      screen.src = item.image;
      viewer.style.zoom = String(1 / (parseFloat(getComputedStyle(document.body).zoom) || 1));
      viewer.style.setProperty('--phone-rotate-x', '3deg');
      viewer.style.setProperty('--phone-rotate-y', `${item.angle}deg`);
      viewer.hidden = false;
      buildPhoneShell();
    };
    trigger.addEventListener('pointerenter', show);
    trigger.addEventListener('focus', show);
    trigger.addEventListener('pointerleave', hide);
    trigger.addEventListener('blur', hide);
    trigger.addEventListener('pointermove', event => {
      if (active !== trigger || reducedMotion.matches) return;
      const bounds = trigger.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - .5;
      const y = (event.clientY - bounds.top) / bounds.height - .5;
      viewer.style.setProperty('--phone-rotate-x', `${3 - y * 10}deg`);
      viewer.style.setProperty('--phone-rotate-y', `${item.angle + x * 18}deg`);
    });
    researchArtwork.append(trigger);
  });
  const sync = () => {
    hide();
    const wrapper = researchArtwork.closest('.research-redesign-wrapper');
    if (desktopHover.matches) wrapper?.removeAttribute('role');
    else wrapper?.setAttribute('role', 'img');
  };
  desktopHover.addEventListener('change', sync);
  window.addEventListener('resize', hide, { passive: true });
  window.addEventListener('scroll', hide, { passive: true });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') hide(); });
  sync();
}

// Native laptop layers keep the mobile comparison legible at larger sizes.
const mobileClinicalComparison = document.querySelector('.case-lifecare #comparison-1');
if (mobileClinicalComparison) {
  [
    [mobileClinicalComparison.querySelector(':scope > .case-art'), './assets/fc04a.jpg'],
    [mobileClinicalComparison.querySelector(':scope > .case-compare-before'), './assets/53361.jpg']
  ].forEach(([layer, source]) => {
    if (!layer) return;
    const laptop = document.createElement('div');
    laptop.className = 'mobile-comparison-laptop';
    laptop.innerHTML = `<img class="mobile-comparison-screen" src="${source}" alt=""><img class="mobile-comparison-frame" src="./assets/b0d29.png" alt="">`;
    layer.append(laptop);
  });
}

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
    if (target.closest('.desktop-device-card')) {
      const mobileArt = document.querySelector('.mobile-device-card [data-case-width]');
      const mobileScale = mobileArt ? mobileArt.clientWidth / Number(mobileArt.dataset.caseWidth) : 1;
      target.style.setProperty('--hotspot-size-ratio', String(scale > 0 ? mobileScale / scale : 1));
    }
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
let desktopFeatureDialog = null;

function getDesktopFeatureDialog() {
  if (desktopFeatureDialog) return desktopFeatureDialog;
  desktopFeatureDialog = document.createElement('dialog');
  desktopFeatureDialog.className = 'lifecare-desktop-feature-dialog';
  desktopFeatureDialog.hidden = true;
  desktopFeatureDialog.addEventListener('cancel', event => {
    event.preventDefault();
    closeFeaturePopup();
  });
  document.body.append(desktopFeatureDialog);
  return desktopFeatureDialog;
}

function addPopupScreenZoom(preview, image, device, wholeImage = false) {
  const lens = document.createElement('div');
  lens.className = 'popup-screen-zoom';
  lens.hidden = true;
  lens.setAttribute('aria-hidden', 'true');
  preview.append(lens);
  const hide = () => {
    lens.hidden = true;
    preview.style.cursor = '';
  };
  preview.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') return;
    const bounds = preview.getBoundingClientRect();
    const source = image.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    const inside = wholeImage
      ? event.clientX >= source.left && event.clientX <= source.right && event.clientY >= source.top && event.clientY <= source.bottom
      : device === 'mobile'
        ? x >= .07 && x <= .36 && y >= .29 && y <= .94
        : x >= .12 && x <= .88 && y >= .32 && y <= .70;
    if (!inside || !image.complete || !image.naturalWidth) {
      hide();
      return;
    }
    const size = Math.min(480, bounds.width * .8, bounds.height * .8);
    const zoom = 2.25;
    lens.style.width = `${size}px`;
    lens.style.height = `${size}px`;
    lens.style.left = `${Math.max(0, Math.min(bounds.width - size, event.clientX - bounds.left - size / 2))}px`;
    lens.style.top = `${Math.max(0, Math.min(bounds.height - size, event.clientY - bounds.top - size / 2))}px`;
    lens.style.backgroundImage = `url("${image.src}")`;
    lens.style.backgroundSize = `${source.width * zoom}px ${source.height * zoom}px`;
    lens.style.backgroundPosition = `${size / 2 - (event.clientX - source.left) * zoom}px ${size / 2 - (event.clientY - source.top) * zoom}px`;
    lens.hidden = false;
    preview.style.cursor = 'zoom-in';
  });
  preview.addEventListener('pointerleave', hide);
}

function alignFeaturePopupToTrigger() {
  if (!activeFeaturePopupPanel) return;
  if (activeFeaturePopupPanel === desktopFeatureDialog) {
    desktopFeatureDialog.style.zoom = String(1 / (parseFloat(getComputedStyle(document.body).zoom) || 1));
    return;
  }
  activeFeaturePopupAnchorBottom = activeFeaturePopupTrigger?.closest('.lifecare-device-card')?.getBoundingClientRect().bottom ?? null;
  if (activeFeaturePopupAnchorBottom === null) return;
  activeFeaturePopupPanel.style.removeProperty('--popup-y-offset');
  const popupBottom = activeFeaturePopupPanel.getBoundingClientRect().bottom;
  const desktopScale = parseFloat(getComputedStyle(document.body).zoom) || 1;
  activeFeaturePopupPanel.style.setProperty('--popup-y-offset', `${(activeFeaturePopupAnchorBottom - popupBottom) / desktopScale}px`);
}

function closeFeaturePopup(restoreFocus = true) {
  if (!activeFeaturePopupPanel) return;
  if (activeFeaturePopupPanel === desktopFeatureDialog && desktopFeatureDialog.open) desktopFeatureDialog.close();
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
  if (window.matchMedia('(max-width: 700px)').matches) {
    closeFeaturePopup(false);
    openMobileFeaturePopup(title);
    return;
  }
  const imagePath = featurePopupFiles[device]?.[title];
  if (!imagePath) return;
  closeFeaturePopup(false);
  const panel = getDesktopFeatureDialog();
  panel.classList.toggle('clinical-popup', device === 'desktop');
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
  const feature = (device === 'desktop' || window.portfolioI18n?.language === 'en')
    ? mobileFeaturePopups.find(feature => feature.title === title) : null;
  if (feature) {
    preview.classList.add('feature-popup-english');
    populateFeatureContent(preview, feature, closeFeaturePopup, 'desktop-feature');
    panel.setAttribute('aria-labelledby', 'desktop-feature-title');
    const screen = preview.querySelector('.mobile-feature-screen');
    if (screen) addPopupScreenZoom(preview, screen, device, true);
  } else {
    preview.append(design, close);
    addPopupScreenZoom(preview, design, device);
    panel.removeAttribute('aria-labelledby');
  }
  panel.replaceChildren(preview);
  panel.hidden = false;
  activeFeaturePopupPanel = panel;
  activeFeaturePopupTrigger = trigger;
  alignFeaturePopupToTrigger();
  panel.showModal();
  (preview.querySelector('button') || close).focus();
}

const mobileFeaturePopups = [
  {
    "title": "Questionário semanal",
    "description": "Permite registar sintomas e acompanhar efeitos secundários ao longo do tempo.",
    "image": "./assets/e613f.png",
    "points": [
      {
        "title": "Registo guiado",
        "description": "Poucos passos e linguagem clara."
      },
      {
        "title": "Acompanhamento contínuo",
        "description": "Ajuda a perceber a evolução."
      },
      {
        "title": "Contexto para a consulta",
        "description": "Informação útil entre consultas."
      }
    ]
  },
  {
    "title": "TriaCare",
    "description": "Assistente de triagem que ajuda a compreender sintomas e orienta os próximos passos com base em critérios validados por profissionais de saúde.",
    "image": "./assets/991b9.png",
    "points": [
      {
        "title": "Triagem orientada",
        "description": "Ajuda a interpretar o que está a acontecer."
      },
      {
        "title": "Sinais de atenção",
        "description": "Destaca quando é importante agir."
      },
      {
        "title": "Próximos passos",
        "description": "Orienta a ação de forma clara."
      }
    ]
  },
  {
    "title": "Apoio ao cuidador",
    "description": "Permite partilhar informação de forma segura com familiares e cuidadores, mantendo o paciente no controlo.",
    "image": "./assets/33304.png",
    "points": [
      {
        "title": "Partilha controlada",
        "description": "O paciente decide o que partilha."
      },
      {
        "title": "Apoio no dia a dia",
        "description": "Facilita o acompanhamento próximo."
      },
      {
        "title": "Paciente no controlo",
        "description": "Permissões claras e ajustáveis."
      }
    ]
  },
  {
    "title": "Medicação e lembretes",
    "description": "Organiza a medicação, lembretes e registo de toma num único lugar.",
    "image": "./assets/a05f2.png",
    "points": [
      {
        "title": "Plano organizado",
        "description": "Medicação reunida num só lugar."
      },
      {
        "title": "Lembretes personalizados",
        "description": "Apoiam a rotina de toma."
      },
      {
        "title": "Registo de toma",
        "description": "Mantém o histórico atualizado."
      }
    ]
  },
  {
    "title": "Diário",
    "description": "Espaço privado para registar sintomas, emoções e notas pessoais ao longo do tratamento.",
    "image": "./assets/9e2d8.png",
    "points": [
      {
        "title": "Registo livre",
        "description": "Notas, sintomas e emoções."
      },
      {
        "title": "Privacidade",
        "description": "Um espaço pessoal dentro da app."
      },
      {
        "title": "Memória do dia a dia",
        "description": "Ajuda a recordar mudanças e padrões."
      }
    ]
  },
  {
    "title": "Conteúdos e recursos de apoio",
    "description": "Acesso rápido a informação essencial e contactos úteis, com linguagem simples e fácil de compreender.",
    "image": "./assets/309de.png",
    "points": [
      {
        "title": "Informação de confiança",
        "description": "Conteúdos essenciais e validados."
      },
      {
        "title": "Linguagem simples",
        "description": "Informação fácil de compreender."
      },
      {
        "title": "Recursos úteis",
        "description": "Acesso rápido a contactos e apoio."
      }
    ]
  }
];

mobileFeaturePopups.push(...[
  {
    "title": "Gestão de pacientes",
    "subtitle": "Consultar e acompanhar",
    "description": "Visão centralizada dos registos clínicos, histórico e informação relevante de cada paciente.",
    "image": "./assets/ec3bc.png",
    "frame": "./assets/b0d29.png",
    "clinical": true,
    "screenBottom": "-9.38%",
    "points": [
      {
        "title": "Informação centralizada",
        "description": "Dados essenciais numa única área."
      },
      {
        "title": "Histórico",
        "description": "Evolução e registos anteriores."
      },
      {
        "title": "Contexto clínico",
        "description": "Diagnóstico, tratamento e acompanhamento."
      }
    ]
  },
  {
    "title": "Avaliação e monitorização",
    "subtitle": null,
    "description": "Acompanha a evolução das respostas ao longo do tempo e destaca sinais que requerem atenção.",
    "image": "./assets/c58e8.png",
    "frame": "./assets/b0d29.png",
    "clinical": true,
    "screenBottom": "-30.29%",
    "points": [
      {
        "title": "Evolução",
        "description": "Alterações e tendências ao longo do tempo."
      },
      {
        "title": "Sinais de atenção",
        "description": "Respostas que podem necessitar de revisão."
      },
      {
        "title": "Continuidade",
        "description": "Mais contexto entre momentos de acompanhamento."
      }
    ]
  },
  {
    "title": "Questionários personalizados",
    "subtitle": null,
    "description": "Criação e adaptação de questionários ao contexto de cada paciente.",
    "image": "./assets/e48d6.png",
    "frame": "./assets/b0d29.png",
    "clinical": true,
    "screenBottom": "-9.38%",
    "points": [
      {
        "title": "Criação personalizada",
        "description": "Questionários ajustados ao acompanhamento."
      },
      {
        "title": "Adaptação ao paciente",
        "description": "Conteúdo adequado ao seu contexto."
      },
      {
        "title": "Respostas estruturadas",
        "description": "Informação consistente e fácil de analisar."
      }
    ]
  },
  {
    "title": "Registo de pacientes",
    "subtitle": "Criar e configurar",
    "description": "Criação e edição de perfis com diagnóstico, tratamento e questionários associados.",
    "image": "./assets/2335a.png",
    "frame": "./assets/b0d29.png",
    "clinical": true,
    "screenBottom": "-9.38%",
    "points": [
      {
        "title": "Perfil clínico",
        "description": "Informação essencial num único registo."
      },
      {
        "title": "Tratamento",
        "description": "Diagnóstico e tratamento associados ao perfil."
      },
      {
        "title": "Acompanhamento",
        "description": "Questionários relevantes associados ao paciente."
      }
    ]
  }
]);

function populateFeatureContent(container, feature, onClose, idPrefix = 'mobile-feature') {
  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    node.className = className;
    if (text) node.textContent = text;
    return node;
  };
  const header = element('div', 'mobile-feature-header');
  const label = element('span', 'mobile-feature-label', 'FUNCIONALIDADE');
  const close = element('button', 'mobile-feature-close', '×');
  close.type = 'button';
  close.setAttribute('aria-label', 'Fechar pop-up');
  close.addEventListener('click', onClose);
  header.append(label, close);
  const heading = element('h3', 'mobile-feature-title', feature.title);
  heading.id = `${idPrefix}-title`;
  const description = element('p', 'mobile-feature-description', feature.description);
  description.id = `${idPrefix}-description`;
  const body = element('div', 'mobile-feature-body');
  const screen = element('img', 'mobile-feature-screen');
  screen.src = feature.image;
  screen.alt = `Ecrã: ${feature.title}`;
  let visual = screen;
  if (feature.clinical) {
    visual = element('div', 'mobile-clinical-laptop');
    const window = element('div', 'mobile-clinical-screen-window');
    const content = element('div', 'mobile-clinical-screen-content');
    content.style.bottom = feature.screenBottom;
    content.append(screen);
    window.append(content);
    const frame = element('img', 'mobile-clinical-frame');
    frame.src = feature.frame;
    frame.alt = '';
    visual.append(window, frame);
  }
  const points = element('ul', 'mobile-feature-points');
  feature.points.forEach(point => {
    const item = element('li', 'mobile-feature-point');
    const icon = element('span', 'mobile-feature-dot');
    icon.setAttribute('aria-hidden', 'true');
    const copy = element('div', 'mobile-feature-point-copy');
    copy.append(element('h4', '', point.title), element('p', '', point.description));
    item.append(icon, copy);
    points.append(item);
  });
  body.append(visual, points);
  const intro = [header, heading];
  if (feature.subtitle) intro.push(element('p', 'mobile-feature-subtitle', feature.subtitle));
  intro.push(description, body);
  container.replaceChildren(...intro);
  window.portfolioI18n?.render(container);
  return close;
}

let mobileFeatureDialog;
function openMobileFeaturePopup(title) {
  const feature = mobileFeaturePopups.find(item => item.title === title);
  if (!feature) return;
  if (!mobileFeatureDialog) {
    mobileFeatureDialog = document.createElement('dialog');
    mobileFeatureDialog.className = 'lifecare-mobile-feature-dialog';
    mobileFeatureDialog.setAttribute('aria-labelledby', 'mobile-feature-title');
    mobileFeatureDialog.setAttribute('aria-describedby', 'mobile-feature-description');
    document.body.append(mobileFeatureDialog);
  }
  mobileFeatureDialog.classList.toggle('clinical-feature-dialog', Boolean(feature.clinical));
  const close = populateFeatureContent(mobileFeatureDialog, feature, () => mobileFeatureDialog.close());
  if (!mobileFeatureDialog.open) mobileFeatureDialog.showModal();
  close.focus({ preventScroll: true });
}
window.matchMedia('(max-width: 700px)').addEventListener('change', event => {
  if (!event.matches && mobileFeatureDialog?.open) mobileFeatureDialog.close();
});

document.querySelectorAll('[data-hotspot-title]').forEach(button => {
  button.addEventListener('click', () => {
    createFeaturePanel(button.dataset.device, button.dataset.hotspotTitle, button);
  });
});

window.addEventListener('portfolio-language-change', () => {
  if (!activeFeaturePopupPanel || !activeFeaturePopupTrigger) return;
  const trigger = activeFeaturePopupTrigger;
  createFeaturePanel(trigger.dataset.device, trigger.dataset.hotspotTitle, trigger);
});

window.addEventListener('resize', () => {
  if (!activeFeaturePopupPanel) return;
  if (window.matchMedia('(max-width: 700px)').matches) {
    closeFeaturePopup(false);
    return;
  }
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

// Keep the overview grid on desktop; browse its cards on mobile.
document.querySelectorAll('.case-overview').forEach(section => {
  const mobile = window.matchMedia('(max-width: 700px)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let track;
  function syncLayout() {
    if (!mobile.matches) {
      if (!track) return;
      section.replaceChildren(...track.children);
      delete section.dataset.mobileCarousel;
      track = null;
      return;
    }
    if (track) return;
    track = document.createElement('div');
    track.className = 'case-overview-track';
    track.tabIndex = 0;
    track.setAttribute('aria-label', 'Cards de apresentação do projeto');
    track.append(...section.children);
    const previous = document.createElement('button');
    const next = document.createElement('button');
    for (const [button, direction, label, symbol] of [[previous, -1, 'Card anterior', '‹'], [next, 1, 'Card seguinte', '›']]) {
      button.type = 'button';
      button.className = `insights-arrow overview-arrow overview-${direction < 0 ? 'prev' : 'next'}`;
      button.setAttribute('aria-label', label);
      button.textContent = symbol;
      button.addEventListener('click', () => move(direction));
    }
    function update() {
      previous.disabled = track.scrollLeft <= 1;
      next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 1;
    }
    function move(direction) {
      const step = track.firstElementChild.getBoundingClientRect().width + 16;
      track.scrollBy({ left: direction * step, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
    }
    track.addEventListener('scroll', update, { passive: true });
    track.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      move(event.key === 'ArrowRight' ? 1 : -1);
    });
    section.append(previous, track, next);
    section.dataset.mobileCarousel = '';
    update();
  }
  mobile.addEventListener('change', syncLayout);
  syncLayout();
});

// Switch between patient and clinical comparisons.
document.querySelectorAll('.case-lifecare .case-evolution').forEach(section => {
  const tabs = section.querySelector('.case-evolution-tabs');
  const panels = [...section.querySelectorAll('.case-compare-grid > article')];
  const originalLabels = [...tabs.children];
  let buttons = [];
  let selected = 0;
  function select(index) {
    selected = index;
    buttons.forEach((button, i) => {
      button.setAttribute('aria-selected', String(i === index));
      button.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = i !== index;
    });
  }
  function sync() {
    if (buttons.length) return;
    tabs.removeAttribute('aria-hidden');
    tabs.setAttribute('role', 'tablist');
    tabs.setAttribute('aria-label', 'Versão da solução');
    tabs.dataset.switcher = '';
    buttons = originalLabels.map((label, i) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label.textContent;
      button.id = `evolution-tab-${i}`;
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-controls', `evolution-panel-${i}`);
      panels[i].id = `evolution-panel-${i}`;
      panels[i].setAttribute('role', 'tabpanel');
      panels[i].setAttribute('aria-labelledby', button.id);
      button.addEventListener('click', () => select(i));
      button.addEventListener('keydown', event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const index = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (selected + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
        select(index);
        buttons[index].focus();
      });
      return button;
    });
    tabs.replaceChildren(...buttons);
    select(selected);
  }
  sync();
});
