-- ENDURO_NALON_AUTORIA_V15
-- ENDURO NALÓN — Enduro, rutas y compañerismo en Asturias
-- Fundador y responsable del proyecto: Adrian Martis Blanco
-- GitHub: https://github.com/adriMB200
-- Web: https://enduronalon.netlify.app/
-- Copyright (c) 2026 Adrian Martis Blanco. Derechos reservados sobre las contribuciones originales.
-- Las bibliotecas, obras y contribuciones de terceros conservan sus licencias y autoría.

-- Fase 13: ejecutar con copia de seguridad previa, sobre las migraciones de Fase 7.
BEGIN;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS foto_perfil_key TEXT;
-- Una cuenta pendiente de verificación no puede duplicar un correo pendiente.
CREATE UNIQUE INDEX IF NOT EXISTS en_usuarios_email_all_f13
 ON public.usuarios(LOWER(email)) WHERE email IS NOT NULL;
CREATE TABLE IF NOT EXISTS public.tienda_productos (
 id BIGSERIAL PRIMARY KEY,
 nombre VARCHAR(100) NOT NULL,
 tipo TEXT NOT NULL CHECK(tipo IN ('chaleco','chaqueta','pegatina','otro')),
 descripcion TEXT NOT NULL,
 precio_centimos INTEGER NOT NULL DEFAULT 0 CHECK(precio_centimos BETWEEN 0 AND 300000),
 stock INTEGER NOT NULL DEFAULT 0 CHECK(stock BETWEEN 0 AND 10000),
 activo BOOLEAN NOT NULL DEFAULT FALSE,
 imagen TEXT,
 creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
 actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.tienda_pedidos (
 id BIGSERIAL PRIMARY KEY,
 usuario_id INTEGER NOT NULL REFERENCES public.usuarios(id) ON DELETE RESTRICT,
 producto_id BIGINT NOT NULL REFERENCES public.tienda_productos(id) ON DELETE RESTRICT,
 nombre_producto TEXT NOT NULL,
 precio_unitario_centimos INTEGER NOT NULL,
 cantidad INTEGER NOT NULL CHECK(cantidad BETWEEN 1 AND 5),
 estado TEXT NOT NULL DEFAULT 'reservado' CHECK(estado IN('reservado','pagado','cancelado','vencido')),
 checkout_session TEXT UNIQUE,
 creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
 actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tienda_pedidos_usuario_f13 ON public.tienda_pedidos(usuario_id,creado_en DESC);
CREATE TABLE IF NOT EXISTS public.club_fotos (
 id BIGSERIAL PRIMARY KEY,
 titulo VARCHAR(85) NOT NULL,
 autor_alias VARCHAR(40) NOT NULL,
 descripcion VARCHAR(450) NOT NULL DEFAULT '',
 blob_key TEXT NOT NULL UNIQUE,
 estado TEXT NOT NULL DEFAULT 'pendiente' CHECK(estado IN('pendiente','publicada','rechazada')),
 revisado_por INTEGER REFERENCES public.usuarios(id) ON DELETE SET NULL,
 revisado_en TIMESTAMPTZ,
 creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS club_fotos_estado_f13 ON public.club_fotos(estado,creado_en DESC);
-- Productos de muestra no publicados: asigna precio, stock y fotografías desde administración.
INSERT INTO public.tienda_productos(nombre,tipo,descripcion,precio_centimos,stock,activo)
SELECT * FROM (VALUES
 ('Chaleco Enduro Nalón','chaleco','Chaleco oficial del club. Tallas y disponibilidad pendientes de confirmar.',0,0,FALSE),
 ('Chaqueta Enduro Nalón','chaqueta','Chaqueta oficial del club. Personalización y tallas pendientes de confirmar.',0,0,FALSE),
 ('Pegatinas Enduro Nalón','pegatina','Pegatinas del club para moto y vehículo. Formatos pendientes de confirmar.',0,0,FALSE)
) AS datos(nombre,tipo,descripcion,precio_centimos,stock,activo)
WHERE NOT EXISTS (SELECT 1 FROM public.tienda_productos);
COMMIT;
