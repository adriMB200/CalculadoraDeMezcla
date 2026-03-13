import { Handler } from "@netlify/functions";
import { neon } from "@netlify/neon";

export const handler: Handler = async (event) => {

    try {

        const sql = neon();

        const body = JSON.parse(event.body || "{}");

        const { matricula, marca, modelo, anio } = body;

        if (!matricula || !marca || !modelo || !anio) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Faltan datos" })
            };
        }

        await sql`
      INSERT INTO public.motos (matricula, marca, modelo, anio)
      VALUES (${matricula}, ${marca}, ${modelo}, ${anio})
    `;

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Moto añadida correctamente" })
        };

    } catch (error: any) {

        if (error.message?.includes("duplicate")) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "La moto ya existe" })
            };
        }

        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};