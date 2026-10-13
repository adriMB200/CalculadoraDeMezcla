import type { Handler } from '@netlify/functions';
import { neon } from '@netlify/neon';
import { ApiError, requireUser, readBody, positiveId, stringField, json, handleError } from '../shared/security';

const esAdmin = (id: number) => (process.env.ENDURO_ADMIN_IDS || '').split(',').some(x => /^\d+$/.test(x.trim()) && Number(x.trim()) === id);
function userOptional(event: Parameters<typeof requireUser>[0]): number | null {
  if (!(event.headers?.authorization || event.headers?.Authorization)) return null;
  return requireUser(event);
}
function textoSeguro(v: unknown, nombre: string, min: number, max: number): string {
  const valor = stringField(v, nombre, max, min);
  // Información de contacto no debe quedar indexada en público.
  if (/(?:[a-z\d._%+-]+@[a-z\d.-]+\.[a-z]{2,})|(?:\+?34[\s.-]*)?[6789](?:[\s.-]*\d){8}/i.test(valor))
    throw new ApiError(400, `${nombre}: no publiques teléfono ni correo; usa los mensajes privados`);
  return valor;
}
function numero(v: unknown, name: string, max = 10_000_000): number {
  if (typeof v !== 'number' || !Number.isSafeInteger(v) || v < 0 || v > max)
    throw new ApiError(400, `${name} incorrecto`);
  return v;
}
function categoria(v: unknown): string {
  if (!['motos', 'recambios', 'equipacion', 'herramientas', 'otros'].includes(String(v)))
    throw new ApiError(400, 'Categoría no válida');
  return String(v);
}
function condicion(v: unknown): string {
  if (!['nuevo', 'usado'].includes(String(v))) throw new ApiError(400, 'Estado del artículo no válido');
  return String(v);
}

