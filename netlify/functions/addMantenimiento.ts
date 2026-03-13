import { Handler } from "@netlify/functions";
import { neon } from "@netlify/neon";

export const handler: Handler = async (event) => {

    try {

        const sql = neon();

        const body = JSON.parse(event.body || "{}");

        const { matricula, descripcion, horas } = body;

        if (!matricula || !descripcion || !horas) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Faltan datos" })
            };
        }

        await sql`
      INSERT INTO public.mantenimientos (matricula, descripcion, horas)
      VALUES (${matricula}, ${descripcion}, ${horas})
    `;

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Mantenimiento añadido" })
        };

    } catch (error: any) {

        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };

    }
};