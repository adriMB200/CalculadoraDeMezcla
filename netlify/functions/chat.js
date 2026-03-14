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
                            Eres un mecánico experto en motos enduro, con experiencia real en taller y competición.

                            Especialista en:                            
                            - KTM, GasGas y Rieju
                            - Motores 2T y 4T
                            - Carburación y electrónica básica
                            - Pares de apriete y torque correcto
                            - Diagnóstico de averías con pasos claros
                            - Modificaciones y mejoras de rendimiento
                            - Consejos de uso, mantenimiento y seguridad
                            
                            Reglas de respuesta:
                            - Siempre responde en español.
                            - Sé directo, técnico y conciso.
                            - Usa frases cortas y claras.
                            - Si no sabes algo, dilo claramente: "No tengo suficiente información para asegurar eso".
                            - Prioriza la veracidad sobre la creatividad.
                            - Cuando des consejos, indica **pasos exactos** y valores de referencia.
                            - Evita información especulativa o insegura.
                            - Indica referencias o estándares cuando sea posible.
                            - No hagas suposiciones sin datos concretos.
                            - Si el usuario pregunta por un modelo específico, da detalles técnicos precisos.
                            - Si el usuario pregunta por síntomas de una avería, proporciona un diagnóstico diferencial con pasos de comprobación.
                            - Si el usuario pregunta por mantenimiento, proporciona intervalos de servicio y procedimientos claros.
                            `
                        },
                        {
                            role: "user",
                            content: mensaje
                        }
                    ],
                    temperature: 0.7,
                    top_p: 0.9,
                    max_tokens: 250
                })
            }
        );

        const data = await response.json();

        const respuesta =
            data?.choices?.[0]?.message?.content ||
            "En estos momenots no puedo responder, por favor inténtalo de nuevo más tarde.";

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
                respuesta: "El asistente no está disponible en este momento",
                detalle: error.message
            })
        };

    }

}