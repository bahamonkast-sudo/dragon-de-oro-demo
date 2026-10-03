(function () {
  var CODIGO = '123456';
  var ACCESO_KEY = 'dragonoro_acceso_ok';
  var TELEGRAM = 'https://t.me/dragon_de_oro_bot';
  var MODAL_ID = 'dragonoro-telegram-modal';
  var MODAL_DELAY = 5 * 60 * 1000;
  var overlay = null;
  var guard = null;
  var ligado = false;
  var HOME = (function () {
    var src = document.currentScript && document.currentScript.src;
    if (!src) return 'inicio.html';
    return src.replace(/\/[^/]*$/, '/') + 'inicio.html';
  })();

  function irAlInicio() {
    if (/(^|\/)inicio\.html(\?|#|$)/.test(location.pathname)) return;
    location.href = HOME;
  }

  function hay() {
    try { return localStorage.getItem(ACCESO_KEY) === '1'; } catch (e) { return false; }
  }

  function grant() {
    try { localStorage.setItem(ACCESO_KEY, '1'); } catch (e) {}
  }

  function libre(nivel, orden) {
    return hay() || (Number(nivel) === 1 && Number(orden) > 0 && Number(orden) <= 5);
  }

  function lockScroll() {
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }

  function unlockScroll() {
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  }

  function el(tag, css, text) {
    var node = document.createElement(tag);
    node.style.cssText = css;
    if (text != null) node.textContent = text;
    return node;
  }

  function build() {
    overlay = el('div', 'position:fixed;inset:0;background:rgba(0,0,0,0.88);z-index:99999;display:flex;align-items:center;justify-content:center;font-family:system-ui,-apple-system,sans-serif;padding:16px;');
    overlay.id = MODAL_ID;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    var box = el('div', 'background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border:2px solid #d4af37;border-radius:16px;padding:32px;max-width:440px;width:100%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.5);');

    box.appendChild(el('h2', 'color:#d4af37;margin:0 0 12px 0;font-size:24px;font-weight:700;', '¡Únete a nuestra comunidad!'));
    box.appendChild(el('p', 'color:#e0e0e0;margin:0 0 20px 0;font-size:15px;line-height:1.6;', 'Ingresa a nuestro canal de Telegram y recibe acceso gratuito a todos los beneficios: señales diarias, análisis en vivo y contenido exclusivo.'));

    var tg = document.createElement('a');
    tg.href = TELEGRAM;
    tg.target = '_blank';
    tg.rel = 'noopener noreferrer';
    tg.textContent = 'Unirme a Telegram';
    tg.style.cssText = 'display:inline-block;background:linear-gradient(135deg,#d4af37 0%,#b8860b 100%);color:#1a1a2e;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;cursor:pointer;transition:transform 0.2s;';
    tg.onmouseenter = function () { tg.style.transform = 'scale(1.05)'; };
    tg.onmouseout = function () { tg.style.transform = 'scale(1)'; };
    box.appendChild(tg);

    box.appendChild(el('div', 'height:1px;background:rgba(212,175,55,0.25);margin:24px 0 20px 0;', ''));
    box.appendChild(el('p', 'color:#d4af37;margin:0 0 4px 0;font-size:15px;font-weight:700;', 'Activa el curso completo'));
    box.appendChild(el('p', 'color:#9aa4b2;margin:0 0 14px 0;font-size:13px;line-height:1.5;', 'Escribe el código de acceso que te enviamos por WhatsApp para abrir todas las lecciones de los 3 niveles.'));

    var input = document.createElement('input');
    input.type = 'text';
    input.inputMode = 'numeric';
    input.autocomplete = 'one-time-code';
    input.maxLength = 12;
    input.placeholder = 'Código de acceso';
    input.style.cssText = 'width:100%;box-sizing:border-box;text-align:center;letter-spacing:6px;font-size:18px;font-weight:700;padding:13px 12px;border-radius:8px;border:1px solid #3a4152;background:#0f1420;color:#f8fafc;outline:none;';
    input.addEventListener('focus', function () { input.style.borderColor = '#d4af37'; });
    input.addEventListener('blur', function () { input.style.borderColor = '#3a4152'; });

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Validar código';
    btn.style.cssText = 'width:100%;margin-top:12px;padding:13px 12px;border-radius:8px;border:none;background:linear-gradient(135deg,#d4af37 0%,#b8860b 100%);color:#1a1a2e;font-weight:700;font-size:15px;cursor:pointer;';
    btn.onmouseenter = function () { btn.style.filter = 'brightness(1.08)'; };
    btn.onmouseout = function () { btn.style.filter = ''; };

    var status = el('p', 'min-height:20px;margin:12px 0 0 0;font-size:13px;color:#f87171;', '');

    function validar() {
      var valor = (input.value || '').replace(/\s+/g, '');
      if (valor === CODIGO) {
        grant();
        status.style.color = '#34d399';
        status.textContent = '¡Código correcto! Activando acceso completo…';
        cerrar();
        document.dispatchEvent(new CustomEvent('dragonoro:acceso'));
        return;
      }
      status.textContent = 'Código incorrecto. Verifica el mensaje de WhatsApp e inténtalo de nuevo.';
      input.select();
    }

    btn.addEventListener('click', validar);
    input.addEventListener('keydown', function (event) { if (event.key === 'Enter') validar(); });

    var form = el('div', 'margin:0;', '');
    form.appendChild(input);
    form.appendChild(btn);
    form.appendChild(status);
    box.appendChild(form);

    var salir = el('button', 'display:block;margin:20px auto 0 auto;background:none;border:none;color:#8b95a5;font-size:13px;cursor:pointer;text-decoration:underline;font-family:inherit;', 'Volver a la portada');
    salir.addEventListener('click', function (event) { event.preventDefault(); event.stopPropagation(); irAlInicio(); });
    box.appendChild(salir);

    overlay.appendChild(box);
    return input;
  }

  function abrir() {
    if (hay() || document.getElementById(MODAL_ID)) return;
    var input = build();
    document.body.appendChild(overlay);
    lockScroll();

    overlay.addEventListener('click', function (event) { event.preventDefault(); event.stopPropagation(); });
    overlay.addEventListener('wheel', function (event) { event.preventDefault(); }, { passive: false });
    overlay.addEventListener('touchmove', function (event) { event.preventDefault(); }, { passive: false });
    overlay.addEventListener('contextmenu', function (event) { event.preventDefault(); });
    window.addEventListener('keydown', onKey, true);
    document.addEventListener('focusin', onFocusIn);

    try { input.focus(); } catch (e) {}

    if (!ligado) {
      ligado = true;
      guard = setInterval(function () {
        if (hay()) { cerrar(); return; }
        if (overlay && !document.getElementById(MODAL_ID)) {
          document.body.appendChild(overlay);
          lockScroll();
        }
      }, 2000);
    }
  }

  function cerrar() {
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    unlockScroll();
    if (guard) { clearInterval(guard); guard = null; ligado = false; }
  }

  function pedir() {
    if (hay()) return;
    abrir();
  }

  function onKey(event) {
    if (event.key !== 'Escape' && event.key !== 'Esc') return;
    if (!document.getElementById(MODAL_ID)) {
      window.removeEventListener('keydown', onKey, true);
      document.removeEventListener('focusin', onFocusIn);
      return;
    }
    event.preventDefault();
    irAlInicio();
  }

  function onFocusIn(event) {
    var modal = document.getElementById(MODAL_ID);
    if (!modal) {
      document.removeEventListener('focusin', onFocusIn);
      return;
    }
    if (modal.contains(event.target)) return;
    var field = modal.querySelector('input');
    if (field) { try { field.focus(); } catch (e) {} }
  }

  window.DragonOroAcceso = { CODIGO: CODIGO, hay: hay, libre: libre, pedir: pedir };

  function init() {
    if (hay()) return;
    setTimeout(function () { if (!hay()) abrir(); }, MODAL_DELAY);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();