import type { Handler } from '@netlify/functions';
import { neon } from '@netlify/neon';
import { ApiError, requireMethod, readBody, stringField, positiveId, json, handleError } from '../shared/security';
import { requireActiveUser } from '../shared/accountSecurity';
const esAdmin = (id:number) => (process.env.ENDURO_ADMIN_IDS || '').split(',').map(x=>x.trim()).some(x=>/^\d+$/.test(x)&&Number(x)===id);
function entero(v:unknown,n:string,min:number,max:number) {
  if(typeof v!=='number' || !Number.isSafeInteger(v) || v<min || v>max) throw new ApiError(400,n+' fuera de rango');
  return v;
}
export const handler:Handler=async event=>{
  try {
    if(event.httpMethod!=='GET'&&event.httpMethod!=='POST') throw new ApiError(405,'Método no permitido');
    const sql=neon();
    if(event.httpMethod==='GET') {
      let userId=0;
      if(event.headers?.authorization||event.headers?.Authorization) userId=await requireActiveUser(event);
      const rows=await sql`
      SELECT r.id,r.titulo,r.fecha_salida,r.zona,r.dificultad,r.kilometros,r.terreno,r.plazas,
        (SELECT COUNT(*)::int FROM public.club_inscripciones i WHERE i.ruta_id=r.id) AS inscritos,
        EXISTS (SELECT 1 FROM public.club_inscripciones i WHERE i.ruta_id=r.id AND i.usuario_id=${userId}) AS apuntado,
        EXISTS (SELECT 1 FROM public.club_espera e WHERE e.ruta_id=r.id AND e.usuario_id=${userId}) AS en_espera,
        CASE WHEN EXISTS (SELECT 1 FROM public.club_inscripciones i WHERE i.ruta_id=r.id AND i.usuario_id=${userId}) THEN r.encuentro ELSE NULL END AS encuentro,
        (SELECT COUNT(*)::int FROM public.club_espera e WHERE e.ruta_id=r.id) AS esperando,
        CASE WHEN ${esAdmin(userId)} THEN r.encuentro ELSE NULL END AS encuentro_admin
      FROM public.club_rutas r
      WHERE r.estado='publicada' AND r.fecha_salida>now()
      ORDER BY r.fecha_salida ASC LIMIT 40`;
      return json(200,{rutas:rows,administrador:esAdmin(userId)});
    }
    requireMethod(event,'POST');
    const userId=await requireActiveUser(event);
    if(!esAdmin(userId)) throw new ApiError(403,'Solo administradores');
    const body=readBody(event);
    if(body.action==='cancelar') {
      const rutaId=positiveId(body.rutaId,'Ruta');
      const result=await sql`SELECT public.club_cancelar_v2(${rutaId}) AS estado`;
      if(result[0]?.estado!=='cancelada') throw new ApiError(404,'Salida no disponible');
      return json(200,{mensaje:'Salida cancelada. Avisos disponibles en la web para los afectados.'});
    }
    if(body.action!=='crear') throw new ApiError(400,'Acción no válida');
    const titulo=stringField(body.titulo,'Título',100,4);
    const zona=stringField(body.zona,'Zona',100,3);
    const terreno=stringField(body.terreno,'Terreno',140,3);
    const encuentro=stringField(body.encuentro,'Encuentro',300,4);
    if(!['facil','media','alta'].includes(String(body.dificultad))) throw new ApiError(400,'Dificultad no válida');
    const dificultad=String(body.dificultad);
    const plazas=entero(body.plazas,'Plazas',1,100);
    const kilometros=body.kilometros===null?null:entero(body.kilometros,'Kilómetros',1,1000);
    if(typeof body.fecha!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(body.fecha))throw new ApiError(400,'Fecha ISO no válida');
    const fecha=new Date(body.fecha);
    if(!Number.isFinite(fecha.getTime())||fecha.getTime()<Date.now()+300000||fecha.getTime()>Date.now()+366*86400000) throw new ApiError(400,'Fecha fuera del intervalo permitido');
    const created=await sql`INSERT INTO public.club_rutas(titulo,fecha_salida,zona,dificultad,kilometros,terreno,plazas,encuentro,creador_id)
      VALUES(${titulo},${fecha.toISOString()},${zona},${dificultad},${kilometros},${terreno},${plazas},${encuentro},${userId}) RETURNING id`;
    return json(201,{mensaje:'Salida creada',id:created[0].id});
  }catch(e){return handleError(e);}
};
