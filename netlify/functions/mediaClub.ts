/*
 * ENDURO_NALON_AUTORIA_V15
 * ENDURO NALÓN — Enduro, rutas y compañerismo en Asturias
 * Fundador y responsable del proyecto: Adrian Martis Blanco
 * GitHub: https://github.com/adriMB200
 * Web: https://enduronalon.netlify.app/
 * Copyright (c) 2026 Adrian Martis Blanco. Derechos reservados sobre las contribuciones originales.
 * Las bibliotecas, obras y contribuciones de terceros conservan sus licencias y autoría.
 */

import type { Handler } from '@netlify/functions';
import { neon } from '@netlify/neon';
import { ApiError,handleError,positiveId } from '../shared/security';
import { requireActiveUser,isAdmin } from '../shared/accountSecurity';
import { fotosStore } from '../shared/fase13Images';
export const handler:Handler=async event=>{
 try{
  if(event.httpMethod!=='GET')throw new ApiError(405,'Método no permitido');
  const sql=neon(),tipo=event.queryStringParameters?.tipo;
  let key:string|undefined;
  if(tipo==='avatar'){
   const uid=await requireActiveUser(event);
   const rows=await sql`SELECT foto_perfil_key FROM public.usuarios WHERE id=${uid}`;
   key=rows[0]?.foto_perfil_key;
  } else if(tipo==='galeria'){
   const id=positiveId(event.queryStringParameters?.id,'Fotografía');
   const rows=await sql`SELECT blob_key,estado FROM public.club_fotos WHERE id=${id}`;
   if(rows[0]?.estado==='publicada')key=rows[0].blob_key;
   else if(rows[0]?.estado==='pendiente'){
    const uid=await requireActiveUser(event);if(!isAdmin(uid))throw new ApiError(403,'Solo administradores');
    key=rows[0].blob_key;
   }
  }else throw new ApiError(400,'Recurso no disponible');
  if(!key)throw new ApiError(404,'Imagen no disponible');
  const contents=await fotosStore().get(key,{type:'arrayBuffer'});
  if(!contents)throw new ApiError(404,'Imagen no disponible');
  return {statusCode:200,isBase64Encoded:true,headers:{'Content-Type':'image/jpeg','Cache-Control':tipo==='avatar'?'private, no-store':'public, max-age=300','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox"},body:Buffer.from(contents).toString('base64')};
 }catch(err){return handleError(err);}
};
