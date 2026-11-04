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
import { requireMethod, json, handleError } from '../shared/security';
import { requireActiveUser } from '../shared/accountSecurity';

export const handler: Handler = async (event) => {
    try {
        requireMethod(event, "GET");
        await requireActiveUser(event);
        const sql = neon();
        const temas = await sql`
            SELECT t.id, t.titulo, t.descripcion, t.fecha, u.username AS creador
            FROM public.temas t
            JOIN public.usuarios u ON t.usuario_id = u.id
            ORDER BY t.fecha DESC
        `;
        return json(200, temas);
    } catch (error) { return handleError(error); }
};
