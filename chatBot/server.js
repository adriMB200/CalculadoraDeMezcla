const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const API_KEY = "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";

app.post("/chat", async (req, res) => {

    const pregunta = req.body.mensaje;

    try {

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + API_KEY
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: `Eres un mecánico experto en motos enduro.

Especialista en:
- KTM
- Gasgas
- Rieju
- pares de apriete
- mantenimiento
- carburación
- fallos de motor
- suspensiones
- electrónica
- diagnosis de averías
- modificaciones y mejoras
- consejos de uso y mantenimiento

Responde de forma clara y técnica.`
                    },
                    {
                        role: "user",
                        content: pregunta
                    }
                ]
            })
        });

        const data = await response.json();

        res.json({
            respuesta: data.choices[0].message.content
        });

    } catch (err) {

        res.json({
            respuesta: "Error en el servidor del asistente."
        });

    }

});

app.listen(3000, () => {
    console.log("Chatbot funcionando en puerto 3000");
});