-- Enduro Nalón · Fase 2.2 · Ejecutar UNA vez en la base de datos Neon usada por Netlify.
-- No borra, altera ni migra los mantenimientos existentes.
-- Requiere public.motos(matricula) como clave primaria/única.
BEGIN;
CREATE TABLE IF NOT EXISTS public.garage_lecturas (
    matricula VARCHAR(20) PRIMARY KEY REFERENCES public.motos(matricula) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL,
    horas_actuales INTEGER CHECK (horas_actuales BETWEEN 0 AND 1000000),
    kilometros_actuales INTEGER CHECK (kilometros_actuales BETWEEN 0 AND 10000000),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS garage_lecturas_usuario_id_idx
    ON public.garage_lecturas(usuario_id);

CREATE TABLE IF NOT EXISTS public.garage_recordatorios (
    matricula VARCHAR(20) NOT NULL REFERENCES public.motos(matricula) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL,
    categoria VARCHAR(32) NOT NULL CHECK (categoria IN (
        'aceite_motor','aceite_caja','filtro_aire','piston','transmision',
        'refrigerante','bujia','frenos','otros'
    )),
    unidad VARCHAR(2) NOT NULL CHECK (unidad IN ('h', 'km')),
    intervalo INTEGER NOT NULL CHECK (intervalo BETWEEN 1 AND 1000000),
    ultima_lectura INTEGER NOT NULL CHECK (ultima_lectura BETWEEN 0 AND 10000000),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (matricula, categoria, unidad)
);
CREATE INDEX IF NOT EXISTS garage_recordatorios_usuario_id_idx
    ON public.garage_recordatorios(usuario_id);
COMMIT;
