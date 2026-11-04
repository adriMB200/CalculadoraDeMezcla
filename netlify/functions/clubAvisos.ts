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
import { ApiError, readBody, positiveId, json, handleError } from '../shared/security';
import { requireActiveUser } from '../shared/accountSecurity';
export const handler:Handler=async event=>{
 try{
   if(!['GET','POST'].includes(event.httpMethod))throw new ApiError(405,'Método no permitido');
   const uid=await requireActiveUser(event),sql=neon();
   if(event.httpMethod==='GET') {
      const rows=await sql`SELECT id,mensaje,creado_en,leido_en FROM public.club_avisos WHERE usuario_id=${uid} ORDER BY creado_en DESC LIMIT 50`;
      return json(200,{avisos:rows});
   }
   const body=readBody(event);
   if(body.action!=='leer')throw new ApiError(400,'Acción no válida');
   const id=positiveId(body.id,'Aviso');
   await sql`UPDATE public.club_avisos SET leido_en=COALESCE(leido_en,now()) WHERE id=${id} AND usuario_id=${uid}`;
   return json(200,{mensaje:'Aviso leído'});
 }catch(e){return handleError(e);}
};
