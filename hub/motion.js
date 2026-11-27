/* Motion layer for the hub. Everything here is optional: the app renders complete, static markup without it.
   GSAP (core) is loaded by the page; ScrollTrigger and SplitText are fetched only when the welcome is shown. */
(function () {
  'use strict';
  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var fine = window.matchMedia ? window.matchMedia('(hover: hover) and (pointer: fine)') : { matches: false };
  var BASE = '../vendor/anim/';
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function pair(el, key) { var p = (el.getAttribute(key) || '0,0').split(','); return [parseFloat(p[0]), parseFloat(p[1])]; }

  var plugins = null;
  function script(src) {
    return new Promise(function (ok, fail) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = fail; document.head.appendChild(s); });
  }
  function scrollPlugins() {
    if (!window.gsap) return Promise.reject(new Error('gsap unavailable'));
    if (!plugins) plugins = Promise.all([script(BASE + 'ScrollTrigger.min.js'), script(BASE + 'SplitText.min.js')]).then(function () { window.gsap.registerPlugin(window.ScrollTrigger, window.SplitText); });
    return plugins;
  }

  /* ---------- living starfield (canvas) ---------- */
  function Sky(canvas, host) {
    var ctx = canvas.getContext('2d'), stars = [], trail = [], w = 0, h = 0, dpr = 1, raf = 0, running = false, live = !mq.matches;
    var px = 0, py = 0, tx = 0, ty = 0, sy = 0, ink = '#fff', gold = '#f5c04a', t0 = performance.now();
    function colours() { var c = getComputedStyle(host); ink = c.getPropertyValue('--star').trim() || '#fff'; gold = c.getPropertyValue('--star-hi').trim() || '#f5c04a'; }
    function size() {
      w = window.innerWidth; h = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, w < 700 ? 1.5 : 2);
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      var n = Math.max(50, Math.min(w < 700 ? 110 : 240, Math.round(w * h / 7000)));
      if ((window.devicePixelRatio || 1) > 2.5) n = Math.round(n * 0.75);
      var seed = 41; function r() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
      stars = [];
      for (var i = 0; i < n; i++) stars.push({ x: r(), y: r(), z: 0.25 + r() * 0.75, r: 0.6 + r() * r() * 2.4, p: r() * 6.28, s: 0.4 + r() * 1.3, g: r() < 0.12 });
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
  var sky = null, ctx = null, token = 0;
  function scenes(root) {
    var gsap = window.gsap, ST = window.ScrollTrigger, Split = window.SplitText;
    root.classList.add('live');
    ctx = gsap.context(function () {
      var ease = 'expo.out';
      /* scene 1: the headline arrives word by word, then drifts away with the scroll */
      var words = [];
      try { $$('.s1-line', root).forEach(function (l) { words = words.concat(Split.create(l, { type: 'words', wordsClass: 'w' }).words); }); } catch (e) { words = $$('.s1-line', root); }
      gsap.timeline({ defaults: { ease: ease } })
        .from('.s1-brand', { yPercent: 28, opacity: 0, scale: 0.92, duration: 1.4 }, 0.1)
        .from(words, { yPercent: 70, opacity: 0, rotation: 4, duration: 1.1, stagger: 0.1 }, 0.45)
        .from('.s1-lead', { y: 24, opacity: 0, duration: 0.9 }, 0.95)
        .from('.s1-cue', { opacity: 0, duration: 0.8 }, 1.5);
      gsap.to('.s1-title', { yPercent: -18, scale: 1.08, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.s1', start: 'top top', end: 'bottom 25%', scrub: true } });
      gsap.to('.s1-lead, .s1-cue', { opacity: 0, ease: 'none', scrollTrigger: { trigger: '.s1', start: 'top top', end: '40% top', scrub: true } });

      /* scenes 2 to 4: stars are pulled into the rosette, which opens into growth rings */
      var stars = $$('.m-star', root), origin = { svgOrigin: '0 0' };
      stars.forEach(function (s, i) { var p = pair(s, 'data-p0'); gsap.set(s, { x: p[0], y: p[1], rotation: i * 37, scale: 1, transformOrigin: '50% 50%' }); });
      gsap.set('.m-petal, .m-core, .m-ring', { scale: 0, opacity: 0, svgOrigin: '0 0' });
      gsap.set('.m-gap, .m-frame', { opacity: 0 });
      gsap.set('.m-line', { strokeDashoffset: 1 });
      var tl = gsap.timeline({ defaults: { ease: 'power2.inOut' }, scrollTrigger: { trigger: '.story', start: 'top 60%', end: 'bottom bottom', scrub: 0.6 } });
      tl.to('.m-line', { strokeDashoffset: 0, duration: 2.4, ease: 'none' }, 0.1)
        .to('.m-line', { opacity: 0, duration: 0.8 }, 3)
        .to('.m-frame', { opacity: 1, duration: 1 }, 3.5)
        .to('.m-core', { scale: 1, opacity: 1, duration: 1, ease: 'back.out(1.6)' }, 3.6)
        .to('.m-petal', { scale: 1, opacity: 1, duration: 1.1, stagger: 0.08, ease: 'back.out(1.3)' }, 3.7)
        .to('.m-gap', { opacity: 1, duration: 0.5, stagger: 0.05 }, 4.7)
        .to('.m-ros', Object.assign({ scale: 0.36, rotation: -108, duration: 2.2 }, origin), 6.3)
        .to('.m-ring', { scale: 1, opacity: 1, duration: 1.5, stagger: 0.22, ease: 'power3.out' }, 6.5)
        .to({}, { duration: 0.4 }, 9.6);
      stars.forEach(function (s, i) {
        var a = pair(s, 'data-p1'), b = pair(s, 'data-p2');
        tl.to(s, { x: a[0], y: a[1], rotation: 180, scale: 0.7, duration: 2 }, 3 + i * 0.05);
        tl.to(s, { x: b[0], y: b[1], rotation: 360, scale: 0.9, duration: 2.2 }, 6.4 + i * 0.04);
      });

      /* the questions arrive line by line as each chapter comes into view */
      $$('.ch', root).forEach(function (ch) {
        gsap.from($$('.rv', ch), { y: 44, opacity: 0, duration: 0.9, stagger: 0.11, ease: 'power3.out', scrollTrigger: { trigger: ch.querySelector('.ch-in'), start: 'top 82%', toggleActions: 'play none none reverse' } });
      });
      /* scene 5: the four roles */
      gsap.from('.s5-title, .s5-lead', { y: 40, opacity: 0, duration: 0.9, stagger: 0.1, ease: 'power3.out', scrollTrigger: { trigger: '.s5', start: 'top 75%', toggleActions: 'play none none reverse' } });
      gsap.from('.s5 .choice', { y: 70, opacity: 0, duration: 1, stagger: 0.09, ease: ease, clearProps: 'transform,opacity', scrollTrigger: { trigger: '.s5 .choices', start: 'top 88%', once: true } });
    }, root);
    ST.refresh();
  }
  function intro(root) {
    stopIntro();
    var mine = ++token, canvas = root.querySelector('canvas');
    if (canvas && canvas.getContext) sky = Sky(canvas, root);
    if (mq.matches) return;
    scrollPlugins().then(function () { return document.fonts && document.fonts.ready; }).then(function () {
      if (mine === token && root.isConnected) scenes(root);
    }).catch(function () { /* the static welcome stays as it is */ });
  }
  function stopIntro() {
    token++;
    if (ctx) { ctx.revert(); ctx = null; }
    if (sky) { sky.destroy(); sky = null; }
  }

  /* ---------- pointer feedback: magnetic primary buttons, tilting colour blocks ---------- */
  function after(root) {
    var gsap = window.gsap;
    if (!gsap || mq.matches || !fine.matches) return;
    /* set up on first contact, once the entrance animation has let go of the transform */
    function lazy(el, make) {
      el.addEventListener('pointerenter', function first() {
        if (el.getAnimations && el.getAnimations().some(function (a) { return a.playState === 'running'; })) return;
        el.removeEventListener('pointerenter', first); make(el);
      });
    }
    $$('.mag', root).forEach(function (el) {
      lazy(el, function () {
        var x = gsap.quickTo(el, 'x', { duration: 0.35, ease: 'power3.out' }), y = gsap.quickTo(el, 'y', { duration: 0.35, ease: 'power3.out' });
        el.addEventListener('pointermove', function (e) { var r = el.getBoundingClientRect(); x((e.clientX - r.left - r.width / 2) * 0.22); y((e.clientY - r.top - r.height / 2) * 0.3); });
        el.addEventListener('pointerleave', function () { x(0); y(0); });
      });
    });
    $$('.block, .choice', root).forEach(function (el) {
      lazy(el, function () {
        gsap.set(el, { transformPerspective: 900 });
        var rx = gsap.quickTo(el, 'rotationX', { duration: 0.5, ease: 'power3.out' }), ry = gsap.quickTo(el, 'rotationY', { duration: 0.5, ease: 'power3.out' });
        el.addEventListener('pointermove', function (e) { var r = el.getBoundingClientRect(); ry(((e.clientX - r.left) / r.width - 0.5) * 5); rx(-((e.clientY - r.top) / r.height - 0.5) * 5); });
        el.addEventListener('pointerleave', function () { rx(0); ry(0); });
      });
    });
  }

  window.HubMotion = { intro: intro, stop: stopIntro, after: after };
})();
