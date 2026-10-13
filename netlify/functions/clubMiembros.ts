import type { Handler } from '@netlify/functions';
import { neon } from '@netlify/neon';
import { ApiError, requireUser, readBody, positiveId, stringField, json, handleError } from '../shared/security';
const esAdmin=(id:number)=>(process.env.ENDURO_ADMIN_IDS||'').split(',').map(x=>x.trim()).some(x=>/^\d+$/.test(x)&&Number(x)===id);
export const handler:Handler=async event=>{
 try {
  if(!['GET','POST'].includes(event.httpMethod))throw new ApiError(405,'Método no permitido');
  const sql=neon();
  if(event.httpMethod==='GET') {
   const scope=event.queryStringParameters?.scope || 'publicos';
   if(scope==='publicos') {
     // No incluimos IDs internos, email ni matrículas de vehículos.
     const rows=await sql`SELECT alias,moto,descripcion FROM public.club_perfiles
       WHERE mostrar=true AND aprobado=true ORDER BY actualizado_en DESC LIMIT 80`;
     return json(200,{miembros:rows});
   }
   const uid=requireUser(event);
   if(scope==='mio') {
     const rows=await sql`SELECT alias,moto,descripcion,mostrar,aprobado FROM public.club_perfiles WHERE usuario_id=${uid}`;
     return json(200,{perfil:rows[0]||null});
   }
   if(scope==='pendientes') {
     if(!esAdmin(uid))throw new ApiError(403,'Solo administradores');
     const rows=await sql`SELECT usuario_id,alias,moto,descripcion FROM public.club_perfiles
       WHERE mostrar=true AND aprobado=false ORDER BY actualizado_en ASC LIMIT 50`;
     return json(200,{pendientes:rows});
   }
   throw new ApiError(400,'Consulta no válida');
  }
  const uid=requireUser(event),body=readBody(event);
  if(body.action==='retirar') {
    // Borra físicamente el perfil; no afecta a la cuenta ni al garaje.
    await sql`DELETE FROM public.club_perfiles WHERE usuario_id=${uid}`;
    return json(200,{mensaje:'Perfil público retirado y datos del perfil eliminados'});
  }
  if(body.action==='aprobar'||body.action==='rechazar') {
    if(!esAdmin(uid))throw new ApiError(403,'Solo administradores');
    const id=positiveId(body.usuarioId,'Usuario');
    if(body.action==='aprobar') {
      const rows=await sql`UPDATE public.club_perfiles SET aprobado=true WHERE usuario_id=${id} AND mostrar=true RETURNING usuario_id`;
      if(!rows.length)throw new ApiError(404,'Perfil no disponible');
    } else await sql`UPDATE public.club_perfiles SET mostrar=false, aprobado=false WHERE usuario_id=${id}`;
    return json(200,{mensaje:'Moderación aplicada'});
  }
  if(body.action!=='guardar')throw new ApiError(400,'Acción no válida');
  const alias=stringField(body.alias,'Alias',40,2);
  const moto=body.moto===''?'':stringField(body.moto,'Moto',80);
  const descripcion=body.descripcion===''?'':stringField(body.descripcion,'Presentación',280);
  // Solo se publica cuando existe consentimiento voluntario explícito.
  if(body.mostrar!==true)throw new ApiError(400,'Marca el consentimiento para solicitar publicación');
  const rows=await sql`INSERT INTO public.club_perfiles(usuario_id,alias,moto,descripcion,mostrar,aprobado)
    VALUES(${uid},${alias},${moto},${descripcion},true,false)
    ON CONFLICT(usuario_id) DO UPDATE SET alias=EXCLUDED.alias,moto=EXCLUDED.moto,
    descripcion=EXCLUDED.descripcion,mostrar=true,aprobado=false,actualizado_en=now()
    RETURNING usuario_id`;
  return json(200,{mensaje:'Perfil enviado a moderación; todavía no es público',id:rows[0].usuario_id});
 }catch(e){return handleError(e);}
};
