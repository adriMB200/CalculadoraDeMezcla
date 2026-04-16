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

        const tokenHeader = event.headers.authorization;
        if (!tokenHeader) throw new Error("No autorizado");

        const token = tokenHeader.replace("Bearer ", "");
        const payload: any = jwt.verify(token, SECRET);
        const userId = payload.id;

        const sql = neon();
        const body = JSON.parse(event.body || "{}");

        const { titulo, descripcion } = body;

        if (!titulo) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: "Falta el título" })
            };
        }

        await sql`
      INSERT INTO public.temas (titulo, descripcion, usuario_id)
      VALUES (${titulo}, ${descripcion}, ${userId})
    `;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ message: "Tema creado correctamente" })
        };

    } catch (error: any) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};