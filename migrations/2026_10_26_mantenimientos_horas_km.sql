-- Fase 12: unidades alternativas en el LIBRO de mantenimientos.
-- Ejecutar en una copia de Neon antes de producción.
-- No elimina registros anteriores ni reescribe los valores guardados en horas.
BEGIN;
ALTER TABLE public.mantenimientos
  ADD COLUMN IF NOT EXISTS unidad varchar(2) NOT NULL DEFAULT 'h';
ALTER TABLE public.mantenimientos
  ADD COLUMN IF NOT EXISTS kilometros integer;
ALTER TABLE public.mantenimientos
  ALTER COLUMN horas DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.mantenimientos'::regclass
      AND conname = 'mantenimientos_unidad_lectura_check'
  ) THEN
    ALTER TABLE public.mantenimientos
      ADD CONSTRAINT mantenimientos_unidad_lectura_check
        CHECK (
          (unidad = 'h' AND horas IS NOT NULL AND horas BETWEEN 0 AND 1000000 AND kilometros IS NULL)
          OR
          (unidad = 'km' AND kilometros IS NOT NULL AND kilometros BETWEEN 0 AND 10000000 AND horas IS NULL)
        );
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS mantenimientos_matricula_fecha_idx
  ON public.mantenimientos (matricula, fecha DESC, id DESC);
COMMIT;
