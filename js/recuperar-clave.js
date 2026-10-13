(()=>{'use strict';const $=id=>document.getElementById(id),set=m=>$('mensaje').textContent=m;
 const urlParams=new URLSearchParams(location.search),token=urlParams.get('token');
 // El token desaparece de la barra del navegador inmediatamente.
 if(token){history.replaceState({},'',location.pathname);$('solicitud').hidden=true;$('restablecer').hidden=false;}
 async function api(body){const r=await fetch('/.netlify/functions/cuentaSegura',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 const j=await r.json();if(!r.ok)throw Error(j.error||'Error de conexión');return j;}
 $('formSolicitud').addEventListener('submit',async e=>{e.preventDefault();const fd=new FormData(e.currentTarget);try{const j=await api({action:'solicitarRecuperacion',identificador:fd.get('identificador')});set(j.mensaje);e.currentTarget.reset()}catch(err){set(err.message)}});
 $('formNueva').addEventListener('submit',async e=>{e.preventDefault();const fd=new FormData(e.currentTarget);if(fd.get('password')!==fd.get('confirmar'))return set('Las contraseñas no coinciden');
 try{const j=await api({action:'aplicarRecuperacion',token,password:fd.get('password')});$('restablecer').hidden=true;set(j.mensaje);}catch(err){set(err.message)}});
})();
