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
import { requireActiveUser, limit } from '../shared/accountSecurity';

// Respuesta compatible con Mi Garaje y Libro: array de motos con mantenimientos.
export const handler: Handler = async event => {
  try {
    requireMethod(event,'GET');
    const uid=await requireActiveUser(event);
    await limit(`f18:lectura-motos:${uid}`,120,60);
    const sql=neon();
    const motos=await sql`
      SELECT matricula, marca, modelo, anio FROM public.motos
      WHERE usuario_id=${uid} ORDER BY marca,modelo,anio LIMIT 75
    `;
    if (!motos.length) return json(200,[]);
    const registros=await sql`
      SELECT r.id,r.matricula,r.descripcion,r.horas,r.kilometros,r.unidad,r.fecha
      FROM public.mantenimientos r
      JOIN public.motos m ON m.matricula=r.matricula
      WHERE m.usuario_id=${uid}
      ORDER BY r.fecha DESC,r.id DESC LIMIT 1000
    `;
    const agrupados=new Map<string,typeof registros>();
    for(const r of registros){const key=String(r.matricula);if(!agrupados.has(key))agrupados.set(key,[]);agrupados.get(key)!.push(r);}
    return json(200,motos.map(m=>({...m,mantenimientos:agrupados.get(String(m.matricula))||[]})));
  }catch(err){return handleError(err);}
};
