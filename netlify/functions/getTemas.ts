import { Handler, HandlerEvent } from "@netlify/functions";
const { neon } = require("@netlify/neon");
const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "supersecret";

const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, OPTIONS"
};

export const handler: Handler = async (event: HandlerEvent) => {
    try {
        if (event.httpMethod === "OPTIONS") {
            return { statusCode: 200, headers, body: "" };
        }

        const tokenHeader = event.headers.authorization;
        if (!tokenHeader) throw new Error("No autorizado");

        const token = tokenHeader.replace("Bearer ", "");
        jwt.verify(token, SECRET);

        const sql = neon();

        const temas = await sql` 
      SELECT 
        t.id,
        t.titulo,
        t.descripcion,
        t.fecha,
        u.username as creador
      FROM public.temas t
      JOIN public.usuarios u ON t.usuario_id = u.id
      ORDER BY t.fecha DESC
    `;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(temas)
        };

    } catch (error: any) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};