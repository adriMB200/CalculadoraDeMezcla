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
import { requireMethod, readBody, stringField, json, handleError } from '../shared/security';
import { requireActiveUser } from '../shared/accountSecurity';

export const handler: Handler = async (event) => {
    try {
        requireMethod(event, "POST");
        const userId = await requireActiveUser(event);
        const body = readBody(event);
        const titulo = stringField(body.titulo, "Título", 150);
        const descripcion = body.descripcion == null || body.descripcion === "" ? "" :
            stringField(body.descripcion, "Descripción", 5000);
        const sql = neon();
        await sql`
            INSERT INTO public.temas (titulo, descripcion, usuario_id)
            VALUES (${titulo}, ${descripcion}, ${userId})
        `;
        return json(200, { message: "Tema creado correctamente" });
    } catch (error) { return handleError(error); }
};
