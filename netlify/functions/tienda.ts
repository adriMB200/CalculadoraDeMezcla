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
import { ApiError,handleError,json,positiveId,readBody,stringField } from '../shared/security';
import { requireActiveUser,isAdmin,limit } from '../shared/accountSecurity';

const tipos=['chaleco','chaqueta','pegatina','otro'];
function precio(v:unknown):number {const n=Number(v);if(!Number.isSafeInteger(n)||n<0||n>300000)throw new ApiError(400,'Precio incorrecto (céntimos)');return n;}
function stock(v:unknown):number {const n=Number(v);if(!Number.isSafeInteger(n)||n<0||n>10000)throw new ApiError(400,'Stock incorrecto');return n;}
function imagen(v:unknown):string|null {if(!v)return null;if(typeof v!=='string'||!/^imagen\/tienda\/[a-zA-Z0-9_-]+\.jpg$/.test(v))throw new ApiError(400,'Imagen: utiliza una ruta JPG de imagen/tienda/');return v;}
export const handler:Handler=async event=>{
 try{
  if(!['GET','POST'].includes(event.httpMethod))throw new ApiError(405,'Método no permitido');
  const sql=neon();
  if(event.httpMethod==='GET'){
   const rows=await sql`SELECT id,nombre,tipo,descripcion,precio_centimos,stock,imagen FROM public.tienda_productos WHERE activo=TRUE ORDER BY tipo,nombre,id LIMIT 80`;
   return json(200,{productos:rows,modo:'checkout',pagosConfigurados:Boolean(process.env.STRIPE_SECRET_KEY)});
  }
  const b=readBody(event),action=String(b.action||'');
  const uid=await requireActiveUser(event);
  if(action==='crearProducto'||action==='editarProducto'){
   if(!isAdmin(uid))throw new ApiError(403,'Solo administradores');
   const nombre=stringField(b.nombre,'Nombre',100,3),descripcion=stringField(b.descripcion,'Descripción',450,8);
   const tipo=String(b.tipo||'');if(!tipos.includes(tipo))throw new ApiError(400,'Categoría incorrecta');
   const cents=precio(b.precio_centimos),cantidad=stock(b.stock),foto=imagen(b.imagen),activo=b.activo===true;
   if(activo&&cents===0)throw new ApiError(400,'Indica el precio antes de activar el producto');
   const rows=action==='crearProducto'
     ? await sql`INSERT INTO public.tienda_productos(nombre,tipo,descripcion,precio_centimos,stock,imagen,activo)
         VALUES(${nombre},${tipo},${descripcion},${cents},${cantidad},${foto},${activo}) RETURNING id`
     : await sql`UPDATE public.tienda_productos SET nombre=${nombre},tipo=${tipo},descripcion=${descripcion},precio_centimos=${cents},stock=${cantidad},imagen=${foto},activo=${activo},actualizado_en=now()
         WHERE id=${positiveId(b.id,'Producto')} RETURNING id`;
   if(!rows.length)throw new ApiError(404,'Producto no encontrado');
   return json(200,{mensaje:'Producto guardado',id:rows[0].id});
  }
  if(action==='listarAdmin'){
   if(!isAdmin(uid))throw new ApiError(403,'Solo administradores');
   const rows=await sql`SELECT id,nombre,tipo,descripcion,precio_centimos,stock,imagen,activo FROM public.tienda_productos ORDER BY id`;
   return json(200,{productos:rows});
  }
  if(action==='listarPedidos'){
   if(!isAdmin(uid))throw new ApiError(403,'Solo administradores');
   const rows=await sql`SELECT p.id,p.nombre_producto,p.cantidad,p.precio_unitario_centimos,p.estado,p.creado_en,u.email
     FROM public.tienda_pedidos p JOIN public.usuarios u ON u.id=p.usuario_id
     ORDER BY p.creado_en DESC LIMIT 100`;
   return json(200,{pedidos:rows});
  }
  if(action!=='comprar')throw new ApiError(400,'Acción desconocida');
  const id=positiveId(b.producto_id,'Producto');
  const cantidad=Number(b.cantidad);
  if(!Number.isSafeInteger(cantidad)||cantidad<1||cantidad>5)throw new ApiError(400,'Cantidad no válida');
  await limit('tienda-compra:'+uid,12,60);
  const [user]=await sql`SELECT email,email_verificado,estado_cuenta FROM public.usuarios WHERE id=${uid}`;
  if(!user?.email||user?.email_verificado!==true)throw new ApiError(403,'Debes verificar tu correo en Mi Cuenta antes de comprar');
  const key=process.env.STRIPE_SECRET_KEY||'';
  if(!key.startsWith('sk_test_')&&!(key.startsWith('sk_live_')&&process.env.ENDURO_ENABLE_LIVE_PAYMENTS==='true'))
    throw new ApiError(503,'La pasarela de pago está en preparación. No se han realizado cobros.');
  const rows=await sql`WITH reservado AS (
      UPDATE public.tienda_productos SET stock=stock-${cantidad} WHERE id=${id} AND activo=TRUE AND precio_centimos>0 AND stock>=${cantidad}
      RETURNING id,nombre,precio_centimos
    ), pedido AS (
      INSERT INTO public.tienda_pedidos(usuario_id,producto_id,nombre_producto,precio_unitario_centimos,cantidad,estado)
      SELECT ${uid},reservado.id,reservado.nombre,reservado.precio_centimos,${cantidad},'reservado' FROM reservado
      RETURNING id,producto_id,nombre_producto,precio_unitario_centimos,cantidad
    ) SELECT * FROM pedido`;
  if(!rows.length)throw new ApiError(409,'Este artículo no está disponible en la cantidad solicitada');
  const p=rows[0];
  try{
   const origin=process.env.ENDURO_SITE_URL;
   if(!origin||!/^https:\/\//.test(origin) && !/^http:\/\/localhost(:\d+)?$/.test(origin))throw Error('Configurar ENDURO_SITE_URL');
   const params=new URLSearchParams();
   const add=(k:string,v:unknown)=>params.append(k,String(v));
   add('mode','payment');add('payment_method_types[0]','card');
   add('line_items[0][price_data][currency]','eur');
   add('line_items[0][price_data][product_data][name]',p.nombre_producto);
   add('line_items[0][price_data][unit_amount]',p.precio_unitario_centimos);
   add('line_items[0][quantity]',cantidad);
   add('client_reference_id',p.id);
   add('customer_email',user.email);
   add('success_url',new URL('/tienda.html?resultado=pendiente',origin).toString());
   add('cancel_url',new URL('/tienda.html?resultado=cancelado',origin).toString());
   add('shipping_address_collection[allowed_countries][0]','ES');
   add('phone_number_collection[enabled]','true');
   add('expires_at',Math.floor(Date.now()/1000)+2100);
   add('metadata[pedido]',p.id);
   const res=await fetch('https://api.stripe.com/v1/checkout/sessions',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/x-www-form-urlencoded'},body:params.toString(),signal:AbortSignal.timeout(10000)});
   const data=await res.json().catch(()=>({}));
   if(!res.ok||!data.id||!/^https:\/\/checkout\.stripe\.com\//.test(data.url))throw Error('Stripe');
   await sql`UPDATE public.tienda_pedidos SET checkout_session=${data.id} WHERE id=${p.id} AND estado='reservado'`;
   return json(200,{url:data.url});
  }catch(e){
   const cancelled=await sql`UPDATE public.tienda_pedidos SET estado='cancelado' WHERE id=${p.id} AND estado='reservado' RETURNING producto_id,cantidad`;
   if(cancelled.length)await sql`UPDATE public.tienda_productos SET stock=stock+${cantidad} WHERE id=${id}`;
   console.error('No se pudo crear checkout',e instanceof Error?e.name:'error');
   throw new ApiError(503,'No se ha podido abrir el pago; no se ha cobrado nada');
  }
 }catch(err){return handleError(err);}
};
