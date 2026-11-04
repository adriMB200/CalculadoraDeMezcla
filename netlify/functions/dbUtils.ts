/*
 * ENDURO_NALON_AUTORIA_V15
 * ENDURO NALÓN — Enduro, rutas y compañerismo en Asturias
 * Fundador y responsable del proyecto: Adrian Martis Blanco
 * GitHub: https://github.com/adriMB200
 * Web: https://enduronalon.netlify.app/
 * Copyright (c) 2026 Adrian Martis Blanco. Derechos reservados sobre las contribuciones originales.
 * Las bibliotecas, obras y contribuciones de terceros conservan sus licencias y autoría.
 */

export const isMissingTableError = (error: unknown, tableName: string) => {
    if (!(error instanceof Error)) {
        return false;
    }

    const missingTablePattern = new RegExp(`relation .*${tableName}.* does not exist`, 'i');
    return missingTablePattern.test(error.message);
};

export const extractYearFromModel = (model: string) => {
    const match = model.match(/(19|20)\d{2}/);
    return match ? Number(match[0]) : null;
};
