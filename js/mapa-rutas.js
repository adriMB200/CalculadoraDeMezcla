/* Enduro Nalón · Trazados Fase 10. Todos los textos de usuarios se renderizan con textContent. */
(() => {
 'use strict';
 const $=id=>document.getElementById(id);
 const el=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=String(txt);return n;};
 const token=()=>typeof window.getToken==='function'?window.getToken():localStorage.getItem('token');
 const notice=(id,t)=>{$(id).textContent=t;};
 let rows=[],admin=false,map=null,leaflet=null,layer=null,editingLayer=null,points=[],drawing=false, outings=[];
 const routeLayers=new Map();
 async function request(action,body){
   const t=token();const headers={...(t?{Authorization:'Bearer '+t}:{}),...(body?{'Content-Type':'application/json'}:{})};
   const r=await fetch('/.netlify/functions/'+action,{method:body?'POST':'GET',headers,body:body?JSON.stringify(body):undefined,cache:'no-store'});
   const data=await r.json().catch(()=>({}));
   if(r.status===401)throw new Error('Sesión caducada. Vuelve a iniciar sesión.');
   if(!r.ok)throw new Error(data.error||'Error de comunicación');return data;
 }
 function validPts(val){return Array.isArray(val)?val.filter(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)):[];}
 function routeText(item){return `${item.provincia} · ${Number(item.distancia_km).toLocaleString('es-ES',{maximumFractionDigits:2})} km · ${item.dificultad}`;}
 function btn(name,fn){const b=el('button','',name);b.type='button';b.addEventListener('click',fn);return b;}
 function filters(item){
   const query=$('filter-text').value.trim().toLocaleLowerCase('es'),province=$('filter-province').value.trim().toLocaleLowerCase('es'),level=$('filter-level').value;
   return (!query||[item.titulo,item.descripcion].some(x=>String(x).toLocaleLowerCase('es').includes(query)))&&
          (!province||String(item.provincia).toLocaleLowerCase('es').includes(province))&&(!level||item.dificultad===level);
 }
 function downloadGPX(item){
   const pts=validPts(item.puntos);if(pts.length<2)return;
   const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
   const xml='<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1" creator="Enduro Nalon" xmlns="http://www.topografix.com/GPX/1/1"><trk><name>'+esc(item.titulo)+'</name><trkseg>'+pts.map(p=>`<trkpt lat="${p[0]}" lon="${p[1]}"/>`).join('')+'</trkseg></trk></gpx>';
   const url=URL.createObjectURL(new Blob([xml],{type:'application/gpx+xml'}));
   const a=el('a');a.href=url;a.download='enduro-nalon-trazado-'+item.id+'.gpx';document.body.append(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(url),2000);
 }
 function centerOn(item){
   if(!map){notice('map-state','Pulsa «Cargar mapa» para visualizar el recorrido.');return;}
   const pts=validPts(item.puntos);
   if(pts.length<2){notice('map-state','Este recorrido no está disponible para tu cuenta. Inscríbete en la salida si está reservado.');return;}
   const poly=routeLayers.get(String(item.id));if(poly)map.fitBounds(poly.getBounds(),{padding:[35,35],maxZoom:14});
   else map.fitBounds(leaflet.latLngBounds(pts),{padding:[35,35],maxZoom:14});
   notice('map-state',`${item.titulo}: ${routeText(item)}. Comprueba las restricciones antes de circular.`);
 }
 function renderRoutes(){
   const target=$('routes-list');target.replaceChildren();const filtered=rows.filter(filters);
   if(!filtered.length)target.append(el('p','','No hay recorridos que coincidan con los filtros.'));
   for(const item of filtered){
     const card=el('article','enmap-route');
     card.append(el('span','enmap-tag',item.estado==='pendiente'?'PENDIENTE DE REVISIÓN':item.estado==='rechazado'?'RECHAZADO':item.acceso==='inscritos'?'SOLO INSCRITOS':'PUBLICADO'));
     card.append(el('h4','',item.titulo),el('p','',routeText(item)),el('p','',item.descripcion));
     card.append(btn('Ver en el mapa',()=>centerOn(item)));
     if(validPts(item.puntos).length>=2)card.append(btn('Descargar GPX',()=>downloadGPX(item)));
     if(item.salida_id){const a=el('a','', 'Ver quedadas ↗');a.href='rutas.html';card.append(' ',a);}
     if(item.wikiloc_url){const a=el('a','','Abrir ruta en Wikiloc ↗');a.href=item.wikiloc_url;a.target='_blank';a.rel='noopener noreferrer';card.append(' ',a);}
     if(item.es_autor && item.estado!=='publicado' || admin){
       const b=btn('Eliminar',async()=>{if(!confirm('¿Eliminar el trazado?'))return;try{await request('clubTrazados',{action:'eliminar',id:Number(item.id)});await refresh();}catch(e){notice('routes-state',e.message);}});card.append(b);
     }
     target.append(card);
   }
   notice('routes-state',`${filtered.length} recorrido(s). Los pendientes propios solo los ves tú y el administrador.`);
   drawExisting();
 }
 function drawExisting(){
   if(!map)return;
   if(layer)layer.clearLayers();routeLayers.clear();
   for(const r of rows.filter(filters)){
     const coords=validPts(r.puntos);if(coords.length<2)continue;
     const line=leaflet.polyline(coords,{color:r.estado==='publicado'?'#dfff45':'#ffb66a',weight:5,opacity:.91});
     line.addTo(layer);line.on('click',()=>centerOn(r));
     line.bindPopup(()=>{const wrapper=el('div');wrapper.append(el('strong','',r.titulo),el('p','',routeText(r)),el('p','',r.descripcion));return wrapper;});
     routeLayers.set(String(r.id),line);
   }
 }
 async function refresh(){
   try{let result;
    try{result=await request('clubTrazados');}
    catch(e){if(token() && /sesión caducada/i.test(e.message)){result=await fetch('/.netlify/functions/clubTrazados',{cache:'no-store'}).then(r=>r.json());}else throw e;}
    rows=Array.isArray(result.trazados)?result.trazados:[];admin=Boolean(result.administrador);
    $('admin-review').hidden=!admin;renderRoutes();renderAdmin();
   }catch(e){notice('routes-state','No se pudieron cargar las rutas: '+e.message);}
 }
 async function loadOutings(){
   try{const d=await request('clubRutas');outings=Array.isArray(d.rutas)?d.rutas:[];const sel=$('admin-trip');sel.replaceChildren();const empty=el('option','', 'Sin vincular a quedada');empty.value='';sel.append(empty);
    for(const r of outings){const opt=el('option','',`${r.titulo} · ${new Date(r.fecha_salida).toLocaleDateString('es-ES')}`);opt.value=String(r.id);sel.append(opt);}
   }catch(e){notice('admin-state','No se pudieron cargar las quedadas: '+e.message);}
 }
 function renderAdmin(){
   if(!admin)return;
   const target=$('admin-list');target.replaceChildren();
   for(const item of rows.filter(r=>r.estado==='pendiente')){
     const card=el('article');card.append(el('h3','',item.titulo),el('p','',routeText(item)),el('p','',item.descripcion));
     card.append(btn('Ver el trazado',()=>centerOn(item)));
     card.append(btn('Aprobar',async()=>{
       const acceso=$('admin-access').value,salidaId=$('admin-trip').value;
       if(acceso==='inscritos'&&!salidaId){notice('admin-state','Selecciona una salida para reservar este GPX a los inscritos.');return;}
       if(!confirm('¿Has revisado la legalidad y derechos del trazado y autorizas la publicación seleccionada?'))return;
       try{const r=await request('clubTrazados',{action:'aprobar',id:Number(item.id),acceso,salidaId:salidaId?Number(salidaId):null});notice('admin-state',r.mensaje);await refresh();}
       catch(e){notice('admin-state',e.message);}
     }));
     card.append(btn('Rechazar',async()=>{if(!confirm('¿Rechazar la propuesta?'))return;try{await request('clubTrazados',{action:'rechazar',id:Number(item.id)});await refresh();}catch(e){notice('admin-state',e.message);}}));
     target.append(card);
   }
   if(!target.children.length)target.append(el('p','','Sin propuestas pendientes.'));
 }
 function updateDrawing(){
   $('point-counter').textContent=`Puntos del recorrido: ${points.length} (máximo 400)`;
   if(!map)return;
   editingLayer.clearLayers();if(points.length>1)leaflet.polyline(points,{color:'#ffbc62',dashArray:'8 7',weight:5}).addTo(editingLayer);
   for(const p of points){leaflet.circleMarker(p,{radius:4,color:'#ffbc62',weight:2,fillOpacity:1}).addTo(editingLayer);}
 }
 async function loadMap(){
   $('load-map').disabled=true;notice('map-state','Cargando Leaflet y cartografía…');
   try{
    // Cargar Leaflet solamente después de pulsar el botón, nunca al entrar en la web.
    const css=document.createElement('link');css.rel='stylesheet';css.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';document.head.append(css);
    await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';s.onload=resolve;s.onerror=()=>reject(Error('Leaflet no disponible. Revisa la conexión o la CSP.'));document.head.append(s);});
    leaflet=window.L;if(!leaflet)throw Error('No se pudo iniciar Leaflet');
    $('map-placeholder').hidden=true;$('route-map').hidden=false;
    map=leaflet.map('route-map',{preferCanvas:true}).setView([43.24,-5.68],8);
    leaflet.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
      attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',maxZoom:18
    }).addTo(map);
    layer=leaflet.layerGroup().addTo(map);editingLayer=leaflet.layerGroup().addTo(map);
    map.on('click',e=>{
      if(!drawing)return;
      if(points.length>=400){notice('map-state','Máximo 400 puntos. Importa un GPX simplificado.');return;}
      points.push([Number(e.latlng.lat.toFixed(6)),Number(e.latlng.lng.toFixed(6))]);updateDrawing();
    });
    for(const id of ['map-draw','map-undo','map-clear','map-gpx'])$(id).disabled=false;
    $('map-draw').addEventListener('click',()=>{if(!token()){window.openAuthModal?.();notice('map-state','Inicia sesión para dibujar y guardar un recorrido.');return;}drawing=!drawing;$('map-draw').textContent=drawing?'Terminar dibujo':'Empezar a dibujar';notice('map-state',drawing?'Pulsa el mapa para añadir puntos.':'Modo dibujo desactivado.');});
    $('map-undo').addEventListener('click',()=>{points.pop();updateDrawing();});
    $('map-clear').addEventListener('click',()=>{if(!points.length||confirm('¿Borrar el dibujo actual?')){points=[];updateDrawing();}});
    $('map-gpx').addEventListener('click',()=>{if(!token()){window.openAuthModal?.();return;}$('gpx-file').click();});
    drawExisting();notice('map-state','Mapa listo. Puedes seleccionar un recorrido o dibujar una propuesta.');
    setTimeout(()=>map.invalidateSize(),100);
   } catch(e){notice('map-state',e.message);$('load-map').disabled=false;}
 }
 $('gpx-file').addEventListener('change',async e=>{
   const file=e.target.files?.[0];if(!file)return; if(file.size>1_000_000){notice('map-state','GPX demasiado grande. Máximo 1 MB.');return;}
   try{
     const data=new DOMParser().parseFromString(await file.text(),'application/xml');
     if(data.querySelector('parsererror'))throw Error('GPX no válido');
     const xmlpts=[...data.getElementsByTagNameNS('*','trkpt'),...data.getElementsByTagNameNS('*','rtept')];
     if(xmlpts.length<2)throw Error('El GPX necesita al menos dos puntos');
     if(xmlpts.length>400)throw Error('El GPX tiene más de 400 puntos; simplifica el track antes de subirlo.');
     const list=xmlpts.map(p=>[Number(p.getAttribute('lat')),Number(p.getAttribute('lon'))]);
     if(list.some(([a,b])=>!Number.isFinite(a)||!Number.isFinite(b)||a<27||a>45||b< -19||b>5))throw Error('El GPX contiene coordenadas fuera de España o no válidas');
     points=list;drawing=false;$('map-draw').textContent='Empezar a dibujar';updateDrawing();map.fitBounds(leaflet.latLngBounds(points),{padding:[20,20]});
     notice('map-state',`GPX importado: ${points.length} puntos. Revisa el recorrido y envía la propuesta.`);
   }catch(err){notice('map-state',err.message);}finally{$('gpx-file').value='';}
 });
 $('create-form').addEventListener('submit',async e=>{
   e.preventDefault();const form=e.currentTarget;if(!token()){window.openAuthModal?.();notice('create-state','Inicia sesión para proponer rutas.');return;}
   if(points.length<2){notice('create-state','Dibuja o importa al menos dos puntos antes de enviar.');return;}
   const data=new FormData(form),save=form.querySelector('[type=submit]');save.disabled=true;
   try{const r=await request('clubTrazados',{action:'crear',titulo:String(data.get('titulo')).trim(),provincia:String(data.get('provincia')).trim(),dificultad:String(data.get('dificultad')),descripcion:String(data.get('descripcion')).trim(),wikiloc_url:String(data.get('wikiloc_url')).trim(),puntos:points,confirmacionLegal:data.get('confirmacion')==='on'});
      notice('create-state',r.mensaje);points=[];updateDrawing();form.reset();await refresh();}
   catch(err){notice('create-state',err.message);}finally{save.disabled=false;}
 });
 $('load-map').addEventListener('click',loadMap);
 for(const id of ['filter-text','filter-province','filter-level'])$(id).addEventListener('input',renderRoutes);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
 window.onLoginSuccess=()=>{refresh();loadOutings();};
 window.onLogout=()=>{points=[];updateDrawing();refresh();};
 refresh();loadOutings();
})();
