(() => {
  const dictionary = window.portfolioTranslations;
  const storageKey = 'portfolio-language';
  const originals = new WeakMap();
  const portuguese = new Map(Object.entries(dictionary).filter(([pt, en]) => pt !== en).map(([pt, en]) => [en, pt]));
  const attributes = ['aria-label', 'alt', 'title', 'placeholder'];
  let language = 'pt';
  try { language = localStorage.getItem(storageKey) === 'en' ? 'en' : 'pt'; } catch {}

  function english(source) {
    const text = source.replace(/\s+/g, ' ').trim();
    if (Object.hasOwn(dictionary, text)) return dictionary[text];
    if (text.includes(' · ')) return text.split(' · ').map(english).join(' · ');
    const prefixes = [
      ['Mostrar competência ', 'Show skill '], ['Mostrar projeto ', 'Show project '],
      ['Ver projeto ', 'View project '], ['Demonstração: ', 'Demonstration: '],
      ['Pré-visualização: ', 'Preview: '], ['Abrir pop-up: ', 'Open popup: '],
      ['Pop-up desktop: ', 'Desktop popup: '], ['Ecrã: ', 'Screen: '],
    ];
    for (const [pt, en] of prefixes) if (text.startsWith(pt)) return en + english(text.slice(pt.length));
    if (text.endsWith(' — apresentação do projeto')) return text.replace(' — apresentação do projeto', ' — project presentation');
    const signature = ' — Ana Contreiras, UX/UI Designer.';
    if (text.endsWith(signature)) return english(text.slice(0, -signature.length)) + signature;
    if (/^\d+ de \d+: /.test(text)) return text.replace(/^(\d+) de (\d+): /, '$1 of $2: ');
    return text;
  }

  function translate(source) { return language === 'en' ? english(source) : source; }
  function sourceText(current) {
    const normalised = current.replace(/\s+/g, ' ').trim();
    const source = portuguese.get(normalised);
    return source && !Object.hasOwn(dictionary, normalised) ? current.replace(/\S[\s\S]*\S|\S/, source) : current;
  }

  function renderText(node) {
    if (node.parentElement?.closest('script, style, [data-language-option]')) return;
    const current = node.nodeValue;
    if (!current.trim()) return;
    let record = originals.get(node);
    if (!record || current !== record.output) record = { source: sourceText(current) };
    const content = translate(record.source);
    // Keep the exact Portuguese whitespace and nested formatting when switching back.
    const output = language === 'pt' ? record.source : record.source.replace(/\S[\s\S]*\S|\S/, content);
    record.output = output;
    originals.set(node, record);
    if (current !== output) node.nodeValue = output;
  }

  function renderAttributes(element) {
    if (element.matches('[data-language-option]')) return;
    let records = originals.get(element);
    if (!records) { records = {}; originals.set(element, records); }
    const names = element.matches('meta[name="description"]') ? [...attributes, 'content'] : attributes;
    for (const name of names) {
      const current = element.getAttribute(name);
      if (current === null) continue;
      let record = records[name];
      if (!record || current !== record.output) record = { source: current };
      const output = translate(record.source);
      record.output = output;
      records[name] = record;
      if (current !== output) element.setAttribute(name, output);
    }
  }

  function render(root) {
    if (root.nodeType === Node.TEXT_NODE) { renderText(root); return; }
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
    if (root.nodeType === Node.ELEMENT_NODE) renderAttributes(root);
    root.querySelectorAll('*').forEach(renderAttributes);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) renderText(walker.currentNode);
  }

  const panel = document.querySelector('#language-panel');
  panel.replaceChildren();
  for (const [value, label, lang] of [['pt', 'Português · PT', 'pt-PT'], ['en', 'English · EN', 'en-GB']]) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.languageOption = value;
    button.lang = lang;
    button.textContent = label;
    button.addEventListener('click', () => {
      setLocale(value);
      panel.hidden = true;
      const toggle = document.querySelector('#language-toggle');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus();
    });
    panel.append(button);
  }

  function setLocale(value) {
    language = value === 'en' ? 'en' : 'pt';
    try { localStorage.setItem(storageKey, language); } catch {}
    document.documentElement.lang = language === 'en' ? 'en-GB' : 'pt-PT';
    render(document);
    panel.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.languageOption === language)));
    // This label describes the selected language, rather than a translated Portuguese label.
    const toggle = document.querySelector('#language-toggle');
    toggle.setAttribute('aria-label', language === 'en' ? 'Language: English' : 'Idioma: português');
    window.dispatchEvent(new CustomEvent('portfolio-language-change', { detail: { language } }));
  }

  window.portfolioI18n = { translate, english, render, get language() { return language; } };
  setLocale(language);
  // Popups, menu labels and carousel controls are created or updated after page load.
  new MutationObserver(mutations => {
    for (const mutation of mutations) {
      if (mutation.type === 'characterData') renderText(mutation.target);
      else if (mutation.type === 'attributes') renderAttributes(mutation.target);
      else mutation.addedNodes.forEach(render);
    }
  }).observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...attributes, 'content'] });
})();
