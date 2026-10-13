-- Fases 3.2, 4 y 5 de Enduro Nalón. Ejecutar DESPUÉS de migración Fase 3.1.
-- Hacer copia de Neon y probar primero en rama de prueba.
BEGIN;
CREATE TABLE IF NOT EXISTS public.club_espera (
 ruta_id BIGINT NOT NULL REFERENCES public.club_rutas(id) ON DELETE CASCADE,
 usuario_id INTEGER NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
 creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
 PRIMARY KEY(ruta_id, usuario_id)
);
CREATE INDEX IF NOT EXISTS club_espera_orden_idx ON public.club_espera(ruta_id,creado_en,usuario_id);
CREATE TABLE IF NOT EXISTS public.club_avisos (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 usuario_id INTEGER NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
 ruta_id BIGINT REFERENCES public.club_rutas(id) ON DELETE SET NULL,
 mensaje VARCHAR(200) NOT NULL,
 creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
 leido_en TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS club_avisos_usuario_idx ON public.club_avisos(usuario_id, creado_en DESC);
CREATE TABLE IF NOT EXISTS public.club_albumes (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 titulo VARCHAR(100) NOT NULL,
 fecha DATE NOT NULL,
 descripcion VARCHAR(800) NOT NULL,
 -- Imágenes servidas desde la propia web y seleccionadas por el responsable del club.
 imagen VARCHAR(200),
 creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
 creado_por INTEGER NOT NULL REFERENCES public.usuarios(id),
 CHECK (length(trim(titulo)) BETWEEN 4 AND 100)
);
CREATE INDEX IF NOT EXISTS club_albumes_fecha_idx ON public.club_albumes(fecha DESC);
CREATE TABLE IF NOT EXISTS public.club_perfiles (
 usuario_id INTEGER PRIMARY KEY REFERENCES public.usuarios(id) ON DELETE CASCADE,
 alias VARCHAR(40) NOT NULL,
 moto VARCHAR(80) NOT NULL DEFAULT '',
 descripcion VARCHAR(280) NOT NULL DEFAULT '',
 mostrar BOOLEAN NOT NULL DEFAULT false,
 aprobado BOOLEAN NOT NULL DEFAULT false,
 actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
 CHECK (length(trim(alias)) BETWEEN 2 AND 40)
);
CREATE INDEX IF NOT EXISTS club_perfiles_publicos_idx ON public.club_perfiles(actualizado_en DESC) WHERE mostrar AND aprobado;

-- Siempre bloquear la fila de ruta antes de tocar aforo o espera.
CREATE OR REPLACE FUNCTION public.club_apuntarse_v2(p_ruta_id BIGINT,p_usuario_id INTEGER)
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE r public.club_rutas%ROWTYPE; n INTEGER;
BEGIN
 SELECT * INTO r FROM public.club_rutas WHERE id=p_ruta_id FOR UPDATE;
 IF NOT FOUND OR r.estado <> 'publicada' OR r.fecha_salida <= now() THEN RETURN 'no_disponible'; END IF;
 IF EXISTS (SELECT 1 FROM public.club_inscripciones WHERE ruta_id=p_ruta_id AND usuario_id=p_usuario_id) THEN RETURN 'ya_inscrito'; END IF;
 IF EXISTS (SELECT 1 FROM public.club_espera WHERE ruta_id=p_ruta_id AND usuario_id=p_usuario_id) THEN RETURN 'ya_esperando'; END IF;
 SELECT COUNT(*) INTO n FROM public.club_inscripciones WHERE ruta_id=p_ruta_id;
 IF n < r.plazas AND NOT EXISTS (SELECT 1 FROM public.club_espera WHERE ruta_id=p_ruta_id) THEN
   INSERT INTO public.club_inscripciones(ruta_id,usuario_id) VALUES(p_ruta_id,p_usuario_id); RETURN 'inscrito';
 END IF;
 INSERT INTO public.club_espera(ruta_id,usuario_id) VALUES (p_ruta_id,p_usuario_id); RETURN 'espera';
END; $$;

CREATE OR REPLACE FUNCTION public.club_promover_espera(p_ruta_id BIGINT)
RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE r public.club_rutas%ROWTYPE; p_user INTEGER; n INTEGER; promovidos INTEGER := 0;
BEGIN
 SELECT * INTO r FROM public.club_rutas WHERE id=p_ruta_id FOR UPDATE;
 IF NOT FOUND OR r.estado <> 'publicada' OR r.fecha_salida <= now() THEN RETURN 0; END IF;
 LOOP
   SELECT count(*) INTO n FROM public.club_inscripciones WHERE ruta_id=p_ruta_id;
   EXIT WHEN n >= r.plazas;
   SELECT usuario_id INTO p_user FROM public.club_espera WHERE ruta_id=p_ruta_id
     ORDER BY creado_en,usuario_id LIMIT 1;
   EXIT WHEN NOT FOUND;
   DELETE FROM public.club_espera WHERE ruta_id=p_ruta_id AND usuario_id=p_user;
   INSERT INTO public.club_inscripciones(ruta_id,usuario_id) VALUES(p_ruta_id,p_user)
     ON CONFLICT DO NOTHING;
   INSERT INTO public.club_avisos(usuario_id,ruta_id,mensaje)
     VALUES (p_user,p_ruta_id,'Se ha liberado una plaza y ya estás inscrito en una salida. Consulta Rutas.');
   promovidos := promovidos + 1;
 END LOOP;
 RETURN promovidos;
END; $$;

CREATE OR REPLACE FUNCTION public.club_salir_v2(p_ruta_id BIGINT,p_usuario_id INTEGER)
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE r public.club_rutas%ROWTYPE; filas INTEGER;
BEGIN
 SELECT * INTO r FROM public.club_rutas WHERE id=p_ruta_id FOR UPDATE;
 IF NOT FOUND THEN RETURN 'no_disponible'; END IF;
 DELETE FROM public.club_inscripciones WHERE ruta_id=p_ruta_id AND usuario_id=p_usuario_id;
 GET DIAGNOSTICS filas=ROW_COUNT;
 IF filas > 0 THEN PERFORM public.club_promover_espera(p_ruta_id); RETURN 'baja'; END IF;
 DELETE FROM public.club_espera WHERE ruta_id=p_ruta_id AND usuario_id=p_usuario_id;
 GET DIAGNOSTICS filas=ROW_COUNT;
 IF filas > 0 THEN RETURN 'salio_espera'; END IF;
 RETURN 'no_inscrito';
END; $$;

CREATE OR REPLACE FUNCTION public.club_editar_v2(p_ruta_id BIGINT, p_titulo TEXT,
 p_fecha TIMESTAMPTZ, p_zona TEXT, p_dificultad TEXT, p_kilometros INTEGER,
 p_terreno TEXT, p_plazas INTEGER, p_encuentro TEXT)
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE r public.club_rutas%ROWTYPE; n INTEGER;
BEGIN
 SELECT * INTO r FROM public.club_rutas WHERE id=p_ruta_id FOR UPDATE;
 IF NOT FOUND OR r.estado <> 'publicada' THEN RETURN 'no_disponible'; END IF;
 SELECT count(*) INTO n FROM public.club_inscripciones WHERE ruta_id=p_ruta_id;
 IF p_plazas < n THEN RETURN 'menos_plazas'; END IF;
 UPDATE public.club_rutas SET titulo=p_titulo, fecha_salida=p_fecha, zona=p_zona,
 dificultad=p_dificultad, kilometros=p_kilometros, terreno=p_terreno,
 plazas=p_plazas, encuentro=p_encuentro WHERE id=p_ruta_id;
 INSERT INTO public.club_avisos(usuario_id,ruta_id,mensaje)
 SELECT usuario_id,p_ruta_id,'Han cambiado los detalles de una salida a la que te apuntaste. Revisa Rutas.'
 FROM public.club_inscripciones WHERE ruta_id=p_ruta_id;
 INSERT INTO public.club_avisos(usuario_id,ruta_id,mensaje)
 SELECT usuario_id,p_ruta_id,'Han cambiado los detalles de una salida donde estás en lista de espera.'
 FROM public.club_espera WHERE ruta_id=p_ruta_id;
 PERFORM public.club_promover_espera(p_ruta_id);
 RETURN 'actualizada';
END; $$;

CREATE OR REPLACE FUNCTION public.club_cancelar_v2(p_ruta_id BIGINT)
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE r public.club_rutas%ROWTYPE;
BEGIN
 SELECT * INTO r FROM public.club_rutas WHERE id=p_ruta_id FOR UPDATE;
 IF NOT FOUND OR r.estado <> 'publicada' THEN RETURN 'no_disponible'; END IF;
 UPDATE public.club_rutas SET estado='cancelada' WHERE id=p_ruta_id;
 INSERT INTO public.club_avisos(usuario_id,ruta_id,mensaje)
 SELECT usuario_id,p_ruta_id,'Una salida en la que te inscribiste ha sido CANCELADA.'
 FROM public.club_inscripciones WHERE ruta_id=p_ruta_id;
 INSERT INTO public.club_avisos(usuario_id,ruta_id,mensaje)
 SELECT usuario_id,p_ruta_id,'Una salida de tu lista de espera ha sido CANCELADA.'
 FROM public.club_espera WHERE ruta_id=p_ruta_id;
 RETURN 'cancelada';
END; $$;
COMMIT;
