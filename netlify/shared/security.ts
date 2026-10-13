import type { HandlerEvent, HandlerResponse } from "@netlify/functions";
const jwt = require("jsonwebtoken");

export class ApiError extends Error {
    constructor(public readonly status: number, message: string) {
        super(message);
        this.name = "ApiError";
    }
}

export const apiHeaders = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
};

export function json(statusCode: number, data: unknown): HandlerResponse {
    return { statusCode, headers: apiHeaders, body: JSON.stringify(data) };
}

export function requireMethod(event: HandlerEvent, method: string): void {
    if (event.httpMethod !== method) throw new ApiError(405, "Método no permitido");
}

// Nunca usar un valor de respaldo público para firmar o verificar JWT.
function jwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32 || secret === "supersecret") {
        console.error("JWT_SECRET ausente o inseguro; configurar variable de entorno (>=32 caracteres aleatorios).");
        throw new ApiError(503, "Autenticación no disponible temporalmente");
    }
    return secret;
}

export function assertJwtConfigured(): void {
    jwtSecret();
}

export function signToken(id: number, username: string): string {
    return jwt.sign({ id, username }, jwtSecret(), { algorithm: "HS256", expiresIn: "1h" });
}

export function requireUser(event: HandlerEvent): number {
    // Comprobar también configuración en rutas protegidas.
    const secret = jwtSecret();
    const authorization = event.headers?.authorization || event.headers?.Authorization;
    const match = typeof authorization === "string" ? /^Bearer\s+(\S+)$/i.exec(authorization) : null;
    if (!match) throw new ApiError(401, "Debes iniciar sesión");
    try {
        const decoded = jwt.verify(match[1], secret, { algorithms: ["HS256"] });
        const id = decoded && typeof decoded === "object" ? decoded.id : undefined;
        if (!Number.isSafeInteger(id) || id <= 0) throw new Error("Identificador inválido");
        return id;
    } catch {
        throw new ApiError(401, "Sesión caducada o no válida");
    }
}

export function readBody(event: HandlerEvent): Record<string, unknown> {
    if (!event.body || event.body.length > 16_000) throw new ApiError(400, "Petición vacía o demasiado grande");
    try {
        const result = JSON.parse(event.body);
        if (!result || typeof result !== "object" || Array.isArray(result)) throw Error();
        return result;
    } catch {
        throw new ApiError(400, "JSON no válido");
    }
}

export function stringField(value: unknown, name: string, max: number, min = 1): string {
    if (typeof value !== "string" || value.trim().length < min || value.length > max) {
        throw new ApiError(400, `${name}: longitud no válida`);
    }
    return value.trim();
}

export function positiveId(value: unknown, name = "ID"): number {
    const num = typeof value === "number" ? value :
        typeof value === "string" && /^\d+$/.test(value) ? Number(value) : NaN;
    if (!Number.isSafeInteger(num) || num <= 0) throw new ApiError(400, `${name} no válido`);
    return num;
}

export function handleError(error: unknown): HandlerResponse {
    if (error instanceof ApiError) return json(error.status, { error: error.message });
    // No devolver excepciones SQL, detalles de conexión ni secretos al navegador.
    console.error("Error interno en función Enduro Nalón:", error);
    return json(500, { error: "Error interno del servidor" });
}
