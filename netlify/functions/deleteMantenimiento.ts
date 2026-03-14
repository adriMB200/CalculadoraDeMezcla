import { Handler } from "@netlify/functions";
import { neon } from "@netlify/neon";

export const handler: Handler = async (event) => {
    try {
        const sql = neon();
        const { id } = JSON.parse(event.body || "{}");

        if (!id) {
            return { statusCode: 400, body: JSON.stringify({ error: "Falta el ID del mantenimiento" }) };
        }

        await sql`DELETE FROM public.mantenimientos WHERE id = ${id}`;

        return { statusCode: 200, body: JSON.stringify({ message: "Mantenimiento eliminado" }) };
    } catch (err: any) {
        return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
};