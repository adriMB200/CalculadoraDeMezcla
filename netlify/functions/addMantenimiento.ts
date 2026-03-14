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
        let { matricula, descripcion, horas } = body;

        if (!matricula || !descripcion || !horas)
            return { statusCode: 400, body: JSON.stringify({ error: "Faltan datos" }) };

        matricula = matricula.toUpperCase();

        // Verificar que la moto pertenece al usuario
        const [moto] = await sql`
      SELECT * FROM public.motos WHERE matricula = ${matricula} AND usuario_id = ${userId}
    `;
        if (!moto)
            return { statusCode: 403, body: JSON.stringify({ error: "No autorizado para esta moto" }) };

        await sql`
      INSERT INTO public.mantenimientos (matricula, descripcion, horas)
      VALUES (${matricula}, ${descripcion}, ${horas})
    `;

        return { statusCode: 200, body: JSON.stringify({ message: "Mantenimiento añadido" }) };
    } catch (error: any) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};