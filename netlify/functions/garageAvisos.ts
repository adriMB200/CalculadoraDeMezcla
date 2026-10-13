import type { Handler } from '@netlify/functions';
import { neon } from '@netlify/neon';
import { ApiError, readBody, json, handleError } from '../shared/security';
import { requireActiveUser } from '../shared/accountSecurity';

// Todas las consultas se filtran con usuario_id extraído del JWT VERIFICADO.
// No se confía nunca en un ID de usuario enviado por el navegador.
const CATEGORIAS = new Set([
  'aceite_motor','aceite_caja','filtro_aire','piston','transmision',
  'refrigerante','bujia','frenos','otros'
]);
type Registro = Record<string, unknown>;
function referencia(value: unknown): string {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{3,20}$/.test(value)) {
    throw new ApiError(400, 'Identificador de moto no válido');
  }
  return value.toUpperCase();
}
function entero(value: unknown, nombre: string, minimo: number, maximo: number): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < minimo || value > maximo) {
    throw new ApiError(400, `${nombre} no válido`);
  }
  return value;
}
function unidad(value: unknown): 'h' | 'km' {
  if (value !== 'h' && value !== 'km') throw new ApiError(400, 'Unidad no válida');
  return value;
}
function categoria(value: unknown): string {
  if (typeof value !== 'string' || !CATEGORIAS.has(value)) {
    throw new ApiError(400, 'Categoría no válida');
  }
  return value;
}

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
      throw new ApiError(405, 'Método no permitido');
    }
    const userId = await requireActiveUser(event);
    const sql = neon();

    if (event.httpMethod === 'GET') {
      const lecturas = await sql`
        SELECT l.matricula, l.horas_actuales, l.kilometros_actuales
        FROM public.garage_lecturas AS l
        INNER JOIN public.motos AS m ON m.matricula = l.matricula
        WHERE l.usuario_id = ${userId} AND m.usuario_id = ${userId}
        ORDER BY l.matricula
      `;
      const reglas = await sql`
        SELECT r.matricula, r.categoria, r.unidad, r.intervalo, r.ultima_lectura
        FROM public.garage_recordatorios AS r
        INNER JOIN public.motos AS m ON m.matricula = r.matricula
        WHERE r.usuario_id = ${userId} AND m.usuario_id = ${userId}
        ORDER BY r.matricula, r.categoria, r.unidad
      `;
      return json(200, { lecturas, reglas });
    }

    const body: Registro = readBody(event);
    const action = body.action;
    if (!['guardarLectura','guardarRegla','eliminarRegla','marcarRealizado','registrarYAnotar'].includes(String(action))) {
      throw new ApiError(400, 'Acción no válida');
    }
    const matricula = referencia(body.matricula);
    const [moto] = await sql`
      SELECT matricula FROM public.motos
      WHERE matricula = ${matricula} AND usuario_id = ${userId}
    `;
    if (!moto) throw new ApiError(404, 'Moto no encontrada');

    if (action === 'guardarLectura') {
      const hayHoras = Object.prototype.hasOwnProperty.call(body, 'horas');
      const hayKm = Object.prototype.hasOwnProperty.call(body, 'kilometros');
      if (!hayHoras && !hayKm) throw new ApiError(400, 'Introduce una lectura');
      const horas = hayHoras ? entero(body.horas, 'Horas', 0, 1000000) : null;
      const kilometros = hayKm ? entero(body.kilometros, 'Kilómetros', 0, 10000000) : null;
      const [previa] = await sql`
        SELECT horas_actuales, kilometros_actuales
        FROM public.garage_lecturas WHERE matricula = ${matricula} AND usuario_id = ${userId}
      `;
      if (horas !== null && previa?.horas_actuales !== null && previa?.horas_actuales !== undefined && horas < Number(previa.horas_actuales)) {
        throw new ApiError(400, 'La lectura de horas no puede disminuir. Contacta con el administrador si has cambiado el contador.');
      }
      if (kilometros !== null && previa?.kilometros_actuales !== null && previa?.kilometros_actuales !== undefined && kilometros < Number(previa.kilometros_actuales)) {
        throw new ApiError(400, 'La lectura de kilómetros no puede disminuir. Contacta con el administrador si has cambiado el contador.');
      }
      const maximos = await sql`
        SELECT unidad, MAX(ultima_lectura) AS max_ultima
        FROM public.garage_recordatorios
        WHERE matricula = ${matricula} AND usuario_id = ${userId}
        GROUP BY unidad
      `;
      for (const row of maximos) {
        if ((row.unidad === 'h' && horas !== null && horas < Number(row.max_ultima)) ||
            (row.unidad === 'km' && kilometros !== null && kilometros < Number(row.max_ultima))) {
          throw new ApiError(400, 'La lectura es anterior a un mantenimiento configurado. Revisa los datos.');
        }
      }
      const resultado = await sql`
        INSERT INTO public.garage_lecturas (matricula, usuario_id, horas_actuales, kilometros_actuales)
        SELECT m.matricula, ${userId}, ${horas}, ${kilometros}
        FROM public.motos AS m
        WHERE m.matricula = ${matricula} AND m.usuario_id = ${userId}
        ON CONFLICT (matricula) DO UPDATE SET
          horas_actuales = COALESCE(EXCLUDED.horas_actuales, garage_lecturas.horas_actuales),
          kilometros_actuales = COALESCE(EXCLUDED.kilometros_actuales, garage_lecturas.kilometros_actuales),
          actualizado_en = NOW()
        WHERE garage_lecturas.usuario_id = ${userId}
        RETURNING matricula
      `;
      if (!resultado.length) throw new ApiError(404, 'Moto no encontrada');
      return json(200, { message: 'Lecturas guardadas' });
    }

    const cat = categoria(body.categoria);
    const un = unidad(body.unidad);
    if (action === 'guardarRegla') {
      const intervalo = entero(body.intervalo, 'Intervalo', 1, 1000000);
      const ultima = entero(body.ultima_lectura, 'Última lectura', 0, un === 'h' ? 1000000 : 10000000);
      const [lectura] = await sql`
        SELECT horas_actuales, kilometros_actuales
        FROM public.garage_lecturas
        WHERE matricula = ${matricula} AND usuario_id = ${userId}
      `;
      const actual = un === 'h' ? lectura?.horas_actuales : lectura?.kilometros_actuales;
      if (actual !== null && actual !== undefined && ultima > Number(actual)) {
        throw new ApiError(400, 'El último mantenimiento no puede ser posterior a la lectura actual');
      }
      const resultado = await sql`
        INSERT INTO public.garage_recordatorios
          (matricula, usuario_id, categoria, unidad, intervalo, ultima_lectura)
        SELECT m.matricula, ${userId}, ${cat}, ${un}, ${intervalo}, ${ultima}
        FROM public.motos AS m
        WHERE m.matricula = ${matricula} AND m.usuario_id = ${userId}
        ON CONFLICT (matricula, categoria, unidad) DO UPDATE SET
          intervalo = EXCLUDED.intervalo,
          ultima_lectura = EXCLUDED.ultima_lectura,
          actualizado_en = NOW()
        WHERE garage_recordatorios.usuario_id = ${userId}
        RETURNING matricula
      `;
      if (!resultado.length) throw new ApiError(404, 'Moto no encontrada');
      return json(200, { message: 'Recordatorio guardado' });
    }

    if (action === 'eliminarRegla') {
      const borrados = await sql`
        DELETE FROM public.garage_recordatorios AS r
        WHERE r.matricula = ${matricula}
          AND r.usuario_id = ${userId}
          AND r.categoria = ${cat} AND r.unidad = ${un}
          AND EXISTS (
            SELECT 1 FROM public.motos AS m
            WHERE m.matricula = r.matricula AND m.usuario_id = ${userId}
          )
        RETURNING matricula
      `;
      if (!borrados.length) throw new ApiError(404, 'Recordatorio no encontrado');
      return json(200, { message: 'Recordatorio eliminado' });
    }

    if (action === 'registrarYAnotar') {
      // Operación atómica: registra la actuación en el libro y actualiza el aviso.
      // El libro existente almacena HORAS (no kilómetros). Si una regla está en km,
      // se requiere asimismo una lectura real de horas, y se anotan los km en el texto.
      const operacion = body.operacion;
      if (typeof operacion !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(operacion)) {
        throw new ApiError(400, 'Identificador de operación no válido');
      }
      const nota = body.nota;
      if (typeof nota !== 'string' || nota.length > 500) {
        throw new ApiError(400, 'Nota no válida (máximo 500 caracteres)');
      }
      const etiquetas: Record<string, string> = {
        aceite_motor: 'Aceite motor', aceite_caja: 'Aceite de caja', filtro_aire: 'Filtro de aire',
        piston: 'Pistón', transmision: 'Transmisión', refrigerante: 'Refrigerante',
        bujia: 'Bujía', frenos: 'Frenos', otros: 'Otros'
      };
      const descripcion = `Mantenimiento ${etiquetas[cat]} registrado desde Mis avisos${nota.trim() ? ': ' + nota.trim() : ''}`;
      // Una única sentencia SQL, con protección contra reintentos duplicados.
      // Las filas se bloquean y el INSERT solo se realiza si el UPDATE prospera.
      const guardado = await sql`
        WITH autorizada AS MATERIALIZED (
          SELECT r.matricula, r.categoria, r.unidad, l.horas_actuales,
                 l.kilometros_actuales,
                 CASE WHEN r.unidad = 'h' THEN l.horas_actuales ELSE l.kilometros_actuales END AS lectura_regla
          FROM public.garage_recordatorios r
          JOIN public.motos m ON m.matricula = r.matricula
          JOIN public.garage_lecturas l ON l.matricula = r.matricula
          WHERE r.matricula = ${matricula}
            AND r.usuario_id = ${userId} AND m.usuario_id = ${userId}
            AND l.usuario_id = ${userId}
            AND r.categoria = ${cat} AND r.unidad = ${un}
            AND l.horas_actuales IS NOT NULL
            AND (CASE WHEN r.unidad = 'h' THEN l.horas_actuales ELSE l.kilometros_actuales END) IS NOT NULL
          FOR UPDATE OF r
        ),
        deduplicado AS (
          INSERT INTO public.garage_operaciones (usuario_id, operacion_id, matricula)
          SELECT ${userId}, ${operacion}::uuid, a.matricula FROM autorizada a
          ON CONFLICT (usuario_id, operacion_id) DO NOTHING
          RETURNING matricula
        ),
        actualizado AS (
          UPDATE public.garage_recordatorios r
          SET ultima_lectura = a.lectura_regla, actualizado_en = NOW()
          FROM autorizada a JOIN deduplicado d ON d.matricula = a.matricula
          WHERE r.matricula = a.matricula AND r.usuario_id = ${userId}
            AND r.categoria = ${cat} AND r.unidad = ${un}
          RETURNING r.matricula, r.ultima_lectura
        ),
        anotado AS (
          INSERT INTO public.mantenimientos (matricula, descripcion, horas)
          SELECT a.matricula,
                 CASE WHEN ${un} = 'km'
                   THEN (${descripcion} || ' · Lectura: ' || a.ultima_lectura || ' km')
                   ELSE ${descripcion} END,
                 l.horas_actuales
          FROM actualizado a
          JOIN public.garage_lecturas l ON l.matricula = a.matricula AND l.usuario_id = ${userId}
          RETURNING matricula
        )
        SELECT matricula FROM anotado
      `;
      if (!guardado.length) {
        throw new ApiError(409, 'La operación ya se registró o falta una lectura actual de horas/kilómetros. No se ha duplicado el historial.');
      }
      return json(200, { message: 'Mantenimiento registrado y aviso actualizado' });
    }

    // "Marcar realizado" usa la lectura actual guardada en Neon;
    // NO cambia ni inventa registros del libro de mantenimientos existente.
    const marcados = await sql`
      UPDATE public.garage_recordatorios AS r
      SET ultima_lectura = CASE WHEN r.unidad = 'h'
        THEN l.horas_actuales ELSE l.kilometros_actuales END,
        actualizado_en = NOW()
      FROM public.motos AS m
      INNER JOIN public.garage_lecturas AS l ON l.matricula = m.matricula
      WHERE r.matricula = m.matricula
        AND r.matricula = ${matricula}
        AND r.usuario_id = ${userId}
        AND m.usuario_id = ${userId}
        AND l.usuario_id = ${userId}
        AND r.categoria = ${cat} AND r.unidad = ${un}
        AND (CASE WHEN r.unidad = 'h'
             THEN l.horas_actuales ELSE l.kilometros_actuales END) >= r.ultima_lectura
      RETURNING r.matricula
    `;
    if (!marcados.length) throw new ApiError(409, 'No hay lectura actual o recordatorio disponible');
    return json(200, { message: 'Mantenimiento marcado como realizado' });
  } catch (error) {
    return handleError(error);
  }
};
