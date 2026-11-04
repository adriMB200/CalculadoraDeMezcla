(()=>{'use strict';
 const $=id=>document.getElementById(id),url='/.netlify/functions/tienda';
 const token=()=>typeof getToken==='function'?getToken():null;
 const euros=n=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(Number(n)/100);
 const node=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
 async function api(payload){const h=payload?{'Content-Type':'application/json'}:{};if(token())h.Authorization='Bearer '+token();const res=await fetch(url,{method:payload?'POST':'GET',headers:h,body:payload?JSON.stringify(payload):undefined});const data=await res.json().catch(()=>({}));if(!res.ok)throw Error(data.error||'No se pudo consultar la tienda');return data;}
 function card(p){const card=node('article','f13-card'),src=typeof p.imagen==='string'&&/^imagen\/tienda\/[a-zA-Z0-9_-]+\.jpg$/.test(p.imagen)?'/'+p.imagen:null;
  if(src){const img=node('img','f13-image');img.src=src;img.alt=p.nombre;img.loading='lazy';card.append(img);}else card.append(node('div','f13-image','🏍'));
  const box=node('div','f13-card-content');box.append(node('h3','',p.nombre),node('p','f13-muted',p.descripcion),node('p','f13-price',euros(p.precio_centimos)),node('p','f13-muted',p.stock>0?`Disponibles: ${p.stock}`:'Sin existencias'));
  const row=node('div','f13-row'),input=node('input','f13-input');input.type='number';input.min='1';input.max=String(Math.min(5,Number(p.stock)));input.value='1';input.style.maxWidth='80px';
  const b=node('button','f13-btn','Comprar');b.disabled=!(Number(p.stock)>0);b.type='button';b.addEventListener('click',async()=>{if(!token()){window.openAuthModal?.();return;}b.disabled=true;$('shop-status').textContent='Preparando pago seguro…';try{const d=await api({action:'comprar',producto_id:p.id,cantidad:Number(input.value)});if(!/^https:\/\/checkout\.stripe\.com\//.test(d.url))throw Error('Pasarela no disponible');location.href=d.url;}catch(e){$('shop-status').textContent=e.message;b.disabled=false;}});
  row.append(input,b);box.append(row);card.append(box);return card;
 }
 async function list(){const box=$('shop-products');box.replaceChildren();try{const d=await api();$('shop-status').textContent=d.productos.length?`${d.productos.length} artículos en catálogo`:'Próximamente: la tienda todavía no tiene productos disponibles.';d.productos.forEach(p=>box.append(card(p)));}catch(e){$('shop-status').textContent=e.message;}}
 function fill(p){const form=$('shop-form');for(const key of ['id','nombre','tipo','descripcion','stock','imagen'])if(form.elements[key])form.elements[key].value=p[key]??'';form.elements.precio.value=(p.precio_centimos/100).toFixed(2);form.elements.activo.checked=Boolean(p.activo);form.scrollIntoView({behavior:'smooth'});}
 async function admin(){const area=$('shop-admin');area.hidden=true;if(!token())return;try{const r=await api({action:'listarAdmin'});area.hidden=false;const box=$('shop-admin-items');box.replaceChildren();r.productos.forEach(p=>{const row=node('div','f13-row');row.style.marginTop='12px';row.append(node('span','',`${p.nombre} · ${p.activo?'Publicado':'Oculto'} · ${euros(p.precio_centimos)}`));const btn=node('button','f13-btn f13-btn--plain','Editar');btn.type='button';btn.addEventListener('click',()=>fill(p));row.append(btn);box.append(row);});
   const ord=await api({action:'listarPedidos'});const orders=$('shop-orders');orders.replaceChildren();
   ord.pedidos.forEach(p=>{const el=node('p','f13-muted',`#${p.id} · ${p.nombre_producto} × ${p.cantidad} · ${p.estado} · ${p.email}`);orders.append(el);});
   if(!ord.pedidos.length)orders.append(node('p','f13-muted','Todavía no hay pedidos.'));
  }catch{}}
 $('shop-form').addEventListener('submit',async ev=>{ev.preventDefault();const f=ev.currentTarget;const b={action:f.elements.id.value?'editarProducto':'crearProducto',id:f.elements.id.value||undefined,nombre:f.elements.nombre.value.trim(),tipo:f.elements.tipo.value,descripcion:f.elements.descripcion.value.trim(),precio_centimos:Math.round(Number(f.elements.precio.value)*100),stock:Number(f.elements.stock.value),imagen:f.elements.imagen.value.trim()||null,activo:f.elements.activo.checked};try{await api(b);$('shop-admin-status').textContent='Producto guardado';f.reset();await admin();await list();}catch(e){$('shop-admin-status').textContent=e.message;}});
 $('sp-clear').addEventListener('click',()=>{$('shop-form').reset();$('sp-id').value='';});
 $('shop-refresh').addEventListener('click',()=>{list();admin();});
 const resultado=new URLSearchParams(location.search).get('resultado');if(resultado)$('shop-status').textContent=resultado==='pendiente'?'Si has pagado, Stripe confirmará el pedido al servidor. Comprueba el recibo de Stripe.':'No se ha completado el pago.';
 window.addEventListener('DOMContentLoaded',()=>{list();admin();});
 window.onLoginSuccess=()=>{list();admin();};window.onLogout=()=>{list();admin();};
})();
