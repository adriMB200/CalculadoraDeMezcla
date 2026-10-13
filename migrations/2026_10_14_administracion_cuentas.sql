-- FASE 7: ejecutar manualmente tras hacer copia de seguridad de Neon.
-- No elimina datos existentes ni obliga a introducir un email en cuentas antiguas.
BEGIN;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS email_verificado BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS estado_cuenta TEXT NOT NULL DEFAULT 'activo';
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS auth_version INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS fecha_desactivacion TIMESTAMPTZ;
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='usuarios_estado_cuenta_f7') THEN
  ALTER TABLE public.usuarios ADD CONSTRAINT usuarios_estado_cuenta_f7 CHECK (estado_cuenta IN ('activo','suspendido','eliminacion_pendiente'));
 END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS usuarios_email_verificado_unico_f7
 ON public.usuarios (LOWER(email)) WHERE email_verificado = TRUE;
CREATE TABLE IF NOT EXISTS public.auth_tokens (
 id BIGSERIAL PRIMARY KEY,
 usuario_id INTEGER NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
 clase TEXT NOT NULL CHECK (clase IN ('verificar_email','restablecer_clave')),
 token_hash TEXT NOT NULL UNIQUE,
 email_destino TEXT,
 creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
 caduca_en TIMESTAMPTZ NOT NULL,
 usado_en TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS auth_tokens_usuario_idx_f7 ON public.auth_tokens(usuario_id, clase, creado_en DESC);
CREATE TABLE IF NOT EXISTS public.auth_limites (
 clave TEXT NOT NULL,
 periodo TIMESTAMPTZ NOT NULL,
 solicitudes INTEGER NOT NULL DEFAULT 1 CHECK (solicitudes >= 1),
 PRIMARY KEY (clave, periodo)
);
CREATE TABLE IF NOT EXISTS public.admin_auditoria (
 id BIGSERIAL PRIMARY KEY,
 actor_id INTEGER REFERENCES public.usuarios(id) ON DELETE SET NULL,
 destino_id INTEGER REFERENCES public.usuarios(id) ON DELETE SET NULL,
 destino_alias TEXT,
 accion TEXT NOT NULL,
 detalle TEXT,
 creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS admin_auditoria_fecha_idx_f7 ON public.admin_auditoria(creado_en DESC);

-- Borrado seguro: bloquea al usuario, comprueba dependencias y evita cascadas inesperadas.
CREATE OR REPLACE FUNCTION public.en_admin_eliminar_cuenta_segura(p_usuario INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY INVOKER SET search_path=public
AS $$
DECLARE v_estado TEXT;
BEGIN
  SELECT estado_cuenta INTO v_estado FROM public.usuarios WHERE id=p_usuario FOR UPDATE;
  IF v_estado IS DISTINCT FROM 'eliminacion_pendiente' THEN RETURN FALSE; END IF;
  IF EXISTS(SELECT 1 FROM public.motos WHERE usuario_id=p_usuario) OR
     EXISTS(SELECT 1 FROM public.temas WHERE usuario_id=p_usuario) OR
     EXISTS(SELECT 1 FROM public.mensajes WHERE usuario_id=p_usuario) OR
     EXISTS(SELECT 1 FROM public.club_rutas WHERE creador_id=p_usuario) OR
     EXISTS(SELECT 1 FROM public.club_inscripciones WHERE usuario_id=p_usuario) OR
     EXISTS(SELECT 1 FROM public.club_espera WHERE usuario_id=p_usuario) OR
     EXISTS(SELECT 1 FROM public.club_avisos WHERE usuario_id=p_usuario) OR
     EXISTS(SELECT 1 FROM public.club_perfiles WHERE usuario_id=p_usuario) OR
     EXISTS(SELECT 1 FROM public.club_albumes WHERE creado_por=p_usuario) OR
     EXISTS(SELECT 1 FROM public.merc_anuncios WHERE vendedor_id=p_usuario) OR
     EXISTS(SELECT 1 FROM public.merc_mensajes WHERE remitente_id=p_usuario OR destinatario_id=p_usuario) OR
     EXISTS(SELECT 1 FROM public.merc_reportes WHERE usuario_id=p_usuario OR revisor_id=p_usuario)
  THEN RETURN FALSE; END IF;
  DELETE FROM public.usuarios WHERE id=p_usuario;
  RETURN FOUND;
END;
$$;

COMMIT;
