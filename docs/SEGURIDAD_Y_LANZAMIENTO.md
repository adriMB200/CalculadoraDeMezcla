# Revisión de seguridad y condiciones para publicar — Fase 13

## Obligatorio antes de producción

1. Ejecutar y verificar las migraciones SQL en una rama de pruebas de Neon. El índice de email único puede fallar si ya hay duplicados: resolverlos previamente, sin borrar usuarios automáticamente.
2. Configurar `ENDURO_GMAIL_USER=enduronalon@gmail.com`, `ENDURO_GMAIL_APP_PASSWORD` (contraseña de aplicación, nunca la contraseña principal), `ENDURO_SITE_URL`, `JWT_SECRET`, `ENDURO_ADMIN_IDS`.
3. Configurar Stripe primero con claves `sk_test_`, `whsec_` y un webhook que apunte a `/.netlify/functions/tiendaWebhook`. Los pagos reales requieren habilitación explícita y pruebas de extremo a extremo.
4. Introducir condiciones de venta reales: vendedor, dirección de contacto, IVA, política de devoluciones, derecho de desistimiento cuando corresponda, tallas, envíos, plazos, protección de datos y tratamiento de quejas. No activar cobros reales mientras falte esta información.
5. Ensayar registro -> email -> verificación -> login y contraseña recuperada. Revisar las restricciones/cuotas de Gmail para cuentas personales; Gmail puede denegar SMTP y no garantiza entregabilidad a gran escala.
6. Validar las fotos reales en Netlify Blobs y Neon. No publicar fotos que revelen viviendas, matrículas, menores identificables sin permisos o rutas privadas. Antes de recoger contribuciones públicas, actualizar política de privacidad y establecer contacto para solicitar borrado.
7. Verificar que los administradores ven y aprueban fotos, pero que visitantes anónimos nunca pueden consultar fotos pendientes.
8. Probar `netlify dev` y una Deploy Preview antes de publicar. La compilación `dist/` debe excluir variables de entorno, migraciones, `netlify/`, `.git` y backups.
9. Revisar dependencias con `npm audit` y comprobar CSP; los tokens JWT continúan en `localStorage`, pendiente de migración a cookies HttpOnly.
10. Evitar sobrecostes: subir solo JPG <=2,5MB, cuota por cliente y total; monitorizar consumo de Functions y Blobs en el panel Netlify. El plan Free no es almacenamiento infinito.

## Protecciones añadidas

- Verificación de email de 30 minutos, token aleatorio de 256 bits almacenado mediante SHA-256, uso único y límite de intentos.
- Inicio de sesión por usuario o correo verificado. Nuevos registros sin JWT antes de verificar. Cuentas antiguas sin correo conservan su acceso por username para permitir una transición gradual.
- Servidor comprueba propiedad en borrado de mantenimientos y requiere JWT con sesión activa. Diálogo accesible pide confirmación antes de enviar la petición.
- Subida pública solo de `.jpg`, comprobación de extensión, tipo MIME, firma JPEG, decodificación, dimensiones máximas, recompresión sin EXIF, tamaño, cuota por IP y cuota global, más moderación.
- El almacenamiento de objetos no se expone al cliente. Las URLs de imágenes acceden mediante una Netlify Function que consulta si están publicadas o si el solicitante es administrador.
- Reserva de stock antes de crear la sesión de Stripe, liberación de stock si falla crear checkout o cuando Stripe informa del vencimiento. Webhook HMAC-SHA256 y control de idempotencia por transición de estado.

## Límites pendientes

- La cuenta de Gmail no es un servicio transaccional especializado. Puede dejar de funcionar si Google cambia sus requisitos, si se alcanza su cuota, o si se retiran las contraseñas de aplicación. OAuth 2.0 o proveedor transaccional son alternativas.
- Stripe puede enviar repetidamente un webhook tras un error temporal. Una actualización de estado repetida no debe duplicar la contabilización; revisar trazas y reconciliar pedidos en Stripe antes de enviar productos.
- Si Stripe no emite el evento de expiración y un pedido queda reservado, el stock puede quedar bloqueado. Añadir tarea periódica de conciliación antes de ventas de volumen.
- Las fotos reexportadas pierden EXIF, pero no eliminan automáticamente información visual identificable.
- El formulario público admite spam limitado; moderación manual obligatoria y futura integración de CAPTCHA con servicio gratuito si aumenta el uso.
- No se han realizado cobros reales ni pruebas con Gmail/Neon de producción desde este entorno.
