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
