(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function refreshIcons() {
    if (window.lucide && window.lucide.createIcons) { try { window.lucide.createIcons(); } catch (e) {} }
    else { setTimeout(refreshIcons, 90); }
  }

  // Reveal on scroll
  function setupReveal() {
    var els = document.querySelectorAll('.reveal');
    if (reduce || !('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.15 });
    els.forEach(function (e) { io.observe(e); });
  }

  // Count-up + progress + bars when in view
  function animateOnce(el, fn) {
    if (reduce || !('IntersectionObserver' in window)) { fn(true); return; }
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { if (en.isIntersecting) { fn(false); io.unobserve(en.target); } });
    }, { threshold: 0.4 });
    io.observe(el);
  }
  function setupCounters() {
    document.querySelectorAll('[data-count]').forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      animateOnce(el, function (instant) {
        if (instant) { el.textContent = Math.round(target).toLocaleString('cs-CZ'); return; }
        var start = performance.now(), dur = 1400;
        (function tick(now) {
          var p = Math.min(1, (now - start) / dur), e = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * e).toLocaleString('cs-CZ');
          if (p < 1) requestAnimationFrame(tick);
        })(start);
      });
    });
    document.querySelectorAll('[data-progress]').forEach(function (el) {
      animateOnce(el, function () { el.style.width = el.getAttribute('data-progress') + '%'; });
    });
    document.querySelectorAll('[data-bars]').forEach(function (group) {
      animateOnce(group, function () {
        group.querySelectorAll('.bar').forEach(function (b) { b.style.height = b.getAttribute('data-h') + '%'; });
      });
    });
  }

  // Mobile menu
  function setupMenu() {
    var b = document.getElementById('burger'), m = document.getElementById('mmenu');
    if (!b || !m) return;
    b.addEventListener('click', function () {
      var open = m.classList.toggle('open');
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    m.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { m.classList.remove('open'); b.setAttribute('aria-expanded', 'false'); }); });
    window.addEventListener('resize', function () { if (window.innerWidth > 980) { m.classList.remove('open'); b.setAttribute('aria-expanded', 'false'); } });
  }

  // Pro mě / Pro firmy segmented toggles
  function setupSeg() {
    document.querySelectorAll('.seg, .mseg').forEach(function (grp) {
      var btns = grp.querySelectorAll('button');
      btns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          btns.forEach(function (x) { x.classList.remove('on'); x.setAttribute && x.setAttribute('aria-selected', 'false'); });
          btn.classList.add('on'); if (btn.hasAttribute('role')) btn.setAttribute('aria-selected', 'true');
        });
      });
    });
  }

  // Cards horizontal scroll arrows (mobile / overflow)
  function setupCards() {
    var track = document.getElementById('cards-track');
    var prev = document.getElementById('cards-prev'), next = document.getElementById('cards-next');
    if (!track || !prev || !next) return;
    var step = function () { return Math.min(track.clientWidth * 0.8, 380); };
    prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: reduce ? 'auto' : 'smooth' }); });
    next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: reduce ? 'auto' : 'smooth' }); });
  }

  // Buy vs rent calculator
  function setupBuyRent() {
    var fields = ['cena', 'vlastni', 'urok', 'doba', 'najem', 'podil', 'rustnem', 'vynos'], el = {};
    fields.forEach(function (k) { el[k] = document.getElementById('br-' + k); });
    if (!el.cena) return;
    var czk = function (n) { return Math.round(n).toLocaleString('cs-CZ') + ' Kč'; };
    var pct = function (n) { return n.toLocaleString('cs-CZ') + ' %'; };
    var set = function (id, t) { var e = document.getElementById(id); if (e) e.textContent = t; };
    function recompute() {
      var price = +el.cena.value, own = +el.vlastni.value, rate = +el.urok.value, years = +el.doba.value, rent = +el.najem.value, podil = +el.podil.value, g = +el.rustnem.value, r = +el.vynos.value;
      set('br-cena-v', czk(price)); set('br-vlastni-v', pct(own) + ' · ' + czk(price * own / 100)); set('br-urok-v', pct(rate));
      set('br-doba-v', years + ' let'); set('br-najem-v', czk(rent)); set('br-podil-v', pct(podil)); set('br-rustnem-v', pct(g)); set('br-vynos-v', pct(r)); set('br-horizon', years);
      var D = price * own / 100, L = price - D, n = years * 12, i = rate / 100 / 12;
      var M = i > 0 ? L * i / (1 - Math.pow(1 + i, -n)) : L / n, rm = r / 100 / 12;
      var V = price * Math.pow(1 + g / 100, years), buyNet = V, buyTotal = D + M * n;
      var diff = Math.max(0, M - rent) * (podil / 100), fvD = D * Math.pow(1 + rm, n);
      var fvDiff = rm > 0 ? diff * ((Math.pow(1 + rm, n) - 1) / rm) : diff * n;
      var rentNet = fvD + fvDiff, rentInv = D + diff * n;
      set('br-buy-net', czk(buyNet)); set('br-buy-m', czk(M)); set('br-buy-total', czk(buyTotal));
      set('br-rent-net', czk(rentNet)); set('br-rent-r', czk(rent)); set('br-rent-inv', czk(rentInv));
      var max = Math.max(buyNet, rentNet, 1);
      var bb = document.getElementById('br-buy-bar'), rb = document.getElementById('br-rent-bar');
      if (bb) bb.style.width = (buyNet / max * 100) + '%'; if (rb) rb.style.width = (rentNet / max * 100) + '%';
      var d = buyNet - rentNet, v = document.getElementById('br-verdict');
      if (Math.abs(d) < max * 0.02) v.innerHTML = 'Obě varianty vyjdou <em>zhruba nastejno</em>. Rozhodne pohodlí a flexibilita.';
      else if (d > 0) v.innerHTML = 'Vyplatí se <em>koupě</em> — o <em>' + czk(d) + '</em> víc po ' + years + ' letech.';
      else v.innerHTML = 'Vyplatí se <em>pronájem + investice</em> — o <em>' + czk(-d) + '</em> víc po ' + years + ' letech.';
    }
    fields.forEach(function (k) { el[k].addEventListener('input', recompute); });
    recompute();
  }

  // Compound interest calculator + growth chart
  function setupCompound() {
    var initial = document.getElementById('ci-initial'), monthly = document.getElementById('ci-monthly'), rate = document.getElementById('ci-rate'), years = document.getElementById('ci-years');
    if (!initial) return;
    var seg = document.getElementById('ci-seg');
    var mode = 'kombinace';
    var czk = function (n) { return Math.round(n).toLocaleString('cs-CZ') + ' Kč'; };
    var short = function (n) { if (n >= 1e6) return (n / 1e6).toLocaleString('cs-CZ', { maximumFractionDigits: 1 }) + ' mil.'; if (n >= 1e3) return Math.round(n / 1e3) + ' tis.'; return String(Math.round(n)); };
    var setTxt = function (id, t) { var e = document.getElementById(id); if (e) e.textContent = t; };
    var setAttr = function (id, a, v) { var e = document.getElementById(id); if (e) e.setAttribute(a, v); };
    var PL = 64, PR = 624, PT = 20, PB = 250;

    function recompute() {
      var P0 = mode === 'pravidelna' ? 0 : +initial.value;
      var PMT = mode === 'jednorazova' ? 0 : +monthly.value;
      var r = +rate.value, Y = +years.value, rm = r / 100 / 12;
      setTxt('ci-initial-v', czk(+initial.value));
      setTxt('ci-monthly-v', czk(+monthly.value));
      setTxt('ci-rate-v', r.toLocaleString('cs-CZ') + ' %');
      setTxt('ci-years-v', Y + ' let');
      var valAt = function (m) { var fv0 = P0 * Math.pow(1 + rm, m); var fvp = rm > 0 ? PMT * ((Math.pow(1 + rm, m) - 1) / rm) : PMT * m; return fv0 + fvp; };
      var nM = Y * 12, finalV = valAt(nM), contribTotal = P0 + PMT * nM, gains = finalV - contribTotal;
      setTxt('ci-final', czk(finalV)); setTxt('ci-contrib', czk(contribTotal)); setTxt('ci-gains', czk(gains));
      var yMax = Math.max(finalV, 1);
      // stacked bars: ~14 max, always including the final year
      var step = Math.max(1, Math.ceil(Y / 14));
      var barYears = [0];
      for (var t = step; t < Y; t += step) barYears.push(t);
      barYears.push(Y);
      var nBars = barYears.length, slot = (PR - PL) / nBars, bw = Math.min(40, slot * 0.62);
      var svgns = 'http://www.w3.org/2000/svg';
      var bars = document.getElementById('ci-bars');
      while (bars.firstChild) bars.removeChild(bars.firstChild);
      var labelSet = {}, lStep = Math.max(1, Math.round(nBars / 3));
      for (var k = nBars - 1; k >= 0; k -= lStep) labelSet[k] = true;
      var rect = function (x, y, w, h, fill) {
        var r = document.createElementNS(svgns, 'rect');
        r.setAttribute('x', x.toFixed(1)); r.setAttribute('y', y.toFixed(1));
        r.setAttribute('width', w.toFixed(1)); r.setAttribute('height', Math.max(0, h).toFixed(1));
        r.setAttribute('rx', '3'); r.setAttribute('fill', fill); bars.appendChild(r);
      };
      barYears.forEach(function (yr, i) {
        var m = yr * 12, val = valAt(m), con = P0 + PMT * m;
        var totalH = (val / yMax) * (PB - PT), conH = (con / yMax) * (PB - PT);
        var x = PL + i * slot + (slot - bw) / 2;
        rect(x, PB - conH, bw, conH, '#63B888');
        rect(x, PB - totalH, bw, totalH - conH, '#EFF56A');
        if (labelSet[i] && val > 0) {
          var tx = document.createElementNS(svgns, 'text');
          tx.setAttribute('x', (x + bw / 2).toFixed(1)); tx.setAttribute('y', (PB - totalH - 8).toFixed(1));
          tx.setAttribute('text-anchor', 'middle'); tx.setAttribute('font-size', '12.5');
          tx.setAttribute('font-family', 'Manrope, sans-serif'); tx.setAttribute('font-weight', '800');
          tx.setAttribute('fill', '#14352B'); tx.textContent = short(val);
          bars.appendChild(tx);
        }
      });
      setTxt('ci-y2', short(yMax)); setTxt('ci-y1', short(yMax / 2)); setTxt('ci-y0', '0');
      setTxt('ci-x0', '0 let'); setTxt('ci-x1', Math.round(Y / 2) + ' let'); setTxt('ci-x2', Y + ' let');
    }

    seg.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        seg.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); x.setAttribute('aria-selected', 'false'); });
        b.classList.add('on'); b.setAttribute('aria-selected', 'true'); mode = b.getAttribute('data-mode');
        document.getElementById('ci-field-initial').style.display = mode === 'pravidelna' ? 'none' : '';
        document.getElementById('ci-field-monthly').style.display = mode === 'jednorazova' ? 'none' : '';
        recompute();
      });
    });
    [initial, monthly, rate, years].forEach(function (el) { el.addEventListener('input', recompute); });
    recompute();

    var rect = document.getElementById('ci-cliprect');
    if (rect) rect.setAttribute('width', 640);
  }

  // Booking form (validation + Web3Forms submit)
  function setupBooking() {
    var form = document.getElementById('booking-form');
    if (!form) return;
    var WEB3FORMS_KEY = 'REPLACE_WITH_YOUR_KEY'; // zdarma na web3forms.com — vloží se sem klíč
    var status = document.getElementById('bf-status');
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    var setErr = function (input, on) { var w = input.closest('div'); if (w) w.classList.toggle('field-err', on); };
    function validate() {
      var checks = [
        [form.email, emailRe.test((form.email.value || '').trim())],
        [form.phone, (form.phone.value || '').replace(/\s/g, '').length >= 6],
        [form.topic, !!form.topic.value],
        [form.preferred_time, !!form.preferred_time.value]
      ];
      var firstBad = null;
      checks.forEach(function (c) { setErr(c[0], !c[1]); if (!c[1] && !firstBad) firstBad = c[0]; });
      if (firstBad) firstBad.focus();
      return !firstBad;
    }
    ['email', 'phone', 'topic', 'preferred_time'].forEach(function (n) {
      form[n].addEventListener('input', function () { setErr(form[n], false); status.textContent = ''; status.className = 'form-status'; });
      form[n].addEventListener('change', function () { setErr(form[n], false); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) { status.className = 'form-status bad'; status.textContent = 'Zkontrolujte prosím vyznačená pole.'; return; }
      if (WEB3FORMS_KEY.indexOf('REPLACE') === 0) { status.className = 'form-status bad'; status.textContent = 'Formulář zatím není propojený s e-mailem (chybí přístupový klíč).'; return; }
      var btn = form.querySelector('button[type=submit]'); btn.disabled = true;
      status.className = 'form-status'; status.textContent = 'Odesílám…';
      var fd = new FormData(form);
      fd.append('access_key', WEB3FORMS_KEY);
      fd.append('subject', 'Nová objednávka schůzky — Finance Lab');
      fd.append('from_name', 'Finance Lab web');
      fetch('https://api.web3forms.com/submit', { method: 'POST', body: fd })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d && d.success) {
            form.innerHTML = '<div class="booking-done"><div class="ic"><i data-lucide="check" style="width:28px;height:28px;color:#2f7a56;"></i></div><h3 style="font-family:Manrope,sans-serif;font-weight:800;font-size:24px;letter-spacing:-0.02em;color:var(--ink);margin-bottom:8px;">Děkujeme!</h3><p style="color:var(--ink-60);">Objednávku máme. Ozveme se vám do 24 hodin a domluvíme termín.</p></div>';
            refreshIcons();
          } else { btn.disabled = false; status.className = 'form-status bad'; status.textContent = 'Odeslání se nepodařilo. Zkuste to prosím znovu.'; }
        })
        .catch(function () { btn.disabled = false; status.className = 'form-status bad'; status.textContent = 'Odeslání se nepodařilo. Zkuste to prosím znovu.'; });
    });
  }

  // Scroll progress bar + nav elevate-on-scroll
  function setupScrollFX() {
    var nav = document.querySelector('nav.site');
    var bar = document.getElementById('scroll-progress');
    if (!nav && !bar) return;
    var ticking = false;
    function update() {
      var st = window.pageYOffset || document.documentElement.scrollTop || 0;
      if (nav) nav.classList.toggle('scrolled', st > 8);
      if (bar) {
        var h = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, st / h) : 0) + ')';
      }
      ticking = false;
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  }

  function init() {
    refreshIcons(); setupReveal(); setupCounters(); setupMenu(); setupSeg(); setupCards(); setupBuyRent(); setupCompound(); setupBooking(); setupScrollFX();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
