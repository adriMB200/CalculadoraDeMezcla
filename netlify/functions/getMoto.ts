import { HandlerEvent, HandlerContext } from '@netlify/functions';
import { db } from '../../db';
import { motos, mantenimientos } from '../../db/schema';
import { eq } from 'drizzle-orm';

export const handler = async (event: HandlerEvent, context: HandlerContext) => {
    try {
        if (!matricula) return { statusCode: 400, body: JSON.stringify({ error: 'Falta matrícula' }) };

        const moto = await db.select().from(motos).where(eq(motos.matricula, matricula));
        const mant = await db.select().from(mantenimientos).where(eq(mantenimientos.matricula, matricula));

        if (moto.length === 0) return { statusCode: 404, body: JSON.stringify({ error: 'Moto no encontrada' }) };

        return { statusCode: 200, body: JSON.stringify({ moto: moto[0], mantenimientos: mant }) };
    } catch (error) {
        console.error(error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Error al obtener datos' }) };
    }
};
