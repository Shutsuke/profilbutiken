(function () {
  'use strict';

  /* ---------------------------------------------------------------
     Mobilmeny
     --------------------------------------------------------------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    Array.prototype.forEach.call(nav.querySelectorAll('a'), function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------------------------------------------------------------
     Provtryckaren
     Lägger en logotyp ovanpå ett produktfoto. Placeringarna nedan är
     ungefärliga tryckytor avlästa ur bilderna – inte riktiga tryckmått.
     --------------------------------------------------------------- */

  var stage    = document.getElementById('stage');
  var stageImg = document.getElementById('stageImg');
  var stageCap = document.getElementById('stageCap');
  var print    = document.getElementById('print');
  var fileIn   = document.getElementById('logofile');
  var size     = document.getElementById('size');
  var sizeOut  = document.getElementById('sizeOut');
  if (!stage || !print || !fileIn || !size) return;

  // cx/cy = tryckytans mittpunkt i procent av bilden, w/h = basstorlek, rot = grader
  var PRODUCTS = {
    mossa: {
      img: 'assets/fulmossa.jpg',
      alt: 'Fulmössa i svart, sedd från sidan',
      cap: 'Fulmössa, svart · tryck på framsidan',
      cx: 37, cy: 39, w: 29, h: 11, rot: -5
    },
    vast: {
      img: 'assets/vast.jpg',
      alt: 'Petrolfärgad quiltad väst, sedd bakifrån',
      cap: 'IQONIQ Meru-väst · tryck på ryggen',
      cx: 50, cy: 33, w: 24, h: 10, rot: 0
    },
    mugg: {
      img: 'assets/mugg.jpg',
      alt: 'Vikkåsa i mörk plast, sedd framifrån',
      cap: 'Vikkåsa 250 ml · tryck på framsidan',
      cx: 50, cy: 35, w: 34, h: 12, rot: 0
    }
  };

  /* Påhittade exempelloggor – finns bara för att skissen ska gå att prova.
     Inga riktiga företag. */
  var EXAMPLES = {
    bygg:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 64">' +
      '<path d="M4 40 34 10 64 40 54 40 34 21 14 40Z" fill="#1B3A5C"/>' +
      '<rect x="27" y="30" width="14" height="14" fill="#E8661E"/>' +
      '<text x="78" y="45" font-family="Archivo,Arial,Helvetica,sans-serif" font-size="38" font-weight="900" letter-spacing="1" fill="#1B3A5C">BYGG</text>' +
      '</svg>',
    akeri:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 64">' +
      '<circle cx="32" cy="32" r="25" fill="none" stroke="#0F7A4F" stroke-width="8"/>' +
      '<rect x="10" y="27" width="44" height="10" fill="#0F7A4F"/>' +
      '<text x="72" y="45" font-family="Archivo,Arial,Helvetica,sans-serif" font-size="36" font-weight="900" letter-spacing="1" fill="#14321F">ÅKERI</text>' +
      '</svg>',
    teknik:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 64">' +
      '<path d="M32 5 54 18v26L32 57 10 44V18Z" fill="#6B2D8C"/>' +
      '<path d="M32 19 43 25v13l-11 6-11-6V25Z" fill="#C9A4E0"/>' +
      '<text x="70" y="45" font-family="Archivo,Arial,Helvetica,sans-serif" font-size="33" font-weight="900" letter-spacing="1" fill="#2B1138">TEKNIK</text>' +
      '</svg>'
  };

  function svgUrl(svg) {
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  var state = {
    prod: 'vast',
    ink: 'as-is',
    scale: 1,
    logo: null
  };

  function render() {
    var p = PRODUCTS[state.prod];

    if (stageImg.getAttribute('src') !== p.img) {
      stageImg.setAttribute('src', p.img);
      stageImg.setAttribute('alt', p.alt);
    }
    stageCap.textContent = p.cap;

    if (!state.logo) {
      print.classList.add('is-empty');
      print.style.backgroundImage = '';
      return;
    }

    var w = p.w * state.scale;
    var h = p.h * state.scale;
    print.classList.remove('is-empty');
    print.style.backgroundImage = 'url("' + state.logo + '")';
    print.style.left = (p.cx - w / 2) + '%';
    print.style.top = (p.cy - h / 2) + '%';
    print.style.width = w + '%';
    print.style.height = h + '%';
    print.style.transform = 'rotate(' + p.rot + 'deg)';

    print.classList.remove('stage__print--white', 'stage__print--black');
    if (state.ink === 'white') print.classList.add('stage__print--white');
    if (state.ink === 'black') print.classList.add('stage__print--black');
  }

  function setLogo(url) {
    state.logo = url;
    render();
  }

  function readFile(file) {
    if (!file || !/^image\//.test(file.type)) return;
    var reader = new FileReader();
    reader.onload = function (e) {
      Array.prototype.forEach.call(document.querySelectorAll('.chip'), function (c) {
        c.classList.remove('is-on');
        c.setAttribute('aria-pressed', 'false');
      });
      setLogo(e.target.result);
    };
    reader.readAsDataURL(file);
  }

  fileIn.addEventListener('change', function () {
    readFile(this.files && this.files[0]);
  });

  // Dra och släpp
  var drop = document.querySelector('.drop');
  if (drop) {
    ['dragenter', 'dragover'].forEach(function (ev) {
      drop.addEventListener(ev, function (e) {
        e.preventDefault();
        drop.classList.add('is-over');
      });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      drop.addEventListener(ev, function (e) {
        e.preventDefault();
        drop.classList.remove('is-over');
      });
    });
    drop.addEventListener('drop', function (e) {
      readFile(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]);
    });
  }

  // Exempelloggor
  Array.prototype.forEach.call(document.querySelectorAll('.chip'), function (chip) {
    chip.setAttribute('aria-pressed', 'false');
    chip.addEventListener('click', function () {
      Array.prototype.forEach.call(document.querySelectorAll('.chip'), function (c) {
        c.classList.remove('is-on');
        c.setAttribute('aria-pressed', 'false');
      });
      chip.classList.add('is-on');
      chip.setAttribute('aria-pressed', 'true');
      fileIn.value = '';
      setLogo(svgUrl(EXAMPLES[chip.dataset.ex]));
    });
  });

  // Produkt- och färgväljare
  function wireSegs(attr, key) {
    var btns = document.querySelectorAll('.seg[data-' + attr + ']');
    Array.prototype.forEach.call(btns, function (btn) {
      btn.setAttribute('aria-pressed', btn.classList.contains('is-on') ? 'true' : 'false');
      btn.addEventListener('click', function () {
        Array.prototype.forEach.call(btns, function (b) {
          b.classList.remove('is-on');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('is-on');
        btn.setAttribute('aria-pressed', 'true');
        state[key] = btn.dataset[attr];
        render();
      });
    });
  }
  wireSegs('prod', 'prod');
  wireSegs('ink', 'ink');

  // Tryckstorlek
  size.addEventListener('input', function () {
    state.scale = Number(size.value) / 100;
    sizeOut.textContent = size.value + ' %';
    render();
  });

  // Starta med en exempellogga så att rutan inte är tom
  var first = document.querySelector('.chip[data-ex="bygg"]');
  if (first) {
    first.classList.add('is-on');
    first.setAttribute('aria-pressed', 'true');
  }
  setLogo(svgUrl(EXAMPLES.bygg));
})();
