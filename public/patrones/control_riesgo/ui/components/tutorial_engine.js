// TutorialEngine - Guardián Visionarios de Oro
// Activar: presiona el botón ❓ flotante.
// Voz: Activa/Inactiva según la Configuración de Voces de Visionarios de Oro.
// Hotspots: cualquier elemento con data-tutorial='{"title":"...","desc":"...","category":"...","voice":true}'

(() => {
  let active = false;
  let lastHotspot = null;   // Evitar repetir voz en cada mousemove

  const toggleBtn = document.getElementById('visionarios-tutorial-toggle');
  const tooltip   = document.getElementById('visionarios-tutorial-tooltip');
  if (!toggleBtn || !tooltip) return; // seguridad si DOM no existe

  const titleEl      = tooltip.querySelector('.title');
  const descEl       = tooltip.querySelector('.description');
  const catEl        = tooltip.querySelector('.category');

  /* ── helpers ───────────────────────────────────────── */
  const parseTutData = (el) => {
    try { return JSON.parse(el.getAttribute('data-tutorial')); }
    catch(_) { return null; }
  };

  const speak = (text) => {
    // Leer configuración global guardada (por defecto true si no está definida)
    const isVoiceEnabled = window.appConfig && window.appConfig.session 
                           ? window.appConfig.session.tutorial_voice_enabled !== false
                           : true;
                           
    if (!isVoiceEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang  = 'es-ES';
    u.rate  = 0.93;
    u.pitch = 1.0;
    window.speechSynthesis.speak(u);
  };

  const positionTooltip = (e) => {
    const margin = 18;
    let x = e.clientX + margin;
    let y = e.clientY + margin;
    const tw = tooltip.offsetWidth  || 290;
    const th = tooltip.offsetHeight || 130;
    if (x + tw > window.innerWidth  - 8) x = e.clientX - tw - margin;
    if (y + th > window.innerHeight - 8) y = e.clientY - th - margin;
    tooltip.style.left = `${x}px`;
    tooltip.style.top  = `${y}px`;
  };

  const showTooltip = (e, info, sourceEl) => {
    titleEl.textContent = info.title    || '';
    descEl.textContent  = info.desc     || '';
    catEl.textContent   = info.category ? `📌 ${info.category}` : '';
    positionTooltip(e);
    tooltip.classList.add('show');

    if (sourceEl !== lastHotspot) {
      lastHotspot = sourceEl;
      if (info.voice) speak(`${info.title}. ${info.desc}`);
    }
  };

  const hideTooltip = () => {
    tooltip.classList.remove('show');
    lastHotspot = null;
    window.speechSynthesis && window.speechSynthesis.cancel();
  };

  /* ── toggle button ──────────────────────────────────── */
  toggleBtn.addEventListener('click', () => {
    active = !active;
    toggleBtn.classList.toggle('active', active);
    toggleBtn.title = active ? 'Tutorial ACTIVO — pasa el cursor sobre cualquier elemento' : 'Activar tutorial interactivo';
    if (!active) {
      hideTooltip();
    }
  });

  /* ── mousemove handler ──────────────────────────────── */
  document.addEventListener('mousemove', (e) => {
    if (!active) return;
    positionTooltip(e);

    let el = e.target;
    while (el && el !== document.body) {
      if (el.hasAttribute('data-tutorial')) {
        const info = parseTutData(el);
        if (info) { showTooltip(e, info, el); return; }
      }
      el = el.parentElement;
    }
    // No hotspot under cursor
    tooltip.classList.remove('show');
    if (lastHotspot) { lastHotspot = null; window.speechSynthesis && window.speechSynthesis.cancel(); }
  });

  document.addEventListener('mouseleave', hideTooltip);
})();
