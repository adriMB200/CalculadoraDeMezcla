/* Fase 10.2: calculadoras mecánicas originales, independientes por página. */
import {comprobarTolerancia,calcularHolguraDiametral,compararCarburacion} from './taller-mecanica-calculos.mjs';
const $ = id => document.getElementById(id);
const n = (form,key) => {
 const field=form.elements.namedItem(key);
 if (!field) return null;
 const text=field.value.trim();
 return text===''?null:Number(text);
};
const pretty=v=>new Intl.NumberFormat('es-ES',{maximumFractionDigits:4}).format(v);
function paint(target,lines,good){
 target.replaceChildren();target.classList.remove('enta-error','enta-good');
 target.classList.add(good?'enta-good':'enta-error');
 for(const [str,em] of lines){const node=document.createElement(em?'strong':'p');node.textContent=str;target.appendChild(node);}
}
const guide={
 'segmentos':'Segmento colocado a escuadra dentro del cilindro; medir la abertura entre extremos con galgas. Confirmar qué segmento es y la posición de medida del manual.',
 'ranura':'Holgura lateral segmento–ranura del pistón, con galgas y piezas limpias.',
 'biela-axial':'Juego lateral de la cabeza de biela. Medir con galgas según procedimiento del fabricante.',
 'biela-radial':'Juego radial de biela: requiere método e instrumentos específicos. No confundir con juego axial.',
 'bujia':'Separación entre electrodo central y lateral, medida con galgas adecuadas. Respetar tipo de bujía y manual del motor.'
};
if ($('mecanica-tipo')) $('mecanica-tipo').addEventListener('change', e=>{
 $('mecanica-guia').textContent=guide[e.target.value]||'';
});
if ($('mecanica-form')) $('mecanica-form').addEventListener('submit',e=>{
 e.preventDefault(); const f=e.currentTarget,out=$('mecanica-resultado');
 try{
  const medida=n(f,'medida'),minimo=n(f,'minimo'),maximo=n(f,'maximo');
  const tipo=f.elements.namedItem('tipo').value;
  const r=comprobarTolerancia({medida,minimo,maximo});
  paint(out,[[`${pretty(medida)} mm medidos`,true],[r.mensaje,false],['Origen de límites: los valores introducidos por ti (no precargados).',false]],r.estado==='dentro');
  if(r.estado==='sin-especificacion')out.classList.remove('enta-error');
  if(tipo==='biela-radial'){
   const p=document.createElement('p');p.textContent='Advertencia: el juego radial debe medirse con instrumental y método especificados; una lectura incorrecta puede resultar peligrosa.';out.append(p);
  }
 }catch(err){paint(out,[[err.message,false]],false);}
});
if ($('diametral-form')) $('diametral-form').addEventListener('submit',e=>{
 e.preventDefault(); const f=e.currentTarget,out=$('diametral-resultado');
 try {
   const r=calcularHolguraDiametral({diametroCilindro:n(f,'cilindro'),diametroPiston:n(f,'piston'),minimo:n(f,'minimo'),maximo:n(f,'maximo')});
   paint(out,[[`${pretty(r.medida)} mm de diferencia diametral`,true],[r.mensaje,false],['Medir en los ejes y alturas indicados por el fabricante; una resta no sustituye una comprobación de ovalización.',false]],r.estado==='dentro');
   if(r.estado==='sin-especificacion')out.classList.remove('enta-error');
 }catch(err){paint(out,[[err.message,false]],false);}
});
const symptoms={
 'ninguno':'El comportamiento real depende también de filtro, altitud, humedad, combustible, estado del motor y carburador.',
 'baja':'Si el problema se nota a pocas aperturas de gas, revisar primero ralentí, circuito de baja, tornillo de aire/mezcla y posibles entradas de aire según manual.',
 'media':'Si aparece a medio gas, revisar progresión, posición y tipo de aguja, nivel de cuba y estado de admisión.',
 'alta':'Si aparece a gas muy abierto, revisar circuito principal, alimentación de combustible, cuba, encendido y refrigeración. Evita pruebas prolongadas a plena carga.',
 'arranque':'Si cuesta arrancar, revisar procedimiento de arranque, estrangulador, bujía, nivel de cuba, combustible y compresión antes de reajustar.'
};
if ($('carburacion-form')) $('carburacion-form').addEventListener('submit',e=>{
 e.preventDefault(); const f=e.currentTarget,out=$('carburacion-resultado');
 try{
  const r=compararCarburacion({altitudBase:n(f,'altitudBase'),tempBase:n(f,'tempBase'),altitudActual:n(f,'altitudActual'),tempActual:n(f,'tempActual')});
  const symptom=f.elements.namedItem('sintoma').value;
  const jet=f.elements.namedItem('principal').value.trim();
  const pilot=f.elements.namedItem('baja').value.trim();
  const text=[
    [`Cambio estimado de densidad del aire: ${r.cambio>=0?'+':''}${pretty(r.cambio)} %`,true],
    [`Referencia: ${pretty(r.densidadBase)} kg/m³ · uso: ${pretty(r.densidadActual)} kg/m³`,false],
    [r.orientacion,false],
    [symptoms[symptom]||symptoms.ninguno,false]
  ];
  if(jet||pilot)text.push([`Configuración anotada: chiclé principal ${jet||'sin indicar'} · baja ${pilot||'sin indicar'}. No se calculan chiclés nuevos automáticamente.`,false]);
  text.push(['Simulación ISA, sin presión meteorológica real ni humedad. No es una receta de carburación. Verifica el manual y consulta a un profesional si detectas detonación o sobrecalentamiento.',false]);
  paint(out,text,Math.abs(r.cambio)<=5);out.classList.remove('enta-error');
 }catch(err){paint(out,[[err.message,false]],false);}
});
