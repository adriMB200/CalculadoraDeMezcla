import { evaluarAviso } from './garage-calculos.mjs';

const $ = id => document.getElementById(id);
const CATEGORIAS = Object.freeze({
  aceite_motor:'Aceite del motor', aceite_caja:'Aceite de la caja', filtro_aire:'Filtro de aire',
  piston:'Pistón', transmision:'Transmisión', refrigerante:'Refrigerante',
  bujia:'Bujía', frenos:'Frenos', otros:'Otros'
});
let motos = [];
let lecturas = [];
let reglas = [];
let version = 0;
let enProceso = false;

function el(tag, clase, texto) {
  const elemento = document.createElement(tag);
  if (clase) elemento.className = clase;
  if (texto !== undefined) elemento.textContent = String(texto);
  return elemento;
}
function token() { return typeof window.getToken === 'function' ? window.getToken() : null; }
function estado(mensaje) { $('avisos-estado').textContent = mensaje; }
function mostrarAcceso(mensaje = 'Inicia sesión para ver tus recordatorios privados.') {
  version++;
  motos = []; lecturas = []; reglas = [];
  $('avisos-selector-area').hidden = true;
  $('avisos-lecturas-panel').hidden = true;
  $('avisos-reglas-panel').hidden = true;
  $('avisos-reglas').replaceChildren();
  $('avisos-moto').replaceChildren(new Option('Selecciona una moto', ''));
  estado(mensaje);
  const boton = el('button','garage-btn garage-btn--accent','Iniciar sesión');
  boton.type = 'button';
  boton.addEventListener('click', () => window.openAuthModal?.());
  $('avisos-estado').append(' ', boton);
}
function manejarCaducidad() {
  if (typeof window.logout === 'function') window.logout();
  else { localStorage.removeItem('token'); localStorage.removeItem('user'); }
  mostrarAcceso('La sesión ha caducado. Inicia sesión otra vez.');
}
async function api(nombre, options = {}) {
  const jwt = token();
  if (!jwt) { const error = new Error('Sesión no iniciada'); error.auth = true; throw error; }
  const res = await fetch('/.netlify/functions/' + nombre, {
    ...options,
    cache:'no-store',
    headers: {
      Authorization:'Bearer ' + jwt,
      ...(options.body ? {'Content-Type':'application/json'} : {}),
      ...(options.headers || {})
    }
  });
  let data;
  try { data = await res.json(); } catch { data = {}; }
  if (res.status === 401) {
    const error = new Error('Sesión caducada'); error.auth = true; throw error;
  }
  if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : 'No se pudo completar la operación');
  return data;
}
function seleccionada() { return $('avisos-moto').value; }
function etiquetaMoto(m) { return `${m.marca} ${m.modelo} (${m.anio})`; }
function lecturaActual(ref, unidad) {
  const lectura = lecturas.find(l => l.matricula === ref);
  const valor = lectura?.[unidad === 'h' ? 'horas_actuales' : 'kilometros_actuales'];
  return valor === null || valor === undefined ? null : Number(valor);
}
function cargarLecturas(ref) {
  const horas = lecturaActual(ref,'h');
  const km = lecturaActual(ref,'km');
  $('avisos-horas').value = horas ?? '';
  $('avisos-km').value = km ?? '';
}
function pintarReglas(ref) {
  const destino = $('avisos-reglas');
  destino.replaceChildren();
  const propias = reglas.filter(r => r.matricula === ref);
  if (!propias.length) {
    destino.append(el('p','aviso-empty','Todavía no tienes recordatorios. Crea el primero en el formulario de abajo.'));
    return;
  }
  for (const regla of propias) {
    const unidad = regla.unidad === 'h' ? 'h' : 'km';
    const actual = lecturaActual(ref, regla.unidad);
    const evalua = evaluarAviso(actual, Number(regla.ultima_lectura), Number(regla.intervalo));
    const tarjeta = el('article','aviso-card');
    tarjeta.dataset.estado = evalua.tipo;
    tarjeta.append(el('h3','',CATEGORIAS[regla.categoria] || 'Mantenimiento'));
    tarjeta.append(el('span','aviso-card__status',evalua.texto));
    tarjeta.append(el('p','',`Cada ${regla.intervalo} ${unidad} · último cambio a las ${regla.ultima_lectura} ${unidad}`));
    tarjeta.append(el('small','',`Próximo a las ${Number(regla.ultima_lectura) + Number(regla.intervalo)} ${unidad}`));
    if (evalua.restante !== null) {
      tarjeta.append(el('small','',evalua.restante > 0
        ? `Quedan ${evalua.restante} ${unidad} según la lectura guardada.`
        : `Intervalo superado o alcanzado por ${Math.abs(evalua.restante)} ${unidad}.`));
    } else {
      tarjeta.append(el('small','', 'Completa la lectura actual para conocer el estado.'));
    }
    const progreso = document.createElement('progress');
    progreso.max = 100;
    progreso.value = evalua.porcentaje;
    progreso.setAttribute('aria-label', `Porcentaje del intervalo para ${CATEGORIAS[regla.categoria] || 'mantenimiento'}`);
    tarjeta.append(progreso);
    const acciones = el('div','aviso-card__actions');
    const realizado = el('button','garage-btn garage-btn--accent','Realizado ahora');
    realizado.type = 'button';
    realizado.disabled = actual === null || evalua.tipo === 'revisar';
    realizado.addEventListener('click', () => accionRegla('marcarRealizado',regla));
    const editar = el('button','garage-btn garage-btn--ghost','Editar');
    editar.type = 'button';
    editar.addEventListener('click', () => {
      $('avisos-categoria').value = regla.categoria;
      $('avisos-unidad').value = regla.unidad;
      $('avisos-intervalo').value = regla.intervalo;
      $('avisos-ultima').value = regla.ultima_lectura;
      $('avisos-regla-form').scrollIntoView({block:'center',behavior:'smooth'});
      $('avisos-intervalo').focus({preventScroll:true});
    });
    const borrar = el('button','garage-btn garage-btn--ghost','Eliminar');
    borrar.type = 'button';
    borrar.addEventListener('click', () => accionRegla('eliminarRegla',regla));
    // La lectura de la propia regla determina el registro en el historial.
    // La lectura seleccionada es suficiente para registrar.
    const registrar = el('button','garage-btn garage-btn--accent','Registrar en el libro');
    registrar.type = 'button';
    registrar.disabled = actual === null || evalua.tipo === 'revisar';
    registrar.title = registrar.disabled
      ? 'Guarda primero la lectura de la unidad elegida en Mis avisos.'
      : 'Guarda el mantenimiento y actualiza el aviso en una operación';
    registrar.addEventListener('click', () => registrarHistorial(regla));
        acciones.append(realizado,registrar,editar,borrar);

    tarjeta.append(acciones);
    destino.append(tarjeta);
  }
}
function mostrarMoto() {
  const ref = seleccionada();
  $('avisos-lecturas-panel').hidden = !ref;
  $('avisos-reglas-panel').hidden = !ref;
  $('avisos-lecturas-mensaje').textContent = '';
  $('avisos-regla-mensaje').textContent = '';
  if (!ref) return;
  cargarLecturas(ref);
  pintarReglas(ref);
}
async function cargar(preservarSeleccion = true) {
  const id = ++version;
  if (!token()) { mostrarAcceso(); return; }
  const anterior = preservarSeleccion ? seleccionada() : '';
  estado('Cargando datos del garaje…');
  try {
    const [m, datos] = await Promise.all([api('getMotos'),api('garageAvisos')]);
    if (id !== version || !token()) return;
    if (!Array.isArray(m) || !Array.isArray(datos.lecturas) || !Array.isArray(datos.reglas)) {
      throw new Error('La respuesta del servidor no es válida');
    }
    motos = m;
    lecturas = datos.lecturas;
    reglas = datos.reglas;
    const selector = $('avisos-moto');
    selector.replaceChildren(new Option('Selecciona una moto', ''));
    for (const moto of motos) {
      selector.add(new Option(etiquetaMoto(moto),String(moto.matricula)));
    }
    if (motos.some(moto=>String(moto.matricula) === anterior)) selector.value = anterior;
    else if (motos.length) selector.value = String(motos[0].matricula);
    $('avisos-selector-area').hidden = !motos.length;
    if (!motos.length) {
      $('avisos-lecturas-panel').hidden = true;
      $('avisos-reglas-panel').hidden = true;
      estado('Todavía no tienes motos. Registra una primero en Mi Garaje.');
      const link = el('a','garage-btn garage-btn--accent','Añadir moto');
      link.href='mi-garaje.html';
      $('avisos-estado').append(' ',link);
    } else estado(`${motos.length} ${motos.length === 1 ? 'moto disponible' : 'motos disponibles'}.`);
    mostrarMoto();
  } catch(error) {
    if (id !== version) return;
    if (error.auth) { manejarCaducidad(); return; }
    $('avisos-selector-area').hidden = true;
    $('avisos-lecturas-panel').hidden = true;
    $('avisos-reglas-panel').hidden = true;
    estado('No se han podido cargar los recordatorios: ' + error.message);
  }
}
async function accionRegla(action,regla) {
  const etiqueta = CATEGORIAS[regla.categoria] || 'mantenimiento';
  const confirmar = action === 'eliminarRegla'
    ? `¿Eliminar el recordatorio «${etiqueta}»? No borra el historial de mantenimientos.`
    : `¿Has realizado «${etiqueta}»? Se actualizará la última lectura a la lectura actual guardada. Esto NO añadirá un registro al libro de mantenimientos.`;
  if (!window.confirm(confirmar) || enProceso) return;
  enProceso = true;
  $('avisos-regla-mensaje').textContent = '';
  try {
    await api('garageAvisos',{method:'POST',body:JSON.stringify({
      action, matricula:seleccionada(), categoria:regla.categoria, unidad:regla.unidad
    })});
    await cargar();
  } catch(error) {
    if (error.auth) manejarCaducidad();
    else $('avisos-regla-mensaje').textContent = error.message;
  } finally { enProceso = false; }
}
async function registrarHistorial(regla) {
  if (enProceso || !seleccionada()) return;
  const etiqueta = CATEGORIAS[regla.categoria] || 'Mantenimiento';
  const nota = window.prompt(
    `¿Qué has realizado en «${etiqueta}»? Añade una nota opcional (máx. 500 caracteres).\nPara cancelar, pulsa «Cancelar».`, ''
  );
  if (nota === null) return;
  if (nota.length > 500) {
    $('avisos-regla-mensaje').textContent = 'La nota no puede superar 500 caracteres.';
    return;
  }
  if (!window.confirm('¿Confirmas que el trabajo SE HA REALIZADO? Se añadirá al libro con la lectura actual de la unidad elegida y se actualizará el aviso.')) return;
  enProceso = true;
  $('avisos-regla-mensaje').textContent = '';
  try {
    await api('garageAvisos', { method:'POST', body:JSON.stringify({
      action:'registrarYAnotar', matricula:seleccionada(),
      categoria:regla.categoria, unidad:regla.unidad,
      nota, operacion:crypto.randomUUID()
    }) });
    await cargar();
    $('avisos-regla-mensaje').textContent = 'Guardado en el libro y aviso actualizado.';
  } catch(error) {
    if (error.auth) manejarCaducidad();
    else $('avisos-regla-mensaje').textContent = error.message;
  } finally { enProceso = false; }
}

