// Scale composed Figma illustrations without changing individual SVG dimensions.
const caseArtObserver = new ResizeObserver(entries => {
  for (const { target } of entries) {
    const scale = target.clientWidth / Number(target.dataset.caseWidth);
    target.querySelector('.case-canvas').style.transform = `scale(${scale})`;
  }
});
document.querySelectorAll('[data-case-width]').forEach(el => caseArtObserver.observe(el));

document.querySelectorAll('[data-case-tabs]').forEach(group => {
  const tabs = [...group.querySelectorAll('[role="tab"]')];
  function activate(index, focus = false) {
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      document.getElementById(tab.getAttribute('aria-controls')).hidden = i !== index;
    });
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
});
document.querySelectorAll('.case-range').forEach(input => {
  input.addEventListener('input', () => document.getElementById(input.dataset.comparison).style.setProperty('--split', `${input.value}%`));
});
