(function () {
  'use strict';

  // Barra de progreso de lectura.
  var bar = document.getElementById('progress');
  if (bar) {
    var update = function () {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
    };
    document.addEventListener('scroll', update, { passive: true });
    update();
  }

  // Los iframes de video se insertan al hacer clic: no se pide nada a YouTube
  // hasta que el usuario decide reproducir.
  document.addEventListener('click', function (ev) {
    var btn = ev.target.closest('.video .play');
    if (!btn) return;
    var box = btn.parentNode;
    var id = box.getAttribute('data-video');
    if (!id) return;
    var iframe = document.createElement('iframe');
    iframe.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&playsinline=1';
    iframe.title = 'Video del curso';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope';
    iframe.allowFullscreen = true;
    box.classList.add('playing');
    box.replaceChildren(iframe);
  });

  // Filtro de busqueda sobre todas las listas de clases de la pagina.
  var search = document.getElementById('q');
  var lists = document.querySelectorAll('.lesson-list');
  var count = document.getElementById('count');
  if (search && lists.length) {
    search.addEventListener('input', function () {
      var q = search.value.trim().toLowerCase();
      var shown = 0;
      lists.forEach(function (list) {
        list.querySelectorAll('li').forEach(function (li) {
          var hit = !q || li.textContent.toLowerCase().indexOf(q) !== -1;
          li.hidden = !hit;
          if (hit) shown++;
        });
      });
      if (count) count.textContent = shown + ' resultado' + (shown === 1 ? '' : 's');
    });
  }
})();