export const handler: Handler = async event => {
 try {
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') throw new ApiError(405, 'Método no permitido');
  const sql = neon();
  if (event.httpMethod === 'GET') {
   const scope = event.queryStringParameters?.scope || 'publicos';
   if (scope === 'publicos') {
    const filtro = event.queryStringParameters?.categoria || 'todas';
    if (filtro !== 'todas') categoria(filtro);
    const rows = await sql`SELECT id,titulo,descripcion,categoria,condicion,precio_centimos,zona,creado_en
      FROM public.merc_anuncios WHERE estado='activo' AND (${filtro}='todas' OR categoria=${filtro})
      ORDER BY creado_en DESC,id DESC LIMIT 60`;
    return json(200,{anuncios:rows});
   }
   const uid = requireUser(event);
   if (scope === 'mios') {
    const rows = await sql`SELECT id,titulo,descripcion,categoria,condicion,precio_centimos,zona,estado,motivo_revision,creado_en
      FROM public.merc_anuncios WHERE vendedor_id=${uid} ORDER BY creado_en DESC LIMIT 100`;
    return json(200,{anuncios:rows});
   }
   if (scope === 'pendientes') {
    if (!esAdmin(uid)) throw new ApiError(403,'Solo administradores');
    const anuncios = await sql`SELECT id,titulo,descripcion,categoria,condicion,precio_centimos,zona,creado_en
      FROM public.merc_anuncios WHERE estado='pendiente' ORDER BY creado_en ASC LIMIT 60`;
    const reportes = await sql`SELECT r.id,r.anuncio_id,r.motivo,r.creado_en,a.titulo,a.estado AS estado_anuncio
      FROM public.merc_reportes r JOIN public.merc_anuncios a ON a.id=r.anuncio_id
      WHERE r.estado='pendiente' ORDER BY r.creado_en ASC LIMIT 60`;
    return json(200,{anuncios,reportes});
   }
   if (scope === 'chats') {
    const rows = await sql`SELECT m.anuncio_id,a.titulo,
      CASE WHEN m.remitente_id=${uid} THEN m.destinatario_id ELSE m.remitente_id END AS contacto_id,
      MAX(m.creado_en) AS ultima
      FROM public.merc_mensajes m JOIN public.merc_anuncios a ON a.id=m.anuncio_id
      WHERE m.remitente_id=${uid} OR m.destinatario_id=${uid}
      GROUP BY m.anuncio_id,a.titulo,contacto_id ORDER BY ultima DESC LIMIT 60`;
    return json(200,{chats:rows});
   }
   if (scope === 'mensajes') {
    const id = positiveId(event.queryStringParameters?.anuncioId,'Anuncio');
    const contacto = positiveId(event.queryStringParameters?.contactoId,'Conversación');
    if (uid === contacto) throw new ApiError(400,'Conversación incorrecta');
    const rows = await sql`SELECT remitente_id,cuerpo,creado_en FROM public.merc_mensajes
      WHERE anuncio_id=${id} AND
      ((remitente_id=${uid} AND destinatario_id=${contacto}) OR
       (remitente_id=${contacto} AND destinatario_id=${uid}))
      ORDER BY creado_en ASC LIMIT 100`;
    // Solo devolvemos mensajes en los que el usuario autenticado participa.
    return json(200,{mensajes:rows});
   }
   throw new ApiError(400,'Consulta no válida');
  }

  const body = readBody(event);
  const action = String(body.action || '');
  if (action === 'denunciar') {
   const uid = userOptional(event);
   const anuncioId = positiveId(body.anuncioId,'Anuncio');
   const motivo = textoSeguro(body.motivo,'Motivo',15,500);
   // Acotamos el volumen de reportes anónimos; añadir rate limiting perimetral antes de producción.
   const inserted = await sql`INSERT INTO public.merc_reportes(anuncio_id,usuario_id,motivo)
     SELECT a.id,${uid},${motivo} FROM public.merc_anuncios a
     WHERE a.id=${anuncioId} AND a.estado='activo'
       AND (SELECT COUNT(*) FROM public.merc_reportes r
            WHERE r.anuncio_id=a.id AND r.creado_en>now()-INTERVAL '1 day') < 25
     RETURNING id`;
   if (!inserted.length) throw new ApiError(429,'No es posible recibir más avisos sobre este anuncio ahora');
   return json(201,{mensaje:'Aviso recibido para revisión. Gracias.'});
  }

  const uid = requireUser(event);
  if (action === 'crear') {
   const titulo = textoSeguro(body.titulo,'Título',8,100);
   const descripcion = textoSeguro(body.descripcion,'Descripción',20,1000);
   const zona = textoSeguro(body.zona,'Zona aproximada',2,70);
   const tipo = categoria(body.categoria),estadoArticulo=condicion(body.condicion);
   const precio = numero(body.precioCentimos,'Precio');
   const limite = await sql`SELECT count(*)::int AS total FROM public.merc_anuncios
     WHERE vendedor_id=${uid} AND estado IN ('pendiente','activo')`;
   if (Number(limite[0]?.total) >= 5) throw new ApiError(429,'Máximo cinco anuncios activos o pendientes');
   const inserted = await sql`INSERT INTO public.merc_anuncios
     (vendedor_id,titulo,descripcion,zona,categoria,condicion,precio_centimos)
     VALUES (${uid},${titulo},${descripcion},${zona},${tipo},${estadoArticulo},${precio}) RETURNING id`;
   return json(201,{mensaje:'Anuncio enviado a moderación. No es público todavía.',id:inserted[0].id});
  }
  if (action === 'estado') {
   const id = positiveId(body.anuncioId,'Anuncio');
   if (!['vendido','retirado'].includes(String(body.estado))) throw new ApiError(400,'Estado no permitido');
   const destino = String(body.estado);
   const rows = await sql`UPDATE public.merc_anuncios SET estado=${destino},actualizado_en=now()
     WHERE id=${id} AND vendedor_id=${uid} AND estado IN ('pendiente','activo') RETURNING id`;
   if (!rows.length) throw new ApiError(404,'Anuncio no disponible en tu cuenta');
   return json(200,{mensaje:destino==='vendido'?'Anuncio marcado como vendido':'Anuncio retirado'});
  }
  if (action === 'moderar') {
   if (!esAdmin(uid)) throw new ApiError(403,'Solo administradores');
   const id = positiveId(body.anuncioId,'Anuncio');
   if (!['aprobar','rechazar','retirar'].includes(String(body.decision))) throw new ApiError(400,'Decisión incorrecta');
   const decision = String(body.decision);
   const motivo = decision==='aprobar' ? null : stringField(body.motivo,'Motivo de moderación',250,8);
   const nuevoEstado = decision==='aprobar'?'activo':decision==='rechazar'?'rechazado':'retirado';
   const rows = await sql`UPDATE public.merc_anuncios SET estado=${nuevoEstado},motivo_revision=${motivo},
     moderado_por=${uid},moderado_en=now(),actualizado_en=now() WHERE id=${id}
     AND (${decision}='retirar' AND estado='activo' OR ${decision}<>'retirar' AND estado='pendiente') RETURNING id`;
   if (!rows.length) throw new ApiError(404,'Anuncio no disponible para moderar');
   return json(200,{mensaje:'Decisión de moderación guardada'});
  }
  if (action === 'revisarDenuncia') {
   if (!esAdmin(uid)) throw new ApiError(403,'Solo administradores');
   const id=positiveId(body.id,'Denuncia');
   const rows=await sql`UPDATE public.merc_reportes SET estado='revisado',revisado_en=now(),revisor_id=${uid}
     WHERE id=${id} AND estado='pendiente' RETURNING id`;
   if (!rows.length) throw new ApiError(404,'Denuncia no encontrada');
   return json(200,{mensaje:'Denuncia revisada'});
  }
  if (action === 'mensaje') {
   const id=positiveId(body.anuncioId,'Anuncio');
   const contenido=stringField(body.mensaje,'Mensaje',1000,5);
   const rows=await sql`SELECT vendedor_id,estado FROM public.merc_anuncios WHERE id=${id}`;
   const item=rows[0];
   if (!item||!['activo','vendido'].includes(String(item.estado))) throw new ApiError(404,'Anuncio no disponible');
   const seller=Number(item.vendedor_id);
   let destino:number;
   if (uid !== seller) {
     if (item.estado!=='activo') throw new ApiError(409,'El artículo ya no está disponible');
     destino=seller;
   } else {
     destino=positiveId(body.contactoId,'Destinatario');
     const prev=await sql`SELECT id FROM public.merc_mensajes WHERE anuncio_id=${id}
       AND remitente_id=${destino} AND destinatario_id=${uid} LIMIT 1`;
     if(!prev.length)throw new ApiError(403,'No existe una consulta previa del comprador');
   }
   const count=await sql`SELECT count(*)::int AS total FROM public.merc_mensajes
     WHERE remitente_id=${uid} AND creado_en>now()-INTERVAL '24 hours'`;
   if (Number(count[0]?.total)>=20)throw new ApiError(429,'Límite diario de mensajes alcanzado');
   await sql`INSERT INTO public.merc_mensajes(anuncio_id,remitente_id,destinatario_id,cuerpo)
     VALUES (${id},${uid},${destino},${contenido})`;
   return json(201,{mensaje:'Mensaje privado enviado'});
  }
  throw new ApiError(400,'Acción no válida');
 } catch(error) { return handleError(error); }
};
