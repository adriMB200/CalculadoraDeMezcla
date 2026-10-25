(() => {
  'use strict';
  const dialogo = document.getElementById('enduro-registro-dialog');
  if (!dialogo) return;
  const formulario = document.getElementById('enduro-registro-form');
  const descripcion = document.getElementById('enduro-registro-descripcion');
  const unidad = document.getElementById('enduro-registro-unidad');
  const lectura = document.getElementById('enduro-registro-lectura');
  const etiqueta = document.getElementById('enduro-registro-etiqueta');
  const estado = document.getElementById('enduro-registro-estado');
  const guardar = document.getElementById('enduro-registro-guardar');
  let matriculaActual = '';
  let recargar = null;
  let ocupado = false;

  function actualizarUnidad() {
    const km = unidad.value === 'km';
    etiqueta.textContent = km ? 'Kilómetros en el momento del mantenimiento' : 'Horas de motor en el momento del mantenimiento';
    lectura.max = km ? '10000000' : '1000000';
    lectura.placeholder = km ? 'Ej.: 8450' : 'Ej.: 125';
    lectura.value = '';
  }
  function cerrar() {
    if (ocupado) return;
    dialogo.close();
  }
  function abrir(matricula, alGuardar) {
    if (!dialogo.open) {
      formulario.reset();
      matriculaActual = String(matricula);
      recargar = alGuardar;
      estado.textContent = '';
      actualizarUnidad();
      dialogo.showModal();
      descripcion.focus();
    }
  }

  unidad.addEventListener('change', actualizarUnidad);
  document.getElementById('enduro-registro-cancelar').addEventListener('click', cerrar);
  dialogo.addEventListener('cancel', event => { if (ocupado) event.preventDefault(); });
  formulario.addEventListener('submit', async event => {
    event.preventDefault();
    if (ocupado || !formulario.reportValidity()) return;
    const valor = Number(lectura.value);
    if (!/^\d+$/.test(lectura.value.trim()) || !Number.isSafeInteger(valor) || valor < 0 || valor > Number(lectura.max)) {
      estado.textContent = 'Introduce un número entero válido para la unidad seleccionada.';
      return;
    }
    const token = typeof window.getToken === 'function' ? window.getToken() : null;
    if (!token) {
      estado.textContent = 'La sesión ha caducado. Inicia sesión nuevamente.';
      return;
    }
    ocupado = true;
    guardar.disabled = true;
    estado.textContent = 'Guardando mantenimiento…';
    try {
      const respuesta = await fetch('/.netlify/functions/addMantenimiento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          matricula: matriculaActual,
          descripcion: descripcion.value.trim(),
          unidad: unidad.value,
          lectura: valor
        })
      });
      const datos = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) throw new Error(datos.error || 'No se pudo registrar el mantenimiento');
      dialogo.close();
      if (typeof recargar === 'function') await recargar();
    } catch (error) {
      estado.textContent = error.message || 'No se pudo guardar';
    } finally {
      ocupado = false;
      guardar.disabled = false;
    }
  });
  window.EnduroRegistroMantenimiento = Object.freeze({ abrir });
})();
