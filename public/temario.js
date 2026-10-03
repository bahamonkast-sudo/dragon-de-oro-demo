/* Temario 142 clases (inicio.html): carga public/data/course_data.json,
   pinta los 3 niveles y conmuta las tabs. Sin dependencias. */
(function () {
  var BTN = [document.getElementById('tabBtn1'), document.getElementById('tabBtn2'), document.getElementById('tabBtn3')];
  var TAB = [document.getElementById('syllabusTab1'), document.getElementById('syllabusTab2'), document.getElementById('syllabusTab3')];
  if (!BTN[0] || !TAB[0]) return;
  var NAMES = ['Fundamentos', 'Dinámica de Velas', 'Operativas'];
  var ACTIVE = 'px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider transition';
  var IDLE = 'px-5 py-2.5 rounded-xl bg-slate-900 text-slate-300 border border-slate-800 font-bold text-xs uppercase tracking-wider hover:border-slate-700 transition';

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function fix(s) {
    if (!s) return '';
    try { return decodeURIComponent(escape(s)); }
    catch (e) {
      return s.replace(/Ã¡/g, 'á').replace(/Ã©/g, 'é').replace(/Ã­/g, 'í')
        .replace(/Ã³/g, 'ó').replace(/Ãº/g, 'ú').replace(/Ã±/g, 'ñ').replace(/Â/g, '');
    }
  }
  function show(n) {
    for (var i = 0; i < 3; i++) {
      BTN[i].className = (i === n) ? ACTIVE : IDLE;
      if (i === n) { TAB[i].classList.remove('hidden'); TAB[i].classList.remove('sf-hidden'); }
      else { TAB[i].classList.add('hidden'); }
    }
  }
  BTN.forEach(function (b, i) { b.addEventListener('click', function () { show(i); }); });

  function estaLibre(lvl, order) {
    return !window.DragonOroAcceso || window.DragonOroAcceso.libre(lvl, order);
  }

  function onLockClick(event) {
    var link = event.target && event.target.closest ? event.target.closest('[data-lock]') : null;
    if (!link) return;
    event.preventDefault();
    if (window.DragonOroAcceso) window.DragonOroAcceso.pedir();
  }
  document.addEventListener('click', onLockClick);
  document.addEventListener('dragonoro:acceso', cargar);

  function hasVideo(c) {
    if (Array.isArray(c.videos) && c.videos.length) return true;
    return !!(c.video || c.youtube_id);
  }
  function card(lvl, c) {
    var order = c.order || 0;
    var num = ('0' + order).slice(-2);
    var title = fix(c.title) || ('Clase ' + order);
    var desc = fix(c.description || '').slice(0, 110);
    var badge = hasVideo(c)
      ? '<span class="text-[10px] text-emerald-400">Video</span>'
      : '<span class="text-[10px] text-slate-400">Lectura</span>';
    if (!estaLibre(lvl, order)) {
      return '<a href="#" data-lock="1" class="p-3 bg-slate-950/40 rounded-xl border border-slate-800/60 flex items-start gap-3 opacity-60">'
        + '<span class="w-6 h-6 rounded bg-slate-800/60 text-slate-500 flex items-center justify-center font-mono font-bold shrink-0">' + num + '</span>'
        + '<div class="min-w-0"><strong class="text-slate-400 block">' + esc(title) + '</strong>'
        + '<span class="text-slate-600">' + esc(desc) + '</span>'
        + '<span class="block mt-1"><span class="text-[10px] text-amber-500/90 font-bold uppercase tracking-wider">Bloqueada</span></span></div></a>';
    }
    return '<a href="curso.html#n' + lvl + '-' + order + '" class="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-start gap-3 hover:border-amber-500/50 transition">'
      + '<span class="w-6 h-6 rounded bg-slate-800 text-amber-500 flex items-center justify-center font-mono font-bold shrink-0">' + num + '</span>'
      + '<div class="min-w-0"><strong class="text-white block">' + esc(title) + '</strong>'
      + '<span class="text-slate-400">' + esc(desc) + '</span>'
      + '<span class="block mt-1">' + badge + '</span></div></a>';
  }

  function cargar() {
    fetch('data/course_data.json', { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(function (data) {
      (data.levels || []).forEach(function (lv) {
        var n = (lv.level || 1) - 1;
        if (n < 0 || n > 2 || !TAB[n]) return;
        var items = (lv.classes || []).concat(lv.video_classes || []);
        items.sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
        var head = '<div class="border-b border-slate-800 pb-4 flex items-center justify-between"><div>'
          + '<h4 class="text-lg font-bold text-white">Nivel ' + (n + 1) + ': ' + esc(fix(lv.title)) + '</h4>'
          + '<p class="text-xs text-slate-400">' + items.length + ' clases, clic para abrir en el aula virtual.</p></div>'
          + '<a href="curso.html" class="hidden sm:inline-flex px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-bold hover:bg-amber-500/20 transition">Ir al aula</a></div>';
        TAB[n].innerHTML = head + '<div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">'
          + items.map(function (c) { return card(n + 1, c); }).join('') + '</div>';
        BTN[n].textContent = 'Nivel ' + (n + 1) + ': ' + NAMES[n] + ' (' + items.length + ' clases)';
      });
      show(0);
    }).catch(function (err) {
      TAB[0].insertAdjacentHTML('beforeend', '<p class="text-xs text-rose-400">No se pudo cargar el temario (' + esc(err.message) + ').</p>');
    });
  }

  cargar();
})();