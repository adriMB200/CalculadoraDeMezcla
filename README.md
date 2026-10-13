<div align="center">

<img src="imagen/img.jpg" alt="Emblema de Enduro Nalón" width="760">

# ENDURO NALÓN

**Enduro, rutas y compañerismo en Asturias.**

Una comunidad para compartir salidas, hablar de motos y tener a mano las herramientas que más utilizamos en el taller.

[**🌐 Visitar la web**](https://enduronalon.netlify.app/) · [**🏍️ Redes del club**](https://linktr.ee/enduronalon) · [**🐛 Reportar un problema**](https://github.com/adriMB200/CalculadoraDeMezcla/issues)

[![Netlify Status](https://api.netlify.com/api/v1/badges/116a1b24-0642-4ebf-a38b-e126c82cf732/deploy-status)](https://app.netlify.com/projects/enduronalon/deploys)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Netlify](https://img.shields.io/badge/Netlify-00C7B7?logo=netlify&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)

</div>

---

## 🏁 ¿Qué es Enduro Nalón?

**Enduro Nalón** es un proyecto web nacido alrededor de la afición al enduro en Asturias. Su objetivo es combinar la vida del club con herramientas prácticas: desde calcular una mezcla de gasolina y aceite hasta consultar documentación técnica, registrar mantenimientos y organizar quedadas.

La idea no es sustituir los manuales de fabricante ni las relaciones personales del club, sino poner las cosas útiles en un solo lugar y facilitar la participación de sus miembros.

> [!NOTE]
> El proyecto está en evolución. El repositorio reúne funcionalidades desarrolladas por fases; su disponibilidad en la web pública depende de que se hayan aplicado las migraciones, configurado los servicios y desplegado la versión correspondiente.

## 📚 Contenido

- [Funcionalidades](#-funcionalidades)
- [Tecnologías](#-tecnologías)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Instalación y desarrollo local](#-instalación-y-desarrollo-local)
- [Configuración del entorno](#-configuración-del-entorno)
- [Base de datos y migraciones](#-base-de-datos-y-migraciones)
- [Administración](#-administración)
- [Privacidad y seguridad](#-privacidad-y-seguridad)
- [Pruebas antes de publicar](#-pruebas-antes-de-publicar)
- [Próximas mejoras](#-próximas-mejoras)
- [Colaboración y licencia](#-colaboración-y-licencia)

## 🧰 Funcionalidades

### Taller y documentación

| Herramienta | Descripción |
| --- | --- |
| 🧮 **Calculadora de mezcla** | Calcula la proporción de aceite para motores de dos tiempos. |
| 🔩 **Pares de apriete y fichas técnicas** | Consulta los datos disponibles en las fichas del proyecto. |
| 📖 **Manuales** | Acceso a la documentación incorporada para modelos concretos. |
| 🔎 **Buscador por moto** | Filtra por marca, modelo y año sin atribuir manuales de otros modelos. |
| 🏍️ **Mi Garaje** | Agrupa las motos asociadas a cada cuenta. |
| 🔧 **Libro de mantenimientos** | Guarda y consulta intervenciones realizadas en cada moto. |
| ⏱️ **Recordatorios** | Permite configurar intervalos por horas o kilómetros. |

El catálogo ampliado contempla modelos de **KTM, GASGAS, Husqvarna, Beta y Sherco**, además de las referencias ya disponibles de **Rieju**. **Que un modelo figure en el selector no significa que ya exista un manual o una tabla de aprietes validada para ese año.**

### Rutas y comunidad

- **Rutas y quedadas:** próximas salidas, dificultad, zona orientativa, plazas e inscripción de usuarios.
- **Lista de espera y avisos internos:** gestión de plazas libres, modificaciones y cancelaciones.
- **Punto de encuentro privado:** accesible únicamente para participantes autorizados.
- **Foro Enduro:** conversaciones y dudas entre aficionados.
- **El Club:** presentación de la comunidad y perfiles públicos voluntarios sujetos a moderación.
- **Galería:** álbumes y crónicas de salidas publicados por administradores.

### Mercadillo Enduro

Un espacio para anuncios entre usuarios, con **moderación previa**, categorías, precios, búsqueda, mensajes privados y denuncias.

> [!IMPORTANT]
> El mercadillo **no gestiona pagos, envíos ni garantías de compraventa**. La versión actual se plantea como un tablón de anuncios moderado; la carga pública de fotografías de artículos también queda pendiente de una fase posterior.

### Cuentas y administración

- Registro e inicio de sesión.
- Gestión de caducidad y revocación de sesiones JWT.
- Cambio de contraseña y recuperación mediante correo **verificado**.
- Panel reservado a administradores para consultar, suspender y reactivar cuentas, gestionar bajas y solicitar restablecimientos.
- Registro de acciones administrativas y avisos por correo cuando el proveedor está configurado.

La verificación y recuperación por email **requieren configurar un servicio de correo transaccional**; no funcionan solo por instalar los archivos.

## 🧱 Tecnologías

| Capa | Tecnologías |
| --- | --- |
| Interfaz | HTML5, CSS3, JavaScript |
| Backend | TypeScript / JavaScript con **Netlify Functions** |
| Base de datos | **Neon PostgreSQL** |
| Acceso a datos | `@netlify/neon`, Drizzle ORM y consultas SQL |
| Autenticación | JWT y contraseñas protegidas con `bcryptjs` |
| Analítica opcional | Umami, sujeta a las preferencias de consentimiento |
| Correos transaccionales | Resend (requiere configuración) |
| Despliegue web | Netlify |
| Escritorio | Configuración Electron incluida, no equivalente a ejecutar el backend de Netlify |

## 🗂️ Estructura del proyecto

```text
CalculadoraDeMezcla/
├── index.html                  # Portada
├── calculadora.html            # Calculadora de mezcla
├── tablas.html                 # Documentación técnica
├── mantenimientos.html        # Libro de mantenimientos
├── buscar-moto.html            # Buscador por marca/modelo/año
├── mi-garaje.html              # Garaje personal
├── avisos.html                 # Recordatorios
├── foro.html                   # Foro
├── rutas.html                  # Salidas e inscripciones
├── galeria.html                # Galería del club
├── club.html                   # Comunidad y perfiles
├── mercadillo.html             # Compraventa entre usuarios
├── admin.html                  # Administración
├── mi-cuenta.html              # Gestión de la cuenta
├── recuperar-clave.html        # Recuperación de contraseña
├── css/                        # Estilos por sección
├── js/                         # Lógica del navegador y catálogos
├── imagen/                     # Imágenes y recursos visuales
├── manuales/                   # Documentación disponible
├── db/                         # Esquema / acceso a datos
├── migrations/                 # Migraciones de PostgreSQL
├── netlify/
│   ├── functions/              # Endpoints del servidor
│   └── shared/                 # Utilidades compartidas de seguridad
├── docs/                       # Notas de privacidad y despliegue
├── netlify.toml                # Configuración de Netlify
└── package.json                # Dependencias del proyecto
```

## 💻 Instalación y desarrollo local

### Requisitos

- **Node.js 22** (versión configurada para la compilación en `netlify.toml`).
- npm.
- Netlify CLI.
- Una base de datos Neon conectada al entorno de pruebas.

### 1. Clonar e instalar

```bash
git clone https://github.com/adriMB200/CalculadoraDeMezcla.git
cd CalculadoraDeMezcla
npm ci
```

### 2. Preparar Netlify CLI

```bash
npm install -g netlify-cli
netlify login
netlify link
```

`netlify link` relaciona la carpeta local con tu sitio. Utiliza preferiblemente un **sitio y una rama de Neon de pruebas** cuando vayas a experimentar con datos o migraciones.

### 3. Iniciar el proyecto

```bash
netlify dev
```

Abre la URL local que indique la terminal (habitualmente `http://localhost:8888`). Usar solo un servidor de archivos estáticos no basta para probar las Netlify Functions.

> [!TIP]
> El `package.json` incluye también scripts de Electron (`npm start` y `npm run dist`). La aplicación de escritorio carga la interfaz localmente, pero **no arranca por sí sola el backend serverless** ni sustituye la prueba completa con `netlify dev`.

## 🔐 Configuración del entorno

Las credenciales y secretos deben mantenerse **fuera del repositorio**. Configúralos en las variables de entorno de Netlify y asegúrate de que también estén disponibles durante las pruebas locales.

| Variable | Necesidad | Uso |
| --- | --- | --- |
| `NETLIFY_DATABASE_URL` | Obligatoria para Neon cuando el entorno no la inyecte automáticamente | Conexión a PostgreSQL. |
| `JWT_SECRET` | Obligatoria | Firma de tokens de sesión. Debe ser aleatoria y suficientemente larga. |
| `ENDURO_ADMIN_IDS` | Para la administración | IDs numéricos de administradores, separados por comas. |
| `ENDURO_SITE_URL` | Para recuperación de cuentas | URL de la web; HTTPS en producción. |
| `RESEND_API_KEY` | Para correos | API privada del proveedor de email. |
| `ENDURO_MAIL_FROM` | Para correos | Remitente verificado. |
| `ENDURO_ADMIN_NOTIFY_EMAIL` | Para avisos al administrador | Dirección a la que se notifican acciones de cuentas. |
| `API_KEY_CHAT` | Si se habilita el chatbot | Credencial de la integración de chat. |

Genera un secreto JWT, por ejemplo:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

**Nunca subas** archivos `.env`, contraseñas, tokens, claves de correo o conexiones de base de datos a GitHub. No sustituyas un `JWT_SECRET` existente sin planificar el cierre de las sesiones anteriores.

## 🗄️ Base de datos y migraciones

El proyecto utiliza **Neon PostgreSQL**. Las diferentes fases añaden tablas para garaje, recordatorios, rutas, anuncios, perfiles y gestión de cuentas.

Las migraciones se encuentran en [`migrations/`](migrations/). Entre las incorporadas están:

```text
2026_10_14_garage_recordatorios.sql
2026_10_14_garage_operaciones.sql
2026_10_14_club_rutas.sql
2026_10_14_fases_3_2_4_5.sql
2026_10_14_mercadillo.sql
2026_10_14_administracion_cuentas.sql
```

**Antes de migrar:**

1. Haz un respaldo o crea una rama de Neon para pruebas.
2. Comprueba qué migraciones están aplicadas; no las vuelvas a ejecutar a ciegas.
3. Sigue el orden y las dependencias descritas en los instaladores de cada fase.
4. Ejecuta los SQL necesarios desde **Neon SQL Editor** y prueba con dos usuarios distintos.
5. Aplica los cambios en producción solo después de validar login, permisos y datos existentes.

El instalador de cada fase puede copiar archivos, pero **no ejecuta automáticamente las migraciones SQL**.

## 🛡️ Administración

La gestión de cuentas y la moderación se realizan desde las páginas correspondientes:

| Sección | Ruta |
| --- | --- |
| Panel de usuarios | [`admin.html`](admin.html) |
| Gestión de la cuenta | [`mi-cuenta.html`](mi-cuenta.html) |
| Recuperar contraseña | [`recuperar-clave.html`](recuperar-clave.html) |
| Moderación de anuncios | [`mercadillo.html`](mercadillo.html) |
| Gestión de rutas | [`rutas.html`](rutas.html) |

La condición de administrador se determina **en el servidor**, mediante `ENDURO_ADMIN_IDS`. Ocultar un enlace en la interfaz no es una medida de seguridad ni concede permisos.

Los administradores **no pueden ver contraseñas** de los usuarios: el sistema permite iniciar procesos de restablecimiento, que deben completarse de forma segura.

## 🔏 Privacidad y seguridad

Enduro Nalón maneja información asociada a cuentas, motos, mantenimientos, inscripciones, anuncios y mensajes. Por ese motivo, el diseño contempla:

- Autenticación y comprobaciones de autorización en las APIs privadas.
- Contraseñas almacenadas como hashes, nunca en texto claro.
- Revocación de sesiones tras operaciones sensibles cuando está instalada la fase correspondiente.
- Garajes e historiales privados por defecto.
- Perfiles públicos **voluntarios** y moderados.
- Puntos de encuentro restringidos a inscritos.
- Moderación de anuncios y vías para denunciarlos.
- Consentimiento configurable para la analítica opcional.
- Ausencia de pagos integrados y de tracks GPX públicos en esta versión.

Se incluyen páginas de **aviso legal, privacidad y cookies**, pero su contenido debe revisarse y completarse con los datos reales del responsable del sitio, los proveedores y los plazos de conservación antes de un lanzamiento público completo.

> [!CAUTION]
> Tener medidas técnicas de seguridad **no equivale a una certificación de cumplimiento** del RGPD, la LOPDGDD, la LSSI-CE o el DSA. Antes de abrir nuevas funciones públicas, revisa los textos legales, la moderación, la supresión de datos y los derechos sobre fotografías y manuales de terceros.

No publiques vulnerabilidades ni credenciales en incidencias públicas. El archivo [`SECURITY.md`](SECURITY.md) existe, pero su procedimiento de comunicación privada debe completarse antes de invitar a reportar fallos sensibles.

## ✅ Pruebas antes de publicar

- [ ] Las páginas funcionan en móvil y escritorio sin desplazamiento horizontal.
- [ ] Calculadora, pares de apriete y manuales originales mantienen sus enlaces.
- [ ] Registro, login, cierre de sesión y caducidad JWT funcionan.
- [ ] Un usuario no puede leer ni modificar las motos de otro.
- [ ] Los recordatorios y el historial permanecen sincronizados al registrar un trabajo.
- [ ] Las rutas no muestran puntos privados a visitantes o usuarios no inscritos.
- [ ] Solo los administradores pueden moderar anuncios y gestionar cuentas.
- [ ] Un cambio de contraseña o una suspensión invalida sesiones anteriores.
- [ ] La recuperación por email utiliza un correo verificado y un enlace de un solo uso.
- [ ] Rechazar analítica evita cargar el script opcional.
- [ ] Migraciones y permisos se prueban en una base de datos de ensayo.
- [ ] Los textos legales están completos y la publicación de recursos tiene autorización.

## 🛣️ Próximas mejoras

- [ ] Más documentación técnica **verificada por modelo y año**.
- [ ] Fotos de artículos en el mercadillo con validación de archivos y moderación.
- [ ] Mejoras de búsqueda y filtros en foro y compraventa.
- [ ] Notificaciones opcionales y configurables para rutas y mantenimientos.
- [ ] MFA/WebAuthn para cuentas administrativas.
- [ ] Accesibilidad y pruebas automatizadas continuas.
- [ ] Funciones PWA y optimización para uso frecuente desde el móvil.

## 🤝 Colaboración y licencia

Las propuestas y errores de funcionamiento se pueden comunicar desde [GitHub Issues](https://github.com/adriMB200/CalculadoraDeMezcla/issues). Antes de enviar cambios, evita incorporar secretos o manuales e imágenes sin permisos de distribución.

**Autor y mantenimiento:** [@adriMB200](https://github.com/adriMB200).

**Licencia:** este repositorio no incluye actualmente un archivo `LICENSE` con una licencia de software explícita. No debe interpretarse como una autorización automática para copiar, redistribuir o explotar comercialmente su código o sus materiales. Los manuales y fotografías de terceros pueden tener derechos independientes.

---

<div align="center">

**ENDURO NALÓN** · Gas, barro y compañerismo. 🏍️

[Ir a la web](https://enduronalon.netlify.app/) · [Instagram, TikTok y YouTube](https://linktr.ee/enduronalon) · [Repositorio](https://github.com/adriMB200/CalculadoraDeMezcla)

</div>
