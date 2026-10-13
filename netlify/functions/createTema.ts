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
