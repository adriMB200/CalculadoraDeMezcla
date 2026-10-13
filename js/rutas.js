'use strict';
// La interfaz NO decide permisos. El servidor verifica JWT y administrador.
(() => {
  const $ = id => document.getElementById(id);
  const lista = $('rutas-lista');
  const estado = $('rutas-estado');
  let version = 0;
  let esperando = false;
  const nodo = (tag, clase, texto) => {
    const el = document.createElement(tag);
    if (clase) el.className = clase;
    if (texto !== undefined) el.textContent = String(texto);
    return el;
  };
  const token = () => typeof window.getToken === 'function' ? window.getToken() : null;
  function mostrar(mensaje) { estado.textContent = mensaje; }
  async function api(nombre, opciones = {}) {
    const actual = token();
    if (opciones.method === 'POST' && !actual) throw new Error('Inicia sesión para continuar');
    const res = await fetch('/.netlify/functions/' + nombre, {
      ...opciones, cache: 'no-store',
      headers: { ...(actual ? { Authorization: 'Bearer ' + actual } : {}),
        ...(opciones.body ? { 'Content-Type': 'application/json' } : {}) }
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      if (typeof window.logout === 'function') window.logout();
      else { localStorage.removeItem('token'); localStorage.removeItem('user'); }
      throw new Error('Sesión caducada. Inicia sesión otra vez.');
    }
    if (!res.ok) throw new Error(data.error || 'Error al contactar con el servidor');
    return data;
  }
  function fechaTexto(valor) {
    const date = new Date(valor);
    return Number.isNaN(date.getTime()) ? 'Fecha no disponible' :
      new Intl.DateTimeFormat('es-ES', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Europe/Madrid' }).format(date);
  }
  function tarjeta(ruta, administrador) {
    const card = nodo('article', 'rutas-card');
    card.append(nodo('span', 'rutas-tag', ruta.dificultad === 'facil' ? '🟢 FÁCIL' : ruta.dificultad === 'media' ? '🟡 MEDIA' : '🔴 ALTA'));
    card.append(nodo('h3', '', ruta.titulo));
    const detalles = nodo('div', 'rutas-meta');
    for (const texto of [fechaTexto(ruta.fecha_salida), 'Zona: ' + ruta.zona,
      'Terreno: ' + ruta.terreno, ruta.kilometros === null ? 'Distancia: por confirmar' : `${ruta.kilometros} km aproximados`]) {
      detalles.append(nodo('p', '', texto));
    }
    card.append(detalles);
    card.append(nodo('p', 'rutas-capacidad', `${ruta.inscritos} / ${ruta.plazas} plazas ocupadas`));
    if (ruta.apuntado && ruta.encuentro) {
      const box = nodo('div', 'rutas-privado');
      box.append(nodo('b', '', 'Punto de encuentro privado'));
      box.append(nodo('span', '', ruta.encuentro));
      card.append(box);
    } else {
      card.append(nodo('p', 'rutas-privado', 'El punto de encuentro se muestra después de apuntarte.'));
    }
    const acciones = nodo('div', 'rutas-card__actions');
    const boton = nodo('button', ruta.apuntado ? 'rutas-btn rutas-btn--ghost' : 'rutas-btn rutas-btn--primary',
      ruta.apuntado ? 'Darme de baja' : (Number(ruta.inscritos) >= Number(ruta.plazas) ? 'Sin plazas' : 'Apuntarme'));
    boton.type = 'button';
    boton.disabled = !ruta.apuntado && Number(ruta.inscritos) >= Number(ruta.plazas);
    boton.addEventListener('click', async () => {
      if (!token()) { window.openAuthModal?.(); mostrar('Inicia sesión para apuntarte.'); return; }
      if (ruta.apuntado && !window.confirm('¿Quieres darte de baja de esta salida?')) return;
      if (esperando) return;
      esperando = true; boton.disabled = true;
      try {
        const data = await api('clubInscripciones', { method:'POST', body: JSON.stringify({
          action: ruta.apuntado ? 'salir' : 'apuntar', rutaId: Number(ruta.id)
        })});
        mostrar(data.mensaje);
        await cargar();
      } catch(e) { mostrar(e.message); boton.disabled = false; }
      finally { esperando = false; }
    });
    acciones.append(boton);
    if (administrador) {
      const cancelar = nodo('button', 'rutas-btn rutas-btn--ghost', 'Cancelar salida');
      cancelar.type='button';
      cancelar.addEventListener('click', async () => {
        if (!window.confirm('¿Cancelar esta salida? Dejará de aparecer en el listado.')) return;
        if (esperando) return;
        esperando = true; cancelar.disabled=true;
        try { await api('clubRutas', { method:'POST', body:JSON.stringify({ action:'cancelar', rutaId:Number(ruta.id) }) });
          mostrar('Salida cancelada. Informa a los participantes por los canales del club.'); await cargar(); }
        catch(e){ mostrar(e.message); cancelar.disabled=false; } finally { esperando=false; }
      });
      acciones.append(cancelar);
    }
    card.append(acciones);
    return card;
  }
  async function cargar() {
    const solicitud = ++version;
    try {
      const data = await api('clubRutas');
      if (solicitud !== version) return;
      lista.replaceChildren();
      $('rutas-admin').hidden = !data.administrador;
      if (!Array.isArray(data.rutas)) throw new Error('Respuesta inesperada');
      if (!data.rutas.length) { mostrar('Todavía no hay salidas programadas.'); return; }
      const frag = document.createDocumentFragment();
      data.rutas.forEach(r => frag.append(tarjeta(r, data.administrador)));
      lista.append(frag);
      mostrar(`${data.rutas.length} ${data.rutas.length===1?'salida disponible':'salidas disponibles'}.`);
    } catch (error) {
      if (solicitud !== version) return;
      $('rutas-admin').hidden=true; lista.replaceChildren();
      mostrar('No se pudieron cargar las salidas: ' + error.message);
    }
  }
  $('rutas-form').addEventListener('submit', async event => {
    event.preventDefault();
    if (esperando) return;
    const local = $('ruta-fecha').value;
    const fecha = new Date(local);
    if (!local || Number.isNaN(fecha.getTime())) { $('rutas-admin-estado').textContent='Fecha incorrecta'; return; }
    const rawKm = $('ruta-km').value.trim();
    const payload = {
      action:'crear', titulo:$('ruta-titulo').value.trim(), fecha:fecha.toISOString(), zona:$('ruta-zona').value.trim(),
      dificultad:$('ruta-nivel').value, kilometros: rawKm ? Number(rawKm) : null,
      plazas:Number($('ruta-plazas').value), terreno:$('ruta-terreno').value.trim(), encuentro:$('ruta-encuentro').value.trim()
    };
    esperando=true; $('rutas-crear').disabled=true;
    try { await api('clubRutas',{method:'POST',body:JSON.stringify(payload)});
      $('rutas-form').reset(); $('rutas-admin-estado').textContent='Salida creada correctamente.'; await cargar(); }
    catch(e){ $('rutas-admin-estado').textContent=e.message; }
    finally { esperando=false; $('rutas-crear').disabled=false; }
  });
  $('rutas-recargar').addEventListener('click', cargar);
  $('rutas-anio').textContent=new Date().getFullYear();
  window.onLoginSuccess = () => cargar();
  window.onLogout = () => { version++; lista.replaceChildren(); $('rutas-admin').hidden=true; mostrar('Has cerrado sesión. Actualizando listado público…'); cargar(); };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState==='visible') { window.renderAuthButton?.(); cargar(); }
  });
  cargar();
})();
