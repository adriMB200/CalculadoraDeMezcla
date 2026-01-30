import { HandlerEvent, HandlerContext } from '@netlify/functions';
import { db } from '../../db';
import { mantenimientos } from '../../db/schema';

export const handler = async (event: HandlerEvent, context: HandlerContext) => {
    try {
        if (!event.body) return { statusCode: 400, body: 'Falta body' };

        const { matricula, descripcion, horas } = JSON.parse(event.body);

        if (!matricula || !descripcion || !horas) {
            return { statusCode: 400, body: 'Faltan datos' };
        }

        const fecha = new Date().toLocaleDateString('es-ES');

        await db.insert(mantenimientos).values({
            matricula,
            descripcion,
            horas: parseInt(horas),
            fecha,
        });

        return { statusCode: 200, body: 'Mantenimiento registrado' };
    } catch (error) {
        console.error(error);
        return { statusCode: 500, body: 'Error al registrar mantenimiento' };
    }
};
