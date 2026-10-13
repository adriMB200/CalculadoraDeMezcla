/* Enduro Nalón · Información legal accesible y aviso al registrarse */
(() => {
  'use strict';
  function buildLegal() {
    if (!document.getElementById('legalModal')) {
      const overlay = document.createElement('div');
      overlay.className = 'legal-modal-overlay';
      overlay.id = 'legalModal';
      overlay.innerHTML = `
        <div class="legal-modal" role="dialog" aria-modal="true" aria-labelledby="legalTitle" tabindex="-1">
          <h2 id="legalTitle">Información legal de Enduro Nalón</h2>
          <p>Esta web ofrece herramientas orientativas para aficionados al enduro. Comprueba los pares de apriete, manuales e intervalos de mantenimiento con la documentación aplicable a tu modelo.</p>
          <p><strong>Desarrollo:</strong> AdriMB200</p>
          <p>Consulta la información completa y vigente en los siguientes documentos:</p>
          <ul>
            <li><a href="aviso-legal.html">Aviso legal</a></li>
            <li><a href="privacidad.html">Política de privacidad</a></li>
            <li><a href="politica-cookies.html">Política de cookies</a></li>
          </ul>
          <button class="legal-close" id="closeLegalModalBtn" type="button">Cerrar</button>
        </div>`;
      document.body.appendChild(overlay);
      overlay.addEventListener('click', event => { if (event.target === overlay) closeLegalModal(); });
      overlay.querySelector('#closeLegalModalBtn').addEventListener('click', closeLegalModal);
    }
    if (!document.getElementById('openLegalModalBtn')) {
      const area = document.createElement('div');
      area.id = 'legalTriggerWrap';
      area.className = 'legal-trigger-wrap';
      area.innerHTML = '<button type="button" class="legal-trigger" id="openLegalModalBtn">Información legal y créditos</button>';
      const footer = document.querySelector('footer');
      if (footer?.parentNode) footer.parentNode.insertBefore(area, footer);
      else document.body.appendChild(area);
      area.querySelector('button').addEventListener('click', openLegalModal);
    }
    if (!document.getElementById('en-register-privacy')) {
      const actions = document.querySelector('.auth-modal .auth-actions');
      if (actions) {
        const p = document.createElement('p');
        p.id = 'en-register-privacy';
        p.className = 'en-register-privacy';
        p.innerHTML = `Al registrarte, usaremos tu usuario y credenciales para gestionar tu cuenta. Responsable: <strong>consulta la identidad en la política</strong>. <a href="privacidad.html" target="_blank" rel="noopener noreferrer">Información y derechos de privacidad</a>.`;
        actions.insertAdjacentElement('afterend', p);
      }
    }
    document.addEventListener('keydown', event => { if (event.key === 'Escape') closeLegalModal(); });
  }
  function openLegalModal() {
    const modal = document.getElementById('legalModal');
    if (modal) { modal.style.display = 'flex'; modal.querySelector('.legal-modal')?.focus(); }
  }
  function closeLegalModal() {
    const modal = document.getElementById('legalModal');
    if (modal) modal.style.display = 'none';
  }
  window.openLegalModal = openLegalModal;
  window.closeLegalModal = closeLegalModal;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', buildLegal);
  else buildLegal();
})();
