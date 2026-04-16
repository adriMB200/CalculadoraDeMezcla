import { Handler, HandlerEvent } from "@netlify/functions";
const { neon } = require("@netlify/neon");
const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "supersecret";

const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
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
        const payload: any = jwt.verify(token, SECRET);
        const userId = payload.id;

        const sql = neon();
        const body = JSON.parse(event.body || "{}");

        const { contenido, tema_id } = body;

        if (!contenido || !tema_id) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: "Faltan datos" })
            };
        }

        await sql`
      INSERT INTO public.mensajes (contenido, usuario_id, tema_id, fecha)
      VALUES (${contenido}, ${userId}, ${tema_id}, NOW())
    `;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ message: "Mensaje enviado correctamente" })
        };

    } catch (error: any) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};