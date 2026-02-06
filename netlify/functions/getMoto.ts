import { HandlerEvent, HandlerContext } from '@netlify/functions';
import { db } from '../../db';
import { motos, mantenimientos, playingWithNeon } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { extractYearFromModel, isMissingTableError } from './dbUtils';

export const handler = async (event: HandlerEvent, context: HandlerContext) => {
    try {
        const matricula = event.queryStringParameters?.matricula?.trim();
        if (!matricula) return { statusCode: 400, body: JSON.stringify({ error: 'Falta matrícula' }) };

        let motoRows;

        try {
            motoRows = await db.select().from(motos).where(eq(motos.matricula, matricula));
        } catch (error) {
            if (!isMissingTableError(error, 'motos')) {
                throw error;
            }
            const fallbackRows = await db.select().from(playingWithNeon).where(eq(playingWithNeon.plate, matricula));
            motoRows = fallbackRows.map((moto) => ({
                matricula: moto.plate,
                marca: moto.name,
                modelo: moto.model,
                anio: extractYearFromModel(moto.model),
            }));
        }

        let mant = [];

        try {
            mant = await db.select().from(mantenimientos).where(eq(mantenimientos.matricula, matricula));
        } catch (error) {
            if (!isMissingTableError(error, 'mantenimientos')) {
                throw error;
            }
        }

        if (motoRows.length === 0) return { statusCode: 404, body: JSON.stringify({ error: 'Moto no encontrada' }) };

        return { statusCode: 200, body: JSON.stringify({ moto: motoRows[0], mantenimientos: mant }) };
    } catch (error) {
        console.error(error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Error al obtener datos' }) };
    }
};
