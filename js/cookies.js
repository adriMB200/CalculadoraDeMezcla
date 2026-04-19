document.addEventListener("DOMContentLoaded", () => {
    injectCookieBanner();
    bindCookieEvents();
    showCookieBannerIfNeeded();
});

function injectCookieBanner() {
    if (document.getElementById("cookieBanner")) return;

    const banner = document.createElement("div");
    banner.className = "cookie-banner";
    banner.id = "cookieBanner";

    banner.innerHTML = `
        <div class="cookie-banner-content">
            <div class="cookie-banner-text">
                <strong>Uso de cookies</strong><br>
                Esta app utiliza cookies o tecnologías similares para mejorar la experiencia,
                recordar preferencias y, en su caso, analizar el uso del sitio.
            </div>

            <div class="cookie-banner-actions">
                <button class="cookie-btn cookie-btn-more" id="cookieMoreBtn">Más información</button>
                <button class="cookie-btn cookie-btn-accept" id="cookieAcceptBtn">Aceptar</button>
            </div>
        </div>
    `;

    document.body.appendChild(banner);
}

function bindCookieEvents() {
    const acceptBtn = document.getElementById("cookieAcceptBtn");
    const moreBtn = document.getElementById("cookieMoreBtn");

    if (acceptBtn) {
        acceptBtn.addEventListener("click", acceptCookies);
    }

    if (moreBtn) {
        moreBtn.addEventListener("click", openCookiesInfo);
    }
}

function showCookieBannerIfNeeded() {
    const accepted = localStorage.getItem("cookiesAccepted");
    const banner = document.getElementById("cookieBanner");

    if (!accepted && banner) {
        banner.style.display = "block";
    }
}

function acceptCookies() {
    localStorage.setItem("cookiesAccepted", "true");
    const banner = document.getElementById("cookieBanner");
    if (banner) banner.style.display = "none";
}

function openCookiesInfo() {
    if (typeof openLegalModal === "function") {
        openLegalModal();
        return;
    }

    alert("Puedes consultar la información legal y de privacidad en el aviso legal de la aplicación.");
}