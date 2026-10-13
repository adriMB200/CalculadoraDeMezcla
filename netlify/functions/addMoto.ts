import type { Handler } from "@netlify/functions";
import { neon } from "@netlify/neon";
import { requireMethod, readBody, stringField, json, handleError } from '../shared/security';
import { requireActiveUser } from '../shared/accountSecurity';

export const handler: Handler = async (event) => {
    try {
        requireMethod(event, "POST");
        const userId = await requireActiveUser(event);
        const body = readBody(event);
        const matricula = stringField(body.matricula, "Matrícula", 20).toUpperCase();
        const marca = stringField(body.marca, "Marca", 50);
        const modelo = stringField(body.modelo, "Modelo", 50);
        const anio = Number(body.anio);
        if (!Number.isInteger(anio) || anio < 1950 || anio > new Date().getFullYear() + 1) {
            return json(400, { error: "Año no válido" });
        }
        const sql = neon();
        await sql`
            INSERT INTO public.motos (matricula, marca, modelo, anio, usuario_id)
            VALUES (${matricula}, ${marca}, ${modelo}, ${anio}, ${userId})
        `;
        return json(200, { message: "Moto añadida correctamente" });
    } catch (error: any) {
        if (error?.code === "23505") return json(409, { error: "La moto ya existe" });
        return handleError(error);
    }
};
