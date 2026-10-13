# Enduro Nalón: seguridad y privacidad (Fase 7)

- **No publiques secretos**. `JWT_SECRET`, `RESEND_API_KEY` y `ENDURO_ADMIN_NOTIFY_EMAIL` solo en el panel de entorno de Netlify o `.env` local no versionado.
- Los usuarios actuales carecen de correo verificado: tendrán que acceder a **Mi cuenta** para registrarlo y confirmar un enlace enviado al buzón. Sin un correo verificado no existe recuperación automática.
- La función «restablecer contraseña» no enseña ni almacena claves en texto claro. Usa token aleatorio de 256 bits, hash SHA-256 en Neon, vencimiento a los 20 minutos y consumo único; la nueva contraseña se guarda con bcrypt.
- La cuenta suspendida no puede usar APIs privadas. Se ha modificado cada Netlify Function protegida para comprobar estado y `auth_version` en Neon; una suspensión, baja o cambio de contraseña invalida JWT anteriores.
- Administradores definidos EXCLUSIVAMENTE mediante `ENDURO_ADMIN_IDS` en backend. La visibilidad del enlace en el menú es orientativa; no concede permisos.
- Acciones privilegiadas exigen la contraseña del administrador, se auditan y pueden notificar al correo configurado. **Las notificaciones dependen de la entrega del proveedor:** si el correo falla, el registro de auditoría persiste y el panel avisa.
- Eliminar una cuenta con datos relacionados puede producir un rechazo de FK. Antes queda bloqueada como `eliminacion_pendiente`; para la supresión integral hay que evaluar mensajes privados, fotografías, facturación, obligaciones de conservación, citas y copias de seguridad. Nunca prometer borrado completo si persisten esos datos.
- Revisar el aviso de privacidad para incorporar correo verificado, proveedor de envío de emails, administración, auditoría y conservación de cuentas; no usar estas páginas legalmente sin completar textos previos.
- Para protección antispam de mayor volumen implementar rate limiting perimetral adicional (Netlify/WAF): el limitador incluido usa contadores persistidos por IP/usuario/token, pero no sustituye una defensa de borde.
- No abrir recuperación vía HTTP público: `ENDURO_SITE_URL` exige HTTPS salvo localhost/127.0.0.1 para pruebas.
- No enviar enlaces de recuperación a la cuenta del administrador: solo al correo del propio usuario. Los emails del administrador informan de acciones, nunca contienen el token.
- Se recomienda MFA/WebAuthn para cuentas administradoras en otra fase, limitaciones adicionales a nivel perimetral y proceso de baja RGPD.
- No eliminar cuentas admin desde el panel; `ENDURO_ADMIN_IDS` permite definir uno o varios administradores sin editarlos públicamente.
