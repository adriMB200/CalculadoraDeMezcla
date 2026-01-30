import { HandlerEvent, HandlerContext } from '@netlify/functions';
import { db } from '../../db';
import { motos } from '../../db/schema';

export const handler = async (event: HandlerEvent, context: HandlerContext) => {
    try {
        if (!event.body) return { statusCode: 400, body: JSON.stringify({ error: 'Falta body' }) };

        const { matricula, marca, modelo, anio } = JSON.parse(event.body);

        if (!matricula || !marca || !modelo || !anio) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Faltan datos' }) };
        }

        // Insertar nueva moto
        await db.insert(motos).values({ matricula, marca, modelo, anio });

        return { statusCode: 200, body: JSON.stringify({ message: 'Moto registrada correctamente' }) };
    } catch (error) {
        console.error(error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Error al registrar moto' }) };
    }
};
