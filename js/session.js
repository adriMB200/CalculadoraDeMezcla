/**
 * Enduro Nalón · Sesión segura (fase 1)
 * Compatible con los JWT actuales en localStorage.
 * No renueva JWT ni modifica las peticiones al servidor.
 * Cuando el token expira o el servidor lo rechaza por autenticación,
 * limpia solo la sesión y facilita volver a entrar.
 */
(function () {
    "use strict";

    const TOKEN_KEY = "token";
    const USER_KEY = "user";
    const RETURN_KEY = "enduro:returnAfterLogin";
    const EXPIRED_KEY = "enduro:sessionExpired";
    let handlingExpiration = false;

    const isHome = () => /(?:\/|\/index\.html)$/i.test(window.location.pathname);

    function readExpiration(token) {
        if (!token || typeof token !== "string") return null;

        try {
            const parts = token.split(".");
            if (parts.length !== 3) return 0; // JWT con formato incorrecto
            const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
            const payload = JSON.parse(window.atob(base64));
            // Un JWT sin exp no puede evaluarse por tiempo en el cliente.
            // El servidor sigue siendo el que determina si es válido.
            if (!Number.isFinite(payload.exp)) return null;
            return payload.exp * 1000;
        } catch (_error) {
            return 0;
        }
    }

    function tokenIsExpired(token) {
        if (!token) return false;
        const expiration = readExpiration(token);
        return expiration !== null && Date.now() >= expiration;
    }

    function isLogged() {
        const token = localStorage.getItem(TOKEN_KEY);
        return Boolean(token && !tokenIsExpired(token));
    }

    function showLoginNotice() {
        const message = "Tu sesión ha caducado. Inicia sesión otra vez para continuar.";
        if (typeof window.renderAuthButton === "function") {
            window.renderAuthButton();
        }
        if (typeof window.openAuthModal === "function") {
            window.openAuthModal();
            const error = document.getElementById("authError");
            if (error) {
                error.textContent = message;
            }
        } else {
            // Si el HTML no tiene el modal de inicio, se muestra un aviso.
            const existing = document.getElementById("enduro-session-notice");
            if (existing) return;
            const notice = document.createElement("div");
            notice.id = "enduro-session-notice";
            notice.setAttribute("role", "alert");
            notice.style.cssText = "position:fixed;bottom:16px;left:16px;right:16px;max-width:500px;margin:auto;z-index:99999;background:#141c18;color:#fff;padding:16px;border:1px solid #dfff45;border-radius:10px;box-shadow:0 8px 36px #0008;font:16px/1.4 system-ui,sans-serif";
            notice.textContent = message + " ";
            const link = document.createElement("a");
            link.href = "index.html";
            link.textContent = "Ir a iniciar sesión";
            link.style.cssText = "color:#dfff45;font-weight:700";
            notice.appendChild(link);
            document.body.appendChild(notice);
        }
    }

    function showNoticeWhenReady() {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", showLoginNotice, { once: true });
        } else {
            showLoginNotice();
        }
    }

    function expireSession() {
        if (handlingExpiration) return;
        handlingExpiration = true;

        // NO borrar el resto de localStorage: configuración o borradores
        // de la app, si los hubiera, deben conservarse.
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        sessionStorage.setItem(EXPIRED_KEY, "1");

        if (!isHome()) {
            const currentPage = window.location.pathname + window.location.search + window.location.hash;
            sessionStorage.setItem(RETURN_KEY, currentPage);
            // Retorno a la portada, que es donde está el modal real de login.
            window.location.replace(new URL("index.html", window.location.href).href);
            return;
        }

        showNoticeWhenReady();
    }

    function checkSession() {
        const token = localStorage.getItem(TOKEN_KEY);
        if (token && tokenIsExpired(token)) {
            expireSession();
            return false;
        }
        return Boolean(token);
    }

    function resumeAfterLogin() {
        sessionStorage.removeItem(EXPIRED_KEY);
        handlingExpiration = false;
        const target = sessionStorage.getItem(RETURN_KEY);
        sessionStorage.removeItem(RETURN_KEY);

        if (!target) return false;
        try {
            // Solo se acepta una ruta relativa al MISMO origen.
            if (!target.startsWith("/") || target.startsWith("//")) return false;
            const destination = new URL(target, window.location.origin);
            if (destination.origin !== window.location.origin) return false;
            window.location.assign(destination.pathname + destination.search + destination.hash);
            return true;
        } catch (_error) {
            return false;
        }
    }

    // Interceptamos SOLO errores de autenticación en peticiones a funciones propias.
    // El resto de respuestas se entregan sin cambios al código de la aplicación.
    const originalFetch = window.fetch.bind(window);
    window.fetch = async function (input, init) {
        const tokenBeforeRequest = localStorage.getItem(TOKEN_KEY);
        const urlString = typeof input === "string" ? input : input && input.url;
        let protectedFunction = false;

        try {
            const url = new URL(urlString, window.location.href);
            protectedFunction = url.origin === window.location.origin &&
                url.pathname.includes("/.netlify/functions/") &&
                !/\/(?:login|singUp|signup)$/i.test(url.pathname);
        } catch (_error) {
            // URL desconocida: no alterar su funcionamiento.
        }

        if (protectedFunction && tokenBeforeRequest && tokenIsExpired(tokenBeforeRequest)) {
            expireSession();
            throw new Error("Sesión caducada: vuelve a iniciar sesión.");
        }

        const response = await originalFetch(input, init);

        // Si el usuario inició otra sesión mientras se resolvía la petición,
        // no invalidar el token nuevo por una respuesta del antiguo.
        if (!protectedFunction || !tokenBeforeRequest ||
            localStorage.getItem(TOKEN_KEY) !== tokenBeforeRequest) {
            return response;
        }

        if (response.status === 401) {
            expireSession();
        } else if (response.status === 403) {
            // 403 también significa "acceso denegado". No cerrar sesión salvo
            // que la API indique claramente token vencido o inválido.
            try {
                const body = await response.clone().text();
                if (/(?:token|jwt|sesión|session)[\s\S]{0,100}(?:expir|caduc|invalid|vencid)|(?:expir|caduc|invalid|vencid)[\s\S]{0,100}(?:token|jwt|sesión|session)/i.test(body)) {
                    expireSession();
                }
            } catch (_error) {
                // No modificar respuesta si no es posible examinar el motivo.
            }
        }
        return response;
    };

    // Revalidar al recuperar pestañas dormidas o volver a una pestaña abierta.
    window.addEventListener("focus", checkSession);
    window.addEventListener("pageshow", checkSession);
    document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "visible") checkSession();
    });

    window.EnduroSession = Object.freeze({
        isLogged,
        check: checkSession,
        resumeAfterLogin,
        tokenIsExpired
    });

    checkSession();
    if (!handlingExpiration && isHome() && sessionStorage.getItem(EXPIRED_KEY) === "1") {
        showNoticeWhenReady();
    }
}());
