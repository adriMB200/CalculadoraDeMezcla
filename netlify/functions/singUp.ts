// netlify/functions/signUp.ts
import { Handler } from "@netlify/functions";
import { neon } from "@netlify/neon";
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "supersecret";

export const handler: Handler = async (event) => {
    try {
        const { username, password } = JSON.parse(event.body || "{}");
        if (!username || !password) throw new Error("Faltan datos");

        const sql = neon();

        // Verificar si ya existe usuario
        const existing = await sql`SELECT * FROM public.usuarios WHERE username = ${username}`;
        if (existing.length > 0) throw new Error("Usuario ya existe");

        const hash = await bcrypt.hash(password, 10);

        // Insertar usuario
        const [user] = await sql`
      INSERT INTO public.usuarios (username, password_hash)
      VALUES (${username}, ${hash})
      RETURNING id, username
    `;

        // Generar token JWT
        const token = jwt.sign({ id: user.id, username: user.username }, SECRET, { expiresIn: "1h" });

        return {
            statusCode: 200,
            body: JSON.stringify({ token, username: user.username })
        };

    } catch (error: any) {
        return { statusCode: 400, body: JSON.stringify({ error: error.message }) };
    }
};