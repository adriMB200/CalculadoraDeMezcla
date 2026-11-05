/** Límite perimetral gratuito por IP para peticiones a Netlify Functions.
 * Verificar que la regla aparece en el log de despliegue de Netlify.
 */
export default async function limiteApi(request, context) {
  return context.next();
}
export const config = {
  path: '/.netlify/functions/*',
  rateLimit: {
    windowLimit: 90,
    windowSize: 60,
    aggregateBy: ['ip','domain']
  }
};
