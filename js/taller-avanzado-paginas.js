/* Fase 10.2: reutiliza los cálculos originales, activando solo el formulario de la página presente. */
import {calcularCostes, calcularDesarrollo, calcularSag} from './taller-calculos.mjs';
const euro=n=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(n);
const num=n=>new Intl.NumberFormat('es-ES',{maximumFractionDigits:2}).format(n);
const $=id=>document.getElementById(id);
const fmt=(form)=>Object.fromEntries([...new FormData(form)].map(([k,v])=>[k,Number(v)]));
function add(tag,text,parent){const n=document.createElement(tag);n.textContent=text;parent.append(n);return n;}
if ($('cost-form')) $('cost-form').addEventListener('submit',e=>{
 e.preventDefault();const out=$('cost-result');out.replaceChildren();
 try {const r=calcularCostes(fmt(e.currentTarget));add('p','Coste estimado por hora:',out);add('strong',euro(r.porHora)+'/h',out);add('p','Gasto total en el período: '+euro(r.total),out);
  const ul=document.createElement('ul');for(const [name,val] of Object.entries(r.desglose))add('li',name+': '+euro(val),ul);out.append(ul);
 }catch(err){add('p',err.message,out);}
});
if ($('gear-form')) $('gear-form').addEventListener('submit',e=>{
 e.preventDefault();const out=$('gear-result');out.replaceChildren();
 try{const r=calcularDesarrollo(fmt(e.currentTarget));add('p','Relación final actual: '+num(r.actual)+' · propuesta: '+num(r.nuevo),out);add('strong',(r.variacion>=0?'+':'')+num(r.variacion)+' %',out);add('p',r.indicacion,out);}catch(err){add('p',err.message,out);}
});
if ($('sag-form')) $('sag-form').addEventListener('submit',e=>{
 e.preventDefault();const out=$('sag-result');out.replaceChildren();
 try{const r=calcularSag(fmt(e.currentTarget));add('p','SAG estático: '+num(r.estatica)+' mm',out);add('p','SAG con piloto:',out);add('strong',num(r.dinamica)+' mm',out);add('p',num(r.porcentaje)+' % del recorrido útil indicado. Consulta el manual antes de ajustar.',out);}catch(err){add('p',err.message,out);}
});
if ($('copy-setup')) $('copy-setup').addEventListener('click',async()=>{
 const comp=$('click-comp').value,reb=$('click-reb').value,notes=$('setup-notes').value.trim();
 if(!comp||!reb){$('copy-state').textContent='Rellena ambos ajustes para copiarlos.';return;}
 const msg=`Enduro Nalón · Reglaje personal\nCompresión: ${comp} clics desde cerrado\nRebote: ${reb} clics desde cerrado\nNotas: ${notes||'Sin observaciones'}\nVerificar siempre el método de medida indicado en el manual.`;
 try{await navigator.clipboard.writeText(msg);$('copy-state').textContent='Reglaje copiado al portapapeles.';}catch{$('copy-state').textContent='No se pudo copiar: comprueba los permisos del navegador.';}
});
