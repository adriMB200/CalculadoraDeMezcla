/* Enduro Nalón · Consentimiento de analítica opcional · Fase 0.2 */
(() => {
  'use strict';
  const KEY = 'enduro_cookie_preferences_v1';
  const UMAMI_ID = 'd013b9b8-1eae-4caa-ae20-f5a590cee984';
  let analyticsLoaded = false;
  let preferences = null;
  let previousFocus = null;

  function readPreferences() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
      return saved && saved.version === 1 && typeof saved.analytics === 'boolean'
        ? saved : null;
    } catch { return null; }
  }

  function savePreferences(analytics) {
    preferences = { version: 1, necessary: true, analytics: !!analytics, savedAt: new Date().toISOString() };
    try { localStorage.setItem(KEY, JSON.stringify(preferences)); } catch { /* El consentimiento vale esta sesión */ }
  }

  function loadAnalytics() {
    if (analyticsLoaded || !preferences?.analytics) return;
    if (document.querySelector('script[data-enduro-umami]')) { analyticsLoaded = true; return; }
    analyticsLoaded = true;
    const script = document.createElement('script');
    script.src = 'https://cloud.umami.is/script.js';
    script.async = true;
    script.dataset.websiteId = UMAMI_ID;
    script.dataset.enduroUmami = 'true';
    script.onerror = () => { analyticsLoaded = false; };
    document.head.appendChild(script);
  }

  function applyChoice(analytics) {
    const hadAnalytics = analyticsLoaded;
    savePreferences(analytics);
    closeSettings();
    const banner = document.getElementById('en-cookie-banner');
    if (banner) banner.hidden = true;
    if (analytics) loadAnalytics();
    // Un script ya ejecutado no puede desactivarse completamente sin recargar.
    if (!analytics && hadAnalytics) window.location.reload();
  }

  function openSettings() {
    const dialog = document.getElementById('en-cookie-settings');
    if (!dialog) return;
    previousFocus = document.activeElement;
    document.getElementById('en-analytics-toggle').checked = preferences?.analytics ?? false;
    dialog.hidden = false;
    document.getElementById('en-analytics-toggle').focus();
  }

  function closeSettings() {
    const dialog = document.getElementById('en-cookie-settings');
    if (dialog) dialog.hidden = true;
    if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
    previousFocus = null;
  }

  function createBanner() {
    const banner = document.createElement('section');
    banner.id = 'en-cookie-banner';
    banner.className = 'en-cookie-banner';
    banner.setAttribute('aria-label', 'Preferencias de privacidad');
    banner.hidden = !!preferences;
    banner.innerHTML = `
      <div class="en-cookie-copy">
        <strong>Tu privacidad en Enduro Nalón</strong>
        <p>Usamos almacenamiento necesario para mantener tu sesión y recordar tus preferencias. La analítica Umami es opcional: solo se activa si la aceptas.</p>
        <a href="politica-cookies.html">Consulta la política de cookies</a>
      </div>
      <div class="en-cookie-actions">
        <button type="button" class="en-cookie-choice" id="en-cookie-reject">Rechazar</button>
        <button type="button" class="en-cookie-choice" id="en-cookie-accept">Aceptar</button>
        <button type="button" class="en-cookie-configure" id="en-cookie-configure">Configurar</button>
      </div>`;
    document.body.appendChild(banner);
    document.getElementById('en-cookie-reject').addEventListener('click', () => applyChoice(false));
    document.getElementById('en-cookie-accept').addEventListener('click', () => applyChoice(true));
    document.getElementById('en-cookie-configure').addEventListener('click', openSettings);
  }

  function createSettings() {
    const overlay = document.createElement('div');
    overlay.id = 'en-cookie-settings';
    overlay.className = 'en-privacy-overlay';
    overlay.hidden = true;
    overlay.innerHTML = `
      <div class="en-privacy-dialog" role="dialog" aria-modal="true" aria-labelledby="en-privacy-title" aria-describedby="en-privacy-desc">
        <h2 id="en-privacy-title">Preferencias de privacidad</h2>
        <p id="en-privacy-desc">Elige qué tecnologías opcionales permites. Puedes cambiar esta decisión en cualquier momento.</p>
        <div class="en-privacy-setting"><div><strong>Necesarias</strong><p>Inicio de sesión y recordar tus preferencias.</p></div><span aria-label="Siempre activadas">Siempre activadas</span></div>
        <label class="en-privacy-setting"><span><strong>Analítica Umami</strong><span class="en-privacy-description">Estadísticas de visitas. Desactivada por defecto.</span></span><input type="checkbox" id="en-analytics-toggle"></label>
        <div class="en-privacy-controls">
          <button type="button" id="en-privacy-save">Guardar elección</button>
          <button type="button" id="en-privacy-cancel">Cancelar</button>
        </div>
        <p><a href="politica-cookies.html">Más información sobre cookies</a></p>
      </div>`;
    document.body.appendChild(overlay);
    document.getElementById('en-privacy-save').addEventListener('click', () => applyChoice(document.getElementById('en-analytics-toggle').checked));
    document.getElementById('en-privacy-cancel').addEventListener('click', closeSettings);
    overlay.addEventListener('click', (event) => { if (event.target === overlay) closeSettings(); });
    document.addEventListener('keydown', (event) => {
      if (overlay.hidden) return;
      if (event.key === 'Escape') { event.preventDefault(); closeSettings(); }
      if (event.key === 'Tab') {
        const controls = [...overlay.querySelectorAll('a,button,input')].filter(el => !el.disabled);
        if (!controls.length) return;
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { last.focus(); event.preventDefault(); }
        else if (!event.shiftKey && document.activeElement === last) { first.focus(); event.preventDefault(); }
      }
    });
  }

  function createPermanentLinks() {
    const links = document.createElement('nav');
    links.className = 'en-privacy-links';
    links.setAttribute('aria-label', 'Privacidad y documentación legal');
    links.innerHTML = `<a href="aviso-legal.html">Aviso legal</a>
      <a href="privacidad.html">Privacidad</a>
      <a href="politica-cookies.html">Cookies</a>
      <button id="en-open-cookie-settings" type="button">Configurar cookies</button>`;
    const footer = document.querySelector('footer');
    if (footer) footer.appendChild(links);
    else document.body.appendChild(links);
    document.getElementById('en-open-cookie-settings').addEventListener('click', openSettings);
  }

  function init() {
    preferences = readPreferences(); // La elección anterior "cookiesAccepted" no prueba consentimiento granular.
    createBanner();
    createSettings();
    createPermanentLinks();
    if (preferences?.analytics) loadAnalytics();
  }
  window.EnduroConsent = { openPreferences: openSettings, getPreferences: () => preferences ? { ...preferences } : null };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
