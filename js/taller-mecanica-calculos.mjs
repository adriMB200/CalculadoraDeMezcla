/** Cálculos puramente orientativos. Las tolerancias siempre proceden del manual introducido por el usuario. */
const finite = n => typeof n === 'number' && Number.isFinite(n);
const isNonnegative = n => finite(n) && n >= 0;

export function comprobarTolerancia({medida,minimo,maximo}) {
  if(!isNonnegative(medida)) throw Error('Indica una medida no negativa y válida.');
  if(minimo === null || maximo === null || minimo === undefined || maximo === undefined)
    return {estado:'sin-especificacion',mensaje:'Introduce el mínimo y el máximo del manual para comprobar esta medición.'};
  if(!isNonnegative(minimo)||!isNonnegative(maximo)||minimo>maximo)
    throw Error('Los límites del manual deben ser válidos y el mínimo no puede superar al máximo.');
  if(medida<minimo)return {estado:'bajo',diferencia:minimo-medida,mensaje:'Por debajo del mínimo indicado en tu manual.'};
  if(medida>maximo)return {estado:'alto',diferencia:medida-maximo,mensaje:'Por encima del máximo indicado en tu manual.'};
  return {estado:'dentro',diferencia:Math.min(medida-minimo,maximo-medida),mensaje:'Dentro del intervalo que has introducido del manual.'};
}
export function calcularHolguraDiametral({diametroCilindro,diametroPiston,minimo,maximo}) {
  if(!finite(diametroCilindro)||!finite(diametroPiston)||diametroCilindro<=0||diametroPiston<=0||diametroPiston>=diametroCilindro)
    throw Error('El diámetro interior medido debe superar al del pistón, ambos en mm.');
  const medida=Number((diametroCilindro-diametroPiston).toFixed(4));
  return {medida,...comprobarTolerancia({medida,minimo,maximo})};
}
/** Densidad atmosférica estimada, con atmósfera estándar ISA y temperatura local suministrada. */
export function densidadAire({altitud,temperatura}) {
  if(!finite(altitud)||altitud<0||altitud>4500||!finite(temperatura)||temperatura< -30||temperatura>65)
    throw Error('Usa altitudes entre 0 y 4500 m y temperaturas entre −30 y 65 °C.');
  const presion=101325*Math.pow(1-2.25577e-5*altitud,5.25588);
  return presion/(287.05*(temperatura+273.15));
}
export function compararCarburacion({altitudBase,tempBase,altitudActual,tempActual}) {
  const base=densidadAire({altitud:altitudBase,temperatura:tempBase});
  const actual=densidadAire({altitud:altitudActual,temperatura:tempActual});
  const cambio=100*(actual/base-1);
  return {
    densidadBase:base,densidadActual:actual,cambio,
    orientacion:cambio < -5
      ? 'Menos densidad de aire: con la misma carburación puede aparecer una tendencia a mezcla rica. Comprobar antes de modificar chiclés.'
      : cambio > 5
        ? 'Más densidad de aire: con la misma carburación puede aparecer una tendencia a mezcla pobre. Comprobar antes de modificar chiclés.'
        : 'Diferencia de densidad moderada: no implica necesariamente un cambio de carburación.'
  };
}
