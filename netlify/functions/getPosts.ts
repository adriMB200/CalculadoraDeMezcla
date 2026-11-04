/*
 * ENDURO_NALON_AUTORIA_V15
 * ENDURO NALÓN — Enduro, rutas y compañerismo en Asturias
 * Fundador y responsable del proyecto: Adrian Martis Blanco
 * GitHub: https://github.com/adriMB200
 * Web: https://enduronalon.netlify.app/
 * Copyright (c) 2026 Adrian Martis Blanco. Derechos reservados sobre las contribuciones originales.
 * Las bibliotecas, obras y contribuciones de terceros conservan sus licencias y autoría.
 */

// El endpoint legado devolvía SELECT * FROM posts sin autenticación.
// Ninguna página de este repositorio lo utiliza; lo deshabilitamos
// hasta definir qué campos y permisos de acceso son apropiados.
export default async () => {
    return new Response(JSON.stringify({ error: "Endpoint no disponible" }), {
        status: 404,
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff"
        }
    });
};
