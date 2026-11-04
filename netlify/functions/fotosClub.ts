import type { Handler } from '@netlify/functions';
import { neon } from '@netlify/neon';
import { ApiError,json,handleError,positiveId,stringField } from '../shared/security';
import { requireActiveUser,isAdmin,limit } from '../shared/accountSecurity';
import { decodeJpeg,normalizarJpg,fotosStore,fotoKey,readImageBody } from '../shared/fase13Images';

const maxFile=2_500_000;
export const handler:Handler=async event=>{
 try{
  const sql=neon();
  if(event.httpMethod==='GET'){
   const isModeracion=event.queryStringParameters?.moderacion==='1';
   if(isModeracion){const uid=await requireActiveUser(event);if(!isAdmin(uid))throw new ApiError(403,'Acceso restringido');}
   const rows=isModeracion
    ? await sql`SELECT id,titulo,autor_alias,descripcion,estado,creado_en FROM public.club_fotos WHERE estado IN ('pendiente','publicada') ORDER BY creado_en DESC LIMIT 100`
    : await sql`SELECT id,titulo,autor_alias,descripcion,creado_en FROM public.club_fotos WHERE estado='publicada' ORDER BY creado_en DESC LIMIT 90`;
   return json(200,{fotos:rows,administrador:isModeracion});
  }
  if(event.httpMethod!=='POST')throw new ApiError(405,'Método no permitido');
  const body=readImageBody(event.body);
  if(body.action==='aprobar'||body.action==='rechazar'||body.action==='eliminar'){
    const uid=await requireActiveUser(event);if(!isAdmin(uid))throw new ApiError(403,'Solo administradores');
    const id=positiveId(body.id,'Fotografía');
    const estado=body.action==='aprobar'?'publicada':'rechazada';
    const res=body.action==='eliminar'
      ? await sql`DELETE FROM public.club_fotos WHERE id=${id} RETURNING blob_key`
      : await sql`UPDATE public.club_fotos SET estado=${estado},revisado_por=${uid},revisado_en=now() WHERE id=${id} AND estado='pendiente' RETURNING blob_key`;
    if(!res.length)throw new ApiError(404,'Fotografía no disponible');
    if(body.action!=='aprobar'){await fotosStore().delete(res[0].blob_key).catch(()=>{});}
    return json(200,{mensaje:body.action==='aprobar'?'Fotografía publicada':'Fotografía retirada'});
  }
  if(body.action!=='subir')throw new ApiError(400,'Acción incorrecta');
  if(body.website)throw new ApiError(400,'Envío no aceptado');
  const ip=String(event.headers?.['x-nf-client-connection-ip']||'sin-ip').slice(0,100);
  await limit(`f13-foto-ip:${ip}`,4,60);
  await limit('f13-foto-global',30,1440);
  const titulo=stringField(body.titulo,'Título',85,3);
  const alias=stringField(body.alias,'Nombre público',40,2);
  const descripcion=typeof body.descripcion==='string'?body.descripcion.trim():'';
  if(descripcion.length>450)throw new ApiError(400,'Descripción demasiado larga');
  if(body.consentimiento!==true)throw new ApiError(400,'Debes confirmar los derechos de publicación');
  const jpg=decodeJpeg(body,maxFile),resized=await normalizarJpg(jpg,1600);
  const key=fotoKey('galeria');
  await fotosStore().set(key,resized,{metadata:{tipo:'galeria'}});
  try{
    await sql`INSERT INTO public.club_fotos(titulo,autor_alias,descripcion,blob_key,estado)
       VALUES(${titulo},${alias},${descripcion},${key},'pendiente')`;
  }catch(err){await fotosStore().delete(key).catch(()=>{});throw err;}
  return json(202,{mensaje:'Foto recibida. El administrador deberá aprobarla antes de que aparezca en la galería.'});
 }catch(err){return handleError(err);}
};
