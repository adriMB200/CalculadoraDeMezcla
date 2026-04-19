document.addEventListener("DOMContentLoaded", () => {
    injectAuthHTML();
    renderAuthButton();
    bindAuthEvents();

    if (typeof window.onAuthReady === "function") {
        window.onAuthReady();
    }
});

function injectAuthHTML() {
    if (!document.getElementById("authTopbar")) {
        const topbar = document.createElement("div");
        topbar.className = "auth-topbar";
        topbar.id = "authTopbar";
        document.body.prepend(topbar);
    }

    if (!document.getElementById("authModal")) {
        const modal = document.createElement("div");
        modal.className = "auth-modal-overlay";
        modal.id = "authModal";
        modal.innerHTML = `
            <div class="auth-modal">
                <h2>🔐 Acceso</h2>
                <div class="auth-error" id="authError"></div>

                <input type="text" id="authUsername" placeholder="Usuario">
                <input type="password" id="authPassword" placeholder="Contraseña">

                <div class="auth-actions">
                    <button class="btn-login" id="authLoginBtn">Iniciar sesión</button>
                    <button class="btn-register" id="authRegisterBtn">Registrarse</button>
                </div>

                <button class="auth-close" id="authCloseBtn">Cerrar</button>
            </div>
        `;
        document.body.appendChild(modal);
    }
}

function bindAuthEvents() {
    const modal = document.getElementById("authModal");
    const loginBtn = document.getElementById("authLoginBtn");
    const registerBtn = document.getElementById("authRegisterBtn");
    const closeBtn = document.getElementById("authCloseBtn");
    const passwordInput = document.getElementById("authPassword");

    if (loginBtn) loginBtn.addEventListener("click", () => handleAuth("login"));
    if (registerBtn) registerBtn.addEventListener("click", () => handleAuth("register"));
    if (closeBtn) closeBtn.addEventListener("click", closeAuthModal);

    if (modal) {
        modal.addEventListener("click", function (e) {
            if (e.target === this) closeAuthModal();
        });
    }

    if (passwordInput) {
        passwordInput.addEventListener("keydown", function (e) {
            if (e.key === "Enter") handleAuth("login");
        });
    }
}

function getUser() {
    return localStorage.getItem("user");
}

function getToken() {
    return localStorage.getItem("token");
}

function isLogged() {
    return !!localStorage.getItem("token");
}

function openAuthModal() {
    const modal = document.getElementById("authModal");
    const errorBox = document.getElementById("authError");

    if (modal) modal.style.display = "flex";
    if (errorBox) errorBox.textContent = "";
}

function closeAuthModal() {
    const modal = document.getElementById("authModal");
    if (modal) modal.style.display = "none";
}

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    renderAuthButton();

    if (typeof window.onLogout === "function") {
        window.onLogout();
    }
}

function renderAuthButton() {
    const topbar = document.getElementById("authTopbar");
    if (!topbar) return;

    if (isLogged()) {
        topbar.innerHTML = `
            <div class="user-menu">
                <button class="auth-btn" id="authUserBtn">${getUser() || "Usuario"}</button>
                <button class="logout-btn" id="authLogoutBtn">Salir</button>
            </div>
        `;

        const authUserBtn = document.getElementById("authUserBtn");
        const authLogoutBtn = document.getElementById("authLogoutBtn");

        if (authUserBtn) authUserBtn.addEventListener("click", openAuthModal);
        if (authLogoutBtn) authLogoutBtn.addEventListener("click", logout);
    } else {
        topbar.innerHTML = `<button class="auth-btn" id="authOpenBtn">Iniciar sesión</button>`;
        const authOpenBtn = document.getElementById("authOpenBtn");
        if (authOpenBtn) authOpenBtn.addEventListener("click", openAuthModal);
    }
}

async function handleAuth(action) {
    const usernameInput = document.getElementById("authUsername");
    const passwordInput = document.getElementById("authPassword");
    const errorBox = document.getElementById("authError");

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
        if (errorBox) errorBox.textContent = "Introduce usuario y contraseña";
        return;
    }

    const path = action === "login"
        ? "/.netlify/functions/login"
        : "/.netlify/functions/singUp";

    const endpoint = resolveAuthEndpoint(path);
    console.log("Endpoint auth:", endpoint);

    try {
        const res = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password })
        });

        const data = await safeJson(res);

        if (!res.ok) {
            if (errorBox) errorBox.textContent = data.error || "Error de autenticación";
            return;
        }

        if (!data.token) {
            if (errorBox) errorBox.textContent = "El servidor no devolvió un token válido";
            return;
        }

        localStorage.setItem("token", data.token);
        localStorage.setItem("user", username);

        passwordInput.value = "";
        closeAuthModal();
        renderAuthButton();

        if (typeof window.onLoginSuccess === "function") {
            window.onLoginSuccess(data, username);
        }
    } catch (err) {
        console.error("Error auth:", err);
        if (errorBox) errorBox.textContent = "No se pudo conectar con el servidor";
    }
}

function resolveAuthEndpoint(path) {
    if (!path.startsWith("/")) {
        path = "/" + path;
    }

    const protocol = window.location.protocol;

    if (protocol === "http:" || protocol === "https:") {
        return path;
    }

    const base = getFallbackBaseUrl();
    return `${base}${path}`;
}

function getFallbackBaseUrl() {
    if (typeof window.PROD_URL === "string" && window.PROD_URL.trim() !== "") {
        return window.PROD_URL.replace(/\/$/, "");
    }

    return "https://enduronalon.netlify.app";
}

async function safeJson(res) {
    try {
        return await res.json();
    } catch {
        return {};
    }
}