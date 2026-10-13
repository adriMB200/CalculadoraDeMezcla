import type { Handler } from '@netlify/functions';
import { neon } from '@netlify/neon';
import { ApiError, requireMethod, readBody, json, handleError } from '../shared/security';
import { requireActiveUser, strongPassword, emailOk, sha256, newToken, recoveryLink, sendEmail, alertAdmin, resetMail, limit } from '../shared/accountSecurity';
const bcrypt=require('bcryptjs');

export const handler: Handler = async (event) => {
 try {
  if(event.httpMethod==='GET'){
   const id=await requireActiveUser(event);
   const sql=neon();
   const rows=await sql`SELECT username,email,email_verificado FROM public.usuarios WHERE id=${id}`;
   return json(200,{usuario:rows[0]||null});
  }
  requireMethod(event,'POST');
  const b=readBody(event),action=String(b.action||'');
  const sql=neon();
  if(action==='solicitarRecuperacion'){
   const identificador=String(b.identificador||'').trim().toLowerCase();
   if(identificador.length<2||identificador.length>254)throw new ApiError(400,'Introduce tu usuario o correo');
   const ip=(event.headers?.['x-nf-client-connection-ip']||event.headers?.['x-forwarded-for']||'unknown').split(',')[0].slice(0,80);
   await limit('resetip:'+ip,12,60);
   await limit('resetid:'+identificador,3,60);
   const rows=await sql`SELECT id,email FROM public.usuarios
    WHERE estado_cuenta='activo' AND email_verificado=true AND
     (lower(username)=${identificador} OR lower(email)=${identificador}) LIMIT 1`;
   if(rows.length){
    try {
     await resetMail(Number(rows[0].id),String(rows[0].email),'solicitud desde la web');
     await alertAdmin('Enduro Nalón · Recuperación solicitada',
      `Se ha generado un enlace de recuperación para una cuenta con correo verificado. ID: ${rows[0].id}. No se adjunta el enlace ni ninguna contraseña.`);
    }catch(err){console.error('Solicitud de recuperación sin envío confirmado',err instanceof Error?err.message:'error');}
   }
   return json(202,{mensaje:'Si la cuenta existe y tiene un correo verificado, recibirá un enlace en unos minutos.'});
  }
  if(action==='aplicarRecuperacion'){
   const token=typeof b.token==='string'?b.token:'';
   if(!/^[a-f0-9]{64}$/.test(token))throw new ApiError(400,'Enlace no válido o caducado');
   const password=strongPassword(b.password),hash=sha256(token);
   await limit('consume:'+hash,10,60);
   const pwhash=await bcrypt.hash(password,12);
   // Consumo único y cambio de contraseña en una misma sentencia SQL.
   const rows=await sql`WITH usado AS (
    UPDATE public.auth_tokens t SET usado_en=now()
     WHERE t.token_hash=${hash} AND t.clase='restablecer_clave'
       AND t.usado_en IS NULL AND t.caduca_en>now()
     RETURNING t.usuario_id
    ), actualizado AS (
      UPDATE public.usuarios u SET password_hash=${pwhash},auth_version=auth_version+1
      FROM usado WHERE u.id=usado.usuario_id AND u.estado_cuenta='activo'
      RETURNING u.id,u.email,u.email_verificado
    ) SELECT * FROM actualizado`;
   if(!rows.length)throw new ApiError(400,'Enlace no válido o caducado');
   if(rows[0].email_verificado && rows[0].email){
    try{await sendEmail(rows[0].email,'Enduro Nalón · Contraseña cambiada',
     'Se ha restablecido la contraseña de tu cuenta. Todas las sesiones anteriores han dejado de ser válidas. Si no lo has hecho tú, contacta con el club inmediatamente.');}
    catch(e){console.error('Fallo de aviso al usuario tras cambio',e);}
   }
   const notified=await alertAdmin('Enduro Nalón · Contraseña restablecida',`La cuenta ID ${rows[0].id} ha cambiado su contraseña mediante enlace de recuperación.`);
   return json(200,{mensaje:'Contraseña actualizada. Inicia sesión con tu nueva clave.',administradorNotificado:notified});
  }
  if(action==='verificarCorreo'){
   const token=typeof b.token==='string'?b.token:'';
   if(!/^[a-f0-9]{64}$/.test(token))throw new ApiError(400,'Enlace no válido');
   const hash=sha256(token);
   await limit('verify:'+hash,10,60);
   const rows=await sql`WITH usado AS (
      UPDATE public.auth_tokens SET usado_en=now()
      WHERE token_hash=${hash} AND clase='verificar_email' AND usado_en IS NULL AND caduca_en>now()
      RETURNING usuario_id,email_destino
    ), cambiado AS (
      UPDATE public.usuarios u SET email=usado.email_destino,email_verificado=true
      FROM usado WHERE u.id=usado.usuario_id AND u.estado_cuenta='activo'
      RETURNING u.id
    ) SELECT * FROM cambiado`;
   if(!rows.length)throw new ApiError(400,'El enlace ha caducado o ya se ha utilizado');
   await alertAdmin('Enduro Nalón · Correo verificado',`La cuenta ID ${rows[0].id} ha verificado un correo para recuperar su acceso.`);
   return json(200,{mensaje:'Correo verificado. Ya puedes recuperar tu contraseña por email.'});
  }
  const uid=await requireActiveUser(event);
  if(action==='prepararCorreo'){
   const email=emailOk(b.email);
   const current=String(b.password||'');
   await limit('verifyrequest:'+uid,5,60);
   const [row]=await sql`SELECT password_hash FROM public.usuarios WHERE id=${uid}`;
   if(!row || !(await bcrypt.compare(current,row.password_hash)))throw new ApiError(403,'Contraseña actual incorrecta');
   const exists=await sql`SELECT id FROM public.usuarios WHERE lower(email)=${email} AND email_verificado=true AND id<>${uid}`;
   if(exists.length)throw new ApiError(409,'Ese correo ya está vinculado a una cuenta');
   const token=newToken(),hash=sha256(token),expiry=new Date(Date.now()+30*60_000).toISOString();
   await sql`UPDATE public.auth_tokens SET usado_en=now() WHERE usuario_id=${uid} AND clase='verificar_email' AND usado_en IS NULL`;
   const [created]=await sql`INSERT INTO public.auth_tokens(usuario_id,clase,token_hash,email_destino,caduca_en)
      VALUES(${uid},'verificar_email',${hash},${email},${expiry}) RETURNING id`;
   try{await sendEmail(email,'Enduro Nalón · Verifica tu correo',
     `Para asociar este correo a tu cuenta, abre el enlace durante los próximos 30 minutos:\n${recoveryLink(token,true)}\n\nSi no lo solicitaste, ignóralo.`);}
   catch(e){await sql`DELETE FROM public.auth_tokens WHERE id=${created.id}`;throw e;}
   return json(200,{mensaje:'Te hemos enviado un enlace de verificación. Revisa tu correo.'});
  }
  if(action==='cambiarClave'){
   const password=strongPassword(b.password);
   const current=String(b.actual||'');
   await limit('passwordchange:'+uid,6,60);
   const [row]=await sql`SELECT password_hash,email,email_verificado FROM public.usuarios WHERE id=${uid}`;
   if(!row || !(await bcrypt.compare(current,row.password_hash)))throw new ApiError(403,'Contraseña actual incorrecta');
   if(await bcrypt.compare(password,row.password_hash))throw new ApiError(400,'La nueva contraseña debe ser distinta');
   const newHash=await bcrypt.hash(password,12);
   await sql`UPDATE public.usuarios SET password_hash=${newHash},auth_version=auth_version+1 WHERE id=${uid}`;
   await sql`UPDATE public.auth_tokens SET usado_en=now() WHERE usuario_id=${uid} AND usado_en IS NULL`;
   if(row.email_verificado && row.email){
    try{await sendEmail(row.email,'Enduro Nalón · Contraseña cambiada',
      'La contraseña de tu cuenta ha cambiado. Si no realizaste el cambio, contacta inmediatamente con Enduro Nalón.');}
    catch(e){console.error('No se pudo enviar aviso de contraseña',e);}
   }
   const notified=await alertAdmin('Enduro Nalón · Cambio de contraseña',`La cuenta ID ${uid} ha cambiado su propia contraseña.`);
   return json(200,{mensaje:'Contraseña cambiada. Cierra sesión y vuelve a entrar.',administradorNotificado:notified});
  }
  throw new ApiError(400,'Acción desconocida');
 }catch(e){
  if((e as {code?:string})?.code==='23505')return json(409,{error:'Correo ya registrado'});
  return handleError(e);
 }
};
