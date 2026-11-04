<div align="center">

# 🏍️ ENDURO NALÓN

**Enduro, rutas y compañerismo en Asturias.**

Herramientas para preparar la moto, compartir rutas y dar vida a una comunidad de enduro abierta a España.

[**Abrir la web**](https://enduronalon.netlify.app/) · [**Instagram del club**](https://www.instagram.com/enduronalon/) · [**Avisar de un problema**](https://github.com/adriMB200/CalculadoraDeMezcla/issues)

</div>

---

## El proyecto

**Enduro Nalón** combina utilidades de taller, gestión personal de motos y espacios de comunidad. La web se desarrolla con JavaScript, HTML, CSS, Netlify Functions en TypeScript y PostgreSQL de Neon. No requiere una aplicación móvil: funciona desde el navegador en ordenador o móvil.

El proyecto comenzó como calculadora de mezcla de gasolina y aceite para motores de dos tiempos. Ha ido incorporando pares de apriete, documentación técnica, libro de mantenimiento, garaje, avisos, rutas, foro, galería, mercadillo y taller avanzado. La **Fase 13** suma una tienda oficial, cuentas con correo verificado, avatares JPG, galería con contribuciones públicas moderadas y mejoras del mapa.

## Funciones disponibles

| Sección | Qué puedes hacer | Acceso |
| --- | --- | --- |
| Calculadora de mezcla | Calcular aceite para mezclas 2T y proporción | Público |
| Pares y manuales | Consultar fichas, modelos y documentación disponible | Público |
| Mi Garaje | Añadir motos y consultar su historial | Cuenta |
| Mantenimientos | Registrar trabajos por horas o kilómetros; borrar con confirmación | Cuenta |
| Mis avisos | Planificar tareas por horas o km | Cuenta |
| Rutas y mapa | Dibujar, importar GPX, proponer recorridos y participar en quedadas | Lectura pública / creación con cuenta |
| Taller avanzado | Coste por hora, desarrollos, suspensiones, tolerancias y carburación | Público |
| Foro | Consultar y conversar sobre motos y mecánica | Según operación |
| Mercadillo | Anuncios, consultas y moderación | Según operación |
| Galería | Consultar crónicas y enviar fotos `.jpg` para revisión | Envío público |
| Tienda oficial | Ver chalecos, chaquetas, pegatinas, disponibilidad y checkout | Catálogo público / compra con cuenta verificada |
| Mi cuenta | Verificar correo, cambiar contraseña, recuperación y foto de perfil | Cuenta |
| Administración | Gestionar usuarios, revisión de fotos, productos y publicaciones | Administrador |

> **Importante:** los pares de apriete, ajustes y comprobaciones mecánicas son orientativos. Confirma siempre las especificaciones del manual exacto de la moto. Los GPX no constituyen una autorización para circular por una vía.

## Inicio rápido (Windows + VS Code)

**Requisitos:** Node.js 22+, Git, Netlify CLI y acceso al proyecto de Netlify/Neon.

```powershell
# Desde el repositorio clonado
npm install
npm install -g netlify-cli
netlify login
netlify link
netlify dev
```

Abre la dirección local que muestre Netlify (habitualmente `http://localhost:8888`). No abras las páginas directamente con `file://`: las Netlify Functions necesitan un servidor.

### Estructura

```text
.
├── index.html, tienda.html, galeria.html, ...    # páginas públicas
├── css/                                          # estilos
├── js/                                           # lógica del navegador
├── imagen/                                       # imágenes estáticas
├── netlify/functions/                            # API de servidor
├── netlify/shared/                               # auth, validaciones y correo
├── db/                                           # esquema de base de datos
├── migrations/                                   # SQL para Neon
├── scripts/build-public.cjs                      # compilación segura
├── netlify.toml                                  # despliegue
└── README.md
```

El archivo `netlify.toml` prepara una compilación en `dist/` para publicar **solo recursos web**. No subas `.env`, claves, migraciones ni copias de seguridad al directorio publicado.

## Configuración de entorno

Crea las variables en **Netlify → Site configuration → Environment variables**. Para desarrollo utiliza un `.env` local **no versionado** y/o `netlify env:set` (revisa las credenciales antes de sincronizar). No incluyas claves reales en GitHub.

| Variable | Finalidad |
| --- | --- |
| `NETLIFY_DATABASE_URL` / las variables Neon que use tu instalación | Conexión a PostgreSQL |
| `JWT_SECRET` | Firma de tokens JWT; al menos 32 caracteres aleatorios |
| `ENDURO_ADMIN_IDS` | IDs numéricos de administradores separados por coma |
| `ENDURO_SITE_URL` | URL pública HTTPS de la web (para correos y checkout) |
| `ENDURO_GMAIL_USER` | **`enduronalon@gmail.com`** |
| `ENDURO_GMAIL_APP_PASSWORD` | Contraseña **de aplicación** Gmail; nunca la contraseña principal |
| `STRIPE_SECRET_KEY` | Clave `sk_test_...` durante desarrollo |
| `STRIPE_WEBHOOK_SECRET` | Secreto `whsec_...` del webhook de Stripe |
| `ENDURO_ENABLE_LIVE_PAYMENTS` | `false` por defecto; pasar a `true` solo tras revisar tienda y legal |

La cuenta de Gmail debe tener verificación en dos pasos y una contraseña de aplicación habilitada (si Google permite esa opción para la cuenta). Los correos salen mediante SMTP TLS de Gmail. **Hasta configurar esta conexión, el registro que exige verificación queda desactivado**; las cuentas anteriores mantienen su acceso según su estado.

### Migraciones

Se aplican manualmente en el editor SQL de Neon, **en orden cronológico**, sin ejecutar ciegamente SQL sobre producción. Para esta fase:

```text
migrations/2026_11_04_fase13_tienda_email_fotos.sql
```

Esta migración depende de las tablas de la Fase 7 (`auth_tokens`, `auth_limites`, `usuarios.email`). Añade tablas `tienda_productos`, `tienda_pedidos`, `club_fotos`, la referencia de avatar y un índice de correos únicos. **No borra usuarios ni mantenimientos**, pero el índice único puede detectar correos repetidos preexistentes: corrígelos antes de aplicarlo.

## Cuentas y verificación

1. El visitante abre Acceso y completa **usuario, correo electrónico y contraseña** (mínimo 12 caracteres).
2. El servidor registra una cuenta **pendiente de verificar**, guarda el token como hash y envía un enlace temporal desde `enduronalon@gmail.com`.
3. El usuario abre el enlace y activa su correo. Desde entonces puede iniciar sesión con **usuario o email**.
4. Si no llega el correo, puede solicitar otro enlace en `verificar-cuenta.html`.
5. En `mi-cuenta.html` puede subir una foto de perfil JPG, cambiar contraseña o usar la recuperación de cuenta.

Las cuentas antiguas sin email siguen pudiendo iniciar sesión con nombre de usuario; conviene completar gradualmente sus perfiles.

## Tienda oficial del club

El catálogo se gestiona desde `tienda.html` y presenta categorías de chalecos, chaquetas, pegatinas y otros productos. Los primeros tres artículos se insertan como **borradores sin precio ni stock** para no inventar precios o existencias. Un administrador puede editar y activar artículos.

Las compras requieren una cuenta con correo verificado. El servidor crea una **reserva temporal de stock** y abre Stripe Checkout. El webhook `/.netlify/functions/tiendaWebhook` confirma pagos y libera reservas que caducan. El inventario se debe reconciliar con Stripe antes de gestionar envíos.

**Durante desarrollo usa claves `sk_test_`: ninguna compra de prueba es un cobro real.** Stripe puede cobrar comisiones cuando habilites pagos en vivo. Antes del lanzamiento completa los términos legales, datos del vendedor, precio con impuestos, gastos de envío, devoluciones, tallas y tratamiento de pedidos.

## Rutas y GPX

El mapa utiliza Leaflet/OpenStreetMap y la API `clubTrazados`. La Fase 13 amplía el límite de **400 a 5000 puntos** por GPX (archivo local máximo de 8 MB y JSON enviado al servidor máximo de 300 KB). El servidor vuelve a validar geometría, ámbito geográfico y distancia; los recorridos privados no se entregan a personas ajenas. Las propuestas requieren moderación y confirmación de derechos de publicación.

Wikiloc no dispone de acceso público a un catálogo masivo mediante API para esta integración; se permiten enlaces hacia rutas concretas. No copies tracks privados o ajenos sin autorización.

## Galería y fotos

Cualquier visitante puede **proponer una foto**, pero solo en formato `.jpg` y hasta 2,5 MB. El servidor comprueba extensión, firma y decodificación JPEG y la reexporta sin metadatos EXIF. Los archivos se guardan en **Netlify Blobs**, con metadatos de aprobación en Neon. Solo las fotos **aprobadas por un administrador** se muestran al público.

La foto de perfil acepta `.jpg` hasta 2 MB y se mantiene como recurso privado de la cuenta. El administrador debe gestionar solicitudes de retirada de fotografías; subir una imagen no equivale a disponer de derechos sobre ella.

## Seguridad y privacidad

- Tokens JWT firmados en servidor y con caducidad; verificación de cuenta activa.
- Sentencias SQL parametrizadas en las Netlify Functions.
- Límites de peticiones persistentes en Neon para registro, verificación, imágenes y acciones sensibles.
- Verificación de propiedad antes de borrar mantenimientos, y confirmación emergente antes de solicitar el borrado.
- Revisión administrativa de rutas y fotografías antes de publicarlas.
- Compilación en `dist/` que excluye archivos internos.

**Pendiente:** migrar JWT de `localStorage` a cookies HttpOnly y revisar la CSP. Los informes de seguridad anteriores contienen riesgos adicionales. No presupongas que todas las vulnerabilidades están resueltas.

Lee [la guía de seguridad y salida al mercado](docs/SEGURIDAD_Y_LANZAMIENTO.md).

## Pruebas antes del despliegue

```powershell
# Instalación y comprobaciones
npm install
node scripts/build-public.cjs
netlify dev
```

Desde un entorno de pruebas con Neon separado, verifica registro/confirmación, login por email, recuperación, subida y rechazo de fotos, borrado de mantenimiento, GPX de 5000 puntos, creación de producto y pago de prueba con webhook Stripe.

## Colaboraciones y licencia

El proyecto es mantenido para la comunidad **Enduro Nalón**. Para reportar errores puedes abrir una incidencia en GitHub. El contenido compartido por socios y terceros sigue sujeto a derechos de autor, permiso de publicación y normas del club. **No se declara una licencia de código abierto** salvo que exista un archivo `LICENSE` específico que lo establezca.

---

<div align="center">Desarrollado por <a href="https://github.com/adriMB200">adriMB200</a> · Enduro Nalón</div>
