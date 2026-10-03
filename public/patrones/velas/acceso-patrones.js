(function () {
  var LIBRES = 5;
  var ATRIB = 'data-dragonoro-lock';
  var estilo = null;
  var observador = null;
  var observado = null;
  var pendiente = false;

  function asegurarEstilo() {
    if (estilo) return;
    estilo = document.createElement('style');
    estilo.textContent = '[' + ATRIB + ']{position:relative !important;opacity:.4 !important;'
      + 'filter:saturate(.35);cursor:not-allowed !important;}'
      + '[' + ATRIB + ']::after{content:"\\1F512";position:absolute;top:7px;right:8px;'
      + 'font-size:12px;line-height:1;opacity:.95;}'
      + '[' + ATRIB + ']:hover{background:rgba(245,158,11,.08) !important;'
      + 'border-left-color:#f59e0b !important;}';
    document.head.appendChild(estilo);
  }

  function numeroDe(btn) {
    var insignias = btn.querySelectorAll('span');
    for (var i = 0; i < insignias.length; i++) {
      var m = (insignias[i].textContent || '').match(/SS0*(\d{1,2})/i);
      if (m) return parseInt(m[1], 10);
    }
    return 0;
  }

  function contenedor() {
    var todos = document.querySelectorAll('button');
    for (var i = 0; i < todos.length; i++) {
      if (numeroDe(todos[i])) return todos[i].parentElement;
    }
    return document.body;
  }

  function programar() {
    if (pendiente) return;
    pendiente = true;
    setTimeout(function () { pendiente = false; aplicar(); }, 60);
  }

  function vigilar() {
    var lista = contenedor();
    if (!lista || lista === observado) return;
    if (observador) observador.disconnect();
    observado = lista;
    observador = new MutationObserver(programar);
    observador.observe(lista, { childList: true, subtree: true });
  }

  function aplicar() {
    var acceso = window.DragonOroAcceso;
    if (!acceso) { programar(); return; }
    asegurarEstilo();
    vigilar();
    var abierto = acceso.hay();
    var todos = observado ? observado.querySelectorAll('button') : [];
    for (var i = 0; i < todos.length; i++) {
      var btn = todos[i];
      var n = numeroDe(btn);
      if (!n) continue;
      if (!abierto && n > LIBRES) btn.setAttribute(ATRIB, '1');
      else btn.removeAttribute(ATRIB);
    }
  }

  document.addEventListener('click', function (event) {
    var bloqueado = event.target && event.target.closest
      ? event.target.closest('[' + ATRIB + ']') : null;
    if (!bloqueado) return;
    event.preventDefault();
    event.stopPropagation();
    if (window.DragonOroAcceso) window.DragonOroAcceso.pedir();
  }, true);

  document.addEventListener('dragonoro:acceso', aplicar);

  programar();
})();