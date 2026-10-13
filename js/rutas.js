'use strict';
// Fase 3.2. La autorización real es siempre responsabilidad de las funciones de Netlify.
(() => {
 const $=id=>document.getElementById(id);
 const lista=$('rutas-lista'), estado=$('rutas-estado');
 let trabajando=false,version=0;
 const token=()=>typeof getToken==='function'?getToken():null;
 const el=(tag,clase,txt)=>{const n=document.createElement(tag); if(clase)n.className=clase; if(txt!==undefined)n.textContent=String(txt);return n;};
 const status=msg=>{estado.textContent=msg;};
 async function api(nombre,body,options={}) {
  const t=token(); if(body&&!t)throw new Error('Debes iniciar sesión');
  const headers={...(t?{Authorization:'Bearer '+t}:{})};if(body)headers['Content-Type']='application/json';
  const res=await fetch('/.netlify/functions/'+nombre+(options.query||''),{method:body?'POST':'GET',headers,body:body?JSON.stringify(body):undefined,cache:'no-store'});
  const data=await res.json().catch(()=>({}));
  if(res.status===401){localStorage.removeItem('token');localStorage.removeItem('user');window.renderAuthButton?.();throw new Error('Sesión caducada. Inicia sesión de nuevo');}
  if(!res.ok)throw new Error(data.error||'No se ha podido completar la operación');return data;
 }
 const fechaTxt=valor=>{let d=new Date(valor);return Number.isNaN(d.getTime())?'Fecha pendiente':new Intl.DateTimeFormat('es-ES',{timeZone:'Europe/Madrid',dateStyle:'full',timeStyle:'short'}).format(d);};
 function fechaLocal(valor){let d=new Date(valor),p=v=>String(v).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;}
 function datosFormulario(prefix){
  const val=name=>$(prefix+name)?.value?.trim()||'';
  const local=val('fecha'), d=new Date(local);
  if(!local||Number.isNaN(d.getTime()))throw new Error('Fecha incorrecta');
  return {titulo:val('titulo'),fecha:d.toISOString(),zona:val('zona'),dificultad:val('nivel'),
   kilometros:val('km')?Number(val('km')):null,plazas:Number(val('plazas')),
   terreno:val('terreno'),encuentro:val('encuentro')};
 }
 function campo(form,label,tipo,valor,prop,extra={}){
  const wrap=el('div');const lab=el('label','',label);const id='edit-'+prop+'-'+form.dataset.ruta;lab.htmlFor=id;
  let inp=tipo==='select'?el('select'):tipo==='textarea'?el('textarea'):el('input');
  inp.id=id;inp.name=prop;if(tipo!=='select'&&tipo!=='textarea')inp.type=tipo;
  if(tipo==='select'){for(const [v,t] of [['facil','Fácil'],['media','Media'],['alta','Alta']]){const o=el('option','',t);o.value=v;inp.append(o);}}
  inp.value=valor??'';inp.required=extra.optional?false:true;
  if(extra.min!==undefined)inp.min=String(extra.min);if(extra.max!==undefined)inp.max=String(extra.max);
  if(extra.maxlength)inp.maxLength=extra.maxlength;
  wrap.append(lab,inp);form.append(wrap);return inp;
 }
 function editor(ruta, card){
  let anterior=card.querySelector('.rutas-editor');if(anterior){anterior.remove();return;}
  const form=el('form','rutas-form rutas-editor');form.dataset.ruta=String(ruta.id);
  const campos={};
  for(const [prop,label,tipo,valor,opt] of [
   ['titulo','Título','text',ruta.titulo,{maxlength:100}],['fecha','Fecha y hora','datetime-local',fechaLocal(ruta.fecha_salida),{}],
   ['zona','Zona pública','text',ruta.zona,{maxlength:100}],['nivel','Dificultad','select',ruta.dificultad,{}],
   ['km','Kilómetros','number',ruta.kilometros,{min:1,max:1000,optional:true}],['plazas','Plazas','number',ruta.plazas,{min:1,max:100}],
   ['terreno','Terreno','text',ruta.terreno,{maxlength:140}],['encuentro','Punto privado','textarea',ruta.encuentro_admin||'',{maxlength:300}]
  ])campos[prop]=campo(form,label,tipo,valor,prop,opt);
  const submit=el('button','rutas-btn rutas-btn--primary','Guardar cambios');submit.type='submit';
  const foot=el('div','rutas-wide');foot.append(submit);form.append(foot);
  const msg=el('p','rutas-wide');msg.setAttribute('role','status');form.append(msg);
  form.addEventListener('submit',async event=>{
   event.preventDefault();if(trabajando)return;
   const d=new Date(campos.fecha.value);if(Number.isNaN(d.getTime())){msg.textContent='Fecha incorrecta';return;}
   const body={action:'editar',rutaId:Number(ruta.id),titulo:campos.titulo.value.trim(),fecha:d.toISOString(),zona:campos.zona.value.trim(),
    dificultad:campos.nivel.value,kilometros:campos.km.value?Number(campos.km.value):null,
    plazas:Number(campos.plazas.value),terreno:campos.terreno.value.trim(),encuentro:campos.encuentro.value.trim()};
   trabajando=true;submit.disabled=true;
   try{const r=await api('clubRutasAvanzadas',body);status(r.mensaje);await cargar();}
   catch(e){msg.textContent=e.message;}finally{trabajando=false;submit.disabled=false;}
  });card.append(form);
 }
 function tarjeta(ruta, admin){
  const card=el('article','rutas-card');
  card.append(el('span','rutas-tag',ruta.dificultad==='facil'?'🟢 FÁCIL':ruta.dificultad==='media'?'🟡 MEDIA':'🔴 ALTA'));
  card.append(el('h3','',ruta.titulo));
  const detail=el('div','rutas-meta');
  for(const t of [fechaTxt(ruta.fecha_salida),'Zona: '+ruta.zona,'Terreno: '+ruta.terreno,
   ruta.kilometros===null?'Distancia sin confirmar':ruta.kilometros+' km aproximados'])detail.append(el('p','',t));
  card.append(detail,el('p','rutas-capacidad',`${ruta.inscritos} / ${ruta.plazas} plazas · ${ruta.esperando} en espera`));
  if(ruta.apuntado&&ruta.encuentro){const privado=el('div','rutas-privado');privado.append(el('b','','Punto de encuentro privado'),el('span','',ruta.encuentro));card.append(privado);}
  else card.append(el('p','rutas-privado',ruta.en_espera?'Estás en lista de espera. El encuentro sigue siendo privado.':'El punto de encuentro solo es visible para inscritos.'));
  const actions=el('div','rutas-card__actions');
  const salida=Boolean(ruta.apuntado||ruta.en_espera),completa=Number(ruta.inscritos)>=Number(ruta.plazas);
  const btn=el('button',salida?'rutas-btn rutas-btn--ghost':'rutas-btn rutas-btn--primary',salida?(ruta.en_espera?'Salir de la espera':'Darme de baja'):(completa?'Entrar en lista de espera':'Apuntarme'));
  btn.type='button';btn.addEventListener('click',async()=>{
   if(!token()){openAuthModal?.();status('Inicia sesión para continuar');return;}
   if(salida&&!confirm('¿Quieres darte de baja?'))return;
   if(trabajando)return;trabajando=true;btn.disabled=true;
   try{const r=await api('clubInscripciones',{action:salida?'salir':'apuntar',rutaId:Number(ruta.id)});status(r.mensaje);await cargar();await avisos();}
   catch(e){status(e.message);}finally{trabajando=false;btn.disabled=false;}
  });actions.append(btn);
  if(admin){
   const edit=el('button','rutas-btn rutas-btn--ghost','Editar');edit.type='button';edit.addEventListener('click',()=>editor(ruta,card));actions.append(edit);
   const cancel=el('button','rutas-btn rutas-btn--ghost','Cancelar salida');cancel.type='button';
   cancel.addEventListener('click',async()=>{
    if(!confirm('¿Cancelar esta salida? Se avisará a inscritos y lista de espera dentro de la web.'))return;
    if(trabajando)return;trabajando=true;cancel.disabled=true;
    try{const r=await api('clubRutas',{action:'cancelar',rutaId:Number(ruta.id)});status(r.mensaje);await cargar();await avisos();}
    catch(e){status(e.message);}finally{trabajando=false;cancel.disabled=false;}
   });actions.append(cancel);
  }
  card.append(actions);return card;
 }
 let panelAvisos=null;
 function initAvisos(){
  panelAvisos=el('section','rutas-panel');panelAvisos.id='avisos-panel';panelAvisos.setAttribute('aria-labelledby','avisos-titulo');
  const h=el('h2','','Avisos de mis salidas');h.id='avisos-titulo';const p=el('p','', 'Aquí verás cambios, cancelaciones y plazas liberadas. No enviamos correos en esta fase.');
  const cont=el('div');cont.id='avisos-lista';panelAvisos.append(h,p,cont);
  $('rutas-lista').closest('section').after(panelAvisos);
 }
 async function avisos(){
  const cont=$('avisos-lista');cont.replaceChildren();panelAvisos.hidden=!token();if(!token())return;
  try{const r=await api('clubAvisos');
   if(!r.avisos.length){cont.append(el('p','','No tienes avisos.'));return;}
   for(const a of r.avisos){const box=el('div','rutas-aviso');box.append(el('p','',a.mensaje+' · '+fechaTxt(a.creado_en)));
    if(!a.leido_en){const b=el('button','rutas-btn rutas-btn--ghost','Marcar leído');b.type='button';
     b.addEventListener('click',async()=>{try{await api('clubAvisos',{action:'leer',id:Number(a.id)});await avisos();}catch(e){status(e.message);}});box.append(b);}
    cont.append(box);
   }
  }catch(e){cont.append(el('p','',e.message));}
 }
 async function cargar(){const v=++version;
  try{const r=await api('clubRutas');if(v!==version)return;
   lista.replaceChildren();$('rutas-admin').hidden=!r.administrador;
   if(!Array.isArray(r.rutas))throw new Error('Formato inesperado');
   for(const item of r.rutas)lista.append(tarjeta(item,r.administrador));
   if(!r.rutas.length)status('Todavía no hay salidas programadas');
   else status(r.rutas.length+' salidas disponibles');
  }catch(e){if(v!==version)return;lista.replaceChildren();$('rutas-admin').hidden=true;status('No se pudieron cargar: '+e.message);}
 }
 $('rutas-form').addEventListener('submit',async event=>{
  event.preventDefault();if(trabajando)return;let data;
  try{data={action:'crear',...datosFormulario('ruta-')};}catch(e){$('rutas-admin-estado').textContent=e.message;return;}
  trabajando=true;$('rutas-crear').disabled=true;
  try{const r=await api('clubRutas',data);$('rutas-form').reset();$('rutas-admin-estado').textContent=r.mensaje;await cargar();}
  catch(e){$('rutas-admin-estado').textContent=e.message;}finally{trabajando=false;$('rutas-crear').disabled=false;}
 });
 $('rutas-recargar').addEventListener('click',()=>{cargar();avisos();});
 $('rutas-anio').textContent=new Date().getFullYear();
 initAvisos();
 window.onLoginSuccess=()=>{cargar();avisos();};
 window.onLogout=()=>{version++;lista.replaceChildren();$('rutas-admin').hidden=true;panelAvisos.hidden=true;cargar();};
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){renderAuthButton?.();cargar();avisos();}});
 cargar();avisos();
})();
