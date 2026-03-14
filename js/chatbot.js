
// chat.js
document.addEventListener("DOMContentLoaded", () => {

    document.body.insertAdjacentHTML("beforeend", `
<div id="chatbot-container">

    <div id="chatbot-header">
        🔧 Asistente Mecánico
        <span id="chatbot-close">✕</span>
    </div>

    <div id="chatbot-messages"></div>

    <div id="chatbot-input-area">
        <input id="chatbot-input" placeholder="Pregunta algo sobre tu moto..." />
        <button id="chatbot-send">Enviar</button>
    </div>

</div>

<button id="chatbot-open">💬</button>
`);

    const chat = document.getElementById("chatbot-container");
    const openBtn = document.getElementById("chatbot-open");
    const closeBtn = document.getElementById("chatbot-close");
    const input = document.getElementById("chatbot-input");
    const sendBtn = document.getElementById("chatbot-send");
    const messages = document.getElementById("chatbot-messages");

    let iniciado = false;

    function addUserMessage(text) {
        const msg = document.createElement("div");
        msg.className = "chat-user";
        msg.textContent = "Tú: " + text;
        messages.appendChild(msg);
        messages.scrollTop = messages.scrollHeight;
    }

    function addBotMessage(text) {
        const msg = document.createElement("div");
        msg.className = "chat-bot";
        msg.textContent = "Mecánico: " + text;
        messages.appendChild(msg);
        messages.scrollTop = messages.scrollHeight;
    }

    async function enviarMensaje(text) {

        if (!text) return;

        addUserMessage(text);
        input.value = "";

        const thinking = document.createElement("div");
        thinking.className = "chat-bot";
        thinking.textContent = "Mecánico: pensando...";
        messages.appendChild(thinking);
        messages.scrollTop = messages.scrollHeight;

        try {

            const res = await fetch("/.netlify/functions/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mensaje: text })
            });

            const data = await res.json();

            thinking.remove();
            addBotMessage(data.respuesta);

        } catch {

            thinking.remove();
            addBotMessage("Error al contactar con el asistente");

        }

    }

    openBtn.onclick = async () => {

        chat.style.display = "flex";

        if (!iniciado) {

            iniciado = true;

            try {

                const res = await fetch("/.netlify/functions/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ mensaje: "hola" })
                });

                const data = await res.json();
                addBotMessage(data.respuesta);

            } catch {

                addBotMessage("¡Hola! ¿Necesitas ayuda con tu moto enduro?");

            }

        }

    };

    closeBtn.onclick = () => {
        chat.style.display = "none";
    };

    sendBtn.onclick = () => {
        enviarMensaje(input.value.trim());
    };

    input.addEventListener("keypress", e => {
        if (e.key === "Enter") {
            enviarMensaje(input.value.trim());
        }
    });

});
