import { HandlerEvent, HandlerContext } from '@netlify/functions';
import { db } from '../../db';
import { motos, mantenimientos } from '../../db/schema';
import { eq } from 'drizzle-orm';

export const handler = async (event: HandlerEvent, context: HandlerContext) => {
    try {
        // Obtener todas las motos
        const allMotos = await db.select().from(motos);

        // Para cada moto, obtener sus mantenimientos
        const motosConMantenimientos = await Promise.all(
            allMotos.map(async (moto) => {
                const mant = await db.select().from(mantenimientos).where(eq(mantenimientos.matricula, moto.matricula));
                return {
                    matricula: moto.matricula,
                    marca: moto.marca,
                    modelo: moto.modelo,
                    anio: moto.anio,
                    mantenimientos: mant
                };
            })
        );

        return { statusCode: 200, body: JSON.stringify(motosConMantenimientos) };
    } catch (error) {
        console.error(error);
        return { statusCode: 500, body: 'Error al obtener motos' };
    }
};