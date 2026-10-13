import type { Handler } from '@netlify/functions';
import { neon } from '@netlify/neon';
import { ApiError, requireUser, requireMethod, readBody, positiveId, stringField, json, handleError } from '../shared/security';
const esAdmin=(id:number)=>(process.env.ENDURO_ADMIN_IDS||'').split(',').map(x=>x.trim()).some(x=>/^\d+$/.test(x)&&Number(x)===id);
function entero(v:unknown, nombre:string,min:number,max:number){
  if(typeof v!=='number'||!Number.isSafeInteger(v)||v<min||v>max)throw new ApiError(400,nombre+' fuera de rango'); return v;
}
export const handler:Handler=async event=>{
 try{
  requireMethod(event,'POST');
  const uid=requireUser(event);
  if(!esAdmin(uid))throw new ApiError(403,'Solo administradores');
  const body=readBody(event); const id=positiveId(body.rutaId,'Ruta');
  if(body.action!=='editar')throw new ApiError(400,'Acción no válida');
  const titulo=stringField(body.titulo,'Título',100,4),zona=stringField(body.zona,'Zona',100,3),
    terreno=stringField(body.terreno,'Terreno',140,3),encuentro=stringField(body.encuentro,'Punto de encuentro',300,4);
  if(!['facil','media','alta'].includes(String(body.dificultad)))throw new ApiError(400,'Dificultad no válida');
  const dificultad=String(body.dificultad);
  const plazas=entero(body.plazas,'Plazas',1,100);
  const km=body.kilometros===null?null:entero(body.kilometros,'Kilómetros',1,1000);
  if(typeof body.fecha!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(body.fecha))throw new ApiError(400,'Fecha ISO no válida');
  const fecha=new Date(body.fecha);
  if(!Number.isFinite(fecha.getTime())||fecha.getTime()<Date.now()+300000||fecha.getTime()>Date.now()+366*86400000)throw new ApiError(400,'Fecha incorrecta');
  const sql=neon();
  const result=await sql`SELECT public.club_editar_v2(${id},${titulo},${fecha.toISOString()},${zona},${dificultad},${km},${terreno},${plazas},${encuentro}) AS estado`;
  if(result[0]?.estado==='menos_plazas')throw new ApiError(409,'Ya hay más inscritos que plazas propuestas');
  if(result[0]?.estado!=='actualizada')throw new ApiError(404,'Salida no disponible');
  return json(200,{mensaje:'Salida actualizada y avisos internos generados'});
 }catch(e){return handleError(e);}
};
