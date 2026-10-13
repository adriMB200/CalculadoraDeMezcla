import type { Handler } from "@netlify/functions";
import { neon } from "@netlify/neon";
import { requireMethod, readBody, stringField, json, handleError, signToken } from "../shared/security";
const bcrypt = require("bcryptjs");

export const handler: Handler = async (event) => {
    try {
        requireMethod(event, "POST");
        const body = readBody(event);
        const username = stringField(body.username, "Usuario", 50);
        const password = body.password;
        if (typeof password !== "string" || password.length < 1 || password.length > 256) {
            return json(400, { error: "Contraseña no válida" });
        }
        const sql = neon();
        const [user] = await sql`
            SELECT id, username, password_hash, estado_cuenta, auth_version FROM public.usuarios WHERE username = ${username}
        `;
        // Mensaje uniforme para evitar enumeración de cuentas.
        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return json(401, { error: "Usuario o contraseña incorrectos" });
        }
        if (user.estado_cuenta !== 'activo') return json(403, { error: 'Cuenta no disponible. Contacta con el administrador.' });
        const token = signToken(user.id, user.username, Number(user.auth_version));
        return json(200, { token });
    } catch (error) { return handleError(error); }
};
