'use strict';
(()=>{
 const $=id=>document.getElementById(id), el=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=String(txt);return n;};
 const token=()=>typeof getToken==='function'?getToken():null;
 let admin=false;
 async function api(body){const t=token();const h={...(t?{Authorization:'Bearer '+t}:{})};if(body)h['Content-Type']='application/json';
  const res=await fetch('/.netlify/functions/clubGaleria',{method:body?'POST':'GET',headers:h,body:body?JSON.stringify(body):undefined,cache:'no-store'});
  const data=await res.json().catch(()=>({}));if(!res.ok)throw Error(data.error||'No se ha podido completar');return data;
 }
 async function esAdmin(){if(!token())return false;try{const res=await fetch('/.netlify/functions/clubRutas',{headers:{Authorization:'Bearer '+token()},cache:'no-store'});const r=await res.json();return res.ok&&r.administrador===true;}catch{return false;}}
 const date=valor=>{const d=new Date(String(valor).slice(0,10)+'T12:00:00Z');return isNaN(d)?'Fecha pendiente':new Intl.DateTimeFormat('es-ES',{dateStyle:'long',timeZone:'UTC'}).format(d);};
 async function cargar(){const box=$('galeria-lista');box.replaceChildren();$('galeria-estado').textContent='Cargando…';
  try{admin=await esAdmin();$('galeria-admin').hidden=!admin;const r=await api();
   if(!r.albumes.length){$('galeria-estado').textContent='Todavía no hay crónicas publicadas.';return;}
   for(const a of r.albumes){const art=el('article','com-card');
    if(a.imagen){const img=el('img','com-photo');img.src='/'+a.imagen;img.alt='Fotografía de '+a.titulo;img.loading='lazy';img.decoding='async';img.addEventListener('error',()=>{img.replaceWith(el('div','com-photo-placeholder','Imagen temporalmente no disponible'));});art.append(img);}
    else art.append(el('div','com-photo-placeholder','Crónica del club'));
    const t=el('time','',date(a.fecha));t.dateTime=String(a.fecha).slice(0,10);
    art.append(t,el('h3','',a.titulo),el('p','',a.descripcion));
    if(admin){const b=el('button','com-btn','Retirar publicación');b.type='button';b.addEventListener('click',async()=>{if(!confirm('¿Retirar esta crónica?'))return;try{await api({action:'eliminar',id:Number(a.id)});await cargar();}catch(e){$('galeria-estado').textContent=e.message;}});art.append(b);}
    box.append(art);
   }
   $('galeria-estado').textContent=`${r.albumes.length} publicaciones`;
  }catch(e){$('galeria-estado').textContent=e.message;}
 }
 $('galeria-form').addEventListener('submit',async ev=>{
  ev.preventDefault();const msg=$('galeria-admin-estado');
  const fecha=$('ga-fecha').value,imagen=$('ga-imagen').value.trim();
  if(!fecha){msg.textContent='Indica la fecha';return;}
  try{await api({action:'crear',titulo:$('ga-titulo').value.trim(),fecha,descripcion:$('ga-descripcion').value.trim(),imagen:imagen||null});
   $('galeria-form').reset();msg.textContent='Crónica publicada';await cargar();}
  catch(e){msg.textContent=e.message;}
 });
 $('galeria-recargar').addEventListener('click',cargar);
 window.onLoginSuccess=cargar;window.onLogout=()=>{$('galeria-admin').hidden=true;cargar();};
 cargar();
})();
