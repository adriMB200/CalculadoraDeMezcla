import type { Handler } from '@netlify/functions';
import { neon } from '@netlify/neon';
import { ApiError, requireUser, requireMethod, readBody, stringField, positiveId, json, handleError } from '../shared/security';

// IDs obtenidos de public.usuarios y configurados SOLO en las variables de Netlify.
const esAdmin = (id: number) => {
  const lista = process.env.ENDURO_ADMIN_IDS || '';
  return lista.split(',').map(x => x.trim()).filter(x => /^[1-9]\d*$/.test(x)).some(x => Number(x) === id);
};
const numero = (v: unknown, nombre: string, minimo: number, maximo: number) => {
  if (typeof v !== 'number' || !Number.isSafeInteger(v) || v < minimo || v > maximo) {
    throw new ApiError(400, `${nombre} fuera de rango`);
  }
  return v;
};
export const handler: Handler = async event => {
  try {
    if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') throw new ApiError(405, 'Método no permitido');
    const sql = neon();
    if (event.httpMethod === 'GET') {
      // Anónimo = datos públicos. Un token inválido NUNCA permite ver encuentros.
      let userId = 0;
      if (event.headers?.authorization || event.headers?.Authorization) userId = requireUser(event);
      const rows = await sql`
        SELECT r.id, r.titulo, r.fecha_salida, r.zona, r.dificultad,
               r.kilometros, r.terreno, r.plazas,
               (SELECT COUNT(*)::integer FROM public.club_inscripciones i WHERE i.ruta_id = r.id) AS inscritos,
               EXISTS (SELECT 1 FROM public.club_inscripciones i WHERE i.ruta_id = r.id AND i.usuario_id = ${userId}) AS apuntado,
               CASE WHEN EXISTS (SELECT 1 FROM public.club_inscripciones i WHERE i.ruta_id = r.id AND i.usuario_id = ${userId})
                 THEN r.encuentro ELSE NULL END AS encuentro
        FROM public.club_rutas r
        WHERE r.estado = 'publicada' AND r.fecha_salida > NOW()
        ORDER BY r.fecha_salida ASC LIMIT 40
      `;
      return json(200, { rutas: rows, administrador: esAdmin(userId) });
    }
    requireMethod(event,'POST');
    const userId = requireUser(event);
    if (!esAdmin(userId)) throw new ApiError(403, 'Solo administradores pueden gestionar salidas');
    const body = readBody(event);
    if (body.action === 'cancelar') {
      const id = positiveId(body.rutaId,'Ruta');
      const changed = await sql`UPDATE public.club_rutas SET estado='cancelada'
        WHERE id=${id} AND estado='publicada' RETURNING id`;
      if (!changed.length) throw new ApiError(404, 'Ruta no encontrada');
      return json(200, { mensaje: 'Ruta cancelada' });
    }
    if (body.action !== 'crear') throw new ApiError(400, 'Acción no válida');
    const titulo = stringField(body.titulo,'Título',100,4);
    const zona = stringField(body.zona,'Zona',100,3);
    const terreno = stringField(body.terreno,'Terreno',140,3);
    const encuentro = stringField(body.encuentro,'Punto de encuentro',300,4);
    if (!['facil','media','alta'].includes(String(body.dificultad))) throw new ApiError(400,'Dificultad no válida');
    const dificultad = String(body.dificultad);
    const plazas = numero(body.plazas,'Plazas',1,100);
    const kilometros = body.kilometros === null ? null : numero(body.kilometros,'Kilómetros',1,1000);
    if (typeof body.fecha !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(body.fecha)) {
      throw new ApiError(400,'Fecha ISO no válida');
    }
    const fecha = new Date(body.fecha);
    if (Number.isNaN(fecha.getTime()) || fecha.getTime() < Date.now() + 5 * 60_000 || fecha.getTime() > Date.now() + 366 * 86400_000) {
      throw new ApiError(400,'La fecha debe estar entre 5 minutos y un año desde ahora');
    }
    const created = await sql`
      INSERT INTO public.club_rutas(titulo,fecha_salida,zona,dificultad,kilometros,terreno,plazas,encuentro,creador_id)
      VALUES (${titulo},${fecha.toISOString()},${zona},${dificultad},${kilometros},${terreno},${plazas},${encuentro},${userId}) RETURNING id
    `;
    return json(201, { mensaje: 'Salida creada', id: created[0].id });
  } catch(e) { return handleError(e); }
};
