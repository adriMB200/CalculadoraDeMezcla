-- ENDURO_NALON_AUTORIA_V15
-- ENDURO NALÓN — Enduro, rutas y compañerismo en Asturias
-- Fundador y responsable del proyecto: Adrian Martis Blanco
-- GitHub: https://github.com/adriMB200
-- Web: https://enduronalon.netlify.app/
-- Copyright (c) 2026 Adrian Martis Blanco. Derechos reservados sobre las contribuciones originales.
-- Las bibliotecas, obras y contribuciones de terceros conservan sus licencias y autoría.

-- Ejecutar DESPUÉS de la migración Fase 2.2 (garage_recordatorios.sql)
-- No altera el historial ni la tabla de motos existente.
BEGIN;
CREATE TABLE IF NOT EXISTS public.garage_operaciones (
  usuario_id INTEGER NOT NULL,
  operacion_id UUID NOT NULL,
  matricula VARCHAR(20) NOT NULL REFERENCES public.motos(matricula) ON DELETE CASCADE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (usuario_id, operacion_id)
);
CREATE INDEX IF NOT EXISTS garage_operaciones_matricula_idx ON public.garage_operaciones(matricula);
COMMIT;
