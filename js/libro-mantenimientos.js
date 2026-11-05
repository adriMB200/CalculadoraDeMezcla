import { MODELOS_GARAJE_18, combinarModelos } from './fase18-modelos.mjs';

const $ = id => document.getElementById(id);
const estado = $('f18-estado');
const lista = $('motoList');
const formMoto = $('motoForm');
const formMant = $('f18-mant-form');
const modal = $('f18-mant-dialog');
const confirmacion = $('f18-borrar-dialog');
const resumen = $('f18-resumen');
let matriculaActual = null;
let ocupado = false;
let generacion = 0;
const maxLectura = { h: 1000000, km: 10000000 };

function status(texto, error=false) { if(estado) { estado.textContent=texto; estado.dataset.error=String(error); } }
function nodo(tag,clase,texto) { const el=document.createElement(tag);if(clase)el.className=clase;if(texto!==undefined)el.textContent=String(texto);return el; }
function token() { return typeof window.getToken==='function'?window.getToken():null; }
function acceso() { if(!token()){ window.openAuthModal?.();status('Inicia sesión para consultar el libro de mantenimientos.');return false;}return true; }
async function api(name,options={}) {
  const cred=token();if(!cred)throw Error('La sesión no está iniciada.');
  const res=await fetch('/.netlify/functions/'+name,{...options,headers:{...(options.body?{'Content-Type':'application/json'}:{}),Authorization:'Bearer '+cred,...options.headers},cache:'no-store'});
  const body=await res.json().catch(()=>({}));
  if(!res.ok){if(res.status===401){status('Sesión caducada. Vuelve a iniciar sesión.',true);}const defecto={429:'Demasiadas peticiones. Espera un poco.',503:'Servicio temporalmente no disponible.'}[res.status];throw new Error(body.error || defecto || `Error HTTP ${res.status}`);}
  return body;
}
function prepararModelos(){
  const marcas=combinarModelos(MODELOS_GARAJE_18);
  const marca=$('marca'),modelo=$('modelo');
  const previa=marca.value;
  marca.replaceChildren(new Option('Selecciona una marca',''));
  for(const nombre of Object.keys(marcas).sort((a,b)=>a.localeCompare(b,'es')))marca.add(new Option(nombre,nombre));
  marca.addEventListener('change',()=>{
    modelo.replaceChildren(new Option('Selecciona un modelo',''));
    for(const nombre of marcas[marca.value]||[])modelo.add(new Option(nombre,nombre));
  });
  if(marcas[previa]){marca.value=previa;marca.dispatchEvent(new Event('change'));}
  const ano=$('anio');
  ano.replaceChildren(new Option('Selecciona el año',''));
  for(let y=new Date().getFullYear()+1;y>=1980;y--)ano.add(new Option(String(y),String(y)));
}
function unidadTexto(m){
  if(m.unidad==='km')return m.kilometros===null||m.kilometros===undefined?'Sin lectura':' '+m.kilometros+' km';
  return m.horas===null||m.horas===undefined?'Sin lectura':' '+m.horas+' h';
}
function lecturaCorta(m){const horas=m.mantenimientos.filter(x=>x.unidad!=='km'&&x.horas!=null).map(x=>Number(x.horas)).filter(Number.isFinite);const km=m.mantenimientos.filter(x=>x.unidad==='km'&&x.kilometros!=null).map(x=>Number(x.kilometros)).filter(Number.isFinite);return [horas.length?Math.max(...horas)+' h':null,km.length?Math.max(...km)+' km':null].filter(Boolean).join(' · ')||'Sin lecturas';}
function textoFecha(value){const d=new Date(value);return Number.isFinite(d.getTime())?d.toLocaleDateString('es-ES'):'Fecha no disponible';}
function campoLectura(){
  const km=$('f18-mant-unidad').value==='km';$('f18-lectura-label').textContent=km?'Kilómetros del contador':'Horas del contador';
  const input=$('f18-mant-lectura');input.max=km?'10000000':'1000000';input.placeholder=km?'Ej.: 8400':'Ej.: 125';input.value='';
}
function abrir(matricula){if(!acceso())return;matriculaActual=matricula;formMant.reset();campoLectura();$('f18-mant-estado').textContent='';modal.showModal();$('f18-mant-descripcion').focus();}
function preguntarBorrado(detalle){return new Promise(resolve=>{
  $('f18-borrar-detalle').textContent=detalle;
  const cancelar=$('f18-borrar-cancelar'),aceptar=$('f18-borrar-aceptar');
  let acabado=false;
  const salir=valor=>{if(acabado)return;acabado=true;cancelar.removeEventListener('click',no);aceptar.removeEventListener('click',si);confirmacion.removeEventListener('cancel',cancel);confirmacion.close();resolve(valor);};
  const no=()=>salir(false),si=()=>salir(true),cancel=e=>{e.preventDefault();salir(false);};
  cancelar.addEventListener('click',no);aceptar.addEventListener('click',si);confirmacion.addEventListener('cancel',cancel);
  confirmacion.showModal();
});}
async function borrar(item){
  if(ocupado)return;
  if(!(await preguntarBorrado(`${item.descripcion||'Mantenimiento'} · ${unidadTexto(item).trim()}`)))return;
  ocupado=true;try{await api('deleteMantenimiento',{method:'POST',body:JSON.stringify({id:Number(item.id)})});status('Mantenimiento eliminado.');await cargar();}
  catch(err){status(err.message,true);}finally{ocupado=false;}
}
function tarjetaMoto(moto){
  const card=nodo('article','f18-moto');
  const cab=nodo('div','f18-moto-head');
  const titulo=nodo('h3','',`${moto.marca} ${moto.modelo} · ${moto.anio}`);
  const subtitulo=nodo('p','f18-meta',`Identificador: ${moto.matricula} · ${lecturaCorta(moto)}`);
  const boton=nodo('button','f18-primary','+ Registrar mantenimiento');boton.type='button';boton.addEventListener('click',()=>abrir(moto.matricula));
  const titulobox=nodo('div');titulobox.append(titulo,subtitulo);cab.append(titulobox,boton);card.append(cab);
  const historial=nodo('ul','f18-historial');
  if(!moto.mantenimientos.length)historial.append(nodo('li','f18-empty','Aún no has registrado mantenimientos.'));
  for(const m of moto.mantenimientos){
    const li=nodo('li','f18-registro');const info=nodo('div');
    info.append(nodo('span','f18-trabajo',m.descripcion),nodo('small','f18-meta',`${textoFecha(m.fecha)} · ${unidadTexto(m).trim()}`));
    const quitar=nodo('button','f18-danger','Eliminar');quitar.type='button';quitar.setAttribute('aria-label',`Eliminar ${m.descripcion}`);quitar.addEventListener('click',()=>borrar(m));
    li.append(info,quitar);historial.append(li);
  }
  card.append(historial);return card;
}
async function cargar(){
  const indice=++generacion;
  lista.replaceChildren();if(!token()){status('Accede a tu cuenta para consultar tus motos.');resumen.textContent='';return;}
  status('Cargando tus motos y mantenimientos…');
  try{
    const result=await api('getMotos');if(indice!==generacion)return;
    const motos=Array.isArray(result)?result:result.motos;
    if(!Array.isArray(motos))throw Error('La respuesta del servidor no es válida.');
    for(const moto of motos){moto.mantenimientos=Array.isArray(moto.mantenimientos)?moto.mantenimientos:[];lista.append(tarjetaMoto(moto));}
    if(!motos.length)lista.append(nodo('p','f18-empty','Todavía no tienes motos. Añade una para empezar tu libro.'));
    const total=motos.reduce((n,m)=>n+m.mantenimientos.length,0);
    resumen.textContent=`${motos.length} ${motos.length===1?'moto':'motos'} · ${total} ${total===1?'mantenimiento':'mantenimientos'} visibles`;
    status(total>=1000?'Se muestran como máximo 1.000 mantenimientos recientes por consulta; el resto sigue guardado en Neon.':'');
  }catch(err){if(indice!==generacion)return;status(err.message||'No se pudo cargar el libro. Comprueba la migración de Neon.',true);}
}
async function registrar(event){
  event.preventDefault();if(ocupado||!formMant.reportValidity())return;
  const lectura=$('f18-mant-lectura').value.trim(),unidad=$('f18-mant-unidad').value;
  if(!/^\d+$/.test(lectura)||!Number.isSafeInteger(Number(lectura))||Number(lectura)>maxLectura[unidad]){$('f18-mant-estado').textContent='Introduce una lectura entera dentro del rango.';return;}
  ocupado=true;const guardar=$('f18-mant-guardar');guardar.disabled=true;
  $('f18-mant-estado').textContent='Guardando…';
  try{await api('addMantenimiento',{method:'POST',body:JSON.stringify({matricula:matriculaActual,descripcion:$('f18-mant-descripcion').value.trim(),unidad,lectura:Number(lectura)})});modal.close();status('Mantenimiento registrado.');await cargar();}
  catch(err){$('f18-mant-estado').textContent=err.message;}finally{ocupado=false;guardar.disabled=false;}
}
async function agregarMoto(event){
  event.preventDefault();if(ocupado||!formMoto.reportValidity()||!acceso())return;
  const matricula=window.prompt('Identificador de la moto o matrícula (3–20 caracteres: letras, números, guion o _):');
  if(matricula===null)return;
  if(!/^[A-Za-z0-9_-]{3,20}$/.test(matricula.trim())){status('El identificador debe tener entre 3 y 20 caracteres (letras, números, _ o -).',true);return;}
  ocupado=true;const boton=formMoto.querySelector('[type=submit]');boton.disabled=true;
  try{
    await api('addMoto',{method:'POST',body:JSON.stringify({matricula:matricula.trim().toUpperCase(),marca:$('marca').value,modelo:$('modelo').value,anio:Number($('anio').value)})});formMoto.reset();$('modelo').replaceChildren(new Option('Selecciona un modelo',''));status('Moto añadida correctamente.');await cargar();
  }catch(err){status(err.message,true);}finally{ocupado=false;boton.disabled=false;}
}
function iniciar(){
  if(!lista||!formMoto||!modal||!formMant)return;
  prepararModelos();$('f18-mant-unidad').addEventListener('change',campoLectura);
  $('f18-mant-cancelar').addEventListener('click',()=>{if(!ocupado)modal.close();});
  modal.addEventListener('cancel',event=>{if(ocupado)event.preventDefault();});
  formMant.addEventListener('submit',registrar);formMoto.addEventListener('submit',agregarMoto);
  window.onAuthReady=cargar;window.onLoginSuccess=cargar;window.onLogout=()=>{generacion++;lista.replaceChildren();status('Has cerrado sesión.');resumen.textContent='';};
  cargar();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar,{once:true});else iniciar();
