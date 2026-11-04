/*
 * ENDURO_NALON_AUTORIA_V15
 * ENDURO NALÓN — Enduro, rutas y compañerismo en Asturias
 * Fundador y responsable del proyecto: Adrian Martis Blanco
 * GitHub: https://github.com/adriMB200
 * Web: https://enduronalon.netlify.app/
 * Copyright (c) 2026 Adrian Martis Blanco. Derechos reservados sobre las contribuciones originales.
 * Las bibliotecas, obras y contribuciones de terceros conservan sus licencias y autoría.
 */

(()=>{'use strict';
 window.confirmarBorradoMantenimiento=async function(){
  if(!('HTMLDialogElement'in window))return window.confirm('¿Eliminar definitivamente este mantenimiento? Esta acción no se puede deshacer.');
  return new Promise(resolve=>{
   const dialog=document.createElement('dialog');dialog.className='f13-dialog';dialog.setAttribute('aria-labelledby','f13-delete-heading');
   const title=document.createElement('h2');title.id='f13-delete-heading';title.textContent='¿Eliminar mantenimiento?';
   const detail=document.createElement('p');detail.textContent='Se borrará definitivamente el registro de tu historial. Esta acción no se puede deshacer.';
   const form=document.createElement('form');form.method='dialog';
   const cancel=document.createElement('button');cancel.className='f13-btn f13-btn--plain';cancel.type='submit';cancel.value='cancelar';cancel.textContent='Cancelar';
   const remove=document.createElement('button');remove.className='f13-btn';remove.type='submit';remove.value='borrar';remove.textContent='Sí, eliminar';
   form.append(cancel,remove);dialog.append(title,detail,form);document.body.append(dialog);
   dialog.addEventListener('close',()=>{const confirmed=dialog.returnValue==='borrar';dialog.remove();resolve(confirmed);},{once:true});dialog.showModal();
  });
 };
})();
