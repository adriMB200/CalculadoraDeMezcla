'use strict';
(()=>{
 const $=id=>document.getElementById(id),el=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=String(txt);return n;};
 const token=()=>typeof getToken==='function'?getToken():null;
 async function api(body=null,scope='publicos'){
  const t=token();const headers={...(t?{Authorization:'Bearer '+t}: {})};if(body)headers['Content-Type']='application/json';
  const response=await fetch('/.netlify/functions/clubMiembros'+(body?'':'?scope='+encodeURIComponent(scope)),{
   method:body?'POST':'GET',headers,body:body?JSON.stringify(body):undefined,cache:'no-store'});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw Error(data.error||'No se ha podido completar');return data;
 }
 async function publicos(){const box=$('club-lista');box.replaceChildren();
  try{const r=await api();if(!r.miembros.length){$('club-estado').textContent='Aún no hay perfiles voluntarios publicados.';return;}
   for(const u of r.miembros){const art=el('article','com-card');art.append(el('h3','',u.alias));if(u.moto)art.append(el('p','','Moto: '+u.moto));if(u.descripcion)art.append(el('p','',u.descripcion));box.append(art);}
   $('club-estado').textContent=`${r.miembros.length} perfiles voluntarios`;
  }catch(e){$('club-estado').textContent=e.message;}
 }
 async function mio(){const visible=$('club-perfil');visible.hidden=!token();if(!token())return;
  try{const r=await api(null,'mio');if(r.perfil){$('club-alias').value=r.perfil.alias||'';$('club-moto').value=r.perfil.moto||'';$('club-descripcion').value=r.perfil.descripcion||'';
   $('club-consiente').checked=Boolean(r.perfil.mostrar);
   $('club-perfil-estado').textContent=r.perfil.aprobado?'Perfil público aprobado':r.perfil.mostrar?'Pendiente de moderación':'Perfil no publicado';}
  }catch(e){$('club-perfil-estado').textContent=e.message;}
 }
 async function pendientes(){const box=$('club-pendientes'),section=$('club-moderacion');box.replaceChildren();section.hidden=true;if(!token())return;
  try{const r=await api(null,'pendientes');section.hidden=false;if(!r.pendientes.length){box.append(el('p','','No hay perfiles pendientes'));return;}
   for(const u of r.pendientes){const card=el('article','com-card');card.append(el('h3','',u.alias),el('p','','Moto: '+u.moto),el('p','',u.descripcion));
    for(const [action,label] of [['aprobar','Aprobar'],['rechazar','Rechazar']]){
     const b=el('button','com-btn',label);b.type='button';b.addEventListener('click',async()=>{try{await api({action,usuarioId:Number(u.usuario_id)});await Promise.all([publicos(),pendientes()]);}catch(e){$('club-estado').textContent=e.message;}});card.append(b);}
    box.append(card);
   }
  }catch(e){if(!e.message.includes('Solo administradores'))$('club-estado').textContent=e.message;}
 }
 $('club-form').addEventListener('submit',async ev=>{
  ev.preventDefault();if(!$('club-consiente').checked)return;
  try{const r=await api({action:'guardar',alias:$('club-alias').value.trim(),moto:$('club-moto').value.trim(),descripcion:$('club-descripcion').value.trim(),mostrar:true});
   $('club-perfil-estado').textContent=r.mensaje;await Promise.all([mio(),pendientes()]);}
  catch(e){$('club-perfil-estado').textContent=e.message;}
 });
 $('club-retirar').addEventListener('click',async()=>{if(!confirm('¿Retirar y borrar tu perfil público? No se elimina la cuenta.'))return;
  try{const r=await api({action:'retirar'});$('club-form').reset();$('club-perfil-estado').textContent=r.mensaje;await Promise.all([publicos(),pendientes()]);}
  catch(e){$('club-perfil-estado').textContent=e.message;}
 });
 async function cargar(){await Promise.all([publicos(),mio(),pendientes()]);}
 window.onLoginSuccess=cargar;window.onLogout=()=>{$('club-perfil').hidden=true;$('club-moderacion').hidden=true;publicos();};
 cargar();
})();
