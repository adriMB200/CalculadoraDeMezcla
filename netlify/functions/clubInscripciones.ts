import type { Handler } from '@netlify/functions';
import { neon } from '@netlify/neon';
import { ApiError, requireUser, requireMethod, readBody, positiveId, json, handleError } from '../shared/security';

export const handler: Handler = async event => {
  try {
    requireMethod(event, 'POST');
    const userId = requireUser(event);
    const body = readBody(event);
    const rutaId = positiveId(body.rutaId, 'Ruta');
    const sql = neon();
    if (body.action === 'apuntar') {
      // No se confía en conteos o usuario_id remitidos por el navegador.
      const result = await sql`SELECT public.club_apuntarse(${rutaId},${userId}) AS estado`;
      switch (result[0]?.estado) {
        case 'inscrito': return json(200, { mensaje: 'Inscripción confirmada' });
        case 'ya_inscrito': return json(200, { mensaje: 'Ya estabas inscrito' });
        case 'completa': throw new ApiError(409, 'No quedan plazas');
        default: throw new ApiError(404, 'Salida no disponible');
      }
    }
    if (body.action === 'salir') {
      const deleted = await sql`DELETE FROM public.club_inscripciones
        WHERE ruta_id=${rutaId} AND usuario_id=${userId} RETURNING ruta_id`;
      if (!deleted.length) throw new ApiError(404, 'No tienes una inscripción activa');
      return json(200, { mensaje: 'Te has dado de baja' });
    }
    throw new ApiError(400, 'Acción no válida');
  } catch(e) { return handleError(e); }
};
