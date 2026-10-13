import type { Handler } from '@netlify/functions';
import { neon } from '@netlify/neon';
import { ApiError, requireMethod, readBody, positiveId, stringField, json, handleError } from '../shared/security';
import { requireActiveUser, isAdmin, resetMail, alertAdmin, limit } from '../shared/accountSecurity';
const bcrypt=require('bcryptjs');
function hiddenEmail(v:unknown):string | null {
 if(typeof v!=='string'||!v.includes('@'))return null;
 const [name,domain]=v.split('@');return `${name.slice(0,2)}***@${domain}`;
}
export const handler:Handler=async event=>{
 try{
  if(!['GET','POST'].includes(event.httpMethod))throw new ApiError(405,'Método no permitido');
  const id=await requireActiveUser(event);
  if(!isAdmin(id))throw new ApiError(403,'Solo administradores');
  const sql=neon();
  if(event.httpMethod==='GET'){
   const scope=event.queryStringParameters?.scope||'usuarios';
   if(scope==='acceso')return json(200,{administrador:true});
   if(scope==='auditoria'){
    const rows=await sql`SELECT id,actor_id,destino_id,destino_alias,accion,detalle,creado_en
      FROM public.admin_auditoria ORDER BY creado_en DESC LIMIT 60`;
    return json(200,{acciones:rows});
   }
   if(scope!=='usuarios')throw new ApiError(400,'Consulta desconocida');
   const rows=await sql`SELECT id,username,email,email_verificado,estado_cuenta
    FROM public.usuarios ORDER BY id DESC LIMIT 200`;
   return json(200,{usuarios:rows.map(x=>({id:x.id,username:x.username,
     correo:hiddenEmail(x.email),correoVerificado:x.email_verificado,
     estado:x.estado_cuenta,administrador:isAdmin(Number(x.id))}))});
  }
  requireMethod(event,'POST');
  const b=readBody(event),action=String(b.action||'');
  if(!['suspender','reactivar','darDeBaja','eliminar','enviarRecuperacion'].includes(action))
   throw new ApiError(400,'Operación no reconocida');
  const targetId=positiveId(b.usuarioId,'Usuario');
  if(targetId===id || isAdmin(targetId))throw new ApiError(403,'No se puede modificar una cuenta administradora desde este panel');
  const adminPassword=String(b.confirmacion||'');
  await limit('adminwrites:'+id,25,60);
  const [me]=await sql`SELECT password_hash FROM public.usuarios WHERE id=${id}`;
  if(!me||!(await bcrypt.compare(adminPassword,me.password_hash)))throw new ApiError(403,'Confirma la acción con tu contraseña de administrador');
  const [target]=await sql`SELECT username,email,email_verificado,estado_cuenta FROM public.usuarios WHERE id=${targetId}`;
  if(!target)throw new ApiError(404,'Usuario no encontrado');
  let message='',notification=false;
  if(action==='enviarRecuperacion'){
   if(!target.email_verificado||!target.email)throw new ApiError(409,'Esta cuenta no tiene correo verificado. No se puede recuperar por email.');
   if(target.estado_cuenta!=='activo')throw new ApiError(409,'Reactiva la cuenta antes de enviar la recuperación');
   await limit('adminreset:'+targetId,3,60);
   await resetMail(targetId,target.email,'solicitud del administrador');
   message='Se ha enviado un enlace de un solo uso al correo verificado. El administrador no recibe la contraseña.';
  }else if(action==='eliminar'){
   if(target.estado_cuenta!=='eliminacion_pendiente')throw new ApiError(409,'Primero tramita la baja de la cuenta');
   // La función SQL bloquea la fila del usuario y comprueba dependencias en la misma transacción.
   try{
    const erased=await sql`SELECT public.en_admin_eliminar_cuenta_segura(${targetId}) AS eliminado`;
    if(!erased[0]?.eliminado)throw new ApiError(409,
      'No se puede borrar la cuenta con seguridad: existen datos vinculados. Sigue bloqueada y pendiente de supresión.');
    message='Cuenta eliminada. Revisa también el plazo de retención de las copias de seguridad.';
   }catch(e){
    if((e as {code?:string})?.code==='23503')throw new ApiError(409,
      'No se puede borrar automáticamente: la cuenta tiene publicaciones, motos u otros datos relacionados. La cuenta permanece bloqueada y pendiente de supresión.');
    throw e;
   }
  }else{
   const estado=action==='suspender'?'suspendido':action==='reactivar'?'activo':'eliminacion_pendiente';
   const rows=await sql`UPDATE public.usuarios SET estado_cuenta=${estado},
    fecha_desactivacion=CASE WHEN ${estado}='activo' THEN NULL ELSE now() END,
    auth_version=auth_version+1 WHERE id=${targetId} RETURNING id`;
   if(!rows.length)throw new ApiError(404,'Cuenta no encontrada');
   message=estado==='activo'?'Cuenta reactivada. Debe iniciar sesión otra vez.':
    estado==='suspendido'?'Cuenta suspendida. Todos sus JWT quedan invalidados.':
    'Cuenta bloqueada y pendiente de revisión para supresión. Los datos aún no se han borrado.';
  }
  await sql`INSERT INTO public.admin_auditoria(actor_id,destino_id,destino_alias,accion,detalle)
    VALUES(${id},${action==='eliminar'?null:targetId},${target.username},${action},${'Acción desde panel de administración'})`;
  notification=await alertAdmin('Enduro Nalón · Acción de administrador',
    `Administrador ID ${id} realizó ${action} sobre la cuenta ID ${targetId} (${target.username}). Fecha: ${new Date().toISOString()}.`);
  return json(200,{mensaje:message,administradorNotificado:notification});
 }catch(e){return handleError(e);}
};
