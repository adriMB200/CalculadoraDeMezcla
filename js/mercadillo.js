'use strict';
(() => {
 const $=id=>document.getElementById(id);
 const el=(tag,cls='',text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=String(text);return node;};
 const token=()=>typeof getToken==='function'?getToken():null;
 const status=(id,msg)=>{$(id).textContent=msg;};
 const money=cents=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(Number(cents)/100);
 const when=raw=>new Intl.DateTimeFormat('es-ES',{timeZone:'Europe/Madrid',dateStyle:'medium'}).format(new Date(raw));
 const labels={motos:'Moto',recambios:'Recambio',equipacion:'Equipación',herramientas:'Herramienta',otros:'Otro'};
 let lista=[], admin=false, conversacion=null, popup=null;
 async function api(body=null,qs=''){
  const t=token();const headers={...(t?{Authorization:'Bearer '+t}:{})};if(body)headers['Content-Type']='application/json';
  const res=await fetch('/.netlify/functions/clubMercadillo'+qs,{method:body?'POST':'GET',headers,body:body?JSON.stringify(body):undefined,cache:'no-store'});
  const data=await res.json().catch(()=>({}));
  if(res.status===401){localStorage.removeItem('token');localStorage.removeItem('user');renderAuthButton?.();throw Error('Sesión caducada. Accede de nuevo.');}
  if(!res.ok)throw Error(data.error||'No se pudo completar la operación');return data;
 }
 function btn(txt,onClick,cls='com-btn'){
  const b=el('button',cls,txt);b.type='button';b.addEventListener('click',async()=>{b.disabled=true;try{await onClick();}finally{b.disabled=false;}});return b;
 }
 function baseCard(item,privado=false){
  const card=el('article','merc-card');card.append(el('span','merc-pill',(labels[item.categoria]||'Artículo')+' · '+(item.condicion==='nuevo'?'Nuevo':'Usado')),
    el('h3','',item.titulo),el('div','merc-price',money(item.precio_centimos)),el('p','',item.descripcion),
    el('p','merc-meta','Zona: '+item.zona+' · '+when(item.creado_en)));
  if(privado)card.append(el('p','merc-meta','Estado: '+item.estado+(item.motivo_revision?' · Motivo: '+item.motivo_revision:'')));
  return card;
 }
 function abrirModal(anuncio,report=false){
  popup={anuncio,report};$('merc-dialog-titulo').textContent=report?'Denunciar anuncio':'Contactar con anunciante';
  $('merc-dialog-descripcion').textContent=report?
   'Explica claramente por qué el anuncio puede infringir la ley o las normas; puedes denunciar sin iniciar sesión.':
   'Pregunta por el artículo sin compartir claves, datos bancarios ni documentación personal.';
  $('merc-dialog-cuerpo').value='';$('merc-dialog-cuerpo').minLength=report?15:5;
  $('merc-dialog-enviar').textContent=report?'Enviar denuncia':'Enviar mensaje';$('merc-dialog-estado').textContent='';$('merc-dialog').showModal();
 }
 function verPublicos(){
  const caja=$('merc-lista');caja.replaceChildren();const txt=$('merc-buscar').value.trim().toLocaleLowerCase('es');
  const filtrados=lista.filter(a=>(a.titulo+' '+a.descripcion).toLocaleLowerCase('es').includes(txt));
  for(const a of filtrados){const card=baseCard(a),controls=el('div','merc-controls');
   controls.append(btn('Preguntar al anunciante',()=>{if(!token()){openAuthModal?.();status('merc-estado','Inicia sesión para contactar.');return;}abrirModal(a);},'com-btn com-btn--primary'));
   controls.append(btn('Denunciar',()=>abrirModal(a,true)));
   card.append(controls);caja.append(card);
  }
  status('merc-estado',filtrados.length+' anuncios disponibles');
 }
 async function cargarPublicos(){try{status('merc-estado','Cargando…');const filtro=encodeURIComponent($('merc-categoria').value);const data=await api(null,'?scope=publicos&categoria='+filtro);lista=data.anuncios||[];verPublicos();}
 catch(e){$('merc-lista').replaceChildren();status('merc-estado',e.message);}}
 async function cargarMios(){const section=$('merc-mios');section.hidden=!token();const box=$('merc-mios-lista');box.replaceChildren();if(!token())return;
  try{const r=await api(null,'?scope=mios');if(!r.anuncios.length){box.append(el('p','','Todavía no tienes anuncios.'));return;}
   for(const a of r.anuncios){const card=baseCard(a,true);if(['pendiente','activo'].includes(a.estado)){const actions=el('div','merc-controls');
    for(const [action,label] of [['vendido','Marcar vendido'],['retirado','Retirar anuncio']])actions.append(btn(label,async()=>{
     if(!confirm('¿Confirmas que quieres cambiar el estado de este anuncio?'))return;
     try{const r=await api({action:'estado',anuncioId:Number(a.id),estado:action});status('merc-form-estado',r.mensaje);await Promise.all([cargarMios(),cargarPublicos()]);}
     catch(e){status('merc-form-estado',e.message);}
    }));card.append(actions);}box.append(card);}
  }catch(e){box.append(el('p','',e.message));}
 }
 async function cargarChats(){const section=$('merc-chats'),list=$('merc-chats-lista');section.hidden=!token();list.replaceChildren();if(!token())return;
  try{const r=await api(null,'?scope=chats');if(!r.chats.length){list.append(el('p','','No tienes conversaciones.'));return;}
   for(const c of r.chats){list.append(btn(c.titulo+' · Conversación #'+c.contacto_id,()=>abrirConversacion(Number(c.anuncio_id),Number(c.contacto_id),c.titulo),'merc-thread'));}
  }catch(e){status('merc-chat-estado',e.message);}
 }
 async function abrirConversacion(anuncioId,contactoId,titulo){conversacion={anuncioId,contactoId};$('merc-conversacion').hidden=false;
  $('merc-conversacion-titulo').textContent='Sobre '+titulo;const box=$('merc-mensajes-lista');box.replaceChildren();
  try{const qs='?scope=mensajes&anuncioId='+encodeURIComponent(anuncioId)+'&contactoId='+encodeURIComponent(contactoId);
   const r=await api(null,qs);for(const m of r.mensajes){const isSelf=Number(m.remitente_id)!==contactoId;
    const div=el('div','merc-message'+(isSelf?' merc-message--own':''));div.append(el('p','',m.cuerpo),el('small','',when(m.creado_en)));box.append(div);}
   status('merc-chat-estado','');
  }catch(e){status('merc-chat-estado',e.message);}
 }
 async function cargarAdmin(){const section=$('merc-admin');section.hidden=true;admin=false;if(!token())return;
  try{const r=await api(null,'?scope=pendientes');admin=true;section.hidden=false;
   const box=$('merc-pendientes'),reports=$('merc-reportes');box.replaceChildren();reports.replaceChildren();
   if(!r.anuncios.length)box.append(el('p','','No hay anuncios pendientes.'));
   for(const a of r.anuncios){const card=baseCard(a),controls=el('div','merc-controls');
    controls.append(btn('Aprobar',async()=>{try{await api({action:'moderar',decision:'aprobar',anuncioId:Number(a.id)});await recargar();}catch(e){status('merc-admin-estado',e.message);}}));
    controls.append(btn('Rechazar',async()=>{const motivo=prompt('Escribe el motivo de rechazo (mínimo 8 caracteres)');if(motivo===null)return;try{await api({action:'moderar',decision:'rechazar',anuncioId:Number(a.id),motivo});await recargar();}catch(e){status('merc-admin-estado',e.message);}}));
    card.append(controls);box.append(card);
   }
   if(!r.reportes.length)reports.append(el('p','','No hay denuncias pendientes.'));
   for(const r2 of r.reportes){const card=el('article','merc-card');card.append(el('h3','','Anuncio #'+r2.anuncio_id+' · '+r2.titulo),el('p','','Estado: '+r2.estado_anuncio),el('p','',r2.motivo));
    const controls=el('div','merc-controls');
    controls.append(btn('Marcar denuncia revisada',async()=>{try{await api({action:'revisarDenuncia',id:Number(r2.id)});await cargarAdmin();}catch(e){status('merc-admin-estado',e.message);}}));
    if(r2.estado_anuncio==='activo')controls.append(btn('Retirar anuncio',async()=>{const motivo=prompt('Motivo de retirada (mínimo 8 caracteres)');if(motivo===null)return;try{await api({action:'moderar',decision:'retirar',anuncioId:Number(r2.anuncio_id),motivo});await recargar();}catch(e){status('merc-admin-estado',e.message);}}));
    card.append(controls);reports.append(card);
   }
  }catch(e){if(!String(e.message).includes('Solo administradores'))status('merc-admin-estado',e.message);}
 }
 async function recargar(){await Promise.all([cargarPublicos(),cargarMios(),cargarChats(),cargarAdmin()]);}
 $('merc-recargar').addEventListener('click',recargar);
 $('merc-categoria').addEventListener('change',cargarPublicos);
 $('merc-buscar').addEventListener('input',verPublicos);
 $('merc-form').addEventListener('submit',async ev=>{ev.preventDefault();const b=$('merc-enviar');b.disabled=true;
  try{if(!$('merc-acepta').checked)throw Error('Debes aceptar las normas');const precio=$('merc-precio').value.trim();
   if(!/^\d{1,6}(?:[.,]\d{1,2})?$/.test(precio))throw Error('Precio incorrecto');
   const cents=Math.round(Number(precio.replace(',','.'))*100);
   const data={action:'crear',titulo:$('merc-titulo').value.trim(),descripcion:$('merc-descripcion').value.trim(),zona:$('merc-zona').value.trim(),
    categoria:$('merc-tipo').value,condicion:$('merc-condicion').value,precioCentimos:cents};
   const result=await api(data);status('merc-form-estado',result.mensaje);$('merc-form').reset();await cargarMios();
  }catch(e){status('merc-form-estado',e.message);}finally{b.disabled=false;}
 });
 $('merc-dialog-form').addEventListener('submit',async ev=>{ev.preventDefault();if(!popup)return;const button=$('merc-dialog-enviar');button.disabled=true;
  try{const result=await api(popup.report?{action:'denunciar',anuncioId:Number(popup.anuncio.id),motivo:$('merc-dialog-cuerpo').value.trim()}: {action:'mensaje',anuncioId:Number(popup.anuncio.id),mensaje:$('merc-dialog-cuerpo').value.trim()});
   $('merc-dialog-estado').textContent=result.mensaje;if(!popup.report)await cargarChats();
  }catch(e){$('merc-dialog-estado').textContent=e.message;}finally{button.disabled=false;}
 });
 $('merc-reply-form').addEventListener('submit',async ev=>{ev.preventDefault();if(!conversacion)return;
  try{const res=await api({action:'mensaje',anuncioId:conversacion.anuncioId,contactoId:conversacion.contactoId,mensaje:$('merc-respuesta').value.trim()});
   $('merc-respuesta').value='';status('merc-chat-estado',res.mensaje);await abrirConversacion(conversacion.anuncioId,conversacion.contactoId,$('merc-conversacion-titulo').textContent.replace(/^Sobre /,''));
  }catch(e){status('merc-chat-estado',e.message);}
 });
 function sesion(){const logged=Boolean(token());$('merc-publicar').hidden=!logged;$('merc-mios').hidden=!logged;$('merc-chats').hidden=!logged;if(!logged){$('merc-admin').hidden=true;$('merc-conversacion').hidden=true;}}
 window.onLoginSuccess=()=>{sesion();recargar();};window.onLogout=()=>{sesion();recargar();};
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){renderAuthButton?.();sesion();recargar();}});
 sesion();recargar();
})();
