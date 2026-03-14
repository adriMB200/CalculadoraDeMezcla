import { Handler, HandlerEvent } from "@netlify/functions";
const { neon } = require("@netlify/neon");
const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "supersecret";

export const handler: Handler = async (event: HandlerEvent) => {
    try {
        const tokenHeader = event.headers && event.headers.authorization;
        if (!tokenHeader) throw new Error("No autorizado");
        const token = tokenHeader.replace("Bearer ", "");
        const payload: any = jwt.verify(token, SECRET);
        const userId = payload.id;

        const sql = neon();
        const body = JSON.parse(event.body || "{}");
        let { matricula, marca, modelo, anio } = body;

        if (!matricula || !marca || !modelo || !anio)
            return { statusCode: 400, body: JSON.stringify({ error: "Faltan datos" }) };

        matricula = matricula.toUpperCase();

        await sql`
      INSERT INTO public.motos (matricula, marca, modelo, anio, usuario_id)
      VALUES (${matricula}, ${marca}, ${modelo}, ${anio}, ${userId})
    `;

        return { statusCode: 200, body: JSON.stringify({ message: "Moto añadida correctamente" }) };
    } catch (error: any) {
        if (error.message?.includes("duplicate"))
            return { statusCode: 400, body: JSON.stringify({ error: "La moto ya existe" }) };
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};