/** Enduro Nalón: modelos de selección (no constituyen fichas de pares ni homologación por año). */
export const MODELOS_GARAJE_18 = Object.freeze({
  KTM: ['125 XC-W','250 XC-W','300 EXC HARDENDURO','300 EXC 6DAYS','EXC 125','EXC 200','EXC 250','EXC 300','EXC 380','EXC 400','EXC 450','EXC 500','EXC 525','EXC-F 250','EXC-F 350','EXC-F 450','EXC-F 500','EXC-F 530','Freeride 250 R'],
  GASGAS: ['EC 125','EC 200','EC 250','EC 300','EC 300 GP','EC 250F','EC 350F','EC 450F','EC 500F'],
  HUSQVARNA: ['TE 125','TE 150','TE 250','TE 300','TE 300 PRO','FE 250','FE 350','FE 350 PRO','FE 450','FE 501','WR 125','WR 250','WR 300'],
  BETA: ['RR 2T 125','RR 2T 200','RR 2T 250','RR 2T 300','RR 4T 350','RR 4T 390','RR 4T 430','RR 4T 480','RR X-PRO 2T 125','RR X-PRO 2T 200','RR X-PRO 2T 250','RR X-PRO 2T 300','RR X-PRO 4T 350','RR X-PRO 4T 390','RR X-PRO 4T 430','RR X-PRO 4T 480','XTRAINER 250','XTRAINER 300'],
  SHERCO: ['125 SE','250 SE','300 SE','125 SE FACTORY','250 SE FACTORY','300 SE FACTORY','250 SE XTREM','300 SE XTREM','250 SEF','300 SEF','450 SEF','500 SEF','250 SEF FACTORY','300 SEF FACTORY','450 SEF FACTORY','500 SEF FACTORY'],
  RIEJU: ['MR 250','MR 300','MR RACING 300','MR PRO 300','MR 300i','MR RACING 300i','MR PRO 300i','MR HARD ENDURO 300i','Marathon 125','Marathon 125 Pro'],
  FANTIC: ['XE 125','XE 300','XEF 250','XEF 310','XEF 450'],
  YAMAHA: ['WR 125 R','WR 250 F','WR 450 F','WR 250 R','WR 250 Z'],
  HONDA: ['CRF 250 X','CRF 450 X','CRF 250 RX','CRF 450 RX'],
  TM: ['EN 125','EN 144','EN 250 2T','EN 300 2T','EN 250 Fi','EN 300 Fi','EN 450 Fi'],
  SWM: ['RS 125 R','RS 300 R','RS 500 R'],
  BMW: ['Funduro 650']
});
export const MODELOS_OFICIALES_2026 = Object.freeze([
  ...['125 XC-W','250 XC-W','300 EXC'].map((modelo,i)=>({marca:'KTM',modelo,anio:2026,motor:'2T',cilindradaClase:['125 cc','250 cc','300 cc'][i],fuente:'https://www.ktm.com/es-es/ktm-world/news/limites-redefinidos--lanzamiento-de-la-gama-ktm-enduro-2026.html'})),
  ...['EXC-F 250','EXC-F 350','EXC-F 450','EXC-F 500'].map((modelo,i)=>({marca:'KTM',modelo,anio:2026,motor:'4T',cilindradaClase:['250 cc','350 cc','450 cc','500 cc'][i],fuente:'https://www.ktm.com/es-es/ktm-world/news/limites-redefinidos--lanzamiento-de-la-gama-ktm-enduro-2026.html'})),
  ...['EC 300','EC 350F','EC 500F'].map((modelo,i)=>({marca:'GASGAS',modelo,anio:2026,motor:i===0?'2T':'4T',cilindradaClase:['300 cc','350 cc','500 cc'][i],fuente:'https://www.gasgas.com/es-es/news/igasgas-revela-el-nuevo-y-radical-look-de-su-gama-offroad-2026-.html'})),
  ...['125 SE FACTORY','250 SE FACTORY','300 SE FACTORY','250 SEF FACTORY','300 SEF FACTORY','450 SEF FACTORY','500 SEF FACTORY','250 SE XTREM','300 SE XTREM'].map(modelo=>({marca:'SHERCO',modelo,anio:2026,motor:modelo.includes('SEF')?'4T':'2T',cilindradaClase:modelo.match(/\d{3}/)?.[0]+' cc',fuente:'https://www.sherco.com/es/motos-es'}))
]);
export function combinarModelos(...fuentes) {
  const resultado = {};
  for (const fuente of fuentes) for (const [marca, modelos] of Object.entries(fuente || {})) {
    const clave = marca.toUpperCase() === 'GASGAS' ? 'GASGAS' : marca.toUpperCase();
    resultado[clave] ||= [];
    for (const modelo of modelos || []) if (!resultado[clave].some(x => x.toLowerCase()===String(modelo).toLowerCase())) resultado[clave].push(String(modelo));
  }
  for (const modelos of Object.values(resultado)) modelos.sort((a,b)=>a.localeCompare(b,'es',{numeric:true}));
  return resultado;
}
export function integrarCatalogo2026(catalogo) {
  for(const item of MODELOS_OFICIALES_2026) {
    let moto=catalogo.find(m=>m.marca.toUpperCase()===item.marca && m.modelo.toUpperCase()===item.modelo.toUpperCase());
    if(!moto){moto={id:`f18-${item.marca.toLowerCase()}-${item.modelo.toLowerCase().replace(/[^a-z0-9]+/g,'-')}`,marca:item.marca,modelo:item.modelo,anios:[],recursos:[],fichasPorAnio:{}};catalogo.push(moto);}
    if(!moto.anios.includes(item.anio)) moto.anios.push(item.anio);
    moto.fichasPorAnio ||= {};
    moto.fichasPorAnio[item.anio] ||= {motor:item.motor,cilindradaClase:item.cilindradaClase,nota:'Identificación de gama comercial: consulta el manual específico para pares y tolerancias.'};
    const recurso={tipo:'Información del fabricante',titulo:`Modelo oficial ${item.anio} (sin manual técnico específico)`,enlace:item.fuente,anios:[item.anio],origen:'Fabricante'};
    if(!moto.recursos.some(r=>r.enlace===recurso.enlace && r.anios?.includes(item.anio)))moto.recursos.push(recurso);
    moto.anios.sort((a,b)=>a-b);
  }
  return catalogo;
}
