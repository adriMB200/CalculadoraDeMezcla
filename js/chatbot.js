// chatbot.js
document.addEventListener("DOMContentLoaded", () => {

    // Insertamos el HTML del chatbot
    document.body.insertAdjacentHTML("beforeend", `
<div id="chatbot-container" style="
    display:none;
    flex-direction:column;
    position:fixed;
    bottom:20px;
    right:20px;
    width:300px;
    max-height:400px;
    background:#fff;
    border:1px solid #ccc;
    box-shadow:0 4px 10px rgba(0,0,0,0.2);
    z-index:9999;
">
    <div id="chatbot-header" style="
        background:#ff5722;
        color:#fff;
        padding:10px;
        cursor:pointer;
        display:flex;
        justify-content:space-between;
        align-items:center;
    ">
        🔧 Asistente Mecánico
        <span id="close-chat" style="cursor:pointer;">✕</span>
    </div>

    <div id="chatbot-messages" style="
        flex:1;
        padding:10px;
        overflow-y:auto;
        border-top:1px solid #ddd;
        border-bottom:1px solid #ddd;
    "></div>

    <input id="chatbot-input" placeholder="Pregunta algo..." style="
        padding:10px;
        border:none;
        outline:none;
        width:100%;
        box-sizing:border-box;
    ">
</div>

<button id="open-chat" style="
    position:fixed;
    bottom:20px;
    right:20px;
    z-index:9999;
    padding:10px 15px;
    border:none;
    border-radius:50%;
    background:#ff5722;
    color:#fff;
    font-size:20px;
    cursor:pointer;
    box-shadow:0 4px 10px rgba(0,0,0,0.2);
">💬 Abrir chat</button>
`);

    // Selección de elementos
    const openBtn = document.getElementById("open-chat");
    const closeBtn = document.getElementById("close-chat");
    const chat = document.getElementById("chatbot-container");
    const input = document.getElementById("chatbot-input");
    const messages = document.getElementById("chatbot-messages");

    // Abrir y cerrar chat
    openBtn.onclick = () => chat.style.display = "flex";
    closeBtn.onclick = () => chat.style.display = "none";

    // Función para enviar mensaje
    input.addEventListener("keypress", async function (e) {
        if (e.key === "Enter" && input.value.trim() !== "") {
            const pregunta = input.value.trim();
            messages.innerHTML += `<p><b>Tú:</b> ${pregunta}</p>`;
            input.value = "";

            try {
                const respuesta = await fetch("/.netlify/functions/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ mensaje: pregunta })
                });

                const data = await respuesta.json();
                messages.innerHTML += `<p style="color:#ff5722"><b>Mecánico:</b> ${data.respuesta}</p>`;
            } catch (err) {
                messages.innerHTML += `<p style="color:red"><b>Error:</b> No se pudo obtener respuesta</p>`;
            }

            // Scroll automático hacia abajo
            messages.scrollTop = messages.scrollHeight;
        }
    });

});