$('avisos-moto').addEventListener('change',mostrarMoto);
$('avisos-lecturas-form').addEventListener('submit',async event => {
  event.preventDefault();
  if (enProceso || !event.currentTarget.reportValidity() || !seleccionada()) return;
  const h = $('avisos-horas').value.trim();
  const km = $('avisos-km').value.trim();
  if (!h && !km) {
    $('avisos-lecturas-mensaje').textContent = 'Introduce al menos una lectura.';
    return;
  }
  const body = {action:'guardarLectura',matricula:seleccionada()};
  if (h) body.horas = Number(h);
  if (km) body.kilometros = Number(km);
  enProceso = true;
  $('avisos-guardar-lectura').disabled = true;
  $('avisos-lecturas-mensaje').textContent = '';
  try {
    await api('garageAvisos',{method:'POST',body:JSON.stringify(body)});
    await cargar();
  } catch(error) {
    if (error.auth) manejarCaducidad();
    else $('avisos-lecturas-mensaje').textContent = error.message;
  } finally { enProceso = false; $('avisos-guardar-lectura').disabled = false; }
});
$('avisos-regla-form').addEventListener('submit',async event => {
  event.preventDefault();
  if (enProceso || !event.currentTarget.reportValidity() || !seleccionada()) return;
  enProceso = true;
  $('avisos-guardar-regla').disabled = true;
  $('avisos-regla-mensaje').textContent = '';
  const body = {
    action:'guardarRegla',matricula:seleccionada(),
    categoria:$('avisos-categoria').value,
    unidad:$('avisos-unidad').value,
    intervalo:Number($('avisos-intervalo').value),
    ultima_lectura:Number($('avisos-ultima').value)
  };
  try {
    await api('garageAvisos',{method:'POST',body:JSON.stringify(body)});
    $('avisos-regla-form').reset();
    await cargar();
  } catch(error) {
    if (error.auth) manejarCaducidad();
    else $('avisos-regla-mensaje').textContent = error.message;
  } finally { enProceso = false; $('avisos-guardar-regla').disabled = false; }
});

$('avisos-year').textContent = new Date().getFullYear();
window.onAuthReady = () => cargar(false);
window.onLoginSuccess = () => cargar(false);
window.onLogout = () => mostrarAcceso();
window.addEventListener('storage', e => {
  if (e.key === 'token' || e.key === 'user') {
    if (!token()) mostrarAcceso(); else cargar();
  }
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    if (!token()) mostrarAcceso(); else cargar();
  }
});
