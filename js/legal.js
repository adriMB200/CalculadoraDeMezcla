document.addEventListener("DOMContentLoaded", () => {
    injectLegalModal();
    injectLegalTrigger();
    bindLegalEvents();
});

function injectLegalTrigger() {
    if (document.getElementById("legalTriggerWrap")) return;

    const wrap = document.createElement("div");
    wrap.className = "legal-trigger-wrap";
    wrap.id = "legalTriggerWrap";

    wrap.innerHTML = `
        <button class="legal-trigger" id="openLegalModalBtn">
            Info legal y créditos
        </button>
    `;

    const footer = document.querySelector("footer");

    if (footer && footer.parentNode) {
        footer.parentNode.insertBefore(wrap, footer);
    } else {
        document.body.appendChild(wrap);
    }
}

function injectLegalModal() {
    if (document.getElementById("legalModal")) return;

    const modal = document.createElement("div");
    modal.className = "legal-modal-overlay";
    modal.id = "legalModal";

    modal.innerHTML = `
        <div class="legal-modal">
            <h2>Información legal y créditos</h2>

            <h3>Desarrollo de la app</h3>
            <p><strong>App:</strong> Enduro Nalón</p>
            <p><strong>Desarrollada por:</strong> AdriMB200</p>
            <p><strong>Versión:</strong> 1.0.0</p>
            <p><strong>Contacto:</strong> https://github.com/adriMB200 </p>

            <h3>Aviso legal</h3>
            <p>
                Esta aplicación y su contenido tienen carácter informativo y orientativo.
                El titular de la app realiza esfuerzos razonables para mantener la información actualizada,
                pero no garantiza la ausencia de errores, omisiones o desactualizaciones.
            </p>

            <p>
                El uso de esta aplicación es responsabilidad exclusiva del usuario.
                El titular no se hace responsable de los daños, perjuicios, averías, pérdidas
                o decisiones derivadas del uso de la información mostrada en la app.
            </p>

            <p>
                Los datos técnicos, pares de apriete, porcentajes de mezcla, manuales, referencias
                y recomendaciones deben contrastarse siempre con la documentación oficial del fabricante
                y con un profesional cualificado cuando sea necesario.
            </p>

            <h3>Propiedad intelectual</h3>
            <p>
                El diseño, textos, estructura y elementos propios de esta aplicación están protegidos por
                la normativa aplicable de propiedad intelectual e industrial. Queda prohibida su reproducción,
                distribución o transformación sin autorización expresa del titular, salvo en los casos permitidos por la ley.
            </p>

            <h3>Privacidad</h3>
            <p>
                Los datos introducidos por los usuarios se utilizarán únicamente para el funcionamiento
                de la aplicación y la prestación de sus funcionalidades. El responsable de la app deberá
                informar de forma específica sobre el tratamiento de datos personales cuando resulte legalmente exigible.
            </p>

            <h3>Responsabilidad del usuario</h3>
            <p>
                El usuario se compromete a utilizar la aplicación de forma lícita, adecuada y respetuosa,
                evitando usos fraudulentos, ilícitos o que puedan perjudicar a terceros o al funcionamiento del servicio.
            </p>

            <h3>Enlaces y recursos externos</h3>
            <p>
                Esta aplicación puede incluir enlaces a sitios externos o documentación de terceros.
                El titular no controla ni asume responsabilidad por el contenido, disponibilidad
                o políticas de dichos sitios web externos.
            </p>

            <button class="legal-close" id="closeLegalModalBtn">Cerrar</button>
        </div>
    `;

    document.body.appendChild(modal);
}

function bindLegalEvents() {
    const openBtn = document.getElementById("openLegalModalBtn");
    const closeBtn = document.getElementById("closeLegalModalBtn");
    const modal = document.getElementById("legalModal");

    if (openBtn) {
        openBtn.addEventListener("click", openLegalModal);
    }

    if (closeBtn) {
        closeBtn.addEventListener("click", closeLegalModal);
    }

    if (modal) {
        modal.addEventListener("click", function (e) {
            if (e.target === this) {
                closeLegalModal();
            }
        });
    }
}

function openLegalModal() {
    const modal = document.getElementById("legalModal");
    if (modal) modal.style.display = "flex";
}

function closeLegalModal() {
    const modal = document.getElementById("legalModal");
    if (modal) modal.style.display = "none";
}