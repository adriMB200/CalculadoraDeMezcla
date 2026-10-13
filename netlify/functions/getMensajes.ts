import type { Handler } from "@netlify/functions";
import { neon } from "@netlify/neon";
import { requireMethod, positiveId, json, handleError } from '../shared/security';
import { requireActiveUser } from '../shared/accountSecurity';

export const handler: Handler = async (event) => {
    try {
        requireMethod(event, "GET");
        await requireActiveUser(event);
        const temaId = positiveId(event.queryStringParameters?.tema_id, "Tema");
        const sql = neon();
        const mensajes = await sql`
            SELECT m.id, m.contenido, m.fecha, u.username AS usuario
            FROM public.mensajes m
            JOIN public.usuarios u ON m.usuario_id = u.id
            WHERE m.tema_id = ${temaId}
            ORDER BY m.fecha ASC
        `;
        return json(200, mensajes);
    } catch (error) { return handleError(error); }
};
