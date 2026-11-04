import type { Handler } from '@netlify/functions';
import { neon } from '@netlify/neon';
import { ApiError,requireMethod,readBody,stringField,json,handleError,assertJwtConfigured } from '../shared/security';
import { guardRequest,guardAccount } from '../shared/fase13Rate';
import { emailOk,newToken,sha256,recoveryLink,limit } from '../shared/accountSecurity';
import { enviarCorreoEnduro,mailDisponible } from '../shared/fase13Mail';
const bcrypt=require('bcryptjs');

export const handler:Handler=async event=>{
 try{
  requireMethod(event,'POST');assertJwtConfigured();
  const body=readBody(event);
  await guardRequest(event,'signup',8,{minuteMax:4,perMinutes:60});
  if(!mailDisponible())throw new ApiError(503,'El registro por correo todavía no está configurado');
  const sql=neon();
  if(body.action==='reenviar'){
   const email=emailOk(body.email);
   await limit('f13-resend:'+email,3,60);
   const rows=await sql`SELECT id,username FROM public.usuarios WHERE lower(email)=${email} AND email_verificado=FALSE AND estado_cuenta='activo' LIMIT 1`;
   if(rows.length){
    const token=newToken(),hash=sha256(token),expiry=new Date(Date.now()+30*60_000).toISOString();
    await sql`UPDATE public.auth_tokens SET usado_en=now() WHERE usuario_id=${Number(rows[0].id)} AND clase='verificar_email' AND usado_en IS NULL`;
    await sql`INSERT INTO public.auth_tokens(usuario_id,clase,token_hash,email_destino,caduca_en) VALUES(${Number(rows[0].id)},'verificar_email',${hash},${email},${expiry})`;
    try{await enviarCorreoEnduro(email,'Enduro Nalón · Verifica tu correo',
      `Hola ${rows[0].username},\n\nAbre este enlace durante los próximos 30 minutos para verificar tu cuenta:\n${recoveryLink(token,true)}\n\nSi no has solicitado este mensaje, puedes ignorarlo.`);}
    catch(err){console.error('No se pudo reenviar activación',err instanceof Error?err.name:'error');}
   }
   return json(202,{mensaje:'Si el correo pertenece a una cuenta pendiente, recibirás un nuevo enlace.'});
  }
  const username=stringField(body.username,'Usuario',40,3),email=emailOk(body.email);
  await guardAccount('signup-name',username,3,60);
  const password=body.password;
  if(typeof password!=='string'||password.length<12||password.length>128)
    throw new ApiError(400,'La contraseña debe tener entre 12 y 128 caracteres');
  if(!/^[A-Za-z0-9_.-]+$/.test(username))throw new ApiError(400,'El usuario contiene caracteres no permitidos');
  const exists=await sql`SELECT id FROM public.usuarios WHERE username=${username} OR lower(email)=${email} LIMIT 1`;
  if(exists.length)throw new ApiError(409,'El usuario o correo ya están registrados');
  const hash=await bcrypt.hash(password,12),token=newToken(),tokenHash=sha256(token);
  const expiry=new Date(Date.now()+30*60_000).toISOString();
  let id:number|undefined;
  try{
   const [user]=await sql`INSERT INTO public.usuarios(username,email,email_verificado,password_hash)
      VALUES(${username},${email},FALSE,${hash}) RETURNING id`;
   id=Number(user.id);
   await sql`INSERT INTO public.auth_tokens(usuario_id,clase,token_hash,email_destino,caduca_en)
     VALUES(${id},'verificar_email',${tokenHash},${email},${expiry})`;
   await enviarCorreoEnduro(email,'Enduro Nalón · Activa tu cuenta',
    `Hola ${username},\n\nPara completar tu registro, abre este enlace de verificación (válido 30 minutos):\n${recoveryLink(token,true)}\n\nSi no te has registrado, puedes ignorar este correo.`);
  }catch(e){
   if(id){await sql`DELETE FROM public.auth_tokens WHERE usuario_id=${id} AND clase='verificar_email' AND usado_en IS NULL`;
    await sql`DELETE FROM public.usuarios WHERE id=${id} AND email_verificado=FALSE`;
   }
   throw e;
  }
  // No emitir JWT antes de confirmar que la dirección de correo pertenece al usuario.
  return json(202,{mensaje:'Registro iniciado. Revisa tu correo y confirma la cuenta antes de iniciar sesión.'});
 }catch(e:any){
  if(e?.code==='23505')return json(409,{error:'El usuario o correo ya están registrados'});
  return handleError(e);
 }
};
