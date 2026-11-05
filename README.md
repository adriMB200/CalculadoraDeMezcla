<div align="center">

# 🏍️ ENDURO NALÓN

**Enduro, rutas y compañerismo en Asturias.**

Herramientas para preparar la moto, compartir rutas y dar vida a una comunidad de enduro abierta a España.

[**Abrir la web**](https://enduronalon.netlify.app/) · [**Instagram del club**](https://www.instagram.com/enduronalon/) · [**Avisar de un problema**](https://github.com/adriMB200/CalculadoraDeMezcla/issues)

</div>

---

## El proyecto

**Enduro Nalón** combina utilidades de taller, gestión personal de motos y espacios de comunidad. La web se desarrolla con JavaScript, HTML, CSS, Netlify Functions en TypeScript y PostgreSQL de Neon. No requiere una aplicación móvil: funciona desde el navegador en ordenador o móvil.

El proyecto comenzó como calculadora de mezcla de gasolina y aceite para motores de dos tiempos. Ha ido incorporando pares de apriete, documentación técnica, libro de mantenimiento, garaje, avisos, rutas, foro, galería, mercadillo y taller avanzado.

Las últimas ampliaciones incorporan una tienda oficial, perfiles con correo opcional verificable, fotografías de perfil JPG, galería con aportaciones moderadas, mejoras del mapa y una navegación común adaptada a móviles.

## Historia del club

**Enduro Nalón fue fundado por Adrian Martis Blanco**, con la afición al enduro, las rutas y el compañerismo como punto de encuentro.

El club nace en Asturias y utiliza su página web para compartir actividades, experiencias y herramientas útiles para los aficionados a las motos de campo.

La comunidad busca reunir a quienes disfrutan de las salidas en moto, el aprendizaje mecánico y las experiencias compartidas, respetando siempre el entorno y la normativa aplicable a las rutas.

Puedes conocer más en [Historia del club](https://enduronalon.netlify.app/historia.html) y en la sección [El club](https://enduronalon.netlify.app/club.html).

---

## Funciones disponibles

| Sección | Qué puedes hacer | Acceso |
| --- | --- | --- |
| Historia del club | Conocer el origen de Enduro Nalón y a su fundador, Adrian Martis Blanco | Público |
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
| Mi cuenta | Cambiar nombre de usuario, añadir o verificar correo, cambiar contraseña y foto de perfil | Cuenta |
| Administración | Gestionar usuarios, revisión de fotos, productos y publicaciones | Administrador |

> **Importante:** los pares de apriete, ajustes y comprobaciones mecánicas son orientativos. Confirma siempre las especificaciones del manual exacto de la moto. Los GPX no constituyen una autorización para circular por una vía.

---

## Navegación y experiencia móvil

El menú compartido facilita el acceso a las secciones sin tener que recordar dónde estaba cada herramienta:

- **Inicio:** presentación del club y accesos rápidos.
- **Rutas:** quedadas y mapa interactivo con GPX.
- **Taller:** calculadora de mezcla, pares de apriete, búsqueda por moto y Taller Avanzado (costes, desarrollos, suspensiones, tolerancias y carburación).
- **Comunidad:** club, historia, foro, galería y mercadillo.
- **Tienda:** artículos y equipación del club.
- **Mi espacio:** Mi Garaje, mantenimientos, avisos y Mi Cuenta.

En móviles, las categorías se abren mediante un menú desplegable. Las páginas interiores incorporan una navegación consistente, y los formularios y tablas se adaptan a pantallas estrechas.

---

## Inicio rápido (Windows + VS Code)

**Requisitos:**

- Node.js 22 o superior.
- Git.
- Netlify CLI.
- Acceso al proyecto de Netlify.
- Acceso a la base de datos Neon PostgreSQL.
- Visual Studio Code.

### Instalación

Desde el repositorio clonado:

```powershell
npm install
npm install -g netlify-cli
netlify login
netlify link
netlify dev
```

Abre la dirección local que muestre Netlify, habitualmente:

`http://localhost:8888`

No abras las páginas directamente con `file://`: las Netlify Functions necesitan un servidor.

### Estructura del proyecto

```text
.
├── index.html
├── historia.html
├── tienda.html
├── taller-avanzado.html
├── mapa-rutas.html
├── mi-garaje.html
├── mantenimientos.html
├── css/
│   └── Estilos de la web
├── js/
│   └── Lógica del navegador
├── imagen/
│   └── Imágenes estáticas
├── netlify/
│   ├── functions/
│   │   └── API del servidor
│   └── shared/
│       └── Autenticación y validaciones
├── db/
│   └── Esquema de la base de datos
├── migrations/
│   └── Migraciones SQL
├── scripts/
│   └── build-public.cjs
├── netlify.toml
└── README.md
```

El archivo `netlify.toml` prepara una compilación en `dist/` para publicar **solo recursos web**.

No subas `.env`, claves, migraciones ni copias de seguridad al directorio publicado.

---

## Configuración de entorno

Configura las variables en:

**Netlify → Site configuration → Environment variables**

Para desarrollo utiliza un archivo `.env` local no versionado.

| Variable | Finalidad |
| --- | --- |
| `NETLIFY_DATABASE_URL` | Conexión a PostgreSQL de Neon |
| `JWT_SECRET` | Firma de tokens JWT |
| `ENDURO_ADMIN_IDS` | IDs numéricos de administradores separados por coma |
| `ENDURO_SITE_URL` | URL pública HTTPS de la web |
| `ENDURO_GMAIL_USER` | `enduronalon@gmail.com` |
| `ENDURO_GMAIL_APP_PASSWORD` | Contraseña de aplicación Gmail |
| `STRIPE_SECRET_KEY` | Clave de Stripe para pagos |
| `STRIPE_WEBHOOK_SECRET` | Secreto del webhook de Stripe |
| `ENDURO_ENABLE_LIVE_PAYMENTS` | Activación de pagos reales |

La cuenta de Gmail debe tener verificación en dos pasos y una contraseña de aplicación habilitada, si Google permite esa opción.

Sin credenciales SMTP, el usuario podrá registrarse con usuario y contraseña, pero no podrá recibir el enlace para verificar su correo.

### Migraciones

Las migraciones se aplican manualmente en el editor SQL de Neon, en orden cronológico.

Entre las más recientes se encuentran:

```text
migrations/2026_11_04_fase13_tienda_email_fotos.sql

migrations/2026_11_04_fase13_2_usuario_unico.sql
```

Antes de aplicar cambios a la base de datos de producción, realiza una copia de seguridad.

---

## Cuentas de usuario y verificación

El sistema permite crear una cuenta utilizando un nombre de usuario y una contraseña.

El correo electrónico es opcional durante el registro.

### Mi Cuenta

Desde `mi-cuenta.html`, cada usuario puede:

- Cambiar su nombre de usuario.
- Añadir una fotografía de perfil.
- Cambiar la contraseña.
- Introducir una dirección de correo electrónico.
- Solicitar la verificación del correo.
- Consultar el estado de verificación.

### Verificación de correo

1. El usuario accede a Mi Cuenta.
2. Introduce su dirección de correo electrónico.
3. Solicita el enlace de verificación.
4. La web envía un correo desde `enduronalon@gmail.com`.
5. El usuario abre el enlace recibido.
6. La dirección queda marcada como verificada.

La tienda y la recuperación de contraseñas mediante correo requieren una dirección verificada.

---

## Tienda oficial del club

Enduro Nalón incorpora una tienda para artículos relacionados con el club.

### Productos

Entre los artículos previstos están:

- Chalecos oficiales.
- Chaquetas de enduro.
- Pegatinas del club.
- Ropa y equipación.
- Otros productos personalizados.

Los administradores pueden gestionar:

- Nombre del producto.
- Descripción.
- Fotografías.
- Precio.
- Existencias.
- Disponibilidad.

### Pagos

La tienda utiliza Stripe Checkout.

Durante el desarrollo se emplean claves de prueba:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
ENDURO_ENABLE_LIVE_PAYMENTS=false
```

Los pagos reales permanecen desactivados hasta que se complete la configuración comercial.

Antes del lanzamiento habrá que definir las condiciones de venta, los gastos de envío, las devoluciones y la información legal del vendedor.

---

## Rutas y mapa interactivo

La plataforma incorpora un mapa interactivo desarrollado con Leaflet y OpenStreetMap.

### Funcionalidades

- Visualización de rutas.
- Importación de archivos GPX.
- Creación de trazados.
- Filtros de búsqueda.
- Información de cada recorrido.
- Rutas públicas y privadas.
- Propuestas de nuevos recorridos.
- Revisión administrativa.
- Vinculación con quedadas del club.

### Archivos GPX

El límite se ha ampliado de 400 a **5.000 puntos** por recorrido.

El tamaño máximo de un archivo GPX importado es de 8 MB.

Los recorridos privados únicamente pueden consultarse por los usuarios autorizados.

Las propuestas de rutas requieren aprobación antes de publicarse.

**La presencia de una ruta en el mapa no garantiza que sea legal circular por ella.** Los usuarios deben respetar las restricciones de cada comunidad autónoma y los espacios naturales protegidos.

---

## Taller avanzado

El Taller Avanzado reúne herramientas específicas para el mantenimiento y la preparación de motocicletas de enduro.

Cada herramienta dispone de su propia página.

### Coste real por hora

Permite calcular el coste aproximado de utilización de una moto teniendo en cuenta:

- Combustible.
- Aceite.
- Neumáticos.
- Filtros.
- Mantenimiento del motor.
- Reparaciones.
- Otros gastos.

### Calculadora de desarrollos

Permite comparar diferentes combinaciones de piñón y corona para conocer cómo cambia la relación de transmisión.

### Configurador de suspensiones

Incluye herramientas para registrar y comparar:

- SAG estático.
- SAG con piloto.
- Compresión.
- Rebote.
- Configuraciones según terreno.

### Tolerancias de motor

Permite comprobar mediciones de:

- Segmentos.
- Pistón y cilindro.
- Biela.
- Bujías.
- Holguras mecánicas.

Los límites deben obtenerse del manual de taller correspondiente al modelo exacto.

### Calculadora de carburación

Permite comparar condiciones de altitud y temperatura para orientar la revisión de la carburación.

Los ajustes definitivos dependen del motor, carburador y configuración específica de la motocicleta.

---

## Mi Garaje y mantenimientos

Los usuarios registrados pueden añadir sus motocicletas y mantener un historial de trabajos realizados.

### Registro de mantenimientos

Cada mantenimiento puede registrarse según:

- **Horas de motor (h).**
- **Kilómetros (km).**

El usuario selecciona la unidad al introducir el trabajo.

También puede consultar el historial y eliminar registros erróneos.

Para evitar borrados accidentales, la eliminación requiere una confirmación mediante una ventana emergente.

### Recordatorios

Desde Mis avisos es posible planificar los próximos mantenimientos según el intervalo configurado.

Por ejemplo:

- Cambio de aceite cada 15 horas.
- Revisión de transmisión cada 1.000 km.
- Sustitución de componentes según las indicaciones del fabricante.

La aplicación utiliza los datos registrados por el usuario para determinar los avisos.

---

## Foro y comunidad

El foro permite intercambiar conocimientos y experiencias entre aficionados al enduro.

Entre los temas habituales pueden encontrarse:

- Averías mecánicas.
- Preparaciones de motos.
- Configuración de suspensiones.
- Mantenimiento.
- Recambios.
- Experiencias de rutas.
- Recomendaciones.

Las funciones de publicación están sujetas a autenticación y a las normas de la comunidad.

---

## Mercadillo

El mercadillo permite publicar y consultar anuncios relacionados con el mundo de la moto.

Se contempla la publicación de:

- Recambios.
- Equipación.
- Accesorios.
- Componentes.
- Otros artículos relacionados con el enduro.

La plataforma dispone de mecanismos de moderación y gestión de publicaciones.

Las transacciones entre particulares deben respetar las normas del mercadillo.

---

## Galería del club

La galería permite compartir fotografías relacionadas con Enduro Nalón.

Cualquier visitante puede proponer una fotografía, incluso sin iniciar sesión.

### Condiciones

- Únicamente archivos `.jpg`.
- Tamaño máximo de 2,5 MB.
- Validación del formato de imagen.
- Eliminación de metadatos EXIF.
- Moderación antes de publicar.

Las fotografías se almacenan mediante Netlify Blobs, con información de aprobación en Neon.

Solo las imágenes aprobadas aparecen públicamente.

---

## Administración

Las funciones administrativas están reservadas a usuarios autorizados.

Permiten gestionar diferentes apartados de la plataforma:

- Cuentas de usuario.
- Publicaciones.
- Fotografías de la galería.
- Anuncios del mercadillo.
- Rutas propuestas.
- Productos de la tienda.
- Existencias.
- Contenido sujeto a moderación.

Los permisos se comprueban desde las funciones del servidor, no únicamente desde la interfaz.

---

## Seguridad y privacidad

La plataforma incorpora distintas medidas de protección:

- Tokens JWT firmados en servidor.
- Verificación de cuentas activas.
- Consultas SQL parametrizadas.
- Validación de datos de entrada.
- Control de permisos sobre recursos privados.
- Límites de peticiones en operaciones sensibles.
- Moderación de fotografías y rutas.
- Confirmaciones para acciones destructivas.
- Compilación pública en `dist/`.
- Protección de credenciales mediante variables de entorno.

### Mejoras de seguridad pendientes

La seguridad requiere una revisión continua.

Entre las tareas pendientes se encuentran:

- Migración de JWT desde `localStorage` a cookies HttpOnly.
- Revisión de políticas CSP.
- Comprobaciones periódicas de dependencias.
- Pruebas de autorización entre diferentes usuarios.
- Verificación del despliegue de producción.
- Auditorías de acceso a información sensible.

No debe considerarse que una aplicación está completamente protegida únicamente por haber incorporado estas medidas.

---

## Pruebas y despliegue

Para ejecutar la aplicación localmente:

```powershell
npm install
netlify dev
```

Si el proyecto dispone del sistema de compilación pública:

```powershell
node scripts/build-public.cjs
```

Antes de publicar cambios, conviene comprobar:

1. Registro e inicio de sesión.
2. Cambio de nombre de usuario.
3. Verificación por correo.
4. Recuperación de contraseña.
5. Fotografías de perfil.
6. Subida y moderación de imágenes.
7. Creación e importación de rutas GPX.
8. Registro y eliminación de mantenimientos.
9. Funcionamiento del Taller Avanzado.
10. Tienda y pagos de prueba.
11. Navegación en móviles.
12. Permisos de administrador.

Se recomienda utilizar una rama de pruebas de Neon antes de modificar la base de datos de producción.

---

<!-- EN15_AUTORIA_README -->
## Autoría y derechos de autor

**Enduro Nalón fue fundado por Adrian Martis Blanco** y se desarrolla bajo el identificador [adriMB200](https://github.com/adriMB200).

**© 2026 Adrian Martis Blanco.** Derechos reservados sobre las contribuciones originales del proyecto. Las dependencias y materiales de terceros mantienen sus propias licencias y autores. Consulta [COPYRIGHT.md](COPYRIGHT.md).

## Colaboraciones y licencia

Enduro Nalón es un proyecto desarrollado para la comunidad de aficionados al enduro.

El club fue fundado por **Adrian Martis Blanco** y mantiene su vinculación con Asturias, aunque las herramientas de la plataforma están abiertas a aficionados de toda España.

Para comunicar errores o proponer mejoras se pueden abrir incidencias en el repositorio de GitHub:

https://github.com/adriMB200/CalculadoraDeMezcla/issues

El contenido compartido por usuarios y terceros está sujeto a los derechos de autor y permisos correspondientes.

No se declara una licencia de código abierto salvo que exista un archivo `LICENSE` específico que lo establezca.

---

<div align="center">

### 🏍️ ENDURO NALÓN

**Enduro, rutas y compañerismo en Asturias.**

**Fundador: Adrian Martis Blanco**

[🌐 Página web](https://enduronalon.netlify.app/) · [📸 Instagram](https://www.instagram.com/enduronalon/) · [💻 GitHub](https://github.com/adriMB200/CalculadoraDeMezcla)

Desarrollado por [adriMB200](https://github.com/adriMB200)

</div>

## SEO e indexación gratuita en Google (Fase 16)

El sitio publica `robots.txt` y `sitemap.xml` y utiliza títulos, descripciones, URL canónicas y etiquetas para compartir. Se excluyen de la indexación las áreas privadas. Para solicitar la indexación, verifica `https://enduronalon.netlify.app/` en [Google Search Console](https://search.google.com/search-console/) como propiedad **Prefijo de URL** y envía `sitemap.xml`. La verificación con archivo HTML de Google debe conservarse en la raíz del sitio. La indexación es gratuita, pero no está garantizada.
