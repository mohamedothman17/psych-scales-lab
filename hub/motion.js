/* Motion layer for the hub. Everything here is optional: the app renders complete, static markup without it.
   GSAP (core) is loaded by the page; ScrollTrigger, SplitText and Lenis are fetched only when the welcome is shown.
   Section files opt in with data attributes (see BRAND.md): data-reveal, data-stagger, data-count, data-tilt, data-magnet, data-glow, data-aurora. */
(function () {
  'use strict';
  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var fine = window.matchMedia ? window.matchMedia('(hover: hover) and (pointer: fine)') : { matches: false };
  var BASE = '../vendor/anim/', root = document.documentElement;
  var EASE = 'cubic-bezier(.16,1,.3,1)', SPRING = 'cubic-bezier(.2,1.5,.4,1)';
  function $$(sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); }
  function pair(el, key) { var p = (el.getAttribute(key) || '0,0').split(','); return [parseFloat(p[0]), parseFloat(p[1])]; }
  function token(name) { return getComputedStyle(root).getPropertyValue(name).trim(); }
  function rgba(hex, a) { var m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex || ''); return m ? 'rgba(' + parseInt(m[1], 16) + ',' + parseInt(m[2], 16) + ',' + parseInt(m[3], 16) + ',' + a + ')' : 'rgba(110,61,249,' + a + ')'; }
  if (!mq.matches) root.classList.add('motion');

  var loaded = {};
  function script(src) {
    if (!loaded[src]) loaded[src] = new Promise(function (ok, fail) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = fail; document.head.appendChild(s); });
    return loaded[src];
  }
  function scrollPlugins() {
    if (!window.gsap) return Promise.reject(new Error('gsap unavailable'));
    return Promise.all([script(BASE + 'ScrollTrigger.min.js'), script(BASE + 'SplitText.min.js')]).then(function () { window.gsap.registerPlugin(window.ScrollTrigger, window.SplitText); });
  }

  /* ---------- aurora: a slow colour field drawn tiny and scaled up, so it costs almost nothing ---------- */
  function Aurora(canvas) {
    var ctx = canvas.getContext('2d'), W = 96, H = 60, raf = 0, on = false, seen = true, last = 0, cols = [], dark = true, t0 = performance.now() - 40000;
    var blobs = [[0.11, 0.07, 0.0, 1.3, 0.62], [0.08, 0.1, 2.1, 0.4, 0.55], [0.06, 0.09, 4.0, 2.2, 0.5], [0.09, 0.05, 5.3, 3.1, 0.42], [0.05, 0.08, 1.2, 4.4, 0.58]];
    canvas.width = W; canvas.height = H;
    function colours() { cols = ['--violet-600', '--coral-500', '--saffron-200', '--teal-300', '--violet-500'].map(token); dark = root.getAttribute('data-theme') === 'dark'; }
    function draw(now) {
      var t = (now - t0) / 1000, i, b, x, y, r, g;
      ctx.globalCompositeOperation = 'source-over'; ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = dark ? 'lighter' : 'source-over';
      for (i = 0; i < blobs.length; i++) {
        b = blobs[i]; x = W * (0.5 + 0.44 * Math.sin(t * b[0] + b[2])); y = H * (0.5 + 0.4 * Math.cos(t * b[1] + b[3])); r = W * b[4];
        g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(cols[i], dark ? 0.6 : 0.5)); g.addColorStop(1, rgba(cols[i], 0));
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }
    }
    function loop(now) { if (!on) return; if (now - last > 40) { last = now; draw(now); } raf = requestAnimationFrame(loop); }
    function sync() { var want = !mq.matches && !document.hidden && seen; if (want && !on) { on = true; raf = requestAnimationFrame(loop); } else if (!want && on) { on = false; cancelAnimationFrame(raf); } }
    function theme() { colours(); draw(performance.now()); }
    var io = window.IntersectionObserver ? new IntersectionObserver(function (e) { seen = e[0].isIntersecting; sync(); }) : null;
    if (io) io.observe(canvas);
    document.addEventListener('visibilitychange', sync); window.addEventListener('hub:theme', theme);
    colours(); draw(performance.now()); sync();
    return { destroy: function () { on = false; cancelAnimationFrame(raf); if (io) io.disconnect(); document.removeEventListener('visibilitychange', sync); window.removeEventListener('hub:theme', theme); } };
  }

  /* ---------- living starfield (canvas): twinkle, parallax, cursor trail, shooting stars ---------- */
  function Sky(canvas, host) {
    var ctx = canvas.getContext('2d'), stars = [], trail = [], shots = [], w = 0, h = 0, dpr = 1, raf = 0, running = false, live = !mq.matches;
    var px = 0, py = 0, tx = 0, ty = 0, sy = 0, ink = '#fff', gold = '#fed325', t0 = performance.now(), nextShot = 2.5;
    function colours() { var c = getComputedStyle(host); ink = c.getPropertyValue('--star').trim() || '#fff'; gold = c.getPropertyValue('--star-hi').trim() || '#fed325'; }
    function size() {
      w = window.innerWidth; h = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, w < 700 ? 1.5 : 2);
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      var n = Math.max(50, Math.min(w < 700 ? 110 : 240, Math.round(w * h / 7000)));
      if ((window.devicePixelRatio || 1) > 2.5) n = Math.round(n * 0.75);
      var seed = 41; function r() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
      stars = [];
      for (var i = 0; i < n; i++) stars.push({ x: r(), y: r(), z: 0.25 + r() * 0.75, r: 0.6 + r() * r() * 2.4, p: r() * 6.28, s: 0.4 + r() * 1.3, g: r() < 0.14 });
      if (!running) draw(performance.now());
    }
    function star4(x, y, s) { ctx.beginPath(); ctx.moveTo(x, y - s); ctx.quadraticCurveTo(x + s * 0.15, y - s * 0.15, x + s, y); ctx.quadraticCurveTo(x + s * 0.15, y + s * 0.15, x, y + s); ctx.quadraticCurveTo(x - s * 0.15, y + s * 0.15, x - s, y); ctx.quadraticCurveTo(x - s * 0.15, y - s * 0.15, x, y - s); ctx.fill(); }
    function draw(now) {
      var t = (now - t0) / 1000, i, s, x, y, a;
      px += (tx - px) * 0.06; py += (ty - py) * 0.06;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
      for (i = 0; i < stars.length; i++) {
        s = stars[i];
        x = s.x * w + px * s.z * 34;
        y = ((s.y * h - sy * s.z * 0.22 + py * s.z * 22) % h + h) % h;
        a = live ? 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * s.s + s.p)) : 0.75;
        ctx.globalAlpha = a * (0.35 + s.z * 0.65);
        ctx.fillStyle = s.g ? gold : ink;
        if (s.r > 1.7) star4(x, y, s.r * 2.8); else ctx.fillRect(x - s.r / 2, y - s.r / 2, s.r, s.r);
      }
      if (live && t > nextShot && shots.length < 2) { nextShot = t + 3.5 + Math.random() * 4; shots.push({ x: w * (0.25 + Math.random() * 0.7), y: h * Math.random() * 0.45, l: 1, v: 9 + Math.random() * 5 }); }
      for (i = shots.length - 1; i >= 0; i--) {
        s = shots[i]; s.x -= s.v; s.y += s.v * 0.42; s.l -= 0.016;
        if (s.l <= 0 || s.x < -120) { shots.splice(i, 1); continue; }
        var g = ctx.createLinearGradient(s.x, s.y, s.x + 130, s.y - 55); g.addColorStop(0, gold); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalAlpha = Math.min(1, s.l * 1.6); ctx.strokeStyle = g; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x + 130, s.y - 55); ctx.stroke();
        ctx.fillStyle = gold; star4(s.x, s.y, 4);
      }
      for (i = trail.length - 1; i >= 0; i--) {
        s = trail[i]; s.l -= 0.022;
        if (s.l <= 0) { trail.splice(i, 1); continue; }
        ctx.globalAlpha = s.l * 0.8; ctx.fillStyle = gold; star4(s.x, s.y + (1 - s.l) * 14, 2 + s.l * 5);
      }
      ctx.globalAlpha = 1;
    }
    function loop(now) { if (!running) return; draw(now); raf = requestAnimationFrame(loop); }
    function start() { if (running || !live || document.hidden) return; running = true; raf = requestAnimationFrame(loop); }
    function stop() { running = false; cancelAnimationFrame(raf); }
    function onMove(e) {
      if (e.pointerType === 'touch') return;
      tx = e.clientX / w - 0.5; ty = e.clientY / h - 0.5;
      if (fine.matches && sy < h * 0.8 && trail.length < 36 && (!onMove.last || Math.hypot(e.clientX - onMove.last[0], e.clientY - onMove.last[1]) > 26)) { trail.push({ x: e.clientX, y: e.clientY, l: 1 }); onMove.last = [e.clientX, e.clientY]; }
    }
    function onTilt(e) { if (e.gamma == null) return; tx = Math.max(-0.5, Math.min(0.5, e.gamma / 60)); ty = Math.max(-0.5, Math.min(0.5, (e.beta - 40) / 80)); }
    function onScroll() { sy = window.scrollY; }
    function onVis() { if (document.hidden) stop(); else start(); }
    function onTheme() { colours(); if (!running) draw(performance.now()); }
    var rz; function onResize() { clearTimeout(rz); rz = setTimeout(size, 160); }
    colours(); size();
    window.addEventListener('resize', onResize);
    window.addEventListener('hub:theme', onTheme);
    if (live) {
      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('deviceorientation', onTilt, { passive: true });
      window.addEventListener('scroll', onScroll, { passive: true });
      document.addEventListener('visibilitychange', onVis);
      start();
    }
    return {
      destroy: function () {
        stop(); clearTimeout(rz);
        window.removeEventListener('resize', onResize); window.removeEventListener('hub:theme', onTheme);
        window.removeEventListener('pointermove', onMove); window.removeEventListener('deviceorientation', onTilt);
        window.removeEventListener('scroll', onScroll); document.removeEventListener('visibilitychange', onVis);
      }
    };
  }

  /* ---------- the welcome: scroll-driven scenes ---------- */
  var sky = null, ctx = null, token_ = 0, lenis = null, lenisTick = null, auroras = [];
  function scenes(el) {
    var gsap = window.gsap, ST = window.ScrollTrigger, Split = window.SplitText;
    el.classList.add('live');
    ctx = gsap.context(function () {
      var ease = 'expo.out';
      /* scene 1: the headline arrives word by word and settles from a slight skew, then drifts away with the scroll */
      var words = [];
      try { $$('.s1-line', el).forEach(function (l) { words = words.concat(Split.create(l, { type: 'words', wordsClass: 'w' }).words); }); } catch (e) { words = $$('.s1-line', el); }
      gsap.timeline({ defaults: { ease: ease } })
        .from('.s1-brand', { yPercent: 30, opacity: 0, scale: 0.9, skewY: 5, duration: 1.5 }, 0.1)
        .from(words, { yPercent: 80, opacity: 0, skewY: 9, duration: 1.1, stagger: 0.1 }, 0.5)
        .from('.s1-lead', { y: 24, opacity: 0, duration: 0.9 }, 1)
        .from('.s1-cue', { opacity: 0, duration: 0.8 }, 1.5);
      gsap.to('.s1-title', { yPercent: -18, scale: 1.08, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.s1', start: 'top top', end: 'bottom 25%', scrub: true } });
      gsap.to('.s1-lead, .s1-cue', { opacity: 0, ease: 'none', scrollTrigger: { trigger: '.s1', start: 'top top', end: '40% top', scrub: true } });

      /* marquee bands lean with the speed of the scroll */
      $$('.marquee', el).forEach(function (m) {
        var skew = gsap.quickTo(m, 'skewX', { duration: 0.5, ease: 'power3.out' });
        ST.create({ trigger: m, start: 'top bottom', end: 'bottom top', onUpdate: function (self) { skew(Math.max(-14, Math.min(14, self.getVelocity() / -220))); } });
      });

      /* scenes 2 to 4: stars fly to the rosette's vertices, it draws itself line by line, blooms petal by petal, then opens into rings */
      var stars = $$('.m-star', el), o = { svgOrigin: '0 0' };
      stars.forEach(function (s, i) { var p = pair(s, 'data-p0'); gsap.set(s, { x: p[0], y: p[1], rotation: i * 37, scale: 1, transformOrigin: '50% 50%' }); });
      gsap.set('.m-petal, .m-core, .m-ring', { scale: 0, opacity: 0, svgOrigin: '0 0' });
      gsap.set('.m-ripple', { scale: 0.2, opacity: 0, svgOrigin: '0 0' });
      gsap.set('.m-gap', { opacity: 0 });
      gsap.set('.m-line, .m-frame, .m-out', { strokeDashoffset: 1 });
      var tl = gsap.timeline({ defaults: { ease: 'power2.inOut' }, scrollTrigger: { trigger: '.story', start: 'top 60%', end: 'bottom bottom', scrub: 0.6 } });
      tl.to('.m-line', { strokeDashoffset: 0, duration: 2.4, ease: 'none' }, 0.1)
        .to('.m-line', { opacity: 0, duration: 0.7 }, 2.9)
        .to('.m-frame', { strokeDashoffset: 0, duration: 1, ease: 'none' }, 3.3)
        .to('.m-out', { strokeDashoffset: 0, duration: 0.7, stagger: 0.07, ease: 'none' }, 3.6)
        .to('.m-petal', { scale: 1, opacity: 1, duration: 0.8, stagger: 0.07, ease: 'back.out(1.5)' }, 4.5)
        .to('.m-core', { scale: 1, opacity: 1, duration: 0.8, ease: 'back.out(1.8)' }, 4.9)
        .to('.m-out', { opacity: 0, duration: 0.5 }, 5.2)
        .to('.m-gap', { opacity: 1, duration: 0.4, stagger: 0.04 }, 5.3)
        .to('.m-ros', Object.assign({ scale: 0.36, rotation: -108, duration: 2.1 }, o), 6.3)
        .to('.m-frame', { opacity: 0, duration: 0.6 }, 6.3)
        .to('.m-ring', { scale: 1, opacity: 1, duration: 1.4, stagger: { each: 0.2, from: 'end' }, ease: 'back.out(1.25)' }, 6.5)
        .to('.m-ripple', { keyframes: [{ scale: 0.6, opacity: 0.9, duration: 0.5 }, { scale: 1.5, opacity: 0, duration: 1.1 }], stagger: 0.28, ease: 'power1.out' }, 6.9)
        .to({}, { duration: 0.4 }, 9.6);
      stars.forEach(function (s, i) {
        var a = pair(s, 'data-p1'), b = pair(s, 'data-p2');
        tl.to(s, { x: a[0], y: a[1], rotation: 180 + i * 36, scale: 0.75, duration: 1.5, ease: 'power3.inOut' }, 2.7 + i * 0.07);
        tl.to(s, { x: b[0], y: b[1], rotation: 540, scale: 0.9, duration: 2.2 }, 6.4 + i * 0.04);
      });

      /* chapter words rise out of a mask and settle; the questions follow line by line */
      $$('.ch', el).forEach(function (ch) {
        var t = gsap.timeline({ defaults: { ease: 'power3.out' }, scrollTrigger: { trigger: ch.querySelector('.ch-in'), start: 'top 82%', toggleActions: 'play none none reverse' } });
        t.from($$('.ch-no', ch), { opacity: 0, duration: 0.5 }, 0)
          .from($$('.mk > span', ch), { yPercent: 115, skewY: 9, duration: 1.1, ease: 'expo.out' }, 0)
          .from($$('.ch-say', ch), { y: 28, opacity: 0, duration: 0.8 }, 0.25)
          .from($$('.ch-q li', ch), { y: 40, opacity: 0, duration: 0.8, stagger: 0.12 }, 0.4);
      });
      /* scene 5: the four roles arrive with depth */
      gsap.from('.s5-title, .s5-lead', { y: 50, opacity: 0, skewY: 4, duration: 1, stagger: 0.1, ease: 'expo.out', scrollTrigger: { trigger: '.s5', start: 'top 75%', toggleActions: 'play none none reverse' } });
      gsap.from('.s5 .choice', { y: 120, rotationX: -38, opacity: 0, transformPerspective: 1000, transformOrigin: '50% 100%', duration: 1.1, stagger: 0.1, ease: ease, clearProps: 'transform,opacity', scrollTrigger: { trigger: '.s5 .choices', start: 'top 90%', once: true } });
    }, el);
    ST.refresh();
    /* smooth scrolling on pointer devices only; touch keeps the platform's own scrolling */
    if (fine.matches) script(BASE + 'lenis.min.js').then(function () {
      if (!window.Lenis || !ctx || lenis) return;
      lenis = new window.Lenis({ lerp: 0.11, smoothWheel: true });
      lenis.on('scroll', ST.update);
      lenisTick = function (t) { if (lenis) lenis.raf(t * 1000); };
      gsap.ticker.add(lenisTick);
    }).catch(function () {});
  }
  function intro(el) {
    stopIntro();
    var mine = ++token_, canvas = el.querySelector('.intro-sky');
    if (canvas && canvas.getContext) sky = Sky(canvas, el);
    if (mq.matches) return;
    scrollPlugins().then(function () { return document.fonts && document.fonts.ready; }).then(function () {
      if (mine === token_ && el.isConnected) scenes(el);
    }).catch(function () { /* the static welcome stays as it is */ });
  }
  function stopIntro() {
    token_++;
    if (lenis) { if (window.gsap && lenisTick) window.gsap.ticker.remove(lenisTick); lenis.destroy(); lenis = null; lenisTick = null; }
    if (ctx) { ctx.revert(); ctx = null; }
    if (sky) { sky.destroy(); sky = null; }
    auroras.forEach(function (a) { a.destroy(); }); auroras = [];
  }

  /* ---------- small set pieces ---------- */
  var SPARKS = ['--saffron-200', '--coral-500', '--violet-400', '--teal-300', '--mint-300'];
  function burst(el, n, big, at) {
    if (mq.matches || !document.body.animate) return;
    var r = el ? el.getBoundingClientRect() : null, x = at ? at[0] : r.left + r.width / 2, y = at ? at[1] : r.top + r.height / 2, i;
    for (i = 0; i < n; i++) {
      var s = document.createElement('i'), ang = Math.random() * 6.283, dist = (big ? 140 : 46) + Math.random() * (big ? 320 : 70), size = (big ? 10 : 7) + Math.random() * (big ? 16 : 8);
      s.className = 'spark'; s.style.left = x + 'px'; s.style.top = y + 'px'; s.style.width = s.style.height = size + 'px'; s.style.background = token(SPARKS[i % SPARKS.length]);
      document.body.appendChild(s);
      s.animate([{ transform: 'translate(-50%,-50%) scale(0) rotate(0deg)', opacity: 1 }, { transform: 'translate(calc(-50% + ' + Math.cos(ang) * dist * 0.7 + 'px),calc(-50% + ' + Math.sin(ang) * dist * 0.7 + 'px)) scale(1.1) rotate(120deg)', opacity: 1, offset: 0.45 }, { transform: 'translate(calc(-50% + ' + Math.cos(ang) * dist + 'px),calc(-50% + ' + (Math.sin(ang) * dist + (big ? 90 : 24)) + 'px)) scale(0) rotate(260deg)', opacity: 0 }],
        { duration: (big ? 1500 : 800) + Math.random() * 400, delay: Math.random() * (big ? 260 : 60), easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'both' }).onfinish = (function (node) { return function () { node.remove(); }; })(s);
    }
  }
  function celebrate() { var cx = window.innerWidth / 2, cy = window.innerHeight * 0.42; burst(null, 46, true, [cx, cy]); setTimeout(function () { burst(null, 30, true, [cx * 0.5, cy * 1.1]); burst(null, 30, true, [cx * 1.5, cy * 1.1]); }, 260); }
  function turn(el) { var svg = el && el.querySelector('svg'); if (svg && svg.animate && !mq.matches) svg.animate([{ transform: 'rotate(-36deg) scale(.9)' }, { transform: 'rotate(0deg) scale(1)' }], { duration: 760, easing: SPRING }); }
  /* a role is picked: its colour floods the screen from the point of the click, then the dashboard arrives underneath */
  function flood(btn, e, cb) {
    var d = document.createElement('div'), cs = getComputedStyle(btn), r = btn.getBoundingClientRect(), done = false;
    var x = e && e.clientX ? e.clientX : r.left + r.width / 2, y = e && e.clientY ? e.clientY : r.top + r.height / 2;
    var R = Math.ceil(Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))) + 4;
    d.className = 'flood'; d.style.background = cs.backgroundImage !== 'none' ? cs.backgroundImage : cs.backgroundColor;
    d.style.left = (x - R) + 'px'; d.style.top = (y - R) + 'px'; d.style.width = d.style.height = R * 2 + 'px';
    document.body.appendChild(d);
    function next() { if (done) return; done = true; cb(); window.scrollTo(0, 0); var out = d.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 460, delay: 80, easing: 'ease-out', fill: 'forwards' }); out.onfinish = function () { d.remove(); }; setTimeout(function () { d.remove(); }, 900); }
    d.animate([{ transform: 'scale(0)' }, { transform: 'scale(1)' }], { duration: 520, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'forwards' }).onfinish = next;
    setTimeout(next, 700);
  }

  /* ---------- helpers that markup opts into ---------- */
  function words(el) {
    var n = 0;
    Array.prototype.slice.call(el.childNodes).forEach(function (node) {
      var frag;
      if (node.nodeType === 3) {
        frag = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          var w = document.createElement('span'), inner = document.createElement('span'); w.className = 'rw'; inner.textContent = part; inner.style.animationDelay = (n++ * 70) + 'ms'; w.appendChild(inner); frag.appendChild(w);
        });
        el.replaceChild(frag, node);
      } else if (node.nodeType === 1 && node.tagName !== 'BR') {
        var wrap = document.createElement('span'); wrap.className = 'rw'; el.replaceChild(wrap, node); wrap.appendChild(node); node.classList.add('rw-in'); node.style.animationDelay = (n++ * 70) + 'ms';
      }
    });
  }
  function odometer(el) {
    var val = String(parseInt(el.getAttribute('data-count'), 10));
    if (!/^\d+$/.test(val) || el.querySelector('.odo')) return;
    el.setAttribute('aria-label', val); el.textContent = '';
    var cols = [];
    val.split('').forEach(function (d, i) {
      var o = document.createElement('span'), inner = document.createElement('span'), k;
      o.className = 'odo'; o.setAttribute('aria-hidden', 'true'); inner.className = 'odo-in';
      for (k = 0; k < 10; k++) { var c = document.createElement('span'); c.textContent = k; inner.appendChild(c); }
      inner.style.transitionDelay = (450 + i * 90) + 'ms'; o.appendChild(inner); el.appendChild(o); cols.push([inner, +d]);
    });
    requestAnimationFrame(function () { requestAnimationFrame(function () { cols.forEach(function (c) { c[0].style.transform = 'translateY(' + (-c[1] * 10) + '%)'; }); }); });
    /* if frames never run (hidden tab), fall back to the plain number */
    setTimeout(function () { if (document.hidden && el.isConnected) { el.textContent = val; } }, 1200);
  }
  var io = null;
  function watch(el) {
    if (!window.IntersectionObserver) { el.classList.add('in'); return; }
    if (!io) io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    io.observe(el);
  }
  function lazy(el, make) {
    el.addEventListener('pointerenter', function first() {
      if (el.getAnimations && el.getAnimations().some(function (a) { return a.playState === 'running'; })) return;
      el.removeEventListener('pointerenter', first); make(el);
    });
  }
  function after(el) {
    auroras.forEach(function (a) { a.destroy(); }); auroras = [];
    $$('canvas[data-aurora]', el).forEach(function (c) { if (c.getContext) auroras.push(Aurora(c)); });
    if (mq.matches) { $$('[data-reveal],[data-stagger]', el).forEach(function (n) { n.classList.add('in'); }); return; }
    $$('[data-reveal="words"]', el).forEach(words);
    $$('[data-reveal]:not([data-reveal="words"])', el).forEach(watch);
    $$('[data-stagger]', el).forEach(function (n) { Array.prototype.forEach.call(n.children, function (c, i) { c.style.transitionDelay = (i * (parseInt(n.getAttribute('data-stagger'), 10) || 70)) + 'ms'; }); watch(n); });
    $$('[data-count]', el).forEach(function (n) { if (!(n instanceof SVGElement)) odometer(n); });
    var gsap = window.gsap;
    if (!fine.matches) return;
    /* a soft light follows the pointer across tiles */
    $$('.sky-in, .block:not(.kid), .pcard, .choice, .mod, [data-glow-host]', el).forEach(function (host) {
      var dot = null;
      host.addEventListener('pointermove', function (e) {
        if (!dot) { dot = document.createElement('i'); dot.className = 'glowdot'; host.appendChild(dot); }
        var r = host.getBoundingClientRect(); dot.style.transform = 'translate(' + (e.clientX - r.left) + 'px,' + (e.clientY - r.top) + 'px)'; dot.style.opacity = '1';
      });
      host.addEventListener('pointerleave', function () { if (dot) dot.style.opacity = '0'; });
    });
    if (!gsap) return;
    $$('.mag, [data-magnet]', el).forEach(function (b) {
      lazy(b, function () {
        var x = gsap.quickTo(b, 'x', { duration: 0.35, ease: 'power3.out' }), y = gsap.quickTo(b, 'y', { duration: 0.35, ease: 'power3.out' });
        b.addEventListener('pointermove', function (e) { var r = b.getBoundingClientRect(); x((e.clientX - r.left - r.width / 2) * 0.22); y((e.clientY - r.top - r.height / 2) * 0.3); });
        b.addEventListener('pointerleave', function () { x(0); y(0); });
      });
    });
    $$('.block, .choice, [data-tilt]', el).forEach(function (t) {
      lazy(t, function () {
        gsap.set(t, { transformPerspective: 900 });
        var rx = gsap.quickTo(t, 'rotationX', { duration: 0.5, ease: 'power3.out' }), ry = gsap.quickTo(t, 'rotationY', { duration: 0.5, ease: 'power3.out' });
        var art = t.querySelector('.choice-art, .lab-art, .toys, .mod-art'), ax = art ? gsap.quickTo(art, 'x', { duration: 0.6, ease: 'power3.out' }) : null, ay = art ? gsap.quickTo(art, 'y', { duration: 0.6, ease: 'power3.out' }) : null;
        t.addEventListener('pointermove', function (e) { var r = t.getBoundingClientRect(), fx = (e.clientX - r.left) / r.width - 0.5, fy = (e.clientY - r.top) / r.height - 0.5; ry(fx * 7); rx(-fy * 7); if (ax) { ax(fx * -16); ay(fy * -16); } });
        t.addEventListener('pointerleave', function () { rx(0); ry(0); if (ax) { ax(0); ay(0); } });
      });
    });
  }

  window.HubMotion = { intro: intro, stop: stopIntro, after: after, burst: burst, celebrate: celebrate, turn: turn, flood: flood, ease: EASE };
})();
