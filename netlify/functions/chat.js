import fetch from "node-fetch";

export async function handler(event) {

    try {

        const { mensaje } = JSON.parse(event.body);

        const response = await fetch(
            "https://router.huggingface.co/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.API_KEY_CHAT}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "Qwen/Qwen2.5-7B-Instruct:together",
                    messages: [
                        {
                            role: "system",
                            content: `
                            Eres un mecánico experto en motos enduro.

                            Especialista en:
                            - KTM, Gasgas y Rieju
                            - motores 2T y 4T
                            - carburación
                            - pares de apriete
                            - mecanica 
                            - diagnosis de averías
                            - modificaciones y mejoras
                            - consejos de uso y mantenimiento
                            
                            
                            Reglas de respuesta:
                            - Responde siempre en español.
                            - Sé directo y técnico.
                            - Usa frases cortas.
                            - Si no sabes algo, dilo claramente.
                            - Da consejos prácticos de mecánico.
                            - Evita respuestas largas innecesarias.
                            
                            Tu tono es como el de un mecánico experimentado de taller.
                            `
                        },
                        {
                            role: "user",
                            content: mensaje
                        }
                    ],
                    temperature: 0.3,
                    top_p: 0.9,
                    max_tokens: 250
                })
            }
        );

        const data = await response.json();

        const respuesta =
            data?.choices?.[0]?.message?.content ||
            "No se recibió respuesta.";

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ respuesta })
        };

    } catch (error) {

        console.error(error);

        return {
            statusCode: 500,
            body: JSON.stringify({
                respuesta: "Error en el asistente",
                detalle: error.message
            })
        };

    }

}