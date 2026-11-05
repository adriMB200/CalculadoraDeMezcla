-- Ejecutar en rama de pruebas o después de una copia de seguridad.
-- La Fase 12 ya crea mantenimientos_matricula_fecha_idx; no duplicar ese índice.
BEGIN;
CREATE INDEX IF NOT EXISTS motos_usuario_id_matricula_f18_idx
  ON public.motos (usuario_id,matricula);
COMMIT;
