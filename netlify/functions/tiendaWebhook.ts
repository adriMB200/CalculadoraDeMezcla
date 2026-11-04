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
import { createHmac,timingSafeEqual } from 'node:crypto';

const response=(code:number)=>({statusCode:code,headers:{'Cache-Control':'no-store'},body:''});
function validar(body:string,header:string,key:string):boolean{
 const pairs=header.split(',').map(s=>s.trim().split('='));
 const t=pairs.find(p=>p[0]==='t')?.[1],v=pairs.filter(p=>p[0]==='v1').map(p=>p[1]);
 if(!t||!/^\d{10,12}$/.test(t)||Math.abs(Date.now()/1000-Number(t))>300||!v.length)return false;
 const expected=createHmac('sha256',key).update(`${t}.${body}`).digest();
 return v.some(x=>{if(!/^[a-f0-9]{64}$/.test(x))return false;return timingSafeEqual(Buffer.from(x,'hex'),expected);});
}
export const handler:Handler=async event=>{
 if(event.httpMethod!=='POST')return response(405);
 const key=process.env.STRIPE_WEBHOOK_SECRET;
 if(!key)return response(503);
 const body=event.isBase64Encoded?Buffer.from(event.body||'','base64').toString('utf8'):(event.body||'');
 if(body.length>200000||!validar(body,String(event.headers?.['stripe-signature']||''),key))return response(400);
 try{
  const data=JSON.parse(body),type=data?.type,session=data?.data?.object;
  if(!['checkout.session.completed','checkout.session.expired'].includes(type))return response(200);
  if(typeof session?.id!=='string'||typeof session?.client_reference_id!=='string')return response(400);
  const sql=neon(),id=Number(session.client_reference_id);
  if(!Number.isSafeInteger(id)||id<=0)return response(400);
  if(type==='checkout.session.completed'){
   if(session.payment_status!=='paid')return response(200);
   await sql`UPDATE public.tienda_pedidos SET estado='pagado',actualizado_en=now()
     WHERE id=${id} AND checkout_session=${session.id} AND estado='reservado'`;
  }else{
   const rows=await sql`UPDATE public.tienda_pedidos SET estado='vencido',actualizado_en=now()
      WHERE id=${id} AND checkout_session=${session.id} AND estado='reservado'
      RETURNING producto_id,cantidad`;
   if(rows.length)await sql`UPDATE public.tienda_productos SET stock=stock+${Number(rows[0].cantidad)} WHERE id=${Number(rows[0].producto_id)}`;
  }
  return response(200);
 }catch(e){console.error('Fallo procesando evento Stripe',e instanceof Error?e.name:'error');return response(500);}
};
