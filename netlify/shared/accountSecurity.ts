import type { HandlerEvent } from '@netlify/functions';
import { neon } from '@netlify/neon';
import { createHash, randomBytes } from 'node:crypto';
import { ApiError, requireUser } from './security';
const jwt = require('jsonwebtoken');

export const isAdmin = (id: number) =>
 (process.env.ENDURO_ADMIN_IDS || '').split(',').some(x => /^\d+$/.test(x.trim()) && Number(x.trim()) === id);

export async function requireActiveUser(event: HandlerEvent): Promise<number> {
 const id = requireUser(event);
 const authorization = event.headers?.authorization || event.headers?.Authorization || '';
 const token = authorization.replace(/^Bearer\s+/i, '');
 const decoded = jwt.decode(token) as { ver?: unknown } | null;
 // La firma y la expiración ya han sido verificadas por requireUser.
 const version = decoded && Number.isSafeInteger(decoded.ver) ? Number(decoded.ver) : 0;
 const sql = neon();
 const rows = await sql`SELECT estado_cuenta,auth_version FROM public.usuarios WHERE id=${id}`;
 if (!rows.length || rows[0].estado_cuenta !== 'activo' || Number(rows[0].auth_version) !== version)
  throw new ApiError(401,'Tu sesión ya no es válida. Vuelve a iniciar sesión.');
 return id;
}
export function strongPassword(p: unknown): string {
 if(typeof p!=='string'||p.length<12||p.length>128)throw new ApiError(400,'La contraseña debe tener entre 12 y 128 caracteres');
 return p;
}
export const sha256 = (v:string)=>createHash('sha256').update(v).digest('hex');
export const newToken = ()=>randomBytes(32).toString('hex');
export function emailOk(email:unknown):string {
 if(typeof email!=='string'||email.length>254|| !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new ApiError(400,'Correo electrónico no válido');
 return email.trim().toLowerCase();
}
// Limitación por identificador/usuario y periodo atómica en PostgreSQL.
export async function limit(key:string,max:number,minutes:number){
 const sql=neon();
 const period = new Date(Math.floor(Date.now()/(minutes*60_000))*minutes*60_000).toISOString();
 const hashed=sha256(key);
 const rows=await sql`INSERT INTO public.auth_limites(clave,periodo,solicitudes) VALUES(${hashed},${period},1)
  ON CONFLICT(clave,periodo) DO UPDATE SET solicitudes=auth_limites.solicitudes+1
  RETURNING solicitudes`;
 if(Number(rows[0].solicitudes)>max)throw new ApiError(429,'Demasiadas solicitudes. Inténtalo más tarde.');
}
function siteUrl():string{
 const raw=process.env.ENDURO_SITE_URL||'';
 const u=new URL(raw);
 if(u.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(u.hostname))throw new Error('ENDURO_SITE_URL exige HTTPS');
 if(u.username||u.password||u.search||u.hash)throw new Error('ENDURO_SITE_URL inválida');
 return u.origin;
}
export function recoveryLink(token:string,verify=false):string {
 return `${siteUrl()}/${verify?'mi-cuenta.html':'recuperar-clave.html'}?${verify?'verificar':'token'}=${encodeURIComponent(token)}`;
}
export async function sendEmail(to:string,subject:string,body:string):Promise<void>{
 const apiKey=process.env.RESEND_API_KEY, from=process.env.ENDURO_MAIL_FROM;
 if(!apiKey||!from)throw new ApiError(503,'Servicio de correo pendiente de configuración');
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),8000);
 try{
  const res=await fetch('https://api.resend.com/emails',{
   method:'POST',signal:controller.signal,
   headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},
   body:JSON.stringify({from,to:[to],subject,text:body})
  });
  if(!res.ok){console.error('Proveedor de correo falló',res.status);throw new Error('No se ha podido enviar el correo');}
 }finally{clearTimeout(timer);}
}
export async function alertAdmin(subject:string,body:string):Promise<boolean>{
 const to=process.env.ENDURO_ADMIN_NOTIFY_EMAIL;
 if(!to)return false;
 try{await sendEmail(to,subject,body);return true;}
 catch(e){console.error('No se pudo notificar al administrador',e instanceof Error?e.message:'error');return false;}
}
export async function resetMail(userId:number,email:string,actor:string):Promise<void>{
 const sql=neon();const token=newToken(),hash=sha256(token);
 const expires=new Date(Date.now()+20*60_000).toISOString();
 await sql`UPDATE public.auth_tokens SET usado_en=now() WHERE usuario_id=${userId} AND clase='restablecer_clave' AND usado_en IS NULL`;
 const [row]=await sql`INSERT INTO public.auth_tokens(usuario_id,clase,token_hash,caduca_en)
  VALUES(${userId},'restablecer_clave',${hash},${expires}) RETURNING id`;
 try{await sendEmail(email,'Enduro Nalón · Recuperar contraseña',
  `Se ha solicitado restablecer tu contraseña (${actor}).\nEnlace válido durante 20 minutos y de un solo uso:\n${recoveryLink(token)}\n\nSi no lo solicitaste, ignora este mensaje y contacta con el club.`);}
 catch(e){await sql`DELETE FROM public.auth_tokens WHERE id=${row.id}`;throw e;}
}
