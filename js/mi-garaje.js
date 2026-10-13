/* Enduro Nalón · Mi Garaje 2.1
   Usa exclusivamente las funciones autenticadas existentes de Netlify/Neon.
   No guarda matrículas ni mantenimientos en localStorage o sessionStorage. */
import { CATALOGO_MOTOS, recursosParaAnio } from './catalogo-motos.js';

const $ = id => document.getElementById(id);
const lista = $('garage-list');
const estado = $('garage-status');
const formulario = $('garage-bike-form');
const formServicio = $('garage-service-form');
const campos = {
  marca: $('garage-brand'), modelo: $('garage-model'), anio: $('garage-year'),
  ref: $('garage-ref'), descripcion: $('garage-description'), horas: $('garage-hours')
};
const MODELOS = {
  'KTM': ['EXC 250', 'EXC 300', 'EXC-F 450'],
  'GasGas': ['EC 200', 'EC 250', 'EC 300'],
  'Rieju': ['MR 300'],
  'BMW': ['Funduro 650']
};
let matriculaServicio = null;
let versionCarga = 0;

function nodo(tag, clase, texto) {
  const n = document.createElement(tag);
  if (clase) n.className = clase;
  if (texto !== undefined && texto !== null) n.textContent = String(texto);
  return n;
}
function ponerEstado(texto) { estado.textContent = texto; }
function tokenActual() { return typeof window.getToken === 'function' ? window.getToken() : null; }
function limpiarVista(texto = 'Inicia sesión para consultar tu garaje.') {
  versionCarga++;
  lista.replaceChildren();
  $('garage-show-form').hidden = true;
  $('garage-create').hidden = true;
  $('garage-service').hidden = true;
  matriculaServicio = null;
  ponerEstado(texto);
}
function mostrarLogin() {
  limpiarVista();
  const boton = nodo('button', 'garage-btn garage-btn--accent', 'Iniciar sesión');
  boton.type = 'button';
  boton.addEventListener('click', () => window.openAuthModal?.());
  estado.append(' ', boton);
}
function sesionCaducada() {
  if (typeof window.logout === 'function') window.logout();
  mostrarLogin();
  ponerEstado('La sesión ha caducado. Vuelve a iniciar sesión para continuar.');
  const boton = nodo('button', 'garage-btn garage-btn--accent', 'Iniciar sesión');
  boton.type = 'button';
  boton.addEventListener('click', () => window.openAuthModal?.());
  estado.append(' ', boton);
}
async function api(path, options = {}) {
  const token = tokenActual();
  if (!token) { const e = new Error('Debes iniciar sesión'); e.auth = true; throw e; }
  const res = await fetch('/.netlify/functions/' + path, {
    ...options,
    headers: { ...(options.body ? {'Content-Type': 'application/json'} : {}), Authorization: `Bearer ${token}`, ...(options.headers || {}) },
    cache: 'no-store'
  });
  let data;
  try { data = await res.json(); } catch { data = {}; }
  if (res.status === 401 || res.status === 403) {
    const e = new Error('Tu sesión ha caducado o no tienes permiso.'); e.auth = true; throw e;
  }
  if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : 'No se pudo completar la operación');
  return data;
}
function ocultarReferencia(ref) {
  const str = String(ref || '');
  return str.length <= 3 ? '•••' : `••••${str.slice(-3)}`;
}
function obtenerDocumentos(moto) {
  // No inferir compatibilidad técnica entre motores, versiones y años.
  const marca = String(moto.marca || '').toUpperCase();
  const modelo = String(moto.modelo || '').toUpperCase();
  const anio = Number(moto.anio);
  return CATALOGO_MOTOS.filter(c =>
    c.marca === marca && c.modelo.toUpperCase() === modelo && c.anios.includes(anio)
  ).flatMap(c => recursosParaAnio(c, anio));
}
function renderMoto(moto) {
  const card = nodo('article', 'garage-bike');
  const encabezado = nodo('div', 'garage-bike__header');
  const labels = nodo('div');
  labels.append(nodo('span', 'garage-bike__badge', 'MOTO REGISTRADA'));
  labels.append(nodo('h3', '', `${moto.marca || 'Moto'} ${moto.modelo || ''}`));
  labels.append(nodo('p', 'garage-bike__year', `Año ${moto.anio ?? 'sin indicar'}`));
  labels.append(nodo('p', 'garage-bike__ref', `Identificador: ${ocultarReferencia(moto.matricula)}`));
  encabezado.append(labels);
  card.append(encabezado);

  const maint = Array.isArray(moto.mantenimientos) ? moto.mantenimientos : [];
  const lecturas = maint.map(m => Number(m.horas)).filter(n => Number.isFinite(n) && n >= 0);
  const ultimaLectura = lecturas.length ? Math.max(...lecturas) + ' h' : '—';
  const metrics = nodo('div', 'garage-bike__metrics');
  const a = nodo('div', 'garage-metric'); a.append(nodo('strong', '', String(maint.length)), nodo('small', '', 'Mantenimientos'));
  const b = nodo('div', 'garage-metric'); b.append(nodo('strong', '', ultimaLectura), nodo('small', '', 'Mayor lectura anotada'));
  metrics.append(a,b); card.append(metrics);

  const historial = nodo('ul', 'garage-bike__list');
  if (!maint.length) historial.append(nodo('li', '', 'Aún no hay mantenimientos registrados.'));
  maint.slice(0,3).forEach(m => {
    const item = nodo('li', '', m.descripcion || 'Mantenimiento');
    item.append(nodo('small', '', `${m.fecha || 'Fecha no disponible'} · ${Number.isFinite(Number(m.horas)) ? m.horas + ' h' : 'sin horas'}`));
    historial.append(item);
  });
  card.append(historial);

  const acciones = nodo('div', 'garage-bike__actions');
  const añadir = nodo('button', 'garage-btn garage-btn--accent', '+ Mantenimiento');
  añadir.type = 'button';
  añadir.addEventListener('click', () => abrirMantenimiento(moto));
  const historialCompleto = nodo('a', 'garage-btn garage-btn--ghost', 'Libro completo');
  historialCompleto.href = 'mantenimientos.html';
  acciones.append(añadir, historialCompleto); card.append(acciones);

  const enlaces = nodo('div', 'garage-bike__docs');
  const docs = obtenerDocumentos(moto);
  if (docs.length) {
    docs.forEach(doc => {
      const enlace = nodo('a', '', doc.tipo + ': ' + doc.titulo);
      enlace.href = doc.enlace;
      enlace.target = '_blank';
      enlace.rel = 'noopener noreferrer';
      enlaces.append(enlace);
    });
  } else {
    const enlace = nodo('a', '', 'Consultar buscador de manuales y pares →');
    enlace.href = 'buscar-moto.html';
    enlaces.append(enlace);
  }
  card.append(enlaces);
  return card;
}
async function cargarMotos() {
  const solicitud = ++versionCarga;
  if (!tokenActual()) { mostrarLogin(); return; }
  lista.replaceChildren();
  $('garage-show-form').hidden = false;
  ponerEstado('Cargando tus motos…');
  try {
    const motos = await api('getMotos');
    if (solicitud !== versionCarga || !tokenActual()) return;
    if (!Array.isArray(motos)) throw new Error('Respuesta de motos inesperada');
    lista.replaceChildren();
    if (!motos.length) {
      ponerEstado('Todavía no tienes motos en el garaje. Pulsa «Añadir moto» para empezar.');
      return;
    }
    const fragment = document.createDocumentFragment();
    motos.forEach(moto => fragment.append(renderMoto(moto)));
    lista.append(fragment);
    ponerEstado(`${motos.length} ${motos.length === 1 ? 'moto registrada' : 'motos registradas'}.`);
  } catch (err) {
    if (solicitud !== versionCarga) return;
    if (err.auth) { sesionCaducada(); return; }
    lista.replaceChildren();
    ponerEstado('No se han podido cargar las motos. ' + err.message);
  }
}
function abrirMantenimiento(moto) {
  matriculaServicio = String(moto.matricula);
  $('garage-service-bike').textContent = `${moto.marca} ${moto.modelo} (${moto.anio})`;
  $('garage-service-message').textContent = '';
  formServicio.reset();
  $('garage-service').hidden = false;
  $('garage-service').scrollIntoView({ behavior: 'smooth', block: 'start' });
  campos.descripcion.focus({preventScroll:true});
}
function cerrarMantenimiento() {
  matriculaServicio = null;
  formServicio.reset();
  $('garage-service').hidden = true;
}
function actualizarModelos() {
  campos.modelo.replaceChildren(new Option('Selecciona modelo', ''));
  for (const modelo of MODELOS[campos.marca.value] || []) campos.modelo.add(new Option(modelo, modelo));
  campos.modelo.disabled = !campos.marca.value;
}
function prepararFormulario() {
  for (let anio = new Date().getFullYear()+1; anio >= 1980; anio--) campos.anio.add(new Option(String(anio), String(anio)));
  campos.anio.value = '';
  campos.marca.addEventListener('change', actualizarModelos);
  $('garage-show-form').addEventListener('click', () => {
    $('garage-form-message').textContent = '';
    $('garage-create').hidden = false;
    $('garage-create').scrollIntoView({ behavior: 'smooth', block: 'start' });
    campos.marca.focus({preventScroll:true});
  });
  $('garage-hide-form').addEventListener('click', () => { $('garage-create').hidden = true; formulario.reset(); actualizarModelos(); });
  $('garage-close-service').addEventListener('click', cerrarMantenimiento);
  formulario.addEventListener('submit', async e => {
    e.preventDefault();
    if (!formulario.reportValidity()) return;
    const submit = $('garage-save-bike');
    submit.disabled = true;
    try {
      await api('addMoto', {method:'POST', body:JSON.stringify({
        matricula:campos.ref.value.trim().toUpperCase(), marca:campos.marca.value,
        modelo:campos.modelo.value, anio:Number(campos.anio.value)
      })});
      formulario.reset(); actualizarModelos();
      $('garage-create').hidden = true;
      await cargarMotos();
    } catch (err) {
      if (err.auth) sesionCaducada();
      else $('garage-form-message').textContent = 'No se pudo guardar la moto: ' + err.message;
    } finally { submit.disabled = false; }
  });
  formServicio.addEventListener('submit', async e => {
    e.preventDefault();
    if (!matriculaServicio || !formServicio.reportValidity()) return;
    const submit = $('garage-save-service');
    submit.disabled = true;
    try {
      await api('addMantenimiento', {method:'POST', body:JSON.stringify({
        matricula:matriculaServicio, descripcion:campos.descripcion.value.trim(), horas:Number(campos.horas.value)
      })});
      cerrarMantenimiento();
      await cargarMotos();
    } catch (err) {
      if (err.auth) sesionCaducada();
      else $('garage-service-message').textContent = 'No se pudo guardar el mantenimiento: ' + err.message;
    } finally {submit.disabled = false;}
  });
}

prepararFormulario();
$('garage-year-footer').textContent = new Date().getFullYear();
window.onAuthReady = cargarMotos;
window.onLoginSuccess = cargarMotos;
window.onLogout = () => mostrarLogin();
window.addEventListener('storage', e => {
  if (e.key === 'token' || e.key === 'user') {
    if (!tokenActual()) mostrarLogin(); else cargarMotos();
  }
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    if (!tokenActual()) mostrarLogin(); else cargarMotos();
  }
});
