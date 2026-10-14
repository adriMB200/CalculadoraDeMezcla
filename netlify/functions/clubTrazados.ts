import type { Handler } from '@netlify/functions';
import { neon } from '@netlify/neon';
import { ApiError, json, handleError, readBody, positiveId, stringField } from '../shared/security';
import { requireActiveUser, isAdmin, limit } from '../shared/accountSecurity';

// El cliente nunca decide qué geometrías privadas puede consultar.
const niv = ['facil','media','alta'];
function coordenadas(value: unknown): [number, number][] {
  if (!Array.isArray(value) || value.length < 2 || value.length > 400)
    throw new ApiError(400, 'El trazado debe tener entre 2 y 400 puntos');
  return value.map((p: unknown) => {
    if (!Array.isArray(p) || p.length !== 2 || !p.every(x => typeof x === 'number' && Number.isFinite(x)))
      throw new ApiError(400,'Punto geográfico no válido');
    const [lat, lng] = p as number[];
    // Península, Baleares y Canarias. No implica que exista una vía autorizada.
    if (lat < 27 || lat > 45 || lng < -19 || lng > 5) throw new ApiError(400,'Puntos fuera del ámbito de España');
    return [lat, lng];
  });
}
function distanciaKm(points: [number, number][]): number {
  let km = 0;
  for (let i=1;i<points.length;i++) {
    const [a,b]=points[i-1], [c,d]=points[i];
    const ra=a*Math.PI/180, rc=c*Math.PI/180;
    const delta1=(c-a)*Math.PI/180, delta2=(d-b)*Math.PI/180;
    const h=Math.sin(delta1/2)**2+Math.cos(ra)*Math.cos(rc)*Math.sin(delta2/2)**2;
    km += 12742 * Math.asin(Math.min(1,Math.sqrt(h)));
    if (km > 500) throw new ApiError(400,'Recorrido demasiado largo (máximo 500 km)');
  }
  if (km < .05) throw new ApiError(400,'El trazado debe medir al menos 50 metros');
  return Math.round(km*100)/100;
}
function wikiloc(value: unknown): string | null {
  if (!value) return null;
  if (typeof value !== 'string' || value.length > 400) throw new ApiError(400,'Enlace Wikiloc no válido');
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:' || !['wikiloc.com','www.wikiloc.com'].includes(u.hostname) || u.username || u.password)
      throw new Error('host');
    return u.toString();
  } catch { throw new ApiError(400,'Solo se admiten enlaces HTTPS de Wikiloc'); }
}
async function currentUser(event: Parameters<Handler>[0]): Promise<number> {
  return (event.headers?.authorization || event.headers?.Authorization) ? requireActiveUser(event) : 0;
}
export const handler: Handler = async event => {
 try {
  if (!['GET','POST'].includes(event.httpMethod)) throw new ApiError(405,'Método no permitido');
  const uid = await currentUser(event), admin = uid > 0 && isAdmin(uid);
  const sql = neon();
  if (event.httpMethod === 'GET') {
    // Solo se devuelven geometrías de trazados publicados y públicos, de participantes
    // efectivamente inscritos, del autor o de un administrador. La lista de espera no concede acceso.
    const rows = await sql`
      SELECT t.id,t.titulo,t.provincia,t.dificultad,t.descripcion,t.distancia_km,
             t.estado,t.acceso,t.salida_id,t.wikiloc_url,t.creado_en,
             t.autor_id = ${uid} AS es_autor,
             CASE WHEN (${admin}) OR t.autor_id=${uid}
                       OR (t.estado='publicado' AND t.acceso='publico')
                       OR (t.estado='publicado' AND t.acceso='inscritos' AND EXISTS
                           (SELECT 1 FROM public.club_inscripciones i JOIN public.club_rutas r ON r.id=i.ruta_id WHERE i.ruta_id=t.salida_id AND i.usuario_id=${uid} AND r.estado='publicada'))
                  THEN t.puntos ELSE NULL END AS puntos
      FROM public.club_trazados t
      WHERE (t.estado='publicado' AND t.acceso='publico')
            OR (${uid} > 0 AND t.autor_id=${uid})
            OR (${admin})
            OR (t.estado='publicado' AND t.acceso='inscritos' AND EXISTS
                (SELECT 1 FROM public.club_inscripciones i JOIN public.club_rutas r ON r.id=i.ruta_id WHERE i.ruta_id=t.salida_id AND i.usuario_id=${uid} AND r.estado='publicada'))
      ORDER BY t.creado_en DESC LIMIT 120`;
    return json(200,{trazados:rows, administrador:admin});
  }
  if (!uid) throw new ApiError(401,'Debes iniciar sesión');
  const b = readBody(event);
  if (b.action === 'crear') {
    await limit(`trazados:${uid}`,10,1440);
    if (b.confirmacionLegal !== true) throw new ApiError(400,'Confirma que puedes compartir el trazado y que requiere revisión legal');
    const points=coordenadas(b.puntos), km=distanciaKm(points);
    const titulo=stringField(b.titulo,'Título',100,4), provincia=stringField(b.provincia,'Provincia',70,2),
          descripcion=stringField(b.descripcion,'Descripción',1000,10), dificultad=String(b.dificultad);
    if (!niv.includes(dificultad)) throw new ApiError(400,'Dificultad incorrecta');
    const url=wikiloc(b.wikiloc_url);
    const result=await sql`INSERT INTO public.club_trazados
       (autor_id,titulo,provincia,dificultad,descripcion,distancia_km,puntos,wikiloc_url)
       VALUES (${uid},${titulo},${provincia},${dificultad},${descripcion},${km},${JSON.stringify(points)}::jsonb,${url})
       RETURNING id`;
    return json(201,{mensaje:'Propuesta enviada a moderación. El recorrido sigue privado.',id:result[0].id});
  }
  const id=positiveId(b.id,'Trazado');
  if (b.action === 'eliminar') {
    const rows=await sql`DELETE FROM public.club_trazados
      WHERE id=${id} AND (autor_id=${uid} AND estado<>'publicado' OR ${admin}) RETURNING id`;
    if (!rows.length) throw new ApiError(404,'No puedes eliminar ese trazado');
    return json(200,{mensaje:'Trazado eliminado'});
  }
  if (!admin) throw new ApiError(403,'Solo administradores');
  if (b.action === 'rechazar') {
    const rows=await sql`UPDATE public.club_trazados SET estado='rechazado', revisado_por=${uid},revisado_en=NOW()
      WHERE id=${id} AND estado='pendiente' RETURNING id`;
    if (!rows.length) throw new ApiError(404,'Propuesta no disponible');
    return json(200,{mensaje:'Propuesta rechazada'});
  }
  if (b.action !== 'aprobar') throw new ApiError(400,'Acción desconocida');
  const acceso=String(b.acceso);
  if (!['publico','inscritos'].includes(acceso)) throw new ApiError(400,'Acceso incorrecto');
  const salidaId=b.salidaId === null || b.salidaId === '' || b.salidaId === undefined ? null : positiveId(b.salidaId,'Salida');
  if (acceso === 'inscritos' && !salidaId) throw new ApiError(400,'El acceso para inscritos exige una salida vinculada');
  if (salidaId) {
    const rs=await sql`SELECT id FROM public.club_rutas WHERE id=${salidaId} AND estado='publicada' LIMIT 1`;
    if (!rs.length) throw new ApiError(400,'La salida vinculada no existe o está cancelada');
  }
  const rows=await sql`UPDATE public.club_trazados SET estado='publicado', acceso=${acceso}, salida_id=${salidaId},
      revisado_por=${uid}, revisado_en=NOW()
      WHERE id=${id} AND estado='pendiente' RETURNING id`;
  if (!rows.length) throw new ApiError(404,'Propuesta no disponible');
  return json(200,{mensaje:acceso==='publico'?'Trazado público aprobado':'Trazado aprobado solo para participantes'});
 } catch (error) { return handleError(error); }
};
