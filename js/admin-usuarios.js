(()=>{'use strict';
 const $=id=>document.getElementById(id),token=localStorage.getItem('token');
 const say=v=>{$('mensaje').textContent=v};let all=[];let pending=null;
 if(!token){say('Acceso denegado: inicia sesión como administrador desde la portada.');return;}
 async function api(scope,body){
  const url='/.netlify/functions/adminUsuarios'+(scope?'?scope='+encodeURIComponent(scope):'');
  const r=await fetch(url,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+token,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
  const d=await r.json();if(!r.ok)throw Error(d.error||'Operación no disponible');return d;
 }
 const cell=(tr,content)=>{const t=document.createElement('td');t.textContent=String(content);tr.append(t);return t;};
 const btn=(label,action,u,cls='secondary')=>{const b=document.createElement('button');b.type='button';b.className=cls;b.textContent=label;b.addEventListener('click',()=>confirmAction(action,u));return b;};
 function render(){const search=$('buscarUsuario').value.trim().toLowerCase();const body=$('listaUsuarios');body.replaceChildren();
  for(const u of all.filter(u=>u.username.toLowerCase().includes(search))){
   const tr=document.createElement('tr');cell(tr,`#${u.id} · ${u.username}${u.administrador?' (administrador)':''}`);
   cell(tr,u.correoVerificado?(u.correo||'Verificado'):'No verificado');cell(tr,u.estado);
   const td=document.createElement('td'),actions=document.createElement('div');actions.className='actions';
   if(!u.administrador){
    if(u.estado==='activo'){actions.append(btn('Recuperación','enviarRecuperacion',u),btn('Suspender','suspender',u,'danger'),btn('Dar de baja','darDeBaja',u,'danger'));}
    else if(u.estado==='suspendido'){actions.append(btn('Reactivar','reactivar',u),btn('Dar de baja','darDeBaja',u,'danger'));}
    else {actions.append(btn('Reactivar','reactivar',u),btn('Borrado definitivo','eliminar',u,'danger'));}
   } else actions.textContent='Cuenta protegida';
   td.append(actions);tr.append(td);body.append(tr);
  }
 }
 function confirmAction(action,u){pending={action,usuarioId:u.id};
  const titles={suspender:'Suspender cuenta',reactivar:'Reactivar cuenta',darDeBaja:'Tramitar baja',eliminar:'Eliminar definitivamente',enviarRecuperacion:'Enviar enlace de recuperación'};
  $('accionTitulo').textContent=titles[action]||'Confirmar';
  $('accionTexto').textContent=action==='eliminar'?`Solo podrás borrar la cuenta de ${u.username} si no existen datos relacionados que bloqueen la eliminación. No podrás deshacerlo.`:
  action==='darDeBaja'?`La cuenta de ${u.username} quedará inhabilitada y pendiente de revisión y supresión. No borra los datos todavía.`:
  action==='enviarRecuperacion'?`Se enviará un enlace privado al correo verificado de ${u.username}. No podrás conocer su contraseña.`:
  `Confirma la operación sobre ${u.username}.`;
  $('adminClave').value='';$('confirmacion').returnValue='cancelar';$('confirmacion').showModal();
 }
 $('confirmacion').addEventListener('close',async()=>{
  if($('confirmacion').returnValue!=='confirmar'||!pending){pending=null;return;}
  const body={...pending,confirmacion:$('adminClave').value};pending=null;$('adminClave').value='';
  try{const d=await api(null,body);say(d.mensaje+(d.administradorNotificado?' Se ha enviado aviso al administrador.':' Atención: no se confirmó el aviso por correo.'));await load();}
  catch(e){say(e.message)}
 });
 async function load(){const data=await api('usuarios');all=data.usuarios;$('panelAdmin').hidden=false;render();}
 async function audit(){try{const data=await api('auditoria');const list=$('historial');list.replaceChildren();for(const a of data.acciones){const item=document.createElement('div');item.className='audit-item';const time=document.createElement('small');time.textContent=new Date(a.creado_en).toLocaleString('es-ES');const text=document.createElement('div');text.textContent=`${a.accion} · ${a.destino_alias||'Cuenta'} · administrador #${a.actor_id||'desconocido'}`;item.append(time,text);list.append(item);}}catch(e){say(e.message)}}
 $('buscarUsuario').addEventListener('input',render);$('recargarHistorial').addEventListener('click',audit);
 load().then(()=>{say('Panel de administración activo.');return audit()}).catch(e=>{say('Acceso denegado: '+e.message);$('panelAdmin').hidden=true;});
})();
