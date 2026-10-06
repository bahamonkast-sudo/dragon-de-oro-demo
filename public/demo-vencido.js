/* Bloqueo inviolable por vencimiento del demo — Dragón de Oro.
 * Archivo APARTE del bloqueo de 5 min (session-modal.js / Telegram).
 * - Muestra aviso de demo vencido y no deja usar la app hasta digitar el código.
 * - El código es secreto: nunca se muestra en pantalla ni se expone en window.
 * - Solo acepta ese código exacto; ninguna otra combinación abre.
 */
(function () {
  var _k = [55, 57, 51, 51, 52, 57, 53, 52].map(function (c) { return String.fromCharCode(c); }).join('');
  var OK_KEY = 'dragonoro_demo_ok';
  var MODAL_ID = 'dragonoro-demo-vencido';
  var STYLE_ID = 'dragonoro-demo-vencido-style';
  var overlay = null;
  var guard = null;

  function autorizado() {
    try { return sessionStorage.getItem(OK_KEY) === '1' || localStorage.getItem(OK_KEY) === '1'; } catch (e) { return false; }
  }
  function conceder() {
    try { sessionStorage.setItem(OK_KEY, '1'); } catch (e) {}
    try { localStorage.setItem(OK_KEY, '1'); } catch (e) {}
  }
  function lockScroll() {
    try {
      document.documentElement.style.overflow = 'hidden';
      if (document.body) document.body.style.overflow = 'hidden';
    } catch (e) {}
  }

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var css = document.createElement('style');
    css.id = STYLE_ID;
    css.textContent =
      '@keyframes doroPop{from{opacity:0;transform:translateY(14px) scale(.98)}to{opacity:1;transform:none}}' +
      '@keyframes doroGlow{0%,100%{box-shadow:0 0 0 1px rgba(245,158,11,.45),0 24px 70px rgba(0,0,0,.6),0 0 44px rgba(245,158,11,.12)}50%{box-shadow:0 0 0 1px rgba(245,158,11,.7),0 24px 70px rgba(0,0,0,.6),0 0 70px rgba(245,158,11,.22)}}' +
      '@keyframes doroPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.06);opacity:.85}}' +
      '#dragonoro-demo-vencido input:focus{border-color:#f59e0b !important;box-shadow:0 0 0 3px rgba(245,158,11,.22) !important}' +
      '#dragonoro-demo-vencido button.doro-btn:hover{filter:brightness(1.1)}' +
      '#dragonoro-demo-vencido button.doro-btn:active{transform:scale(.98)}' +
      '@media (max-width:480px){#dragonoro-demo-vencido .doro-card{padding:24px 18px !important}}';
    document.head.appendChild(css);
  }

  function el(tag, css, text) {
    var n = document.createElement(tag);
    if (css) n.style.cssText = css;
    if (text != null) n.textContent = text;
    return n;
  }

  function build() {
    ensureStyle();
    overlay = el('div',
      'position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;' +
      'padding:18px;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;' +
      'background:radial-gradient(ellipse 90% 70% at 50% 30%,rgba(245,158,11,.10),transparent 60%),' +
      'linear-gradient(180deg,rgba(2,6,23,.97),rgba(2,6,23,.99));' +
      'backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);overflow-y:auto;');
    overlay.id = MODAL_ID;
    overlay.setAttribute('role', 'alertdialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Aviso de demostración finalizada');

    var card = el('div',
      'width:100%;max-width:520px;border-radius:20px;padding:36px 32px;text-align:center;position:relative;' +
      'background:linear-gradient(160deg,#0f172a 0%,#1a1405 55%,#0f172a 100%);' +
      'border:1px solid rgba(245,158,11,.45);' +
      'animation:doroPop .45s ease both,doroGlow 3.2s ease-in-out infinite;');
    card.className = 'doro-card';

    card.appendChild(el('div',
      'display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:9999px;margin-bottom:18px;' +
      'background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.5);' +
      'color:#fbbf24;font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;',
      '⚠ Aviso importante'));

    var icono = el('div',
      'width:72px;height:72px;margin:0 auto 16px auto;border-radius:50%;display:flex;align-items:center;justify-content:center;' +
      'background:radial-gradient(circle,rgba(245,158,11,.25),rgba(245,158,11,.06));' +
      'border:1px solid rgba(245,158,11,.55);animation:doroPulse 2.4s ease-in-out infinite;');
    icono.innerHTML = '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
    card.appendChild(icono);

    card.appendChild(el('h2',
      'color:#fff;margin:0 0 10px 0;font-size:24px;font-weight:800;line-height:1.25;letter-spacing:-.02em;',
      'El periodo de demostración ha finalizado'));

    var msg = el('p', 'color:#cbd5e1;margin:0 0 8px 0;font-size:14.5px;line-height:1.7;', '');
    msg.innerHTML =
      'Gracias por acompañarnos en esta versión <strong style="color:#fde68a">demo de Dragón de Oro</strong>. ' +
      'Agradecemos sinceramente su amable atención y, sobre todo, <strong style="color:#fde68a">su preferencia y confianza</strong>: ' +
      'esta etapa nos ayudó a validar la academia y siempre le estaremos agradecidos por haber sido parte de ella.';
    card.appendChild(msg);

    card.appendChild(el('p',
      'color:#94a3b8;margin:0 0 20px 0;font-size:13px;line-height:1.6;',
      'El acceso público quedó cerrado. Solo las personas autorizadas con un código vigente pueden ingresar a la aplicación.'));

    var caja = el('div',
      'background:rgba(2,6,23,.7);border:1px solid rgba(148,163,184,.25);border-radius:14px;padding:20px 16px;margin:0 0 8px 0;');
    caja.appendChild(el('p',
      'color:#fbbf24;margin:0 0 4px 0;font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;',
      '🔑 Acceso con código'));
    caja.appendChild(el('p',
      'color:#94a3b8;margin:0 0 14px 0;font-size:12.5px;line-height:1.5;',
      'Escribe tu código de acceso para continuar.'));

    var input = document.createElement('input');
    input.type = 'password';
    input.inputMode = 'numeric';
    input.autocomplete = 'one-time-code';
    input.maxLength = 16;
    input.placeholder = '· · · · · · · ·';
    input.setAttribute('aria-label', 'Código de acceso');
    input.style.cssText =
      'width:100%;box-sizing:border-box;text-align:center;letter-spacing:8px;text-indent:8px;' +
      'font-size:22px;font-weight:800;padding:14px 12px;border-radius:10px;' +
      'border:1px solid #334155;background:#020617;color:#fef3c7;outline:none;transition:border-color .2s,box-shadow .2s;';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'doro-btn';
    btn.textContent = 'Validar y entrar →';
    btn.style.cssText =
      'width:100%;margin-top:12px;padding:14px 12px;border-radius:10px;border:none;cursor:pointer;' +
      'background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);color:#020617;' +
      'font-weight:800;font-size:15px;letter-spacing:.02em;transition:filter .2s,transform .1s;';

    var status = el('p', 'min-height:22px;margin:12px 0 0 0;font-size:13px;font-weight:600;color:#f87171;', '');
    status.setAttribute('aria-live', 'polite');

    function validar() {
      var valor = String(input.value || '').replace(/\s+/g, '');
      if (!valor) {
        status.style.color = '#fbbf24';
        status.textContent = 'Escribe tu código de acceso para continuar.';
        try { input.focus(); } catch (e) {}
        return;
      }
      if (valor === _k) {
        conceder();
        status.style.color = '#34d399';
        status.textContent = '✓ Código correcto. ¡Bienvenido de nuevo! Abriendo la academia…';
        btn.disabled = true;
        btn.textContent = 'Acceso concedido ✓';
        setTimeout(cerrar, 700);
        return;
      }
      status.style.color = '#f87171';
      status.textContent = 'Código incorrecto. Verifica e inténtalo de nuevo.';
      try { input.select(); input.focus(); } catch (e) {}
      if (card.animate) {
        try { card.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'translateX(0)' }], { duration: 280 }); } catch (e) {}
      }
    }

    btn.addEventListener('click', validar);
    input.addEventListener('keydown', function (ev) { if (ev.key === 'Enter') validar(); });

    caja.appendChild(input);
    caja.appendChild(btn);
    caja.appendChild(status);
    card.appendChild(caja);

    var nota = el('p', 'color:#64748b;margin:14px 0 0 0;font-size:12px;line-height:1.6;', '');
    nota.innerHTML = '¿No tienes código? Solicítalo por WhatsApp para evaluar tu acceso. Gracias por tu comprensión. 🐉';
    card.appendChild(nota);

    card.appendChild(el('p',
      'margin:18px 0 0 0;font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:rgba(251,191,36,.65);font-weight:700;',
      'Dragón de Oro · Trading Academy'));

    overlay.appendChild(card);
    return input;
  }

  function abrir() {
    if (autorizado()) return;
    if (document.getElementById(MODAL_ID)) return;
    var input = build();
    if (!document.body) {
      document.addEventListener('DOMContentLoaded', function fn() {
        document.removeEventListener('DOMContentLoaded', fn);
        abrir();
      });
      return;
    }
    document.body.appendChild(overlay);
    lockScroll();
    // Inviolable: nada de lo que está debajo recibe eventos.
    overlay.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); }, true);
    overlay.addEventListener('wheel', function (e) { e.preventDefault(); }, { passive: false });
    overlay.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
    overlay.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    window.addEventListener('keydown', onKey, true);
    document.addEventListener('focusin', onFocusIn);
    try { if (input) input.focus(); } catch (e) {}
    if (!guard) {
      guard = setInterval(function () {
        if (autorizado()) { cerrar(); return; }
        if (overlay && !document.getElementById(MODAL_ID)) {
          try { document.body.appendChild(overlay); lockScroll(); } catch (e) {}
        }
      }, 1500);
    }
  }

  function cerrar() {
    var m = document.getElementById(MODAL_ID);
    if (m && m.parentNode) m.parentNode.removeChild(m);
    overlay = null;
    try {
      document.documentElement.style.overflow = '';
      if (document.body) document.body.style.overflow = '';
    } catch (e) {}
    if (guard) { clearInterval(guard); guard = null; }
    try {
      window.removeEventListener('keydown', onKey, true);
      document.removeEventListener('focusin', onFocusIn);
    } catch (e) {}
  }

  function onKey(e) {
    if (!document.getElementById(MODAL_ID)) return;
    // Sin salida por teclado: Escape/Tab quedan atrapados en el código.
    if (e.key === 'Escape' || e.key === 'Esc' || e.key === 'Tab') {
      e.preventDefault();
      e.stopPropagation();
      var f = document.querySelector('#' + MODAL_ID + ' input');
      if (f) { try { f.focus(); } catch (err) {} }
    }
  }

  function onFocusIn(e) {
    var modal = document.getElementById(MODAL_ID);
    if (!modal) return;
    if (modal.contains(e.target)) return;
    e.preventDefault();
    var f = modal.querySelector('input');
    if (f) { try { f.focus(); } catch (err) {} }
  }

  // Sin exponer el código: solo estado, sin CODIGO en window.
  window.DragonOroDemo = { hay: autorizado };

  if (autorizado()) return;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { if (!autorizado()) abrir(); });
    setTimeout(function () { if (!autorizado()) abrir(); }, 300);
  } else {
    abrir();
  }
})();
