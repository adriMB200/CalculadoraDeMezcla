import type { Handler } from "@netlify/functions";
import { neon } from "@netlify/neon";
import { requireUser, requireMethod, readBody, positiveId, json, handleError } from "../shared/security";

export const handler: Handler = async (event) => {
    try {
        requireMethod(event, "POST"); // Mantener compatibilidad con mantenimientos.html.
        const userId = requireUser(event);
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
