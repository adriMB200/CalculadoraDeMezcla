# Security Policy — Enduro Nalón

**Proyecto:** Enduro Nalón  
**GitHub:** [adriMB200](https://github.com/adriMB200)  
**Web oficial:** https://enduronalon.netlify.app/

**Última actualización:** 5 de noviembre de 2026

---

## 1. Política de seguridad

La seguridad de Enduro Nalón es una prioridad, especialmente en las funcionalidades que gestionan cuentas de usuario, información personal, publicaciones y datos almacenados en la base de datos.

El proyecto utiliza tecnologías como Netlify, Netlify Functions, Neon PostgreSQL y JavaScript/TypeScript. Su mantenimiento incluye la revisión de dependencias, la corrección de errores y la incorporación progresiva de medidas de protección.

Esta política establece cómo comunicar posibles vulnerabilidades y cómo se gestionarán los problemas de seguridad identificados.

## 2. Versiones con soporte

Enduro Nalón se desarrolla mediante actualizaciones sucesivas, por lo que el mantenimiento de seguridad se concentra en la versión actualmente publicada.

| Versión | Soporte de seguridad |
|---|---|
| Versión publicada en producción | ✅ Activo |
| Versión de desarrollo vigente | ✅ En revisión y mantenimiento |
| Fases anteriores y versiones sustituidas | ❌ Sin mantenimiento independiente |
| Copias modificadas por terceros | ❌ Sin soporte oficial |

Las correcciones se incorporarán preferentemente a la versión de desarrollo actual y se publicarán después de realizar las comprobaciones correspondientes.

Se recomienda utilizar siempre la última versión disponible del proyecto.

## 3. Componentes incluidos en el alcance

Se aceptan informes sobre posibles vulnerabilidades que afecten a componentes propios de Enduro Nalón, especialmente:

### Autenticación y cuentas

- Inicio de sesión y registro.
- Gestión de contraseñas.
- Recuperación y verificación de correo electrónico.
- Sesiones y tokens JWT.
- Acceso no autorizado a cuentas.
- Escalada de privilegios.
- Acceso indebido a funciones administrativas.

### Base de datos y API

- Consultas a Neon PostgreSQL.
- Inyección SQL.
- Acceso no autorizado a registros de otros usuarios.
- Exposición de información sensible.
- Validaciones insuficientes en Netlify Functions.
- Operaciones que permitan modificar o eliminar datos ajenos.
- Uso indebido de recursos del servidor o la base de datos.

### Archivos y contenido

- Subida y procesamiento de imágenes JPG.
- Fotografías de perfil.
- Galería pública.
- Importación y procesamiento de archivos GPX.
- Manipulación de archivos no autorizados.
- Cross-Site Scripting (XSS).
- Acceso a contenidos privados sin autorización.

### Otras funcionalidades

- Libro de mantenimientos.
- Garaje de motocicletas.
- Rutas públicas y privadas.
- Foro.
- Mercadillo.
- Tienda y procesos de compra.
- Panel de administración.
- Dependencias y librerías utilizadas por el proyecto.

También pueden comunicarse vulnerabilidades relacionadas con configuraciones incorrectas de seguridad, siempre que exista un impacto demostrable sobre el proyecto.

## 4. Cómo informar de una vulnerabilidad

**No publiques vulnerabilidades, credenciales, datos personales ni instrucciones de explotación en incidencias públicas de GitHub.**

El canal preferido es el sistema de comunicación privada de vulnerabilidades de GitHub, cuando esté habilitado:

1. Accede al repositorio [CalculadoraDeMezcla](https://github.com/adriMB200/CalculadoraDeMezcla).
2. Abre la sección **Security**.
3. Entra en **Advisories**.
4. Selecciona **Report a vulnerability**.
5. Describe el problema y envía el informe de manera privada.

Si esta opción no aparece, puedes solicitar un canal de contacto privado mediante una incidencia pública, sin incluir detalles técnicos sensibles.

También puedes contactar con el equipo del proyecto a través de los canales oficiales de Enduro Nalón.

### Información recomendada

Para facilitar la revisión, incluye:

- Descripción del problema.
- Página o componente afectado.
- Condiciones necesarias para reproducirlo.
- Impacto potencial.
- Versión o fecha aproximada de la prueba.
- Evidencias que no contengan datos personales ni información confidencial.
- Propuesta de solución, si dispones de ella.

No es necesario acceder a información real de otros usuarios para demostrar una vulnerabilidad.

## 5. Proceso de gestión

Los informes recibidos serán revisados de acuerdo con su impacto, posibilidad de explotación y componentes afectados.

El procedimiento previsto es:

1. **Recepción:** comprobación inicial de la información comunicada.
2. **Evaluación:** análisis del problema y de los componentes afectados.
3. **Clasificación:** valoración de la gravedad y del riesgo.
4. **Corrección:** preparación de los cambios necesarios.
5. **Verificación:** pruebas para comprobar la corrección y evitar regresiones.
6. **Publicación:** despliegue del parche y actualización de dependencias o documentación cuando corresponda.

Se intentará confirmar la recepción de los informes en un plazo orientativo de cinco días hábiles. La resolución dependerá de la gravedad del problema, su complejidad y la disponibilidad de mantenimiento.

Los informes que no permitan identificar un problema de seguridad real podrán cerrarse con una explicación.

## 6. Clasificación de vulnerabilidades

Las incidencias se priorizarán conforme a su impacto.

| Gravedad | Ejemplos |
|---|---|
| Crítica | Acceso administrativo no autorizado, exposición masiva de información o compromiso de credenciales del servidor |
| Alta | Inyección SQL explotable, acceso a datos de otros usuarios o ejecución de operaciones privilegiadas |
| Media | XSS con impacto limitado, exposición parcial de información o errores de autorización condicionados |
| Baja | Configuraciones mejorables o problemas con impacto reducido y sin explotación relevante demostrada |

La clasificación definitiva dependerá del contexto técnico y del alcance real de cada incidencia.

## 7. Normas para las investigaciones de seguridad

Se agradecen las investigaciones realizadas de forma responsable y con autorización.

Para proteger a los usuarios y la infraestructura, deben respetarse las siguientes condiciones:

- Limitar las pruebas a las cuentas y recursos propios del investigador.
- Utilizar el mínimo número de solicitudes necesario.
- No acceder, descargar ni modificar información de terceros.
- No realizar ataques de denegación de servicio (DoS/DDoS).
- No ejecutar pruebas de fuerza bruta contra cuentas reales.
- No saturar las Netlify Functions ni las conexiones de Neon.
- No intentar extraer credenciales, tokens o información privada.
- No alterar publicaciones ni archivos pertenecientes a otros usuarios.
- No utilizar ingeniería social contra miembros del club.
- No divulgar públicamente vulnerabilidades sin coordinar previamente su comunicación con los responsables.

Las pruebas de carga, intrusión y explotación activa requieren autorización expresa y un entorno de pruebas apropiado.

La comunicación de una vulnerabilidad no constituye una autorización para comprometer sistemas o datos.

## 8. Medidas de seguridad y mantenimiento

El desarrollo de Enduro Nalón contempla las siguientes líneas de protección, cuya implementación y eficacia deben comprobarse periódicamente:

**Autenticación y autorización**
- Validación de sesiones y tokens.
- Comprobación de permisos desde el servidor.
- Restricción del acceso a recursos privados.
- Protección de funciones administrativas.

**Base de datos**
- Uso de consultas SQL parametrizadas.
- Validación de datos de entrada.
- Límites de lectura y escritura.
- Control de acceso a registros según su propietario.
- Protección de credenciales y cadenas de conexión.

**Infraestructura**
- Gestión de secretos mediante variables de entorno.
- Revisión de dependencias con Dependabot y npm audit.
- Limitación de solicitudes cuando esté configurada.
- Separación entre archivos públicos y código interno.
- Supervisión de errores y consumo de recursos.

**Archivos**
- Validación del tipo y tamaño de las imágenes.
- Comprobación de archivos GPX.
- Restricción de operaciones no autorizadas.
- Moderación de contenido cuando corresponda.

Estas medidas forman parte del proceso de mejora continua. Su inclusión en esta política no debe interpretarse como una certificación de seguridad ni como una garantía de ausencia de vulnerabilidades.

## 9. Protección de datos y servicios externos

Enduro Nalón puede utilizar servicios externos para el alojamiento, almacenamiento, base de datos y procesamiento de pagos.

Los posibles problemas relacionados con estos servicios serán evaluados para determinar si afectan a la configuración o al código del proyecto.

Las vulnerabilidades que correspondan exclusivamente a la infraestructura de un proveedor deberán comunicarse también a dicho proveedor mediante sus canales oficiales.

Los informes de seguridad no deben incluir contraseñas, claves API, tokens válidos, datos bancarios ni información personal de usuarios.

## 10. Divulgación responsable

Se solicita que las vulnerabilidades se comuniquen de manera privada antes de su publicación.

Cuando se confirme un problema relevante, se procurará corregirlo y verificar la solución antes de divulgar los detalles que pudieran facilitar su explotación.

Se podrá reconocer la colaboración de quienes hayan comunicado vulnerabilidades de forma responsable, con su consentimiento.

Actualmente Enduro Nalón no dispone de un programa público de recompensas económicas por vulnerabilidades.

## 11. Contacto y mantenimiento

**Responsable del proyecto:** Adrian Martis Blanco  
**Identificador de GitHub:** [adriMB200](https://github.com/adriMB200)  
**Repositorio:** https://github.com/adriMB200/CalculadoraDeMezcla  
**Página oficial:** https://enduronalon.netlify.app/

Para problemas de seguridad, utiliza preferentemente el sistema privado de avisos de GitHub.

Para errores funcionales o propuestas de mejora que no impliquen un riesgo de seguridad, utiliza la sección pública de **Issues** del repositorio.

---

**Enduro Nalón — © 2026 Adrian Martis Blanco.**

Todos los derechos sobre las contribuciones originales quedan reservados conforme a la licencia aplicable y la legislación vigente.
