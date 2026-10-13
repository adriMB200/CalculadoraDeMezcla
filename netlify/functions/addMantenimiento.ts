import type { Handler } from "@netlify/functions";
import { neon } from "@netlify/neon";
import { requireMethod, readBody, stringField, json, handleError } from '../shared/security';
import { requireActiveUser } from '../shared/accountSecurity';

export const handler: Handler = async (event) => {
    try {
        requireMethod(event, "POST");
        const userId = await requireActiveUser(event);
        const body = readBody(event);
        const matricula = stringField(body.matricula, "Matrícula", 20).toUpperCase();
        const descripcion = stringField(body.descripcion, "Descripción", 2000);
        const horas = Number(body.horas);
        if (!Number.isFinite(horas) || horas < 0 || horas > 1_000_000) {
            return json(400, { error: "Horas no válidas" });
        }
        const sql = neon();
        const moto = await sql`
            SELECT matricula FROM public.motos
            WHERE matricula = ${matricula} AND usuario_id = ${userId}
        `;
        if (moto.length === 0) return json(404, { error: "Moto no encontrada" });
        await sql`
            INSERT INTO public.mantenimientos (matricula, descripcion, horas)
            VALUES (${matricula}, ${descripcion}, ${horas})
        `;
        return json(200, { message: "Mantenimiento añadido" });
    } catch (error) { return handleError(error); }
};
