import { CATALOGO_MOTOS, buscarMoto, recursosParaAnio } from './catalogo-motos.js';

const marca = document.getElementById('bm-marca');
const modelo = document.getElementById('bm-modelo');
const anio = document.getElementById('bm-anio');
const formulario = document.getElementById('bm-form');
const resultados = document.getElementById('bm-resultados');
const mensaje = document.getElementById('bm-mensaje');
const limpiar = document.getElementById('bm-limpiar');

function opcion(valor, etiqueta) {
  const el = document.createElement('option');
  el.value = valor;
  el.textContent = etiqueta;
  return el;
}

function vaciarSelect(select, etiqueta) {
  select.replaceChildren(opcion('', etiqueta));
  select.value = '';
}

function marcasDisponibles() {
  return [...new Set(CATALOGO_MOTOS.map(m => m.marca))].sort((a, b) => a.localeCompare(b, 'es'));
}

function ponerEstado(texto) {
  mensaje.textContent = texto;
}

function resetResultados() {
  resultados.replaceChildren();
  resultados.hidden = true;
}

function alElegirMarca() {
  vaciarSelect(modelo, 'Selecciona el modelo');
  vaciarSelect(anio, 'Selecciona el año');
  modelo.disabled = !marca.value;
  anio.disabled = true;
  resetResultados();
  if (!marca.value) return ponerEstado('Selecciona una marca para comenzar.');
  const motos = CATALOGO_MOTOS.filter(m => m.marca === marca.value)
    .sort((a, b) => a.modelo.localeCompare(b.modelo, 'es'));
  for (const moto of motos) modelo.appendChild(opcion(moto.id, moto.modelo));
  ponerEstado(`${motos.length} modelos disponibles. Selecciona uno.`);
}

function alElegirModelo() {
  vaciarSelect(anio, 'Selecciona el año');
  anio.disabled = !modelo.value;
  resetResultados();
  const moto = CATALOGO_MOTOS.find(m => m.marca === marca.value && m.id === modelo.value);
  if (!moto) return ponerEstado('Selecciona el modelo de tu moto.');
  [...moto.anios].sort((a, b) => b - a).forEach(a => anio.appendChild(opcion(String(a), String(a))));
  ponerEstado('Selecciona el año de fabricación para ver la documentación.');
}

function crearEnlace(recurso) {
  const enlace = document.createElement('a');
  enlace.className = 'bm-resultado-enlace';
  enlace.href = recurso.enlace;
  enlace.target = '_blank';
  enlace.rel = 'noopener noreferrer';
  const tipo = document.createElement('span');
  tipo.className = 'bm-resultado-tipo';
  tipo.textContent = recurso.tipo;
  const titulo = document.createElement('strong');
  titulo.textContent = recurso.titulo;
  const origen = document.createElement('small');
  origen.textContent = recurso.origen;
  const flecha = document.createElement('span');
  flecha.className = 'bm-resultado-flecha';
  flecha.textContent = '↗';
  flecha.setAttribute('aria-hidden', 'true');
  enlace.append(tipo, titulo, origen, flecha);
  return enlace;
}

function mostrarResultados(evento) {
  evento.preventDefault();
  resetResultados();
  const moto = buscarMoto(marca.value, modelo.value, anio.value);
  if (!moto) {
    ponerEstado('Completa los tres campos. Solo se muestran los modelos y años con datos en la web.');
    return;
  }
  const titulo = document.createElement('h2');
  titulo.id = 'bm-resultado-titulo';
  titulo.tabIndex = -1;
  titulo.textContent = `${moto.marca} ${moto.modelo} · ${anio.value}`;
  const resumen = document.createElement('p');
  resumen.className = 'bm-resultado-info';
  resumen.textContent = moto.aclaracion;
  const listado = document.createElement('div');
  listado.className = 'bm-resultados-grid';
  const recursos = recursosParaAnio(moto, anio.value);
  recursos.forEach(recurso => listado.appendChild(crearEnlace(recurso)));
  resultados.append(titulo, resumen, listado);
  resultados.hidden = false;
  ponerEstado(`${recursos.length} recurso${recursos.length === 1 ? '' : 's'} encontrado${recursos.length === 1 ? '' : 's'}.`);
  titulo.focus({ preventScroll: true });
  resultados.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

marca.append(...marcasDisponibles().map(m => opcion(m, m)));
marca.addEventListener('change', alElegirMarca);
modelo.addEventListener('change', alElegirModelo);
anio.addEventListener('change', () => { resetResultados(); ponerEstado('Pulsa «Ver documentación» para consultar los recursos.'); });
formulario.addEventListener('submit', mostrarResultados);
limpiar.addEventListener('click', () => {
  formulario.reset();
  vaciarSelect(modelo, 'Selecciona el modelo');
  vaciarSelect(anio, 'Selecciona el año');
  modelo.disabled = true;
  anio.disabled = true;
  resetResultados();
  ponerEstado('Selecciona una marca para comenzar.');
  marca.focus();
});
ponerEstado('Selecciona una marca para comenzar.');
