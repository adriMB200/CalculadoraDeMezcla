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
import { requireMethod, readBody, stringField, positiveId, json, handleError } from '../shared/security';
import { requireActiveUser } from '../shared/accountSecurity';

export const handler: Handler = async (event) => {
    try {
        requireMethod(event, "POST");
        const userId = await requireActiveUser(event);
        const body = readBody(event);
        const contenido = stringField(body.contenido, "Mensaje", 4000);
        const temaId = positiveId(body.tema_id, "Tema");
        const sql = neon();
        await sql`
            INSERT INTO public.mensajes (contenido, usuario_id, tema_id, fecha)
            VALUES (${contenido}, ${userId}, ${temaId}, NOW())
        `;
        return json(200, { message: "Mensaje enviado correctamente" });
    } catch (error) { return handleError(error); }
};
