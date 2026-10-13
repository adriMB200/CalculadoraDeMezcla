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
