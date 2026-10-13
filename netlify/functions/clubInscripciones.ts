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
      const result = await sql`SELECT public.club_apuntarse_v2(${rutaId},${userId}) AS estado`;
      const estado = result[0]?.estado;
      if (estado === 'inscrito') return json(200,{mensaje:'Inscripción confirmada'});
      if (estado === 'espera') return json(200,{mensaje:'Estás en lista de espera. Te avisaremos dentro de la web si consigues plaza.'});
      if (estado === 'ya_inscrito') return json(200,{mensaje:'Ya estabas inscrito'});
      if (estado === 'ya_esperando') return json(200,{mensaje:'Ya estás en lista de espera'});
      throw new ApiError(404,'Salida no disponible');
    }
    if (body.action === 'salir') {
      const result = await sql`SELECT public.club_salir_v2(${rutaId},${userId}) AS estado`;
      if (result[0]?.estado === 'baja') return json(200,{mensaje:'Te has dado de baja'});
      if (result[0]?.estado === 'salio_espera') return json(200,{mensaje:'Has salido de la lista de espera'});
      throw new ApiError(404,'No estás apuntado ni en espera');
    }
    throw new ApiError(400,'Acción no válida');
  } catch(e){return handleError(e);}
};
