import type { Handler } from '@netlify/functions';
import { neon } from '@netlify/neon';
import { requireMethod, readBody, stringField, json, handleError, ApiError } from '../shared/security';
import { requireActiveUser, limit } from '../shared/accountSecurity';

const LIMITES = { h: 1_000_000, km: 10_000_000 } as const;
type Unidad = keyof typeof LIMITES;

function lecturaValida(value: unknown, unidad: Unidad): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0 || value > LIMITES[unidad]) {
    throw new ApiError(400, `Introduce una lectura válida en ${unidad === 'h' ? 'horas' : 'kilómetros'}`);
  }
  return value;
}

export const handler: Handler = async (event) => {
  try {
    requireMethod(event, 'POST');
    const userId = await requireActiveUser(event);
    const body = readBody(event);
    const matricula = stringField(body.matricula, 'Matrícula', 20).toUpperCase();
    if (!/^[A-Z0-9_-]{3,20}$/.test(matricula)) throw new ApiError(400, 'Identificador de moto no válido');
    const descripcion = stringField(body.descripcion, 'Descripción', 2000);
    // Las integraciones anteriores enviaban exclusivamente "horas".
    const unidad: Unidad = body.unidad === undefined ? 'h' : body.unidad as Unidad;
    if (unidad !== 'h' && unidad !== 'km') throw new ApiError(400, 'Unidad no válida');
    const lectura = lecturaValida(body.lectura ?? body[unidad === 'h' ? 'horas' : 'kilometros'], unidad);
    await limit(`sec11:historial-mantenimiento:account:${userId}`, 45, 60);

    const sql = neon();
    const resultado = await sql`
      INSERT INTO public.mantenimientos (matricula, descripcion, horas, kilometros, unidad)
      SELECT m.matricula, ${descripcion}, ${unidad === 'h' ? lectura : null},
             ${unidad === 'km' ? lectura : null}, ${unidad}
      FROM public.motos AS m
      WHERE m.matricula = ${matricula} AND m.usuario_id = ${userId}
      RETURNING id
    `;
    if (!resultado.length) throw new ApiError(404, 'Moto no encontrada');
    return json(200, { message: 'Mantenimiento añadido', id: resultado[0].id });
  } catch (error) {
    return handleError(error);
  }
};
