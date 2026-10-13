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
