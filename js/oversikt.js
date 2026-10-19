(function () {
  'use strict';

  var stage  = document.getElementById('stage');
  var canvas = document.getElementById('canvas');
  var panel  = document.getElementById('panel');
  if (!stage || !canvas) return;

  var MIN = 0.08, MAX = 2.2;
  var view = { x: 0, y: 0, k: 1 };
  var frames = Array.prototype.slice.call(canvas.querySelectorAll('.frame'));

  var zoomLevel = document.getElementById('zoomLevel');

  function apply() {
    canvas.style.transform = 'translate(' + view.x + 'px,' + view.y + 'px) scale(' + view.k + ')';
    if (zoomLevel) zoomLevel.textContent = Math.round(view.k * 100) + ' %';
  }

  function clampK(k) { return Math.min(MAX, Math.max(MIN, k)); }

  /* Sidlistan ligger ovanpå ytan – dess bredd ska inte räknas som synlig yta */
  function leftInset() {
    if (!panel || panel.hasAttribute('hidden')) return 0;
    if (stage.clientWidth < 700) return 0;          // panelen täcker nästan allt ändå
    return panel.offsetWidth;
  }

  /* Zooma så att en rektangel i canvas-koordinater fyller den synliga ytan */
  function fitRect(x, y, w, h, pad, maxK) {
    pad = pad == null ? 48 : pad;
    var inset = leftInset();
    var vw = stage.clientWidth - inset, vh = stage.clientHeight;
    var k = clampK(Math.min((vw - pad * 2) / w, (vh - pad * 2) / h));
    if (maxK) k = Math.min(k, maxK);
    view.k = k;
    view.x = inset + (vw - w * k) / 2 - x * k;
    view.y = (vh - h * k) / 2 - y * k;
    apply();
  }

  function fitAll() {
    setCurrent(null);
    /* -90 i y för lanetiketten ovanför första raden */
    fitRect(-20, -90, 3080, 2310, 40);
  }

  function setCurrent(id) {
    frames.forEach(function (f) { f.classList.toggle('is-current', f.id === id); });
    Array.prototype.forEach.call(panel ? panel.querySelectorAll('button[data-goto]') : [], function (b) {
      b.classList.toggle('is-current', b.dataset.goto === id);
    });
  }

  function focusFrame(el) {
    if (!el) return;
    setCurrent(el.id);
    fitRect(el.offsetLeft, el.offsetTop - 34, el.offsetWidth, el.offsetHeight + 34, 40, 1.6);
  }

  /* ---- Zoom med hjul, runt pekaren ---- */
  stage.addEventListener('wheel', function (e) {
    e.preventDefault();
    var rect = stage.getBoundingClientRect();
    var px = e.clientX - rect.left, py = e.clientY - rect.top;
    var factor = Math.pow(0.9988, e.deltaY * (e.deltaMode === 1 ? 18 : 1));
    var k = clampK(view.k * factor);
    if (k === view.k) return;
    view.x = px - (px - view.x) * (k / view.k);
    view.y = py - (py - view.y) * (k / view.k);
    view.k = k;
    apply();
  }, { passive: false });

  /* ---- Zoomknappar, runt mitten ---- */
  function zoomBy(factor) {
    var px = stage.clientWidth / 2, py = stage.clientHeight / 2;
    var k = clampK(view.k * factor);
    if (k === view.k) return;
    view.x = px - (px - view.x) * (k / view.k);
    view.y = py - (py - view.y) * (k / view.k);
    view.k = k;
    apply();
  }
  var zi = document.getElementById('zoomIn');
  var zo = document.getElementById('zoomOut');
  if (zi) zi.addEventListener('click', function () { zoomBy(1.25); });
  if (zo) zo.addEventListener('click', function () { zoomBy(0.8); });

  var fa = document.getElementById('fitAll');
  if (fa) fa.addEventListener('click', fitAll);

  /* ---- Panorering ---- */
  var drag = null;
  stage.addEventListener('pointerdown', function (e) {
    if (e.button !== 0) return;
    if (e.target.closest('a')) return;              // länkar ska fungera
    drag = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y, moved: false, id: e.pointerId };
    stage.setPointerCapture(e.pointerId);
    stage.classList.add('is-panning');
  });
  stage.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moved && Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
    if (!drag.moved) return;
    view.x = drag.vx + dx;
    view.y = drag.vy + dy;
    apply();
  });
  function endDrag(e) {
    if (!drag || (e && e.pointerId !== drag.id)) return;
    var wasClick = !drag.moved;
    var start = drag;
    drag = null;
    stage.classList.remove('is-panning');
    if (wasClick && e) {
      var fr = e.target.closest ? e.target.closest('.frame') : null;
      if (fr) focusFrame(fr);
    }
    void start;
  }
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);

  /* ---- Tangentbord: ramar är fokuserbara ---- */
  frames.forEach(function (f) {
    f.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); focusFrame(f); }
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { fitAll(); }
    if (e.key === '+' || e.key === '=') { zoomBy(1.25); }
    if (e.key === '-') { zoomBy(0.8); }
  });

  /* ---- Sidlistan ---- */
  if (panel) {
    Array.prototype.forEach.call(panel.querySelectorAll('button[data-goto]'), function (b) {
      b.addEventListener('click', function () {
        var el = document.getElementById(b.dataset.goto);
        focusFrame(el);
        if (el) el.focus({ preventScroll: true });
      });
    });
  }

  var tp = document.getElementById('togglePanel');
  if (tp && panel) {
    tp.addEventListener('click', function () {
      var open = panel.hasAttribute('hidden');
      if (open) panel.removeAttribute('hidden'); else panel.setAttribute('hidden', '');
      tp.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* ---- Start ---- */
  window.addEventListener('resize', (function () {
    var t;
    return function () { clearTimeout(t); t = setTimeout(fitAll, 150); };
  })());

  fitAll();
})();
