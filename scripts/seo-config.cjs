'use strict';
/** Enduro Nalón — SEO público. Mantener únicamente URLs públicas y útiles. */
const BASE = 'https://enduronalon.netlify.app';
const pages = {
  'index.html': ['Enduro Nalón | Club de enduro y rutas en Asturias', 'Enduro Nalón es una comunidad de aficionados al enduro en Asturias. Rutas, mecánica, calculadoras 2T, mantenimiento y experiencias en moto.'],
  'historia.html': ['Historia de Enduro Nalón | Fundador y origen del club', 'Conoce la historia de Enduro Nalón, club de enduro fundado por Adrian Martis Blanco en Asturias, y su pasión por las rutas y el compañerismo.'],
  'club.html': ['Club Enduro Nalón | Enduro y comunidad en Asturias', 'Conoce el club Enduro Nalón: una comunidad para compartir salidas, experiencias y afición por las motos de enduro en Asturias.'],
  'rutas.html': ['Rutas y quedadas de enduro | Enduro Nalón', 'Consulta las rutas y quedadas de Enduro Nalón, participa en las salidas del club y descubre la comunidad de aficionados al enduro.'],
  'mapa-rutas.html': ['Mapa de rutas GPX de enduro | Enduro Nalón', 'Explora el mapa interactivo de Enduro Nalón, consulta rutas revisadas e importa tus GPX para visualizar recorridos de enduro.'],
  'calculadora.html': ['Calculadora de mezcla 2T: gasolina y aceite | Enduro Nalón', 'Calcula cuántos mililitros de aceite necesitas para una mezcla de gasolina de motor 2 tiempos. Herramienta gratuita de Enduro Nalón.'],
  'tablas.html': ['Pares de apriete y fichas técnicas de motos | Enduro Nalón', 'Consulta fichas técnicas, pares de apriete y documentación de motos de enduro. Verifica cada dato con el manual de tu modelo.'],
  'buscar-moto.html': ['Buscar manuales y datos de tu moto | Enduro Nalón', 'Busca modelos de enduro y consulta fichas técnicas, manuales disponibles y valores de mantenimiento según la motocicleta.'],
  'gg_04-06.html': ['Pares de apriete GASGAS 250/300 2004–2006 | Enduro Nalón', 'Consulta la ficha de pares de apriete de GASGAS EC 250/300 de 2004 a 2006. Contrasta los valores con el manual de taller.'],
  'ktm300_2017.html': ['Pares de apriete KTM EXC 300 2017 | Enduro Nalón', 'Ficha de pares de apriete para KTM EXC 300 2017. Comprueba los valores de cada componente con la documentación oficial de tu moto.'],
  'ktm450_2003.html': ['Pares de apriete KTM 450 2003 | Enduro Nalón', 'Tabla de pares de apriete de KTM 450 de 2003. Consulta las especificaciones y verifica cada dato antes de realizar un mantenimiento.'],
  'taller-avanzado.html': ['Taller avanzado para motos de enduro | Enduro Nalón', 'Herramientas de mecánica de enduro: coste por hora, desarrollos, suspensiones, tolerancias de motor y carburación.'],
  'taller-costes.html': ['Calculadora de coste por hora de tu moto | Enduro Nalón', 'Calcula el coste de uso de tu moto de enduro por hora a partir de gasolina, aceite, neumáticos, reparaciones y otros gastos.'],
  'taller-desarrollos.html': ['Calculadora de desarrollos: piñón y corona | Enduro Nalón', 'Compara desarrollos de transmisión de tu moto de enduro cambiando piñón y corona. Calcula la diferencia entre relaciones.'],
  'taller-suspensiones.html': ['Calculadora SAG y ajustes de suspensión | Enduro Nalón', 'Calcula el SAG estático y con piloto y registra reglajes de suspensión para diferentes terrenos de enduro.'],
  'taller-tolerancias.html': ['Tolerancias de motor, segmentos y bujías | Enduro Nalón', 'Comprueba holguras de segmentos, biela, pistón y separación de bujía con los límites del manual de taller de tu moto.'],
  'taller-carburacion.html': ['Carburación por altitud y temperatura | Enduro Nalón', 'Calculadora orientativa para revisar la carburación de una moto según altitud y temperatura. Consulta siempre el manual del motor.'],
  'foro.html': ['Foro de motos de enduro y mecánica | Enduro Nalón', 'Foro de Enduro Nalón para hablar de motos, mecánica, mantenimiento, recambios y experiencias de enduro entre aficionados.'],
  'galeria.html': ['Galería de fotos de enduro | Enduro Nalón', 'Fotos de motos y salidas del club Enduro Nalón. Descubre la galería de la comunidad y envía imágenes JPG para revisión.'],
  'mercadillo.html': ['Mercadillo de recambios y equipación enduro | Enduro Nalón', 'Explora anuncios de recambios, equipación y accesorios relacionados con las motos de enduro en el mercadillo de Enduro Nalón.'],
  'tienda.html': ['Tienda Enduro Nalón | Chaquetas, chalecos y pegatinas', 'Conoce la tienda de Enduro Nalón: chaquetas, chalecos, pegatinas y artículos oficiales del club, según disponibilidad.']
};
// Páginas de sesión, operaciones sensibles, formularios personales y textos legales.
const privatePages = new Set([
  'admin.html','mi-cuenta.html','mi-garaje.html','mantenimientos.html',
  'avisos.html','recuperar-clave.html','verificar-cuenta.html',
  'aviso-legal.html','privacidad.html','politica-cookies.html','normas-mercadillo.html'
]);
const publicURL = (name) => name === 'index.html' ? `${BASE}/` : `${BASE}/${name}`;
module.exports = {BASE,pages,privatePages,publicURL};
