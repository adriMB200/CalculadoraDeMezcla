import type { Handler } from "@netlify/functions";
import { neon } from "@netlify/neon";
import { ApiError, requireMethod, readBody, stringField, json, handleError, signToken, assertJwtConfigured } from "../shared/security";
const bcrypt = require("bcryptjs");

export const handler: Handler = async (event) => {
    try {
        requireMethod(event, "POST");
        assertJwtConfigured();
        const body = readBody(event);
        const username = stringField(body.username, "Usuario", 40, 3);
        const password = body.password;
        if (typeof password !== "string" || password.length < 12 || password.length > 256) {
            return json(400, { error: "La contraseña debe tener entre 12 y 256 caracteres" });
        }
        if (!/^[A-Za-z0-9_.-]+$/.test(username)) {
            throw new ApiError(400, "El usuario solo puede contener letras, números, guion, punto y guion bajo");
        }
        const sql = neon();
        const exists = await sql`SELECT id FROM public.usuarios WHERE username = ${username}`;
        if (exists.length) return json(409, { error: "Ese usuario ya está registrado" });
        const passwordHash = await bcrypt.hash(password, 12);
        const [user] = await sql`
            INSERT INTO public.usuarios (username, password_hash)
            VALUES (${username}, ${passwordHash})
            RETURNING id, username
        `;
        return json(201, { token: signToken(user.id, user.username), username: user.username });
    } catch (error: any) {
        if (error?.code === "23505") return json(409, { error: "Ese usuario ya está registrado" });
        return handleError(error);
    }
};
