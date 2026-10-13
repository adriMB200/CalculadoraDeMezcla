import type { Handler } from '@netlify/functions';
import { neon } from '@netlify/neon';
import { ApiError, readBody, positiveId, stringField, json, handleError } from '../shared/security';
import { requireActiveUser } from '../shared/accountSecurity';
const esAdmin=(id:number)=>(process.env.ENDURO_ADMIN_IDS||'').split(',').map(x=>x.trim()).some(x=>/^\d+$/.test(x)&&Number(x)===id);
export const handler:Handler=async event=>{
 try{
  if(!['GET','POST'].includes(event.httpMethod))throw new ApiError(405,'Método no permitido');
  const sql=neon();
  if(event.httpMethod==='GET') {
    const rows=await sql`SELECT id,titulo,fecha,descripcion,imagen FROM public.club_albumes ORDER BY fecha DESC,id DESC LIMIT 60`;
    return json(200,{albumes:rows});
  }
  const uid=await requireActiveUser(event);
  if(!esAdmin(uid))throw new ApiError(403,'Solo administradores');
  const body=readBody(event);
  if(body.action==='eliminar') {
    const id=positiveId(body.id,'Álbum');
    const rows=await sql`DELETE FROM public.club_albumes WHERE id=${id} RETURNING id`;
    if(!rows.length)throw new ApiError(404,'Álbum no encontrado');
    return json(200,{mensaje:'Álbum retirado'});
  }
  if(body.action!=='crear')throw new ApiError(400,'Acción no válida');
  const titulo=stringField(body.titulo,'Título',100,4);
  const descripcion=stringField(body.descripcion,'Crónica',800,10);
  if(typeof body.fecha!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(body.fecha)|| Number.isNaN(new Date(body.fecha+'T12:00:00Z').getTime()))throw new ApiError(400,'Fecha no válida');
  const fecha=body.fecha;
  let imagen:string|null=null;
  if(body.imagen!==null&&body.imagen!==undefined&&body.imagen!=='') {
    if(typeof body.imagen!=='string'|| !/^imagen\/galeria\/[a-zA-Z0-9_-]+\.(?:webp|jpg|jpeg|png)$/.test(body.imagen) || body.imagen.length>200)throw new ApiError(400,'Ruta de imagen no permitida');
    imagen=body.imagen;
  }
  const rows=await sql`INSERT INTO public.club_albumes(titulo,fecha,descripcion,imagen,creado_por)
   VALUES(${titulo},${fecha},${descripcion},${imagen},${uid}) RETURNING id`;
  return json(201,{mensaje:'Crónica publicada',id:rows[0].id});
 }catch(e){return handleError(e);}
};
