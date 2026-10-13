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
