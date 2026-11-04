/*
 * ENDURO_NALON_AUTORIA_V15
 * ENDURO NALÓN — Enduro, rutas y compañerismo en Asturias
 * Fundador y responsable del proyecto: Adrian Martis Blanco
 * GitHub: https://github.com/adriMB200
 * Web: https://enduronalon.netlify.app/
 * Copyright (c) 2026 Adrian Martis Blanco. Derechos reservados sobre las contribuciones originales.
 * Las bibliotecas, obras y contribuciones de terceros conservan sus licencias y autoría.
 */

(()=>{'use strict';const f=document.getElementById('f13-resend'),s=document.getElementById('f13-resend-status');f.addEventListener('submit',async e=>{e.preventDefault();const email=new FormData(f).get('email');s.textContent='Enviando solicitud…';try{const res=await fetch('/.netlify/functions/singUp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'reenviar',email})});const d=await res.json().catch(()=>({}));s.textContent=res.ok?d.mensaje:(d.error||'No se pudo completar');}catch{s.textContent='No se pudo contactar con el servidor';}});})();
