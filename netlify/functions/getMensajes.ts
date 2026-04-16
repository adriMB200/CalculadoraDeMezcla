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

        // 🔐 Auth
        const tokenHeader = event.headers.authorization;
        if (!tokenHeader) throw new Error("No autorizado");

        const token = tokenHeader.replace("Bearer ", "");
        jwt.verify(token, SECRET);

        const sql = neon();

        const tema_id = event.queryStringParameters?.tema_id;

        if (!tema_id) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: "Falta tema_id" })
            };
        }

        const mensajes = await sql`
      SELECT m.id, m.contenido, m.fecha, u.username as usuario
      FROM public.mensajes m
      JOIN public.usuarios u ON m.usuario_id = u.id
      WHERE m.tema_id = ${tema_id}
      ORDER BY m.fecha ASC
    `;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(mensajes)
        };

    } catch (error: any) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};