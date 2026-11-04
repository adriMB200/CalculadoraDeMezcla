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
import { ApiError,json,handleError } from '../shared/security';
import { requireActiveUser,limit } from '../shared/accountSecurity';
import { decodeJpeg,normalizarJpg,fotosStore,fotoKey,readImageBody } from '../shared/fase13Images';
export const handler:Handler=async event=>{
 try{
  if(event.httpMethod!=='POST')throw new ApiError(405,'Método no permitido');
  const uid=await requireActiveUser(event);await limit(`f13-avatar:${uid}`,15,1440);
  const body=readImageBody(event.body),sql=neon();
  if(body.action==='eliminar'){
   const [prev]=await sql`SELECT foto_perfil_key FROM public.usuarios WHERE id=${uid}`;
   await sql`UPDATE public.usuarios SET foto_perfil_key=NULL WHERE id=${uid}`;
   if(prev?.foto_perfil_key)await fotosStore().delete(prev.foto_perfil_key).catch(()=>{});
   return json(200,{mensaje:'Foto de perfil retirada'});
  }
  if(body.action!=='subir')throw new ApiError(400,'Acción incorrecta');
  const buffer=decodeJpeg(body,2_000_000),jpg=await normalizarJpg(buffer,480),key=fotoKey('avatar');
  await fotosStore().set(key,jpg,{metadata:{tipo:'avatar'}});
  try{
   const [prev]=await sql`SELECT foto_perfil_key FROM public.usuarios WHERE id=${uid}`;
   await sql`UPDATE public.usuarios SET foto_perfil_key=${key} WHERE id=${uid}`;
   if(prev?.foto_perfil_key)await fotosStore().delete(prev.foto_perfil_key).catch(()=>{});
  }catch(e){await fotosStore().delete(key).catch(()=>{});throw e;}
  return json(200,{mensaje:'Foto de perfil actualizada'});
 }catch(e){return handleError(e);}
};
