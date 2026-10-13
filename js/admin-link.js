// El menú se muestra solo si el servidor valida los permisos; el servidor protege además todas las operaciones.
(()=>{'use strict';const token=localStorage.getItem('token');if(!token)return;
 const nav=document.querySelector('.en-nav, header nav');if(!nav)return;
 if(!nav.querySelector('a[href="mi-cuenta.html"]')){const link=document.createElement('a');link.href='mi-cuenta.html';link.textContent='Mi cuenta';nav.append(link);}
 fetch('/.netlify/functions/adminUsuarios?scope=acceso',{headers:{Authorization:'Bearer '+token}})
 .then(r=>r.ok?r.json():null).then(data=>{if(data?.administrador && !nav.querySelector('a[href="admin.html"]')){
  const link=document.createElement('a');link.href='admin.html';link.textContent='Administración';nav.append(link);
 }}).catch(()=>{});
})();
