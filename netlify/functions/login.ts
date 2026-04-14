import { Handler } from "@netlify/functions";
import { neon } from "@netlify/neon";
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "supersecret";

const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
};

export const handler: Handler = async (event) => {
    try {

        if (event.httpMethod === "OPTIONS") {
            return { statusCode: 200, headers, body: "" };
        }

        const { username, password } = JSON.parse(event.body || "{}");
        const sql = neon();

        const [user] = await sql`SELECT * FROM public.usuarios WHERE username = ${username}`;
        if (!user) return { statusCode: 401, body: JSON.stringify({ error: "Usuario no encontrado" }) };

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return { statusCode: 401, body: JSON.stringify({ error: "Contraseña incorrecta" }) };

        const token = jwt.sign({ id: user.id, username: user.username }, SECRET, { expiresIn: "1h" });

        return { statusCode: 200, headers, body: JSON.stringify({ token }) };
    } catch (error: any) {
        return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
    }
};