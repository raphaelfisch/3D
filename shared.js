/* ================================================================
   3D-Werkstatt · shared.js
   Hell/Dunkel-Toggle mit Persistenz über Seiten hinweg.
   ================================================================ */

(function() {
  const STORAGE_KEY = 'werkstatt-theme';

  // Theme ASAP anwenden, damit kein Flackern beim Laden entsteht.
  // Dieser Block läuft synchron vor dem ersten Paint.
  const saved = (() => {
    try { return localStorage.getItem(STORAGE_KEY); }
    catch (e) { return null; }
  })();
  const initialTheme = saved || 'light';

  // Anti-Flicker: Theme sofort auf <html> anwenden, später auf <body> spiegeln.
  // Wir fügen eine temporäre Style-Regel ein, die <html>.light-early auf die
  // gleichen Variablen-Overrides wie body.light mappt.
  if (initialTheme === 'light') {
    const earlyStyle = document.createElement('style');
    earlyStyle.id = '__werkstatt_early_theme';
    earlyStyle.textContent = `
      html.light-early {
        --bg-base: #f5f7fa;
        --bg-grad-3-start: #e4e9f0;
        --bg-grad-3-end: #f5f7fa;
        --text: #1a1a1a;
        background: #f5f7fa;
      }
    `;
    document.head.appendChild(earlyStyle);
    document.documentElement.classList.add('light-early');
  }

  // Globale Helfer-Funktion, die auch andere Scripts aufrufen können
  // (z.B. volume-18, um das 3D-Theme synchron umzuschalten).
  window.WerkstattTheme = {
    get: () => document.body?.classList.contains('light') ? 'light' : 'dark',
    set: (theme) => applyTheme(theme, true),
    toggle: () => applyTheme(window.WerkstattTheme.get() === 'light' ? 'dark' : 'light', true),
    onChange: (cb) => { listeners.push(cb); }
  };

  const listeners = [];

  function applyTheme(theme, persist) {
    const body = document.body;
    if (!body) return;

    // Kurz Transitions aus, damit der Wechsel nicht mitanimiert wird
    body.classList.add('resizing');

    if (theme === 'light') body.classList.add('light');
    else body.classList.remove('light');

    // Transitions nach einem Frame wieder an
    requestAnimationFrame(() => {
      requestAnimationFrame(() => body.classList.remove('resizing'));
    });

    if (persist) {
      try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) {}
    }
    listeners.forEach(cb => { try { cb(theme); } catch (e) { console.error(e); } });
  }

  // Nach DOMContentLoaded: initiales Theme anwenden und Toggle verdrahten
  function init() {
    // Anti-Flicker-Helfer wieder entfernen
    document.documentElement.classList.remove('light-early');
    document.getElementById('__werkstatt_early_theme')?.remove();

    applyTheme(initialTheme, false);

    const toggle = document.querySelector('[data-theme-toggle]');
    if (toggle) {
      toggle.addEventListener('click', () => window.WerkstattTheme.toggle());
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
