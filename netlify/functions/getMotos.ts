import { Handler } from "@netlify/functions";
import { neon } from "@netlify/neon";

export const handler: Handler = async () => {

    try {

        const sql = neon();

        const motos = await sql`
      SELECT * FROM public.motos
      ORDER BY marca
    `;

        const mantenimientos = await sql`
      SELECT * FROM public.mantenimientos
      ORDER BY fecha DESC
    `;

        const resultado = motos.map((moto: any) => {

            const mant = mantenimientos.filter(
                (m: any) => m.matricula === moto.matricula
            );

            return {
                ...moto,
                mantenimientos: mant
            };

        });

        return {
            statusCode: 200,
            body: JSON.stringify(resultado)
        };

    } catch (error: any) {

        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };

    }
};