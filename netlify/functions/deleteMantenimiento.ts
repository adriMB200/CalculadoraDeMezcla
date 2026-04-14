import { Handler } from "@netlify/functions";
import { neon } from "@netlify/neon";

const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
};

export const handler: Handler = async (event) => {
    try {
        if (event.httpMethod === "OPTIONS") {
            return { statusCode: 200, headers, body: "" };
        }
        const sql = neon();
        const { id } = JSON.parse(event.body || "{}");

        if (!id) {
            return { statusCode: 400, body: JSON.stringify({ error: "Falta el ID del mantenimiento" }) };
        }

        await sql`DELETE FROM public.mantenimientos WHERE id = ${id}`;

        return { statusCode: 200, headers, body: JSON.stringify({ message: "Mantenimiento eliminado" }) };
    } catch (err: any) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
    }
};