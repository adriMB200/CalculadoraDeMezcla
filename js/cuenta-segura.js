(()=>{'use strict';
 const $=id=>document.getElementById(id),set=(txt)=>{$('mensaje').textContent=txt};
 const token=()=>localStorage.getItem('token');
 async function api(body){const res=await fetch('/.netlify/functions/cuentaSegura',{method:'POST',headers:{'Content-Type':'application/json',...(token()?{Authorization:'Bearer '+token()}:{})},body:JSON.stringify(body)});
  const data=await res.json();if(!res.ok)throw Error(data.error||'Error inesperado');return data;}
 const params=new URLSearchParams(location.search),verify=params.get('verificar');
 if(verify){history.replaceState({},'',location.pathname);api({action:'verificarCorreo',token:verify}).then(d=>set(d.mensaje)).catch(e=>set(e.message));}
 if(!token()){set('Debes iniciar sesión desde la portada.');document.querySelectorAll('form').forEach(f=>f.hidden=true);return;}
 fetch('/.netlify/functions/cuentaSegura',{headers:{Authorization:'Bearer '+token()}}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error||'Sesión caducada');return d;}).then(d=>{
  $('datosCuenta').textContent=`Usuario: ${d.usuario.username} · Correo: ${d.usuario.email||'Sin verificar'} · ${d.usuario.email_verificado?'Verificado':'Pendiente de verificación'}`;
 }).catch(e=>set(e.message));
 $('formEmail').addEventListener('submit',async e=>{e.preventDefault();const fd=new FormData(e.currentTarget);try{const d=await api({action:'prepararCorreo',email:fd.get('email'),password:fd.get('password')});set(d.mensaje);e.currentTarget.reset();}catch(err){set(err.message)}});
 $('formPassword').addEventListener('submit',async e=>{e.preventDefault();const fd=new FormData(e.currentTarget);if(fd.get('password')!==fd.get('confirmar'))return set('Las contraseñas no coinciden');
  try{const d=await api({action:'cambiarClave',actual:fd.get('actual'),password:fd.get('password')});localStorage.removeItem('token');localStorage.removeItem('user');set(d.mensaje+' Ya puedes volver al inicio.');e.currentTarget.reset();}catch(err){set(err.message)}});
})();
