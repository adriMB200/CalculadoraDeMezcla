(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const form=$('f13-avatar-form');if(!form)return;
  const imagen=$('f13-avatar-preview'),archivo=$('f13-avatar-file'),mensaje=$('f13-avatar-msg');
  const canvas=$('f18-avatar-canvas'),zoom=$('f18-avatar-zoom'),girar=$('f18-avatar-girar');
  const publicar=form.querySelector('button[type="submit"]');
  let foto=null,rotacion=0,imagenUrl=null,subiendo=false;
  const token=()=>typeof window.getToken==='function'?window.getToken():localStorage.getItem('token');
  const decir=(msg,error=false)=>{mensaje.textContent=msg;mensaje.dataset.error=String(error);};
  function liberar(){if(imagenUrl){URL.revokeObjectURL(imagenUrl);imagenUrl=null;}}
  function dibujar(){
    const ctx=canvas.getContext('2d');if(!ctx||!foto)return;
    const size=canvas.width;ctx.clearRect(0,0,size,size);
    const lado=Math.min(foto.naturalWidth,foto.naturalHeight)/Number(zoom.value);
    ctx.save();ctx.translate(size/2,size/2);ctx.rotate(rotacion*Math.PI/180);
    ctx.drawImage(foto,(foto.naturalWidth-lado)/2,(foto.naturalHeight-lado)/2,lado,lado,-size/2,-size/2,size,size);
    ctx.restore();canvas.hidden=false;
  }
  async function cargarActual(){
    liberar();
    if(!token()){imagen.removeAttribute('src');imagen.alt='Sin foto de perfil';return;}
    try{
      const res=await fetch('/.netlify/functions/mediaClub?tipo=avatar',{headers:{Authorization:'Bearer '+token()},cache:'no-store'});
      if(res.status===404){imagen.removeAttribute('src');imagen.alt='Aún no hay foto de perfil';return;}
      if(!res.ok)throw Error('No se pudo consultar la foto');
      imagenUrl=URL.createObjectURL(await res.blob());imagen.src=imagenUrl;imagen.alt='Foto de perfil actual';
    }catch{imagen.removeAttribute('src');decir('No se ha podido mostrar tu foto guardada. Puedes intentar de nuevo.',true);}
  }
  archivo.addEventListener('change',()=>{
    const f=archivo.files?.[0];foto=null;canvas.hidden=true;rotacion=0;zoom.value='1';
    if(!f)return;
    if(!/\.jpg$/i.test(f.name)||f.type!=='image/jpeg'||f.size>2_000_000){decir('Elige una imagen .jpg de hasta 2 MB.',true);archivo.value='';return;}
    const temporary=URL.createObjectURL(f),src=new Image();
    src.onload=()=>{URL.revokeObjectURL(temporary);foto=src;dibujar();decir('Ajusta el recorte antes de guardar.');};
    src.onerror=()=>{URL.revokeObjectURL(temporary);decir('No se pudo leer esta imagen JPEG.',true);};
    src.src=temporary;
  });
  zoom.addEventListener('input',dibujar);
  girar.addEventListener('click',()=>{rotacion=(rotacion+90)%360;dibujar();});
  form.addEventListener('submit',async e=>{
    e.preventDefault();if(subiendo)return;
    if(!token()){decir('Inicia sesión para guardar tu foto.',true);return;}
    if(!foto){decir('Selecciona una fotografía primero.',true);return;}
    subiendo=true;publicar.disabled=true;decir('Guardando fotografía…');
    try{
      const dataURL=canvas.toDataURL('image/jpeg',0.84);
      const imagenBase64=dataURL.split(',')[1];
      const response=await fetch('/.netlify/functions/fotoPerfil',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token()},body:JSON.stringify({action:'subir',nombreArchivo:'avatar.jpg',imagenBase64})});
      const data=await response.json().catch(()=>({}));if(!response.ok)throw Error(data.error||'No se pudo subir la fotografía');
      decir('Foto guardada correctamente.');foto=null;archivo.value='';canvas.hidden=true;await cargarActual();
    }catch(err){decir(err.message||'No se pudo guardar.',true);}finally{subiendo=false;publicar.disabled=false;}
  });
  $('f13-avatar-delete').addEventListener('click',async()=>{
    if(subiendo||!window.confirm('¿Eliminar tu fotografía actual?'))return;
    if(!token()){decir('Inicia sesión primero.',true);return;}
    subiendo=true;try{
      const res=await fetch('/.netlify/functions/fotoPerfil',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token()},body:JSON.stringify({action:'eliminar'})});
      if(!res.ok)throw Error('No se pudo quitar la fotografía');
      foto=null;archivo.value='';canvas.hidden=true;await cargarActual();decir('Fotografía eliminada.');
    }catch(err){decir(err.message,true);}finally{subiendo=false;}
  });
  window.addEventListener('pagehide',liberar,{once:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',cargarActual,{once:true});else cargarActual();
})();
