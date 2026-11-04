/*
 * ENDURO_NALON_AUTORIA_V15
 * ENDURO NALÓN — Enduro, rutas y compañerismo en Asturias
 * Fundador y responsable del proyecto: Adrian Martis Blanco
 * GitHub: https://github.com/adriMB200
 * Web: https://enduronalon.netlify.app/
 * Copyright (c) 2026 Adrian Martis Blanco. Derechos reservados sobre las contribuciones originales.
 * Las bibliotecas, obras y contribuciones de terceros conservan sus licencias y autoría.
 */

import type { Handler } from '@netlify/functions';
import { neon } from '@netlify/neon';
import { requireMethod, json, handleError } from '../shared/security';
import { requireActiveUser } from '../shared/accountSecurity';

export const handler: Handler = async (event) => {
  try {
    requireMethod(event, 'GET');
    const userId = await requireActiveUser(event);
    const sql = neon();
    const motos = await sql`
      SELECT * FROM public.motos WHERE usuario_id = ${userId} ORDER BY marca, modelo, anio
    `;
    if (!motos.length) return json(200, []);

    const registros = await sql`
      SELECT r.* FROM public.mantenimientos AS r
      INNER JOIN public.motos AS m ON m.matricula = r.matricula
      WHERE m.usuario_id = ${userId}
      ORDER BY r.fecha DESC, r.id DESC
    `;
    const agrupados = new Map<string, typeof registros>();
    for (const registro of registros) {
      const matricula = String(registro.matricula);
      if (!agrupados.has(matricula)) agrupados.set(matricula, []);
      agrupados.get(matricula)!.push(registro);
    }
    return json(200, motos.map(moto => ({
      ...moto,
      mantenimientos: agrupados.get(String(moto.matricula)) ?? []
    })));
  } catch (error) {
    return handleError(error);
  }
};
