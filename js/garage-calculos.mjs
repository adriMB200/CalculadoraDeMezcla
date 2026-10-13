/** Cálculos locales. Solo sirven para presentar avisos: no son intervalos de fabricante. */
export function evaluarAviso(actual, ultima, intervalo) {
  if (actual === null || actual === undefined || actual === '' || !Number.isSafeInteger(Number(actual))) {
    return { tipo: 'sin-datos', texto: 'Falta lectura actual', restante: null, porcentaje: 0 };
  }
  const lectura = Number(actual);
  if (![lectura, ultima, intervalo].every(Number.isSafeInteger) || ultima < 0 || intervalo < 1 || lectura < ultima) {
    return { tipo: 'revisar', texto: 'Revisar lecturas', restante: null, porcentaje: 0 };
  }
  const transcurrido = lectura - ultima;
  const restante = intervalo - transcurrido;
  const porcentaje = Math.min(100, Math.max(0, Math.round(100 * transcurrido / intervalo)));
  if (restante <= 0) return {
    tipo: 'vencido', texto: restante === 0 ? 'Límite alcanzado' : 'Intervalo superado', restante, porcentaje
  };
  if (restante <= Math.max(1, Math.ceil(intervalo * 0.1))) return {
    tipo: 'proximo', texto: 'Próximo mantenimiento', restante, porcentaje
  };
  return { tipo: 'al-dia', texto: 'Dentro del intervalo', restante, porcentaje };
}
