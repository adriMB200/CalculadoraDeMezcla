// Funciones matemáticas puras; no acceden a red, DOM ni almacenamiento.
const valid = (n) => typeof n === 'number' && Number.isFinite(n) && n >= 0;
export function calcularCostes({horas,combustibleLitros,precioLitro,aceite,neumaticos,recambios,taller,otros}) {
  if(!valid(horas)||horas<=0)throw Error('Indica horas recorridas mayores que cero');
  const inputs=[combustibleLitros,precioLitro,aceite,neumaticos,recambios,taller,otros];
  if(inputs.some(x=>!valid(x)))throw Error('Introduce gastos positivos o cero');
  const gasolina=combustibleLitros*precioLitro;
  const total=gasolina+aceite+neumaticos+recambios+taller+otros;
  return {total,porHora:total/horas,desglose:{Gasolina:gasolina,'Aceite y filtros':aceite,Neumáticos:neumaticos,Recambios:recambios,Taller:taller,Otros:otros}};
}
export function calcularDesarrollo({pinionActual,coronaActual,pinionNuevo,coronaNueva}) {
 const ns=[pinionActual,coronaActual,pinionNuevo,coronaNueva];
 if(ns.some(v=>!Number.isSafeInteger(v)||v<9||v>80))throw Error('Dientes entre 9 y 80 (enteros)');
 const actual=coronaActual/pinionActual, nuevo=coronaNueva/pinionNuevo;
 const variacion=100*(nuevo/actual-1);
 return {actual,nuevo,variacion,indicacion:Math.abs(variacion)<.01?'Sin cambios':variacion>0?'Más corto: mayor multiplicación final, menor velocidad a igual régimen':'Más largo: menor multiplicación final, mayor velocidad a igual régimen'};
}
export function calcularSag({extendida,libre,piloto,recorrido}) {
 if([extendida,libre,piloto,recorrido].some(v=>!valid(v)||v<=0))throw Error('Introduce medidas y recorrido positivos');
 if(!(extendida>=libre&&libre>=piloto))throw Error('Medidas incoherentes: extendida ≥ moto apoyada ≥ piloto');
 const estatica=extendida-libre,dinamica=extendida-piloto;
 if(dinamica>recorrido)throw Error('El SAG con piloto supera el recorrido indicado');
 return {estatica,dinamica,porcentaje:100*dinamica/recorrido};
}
