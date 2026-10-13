import { Handler, HandlerEvent } from "@netlify/functions";
const { neon } = require("@netlify/neon");
import { requireMethod, json, handleError } from '../shared/security';
import { requireActiveUser } from '../shared/accountSecurity';



export const handler: Handler = async (event: HandlerEvent) => {
    try {
        requireMethod(event, "GET");
        const userId = await requireActiveUser(event);

        const sql = neon();

        // 2️⃣ Traer motos del usuario
        const motos = await sql`SELECT * FROM public.motos WHERE usuario_id = ${userId} ORDER BY marca`;

        if (motos.length === 0) return json(200, []);

        // 3️⃣ Traer mantenimientos solo de las motos del usuario
        const matriculas: string[] = [];
        for (let i = 0; i < motos.length; i++) {
            matriculas.push(motos[i].matricula);
        }

        if (matriculas.length === 0) return json(200, motos);

        const mantenimientos = await sql`
            SELECT * FROM public.mantenimientos
            WHERE matricula = ANY(${matriculas})
            ORDER BY fecha DESC
        `;

        // 4️⃣ Combinar motos con mantenimientos usando solo bucles
        const resultado = [];
        for (let i = 0; i < motos.length; i++) {
            const moto = motos[i];
            const motoMant = [];
            for (let j = 0; j < mantenimientos.length; j++) {
                const m = mantenimientos[j];
                if (m.matricula === moto.matricula) {
                    let fechaStr = "";
                    if (m.fecha) {
                        const fechaRaw = String(m.fecha); // convertir a string seguro
                        // tomar solo YYYY-MM-DD HH:MM:SS
                        const match = fechaRaw.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})/);
                        if (match) {
                            const d = new Date(match[1] + "Z"); // interpretar como UTC
                            fechaStr = d.toLocaleDateString();
                        } else {
                            fechaStr = fechaRaw; // fallback
                        }
                    }
                    motoMant.push({ ...m, fecha: fechaStr });
                }
            }
            resultado.push({ ...moto, mantenimientos: motoMant });
        }

        return json(200, resultado);
    } catch (err: any) {
        return handleError(err);
    }
};