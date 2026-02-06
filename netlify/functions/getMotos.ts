import { HandlerEvent, HandlerContext } from '@netlify/functions';
import { db } from '../../db';
import { motos, mantenimientos, playingWithNeon } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { extractYearFromModel, isMissingTableError } from './dbUtils';

export const handler = async (event: HandlerEvent, context: HandlerContext) => {
    try {
        // Obtener todas las motos
        let allMotos: Array<{
            matricula: string;
            marca: string;
            modelo: string;
            anio: number | null;
        }>;

        try {
            const motosRows = await db.select().from(motos);
            allMotos = motosRows.map((moto) => ({
                matricula: moto.matricula,
                marca: moto.marca,
                modelo: moto.modelo,
                anio: moto.anio,
            }));
        } catch (error) {
            if (!isMissingTableError(error, 'motos')) {
                throw error;
            }

            const fallbackRows = await db.select().from(playingWithNeon);
            allMotos = fallbackRows.map((moto) => ({
                matricula: moto.plate,
                marca: moto.name,
                modelo: moto.model,
                anio: extractYearFromModel(moto.model),
            }));
        }

        // Para cada moto, obtener sus mantenimientos
        const motosConMantenimientos = await Promise.all(
            allMotos.map(async (moto) => {
                let mant = [];

                try {
                    mant = await db.select().from(mantenimientos).where(eq(mantenimientos.matricula, moto.matricula));
                } catch (error) {
                    if (!isMissingTableError(error, 'mantenimientos')) {
                        throw error;
                    }
                }

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
