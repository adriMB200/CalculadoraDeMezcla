/*
 * ENDURO_NALON_AUTORIA_V15
 * ENDURO NALÓN — Enduro, rutas y compañerismo en Asturias
 * Fundador y responsable del proyecto: Adrian Martis Blanco
 * GitHub: https://github.com/adriMB200
 * Web: https://enduronalon.netlify.app/
 * Copyright (c) 2026 Adrian Martis Blanco. Derechos reservados sobre las contribuciones originales.
 * Las bibliotecas, obras y contribuciones de terceros conservan sus licencias y autoría.
 */

import type { Handler } from "@netlify/functions";
import { neon } from "@netlify/neon";
import { requireMethod, readBody, positiveId, json, handleError } from '../shared/security';
import { requireActiveUser } from '../shared/accountSecurity';

export const handler: Handler = async (event) => {
    try {
        requireMethod(event, "POST"); // Mantener compatibilidad con mantenimientos.html.
        const userId = await requireActiveUser(event);
        const id = positiveId(readBody(event).id, "ID de mantenimiento");
        const sql = neon();
        // El borrado solo ocurre si la moto del mantenimiento pertenece al usuario autenticado.
        const deleted = await sql`
            DELETE FROM public.mantenimientos AS m
            WHERE m.id = ${id}
              AND EXISTS (
                SELECT 1 FROM public.motos AS mo
                WHERE mo.matricula = m.matricula AND mo.usuario_id = ${userId}
              )
            RETURNING id
        `;
        if (deleted.length === 0) return json(404, { error: "Mantenimiento no encontrado" });
        return json(200, { message: "Mantenimiento eliminado" });
    } catch (error) { return handleError(error); }
};
