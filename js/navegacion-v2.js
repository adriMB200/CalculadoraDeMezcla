/*
 * ENDURO_NALON_AUTORIA_V15
 * ENDURO NALÓN — Enduro, rutas y compañerismo en Asturias
 * Fundador y responsable del proyecto: Adrian Martis Blanco
 * GitHub: https://github.com/adriMB200
 * Web: https://enduronalon.netlify.app/
 * Copyright (c) 2026 Adrian Martis Blanco. Derechos reservados sobre las contribuciones originales.
 * Las bibliotecas, obras y contribuciones de terceros conservan sus licencias y autoría.
 */

/* Navegación común Enduro Nalón. No modifica APIs, sesiones ni datos de usuario. */
(() => {
  'use strict';

  const sections = [
    { label: 'Rutas', entries: [
      ['rutas.html', 'Quedadas e inscripciones'],
      ['mapa-rutas.html', 'Mapa y recorridos GPX']
    ] },
    { label: 'Taller', entries: [
      ['taller-avanzado.html', 'Taller avanzado'],
      ['calculadora.html', 'Calculadora de mezcla 2T'],
      ['tablas.html', 'Pares de apriete y manuales'],
      ['buscar-moto.html', 'Buscar por moto']
    ] },
    { label: 'Comunidad', entries: [
      ['club.html', 'El club'],
      ['historia.html', 'Historia del club'],
      ['galeria.html', 'Galería'],
      ['foro.html', 'Foro'],
      ['mercadillo.html', 'Mercadillo']
    ] },
    { label: 'Mi espacio', entries: [
      ['mi-garaje.html', 'Mi garaje'],
      ['mantenimientos.html', 'Libro de mantenimientos'],
      ['avisos.html', 'Mis avisos'],
      ['mi-cuenta.html', 'Mi cuenta']
    ] }
  ];
  const pages = {
    'index.html': ['Inicio', null],
    'rutas.html': ['Quedadas', 'Rutas'],
    'mapa-rutas.html': ['Mapa de rutas', 'Rutas'],
    'taller-avanzado.html': ['Taller avanzado', 'Taller'],
    'calculadora.html': ['Mezcla 2T', 'Taller'],
    'tablas.html': ['Pares y manuales', 'Taller'],
    'buscar-moto.html': ['Buscar moto', 'Taller'],
    'ktm300_2017.html': ['KTM 300', 'Taller'],
    'ktm450_2003.html': ['KTM 450', 'Taller'],
    'gg_04-06.html': ['GasGas 2004-2006', 'Taller'],
    'taller-costes.html': ['Coste por hora', 'Taller'],
    'taller-desarrollos.html': ['Desarrollos', 'Taller'],
    'taller-suspensiones.html': ['Suspensiones', 'Taller'],
    'taller-tolerancias.html': ['Tolerancias de motor', 'Taller'],
    'taller-carburacion.html': ['Carburación', 'Taller'],
    'club.html': ['El club', 'Comunidad'],
    'historia.html': ['Historia del club', 'Comunidad'],
    'galeria.html': ['Galería', 'Comunidad'],
    'foro.html': ['Foro', 'Comunidad'],
    'mercadillo.html': ['Mercadillo', 'Comunidad'],
    'normas-mercadillo.html': ['Normas del mercadillo', 'Comunidad'],
    'tienda.html': ['Tienda', null],
    'mi-garaje.html': ['Mi garaje', 'Mi espacio'],
    'mantenimientos.html': ['Mantenimientos', 'Mi espacio'],
    'avisos.html': ['Mis avisos', 'Mi espacio'],
    'mi-cuenta.html': ['Mi cuenta', 'Mi espacio'],
    'verificar-cuenta.html': ['Verificar correo', 'Mi espacio'],
    'recuperar-clave.html': ['Recuperar acceso', 'Mi espacio'],
    'admin.html': ['Administración', 'Mi espacio'],
    'privacidad.html': ['Privacidad', null],
    'aviso-legal.html': ['Aviso legal', null],
    'politica-cookies.html': ['Cookies', null]
  };
  const filename = decodeURIComponent(location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const current = pages[filename] || [document.title.split('|')[0].trim(), null];

  const escapeHtml = text => String(text).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const link = ([href, label]) => `<a href="${escapeHtml(href)}"${filename === href ? ' aria-current="page"' : ''}>${escapeHtml(label)}</a>`;
  const group = (item, i) => `<details class="en14-group" data-en14-group="${i}"${current[1] === item.label ? ' data-en14-section-current="true"' : ''}>
    <summary>${escapeHtml(item.label)}<span class="en14-chevron" aria-hidden="true"></span></summary>
    <div class="en14-submenu">${item.entries.map(link).join('')}</div>
  </details>`;

  function closeGroups(except) {
    document.querySelectorAll('#en14-nav .en14-group[open]').forEach(el => {
      if (el !== except) el.open = false;
    });
  }
  function init() {
    if (!document.body || document.getElementById('en14-header')) return;
    const main = document.querySelector('main');
    const skipExisting = document.querySelector('a[class*="skip"][href^="#"]');
    if (!skipExisting && main && !main.id) main.id = 'en14-main';
    const skipTarget = main && main.id ? main.id : null;
    if (skipTarget && !skipExisting) {
      const skip = document.createElement('a');
      skip.className = 'en14-skip'; skip.href = '#' + skipTarget;
      skip.textContent = 'Saltar al contenido';
      document.body.insertBefore(skip, document.body.firstChild);
    }

    const header = document.createElement('header');
    header.id = 'en14-header'; header.className = 'en14-header';
    header.innerHTML = `<div class="en14-shell">
      <a class="en14-brand" href="index.html" aria-label="Enduro Nalón, página de inicio">
        <span class="en14-mark" aria-hidden="true">EN</span><span>ENDURO <strong>NALÓN</strong></span>
      </a>
      <nav id="en14-nav" class="en14-nav" aria-label="Navegación principal">
        <a class="en14-direct" href="index.html"${filename === 'index.html' ? ' aria-current="page"' : ''}>Inicio</a>
        ${sections.slice(0,3).map((item,i) => group(item,i)).join('')}
        <a class="en14-direct" href="tienda.html"${filename === 'tienda.html' ? ' aria-current="page"' : ''}>Tienda</a>
        ${group(sections[3],3)}
      </nav>
      <div class="en14-actions"><div class="en14-auth" id="en14-auth-slot"></div>
        <button type="button" class="en14-menu-button" id="en14-toggle" aria-expanded="false" aria-controls="en14-nav" aria-label="Abrir menú">
          <span aria-hidden="true" class="en14-menu-icon">☰</span><span class="en14-menu-label">Menú</span>
        </button>
      </div>
    </div>`;
    const originalTopbar = document.getElementById('authTopbar');
    document.body.insertBefore(header, skipExisting && skipExisting.parentNode === document.body ? skipExisting.nextSibling : document.body.firstChild);
    if (originalTopbar) document.getElementById('en14-auth-slot').appendChild(originalTopbar);

    const backdrop = document.createElement('button');
    backdrop.type = 'button'; backdrop.className = 'en14-backdrop';
    backdrop.setAttribute('aria-label', 'Cerrar menú');
    backdrop.tabIndex = -1;
    document.body.appendChild(backdrop);
    const nav = header.querySelector('#en14-nav');
    const toggle = header.querySelector('#en14-toggle');
    const mobileQuery = matchMedia('(max-width: 1100px)');
    const isMobile = () => mobileQuery.matches;

    function setOpen(open) {
      if (!isMobile()) open = false;
      document.body.classList.toggle('en14-menu-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      header.querySelector('.en14-menu-icon').textContent = open ? '✕' : '☰';
      if (!open) closeGroups();
    }
    toggle.addEventListener('click', () => setOpen(!document.body.classList.contains('en14-menu-open')));
    backdrop.addEventListener('click', () => setOpen(false));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        const wasOpen = document.body.classList.contains('en14-menu-open');
        setOpen(false);
        if (wasOpen) toggle.focus();
      }
    });
    nav.addEventListener('click', event => {
      if (event.target.closest('a')) setOpen(false);
    });
    nav.querySelectorAll('details').forEach(d => d.addEventListener('toggle', () => {
      if (d.open) closeGroups(d);
    }));
    document.addEventListener('pointerdown', e => {
      if (!header.contains(e.target) && !isMobile()) closeGroups();
    });
    if (typeof mobileQuery.addEventListener === 'function') mobileQuery.addEventListener('change', () => setOpen(false));
    else if (typeof mobileQuery.addListener === 'function') mobileQuery.addListener(() => setOpen(false));

    if (main && filename !== 'index.html' && !main.querySelector('.en14-breadcrumb')) {
      const crumb = document.createElement('nav');
      crumb.className = 'en14-breadcrumb'; crumb.setAttribute('aria-label', 'Ruta de navegación');
      const parentDestination = {'Rutas':'rutas.html', 'Taller':'taller-avanzado.html', 'Comunidad':'club.html', 'Mi espacio':'mi-garaje.html'};
      const parents = current[1] ? `<span aria-hidden="true">/</span><a href="${parentDestination[current[1]]}">${escapeHtml(current[1])}</a>` : '';
      crumb.innerHTML = `<a href="index.html">Inicio</a>${parents}<span aria-hidden="true">/</span><span aria-current="page">${escapeHtml(current[0])}</span>`;
      main.insertBefore(crumb, main.firstChild);
    }
    if (filename === 'index.html') addHomeShortcuts(main);
    document.body.classList.add('en14-enhanced');
  }

  function addHomeShortcuts(main) {
    if (!main || document.getElementById('en14-home-shortcuts')) return;
    const section = document.createElement('section');
    section.id = 'en14-home-shortcuts';
    section.className = 'en14-home-shortcuts';
    section.setAttribute('aria-labelledby','en14-home-title');
    const cards = [
      ['rutas.html','↗','Rutas y quedadas','Encuentra salidas y consulta las inscripciones'],
      ['mapa-rutas.html','⌖','Mapa de rutas','Explora los recorridos compartidos'],
      ['taller-avanzado.html','⚙','Taller avanzado','Suspensiones, desarrollos y más'],
      ['mi-garaje.html','◇','Mi garaje','Motos e historial personal'],
      ['tienda.html','▣','Tienda del club','Chaquetas, chalecos y pegatinas'],
      ['historia.html','✦','Historia del club','Conoce el origen de Enduro Nalón']
    ];
    section.innerHTML = `<div class="en14-shortcuts-intro"><p>ACCESOS DIRECTOS</p><h2 id="en14-home-title">¿Qué buscas hoy?</h2><span>Entra directamente en las secciones más utilizadas.</span></div>
      <div class="en14-shortcuts-grid">${cards.map(([href,symbol,title,desc])=>`<a href="${href}" class="en14-shortcut"><span class="en14-shortcut-icon" aria-hidden="true">${symbol}</span><span class="en14-shortcut-copy"><strong>${title}</strong><small>${desc}</small></span><span class="en14-shortcut-arrow" aria-hidden="true">›</span></a>`).join('')}</div>`;
    const hero = main.querySelector('.en-hero');
    if (hero && hero.nextSibling) main.insertBefore(section, hero.nextSibling);
    else main.insertBefore(section, main.firstChild);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
