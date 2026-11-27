/* Literature explorer (OpenAlex) and opportunities board.
   Nothing here is generated: papers come from the OpenAlex index as returned, opportunities come from the
   hand-curated file data/opportunities.json, and every number is a count from one of those or the user's own rating. */
(function () {
  'use strict';
  var H = window.Hub, esc = H.esc, $ = H.$, $$ = H.$$;
  var API = 'https://api.openalex.org/works';
  var SELECT = 'id,doi,title,display_name,publication_year,authorships,primary_location,cited_by_count,open_access,abstract_inverted_index,language,type,biblio';
  var PER = 25, MAX_PAGE = 400, TIMEOUT = 20000, FRESH_DAYS = 30;

  /* ---------- store ---------- */
  function D() {
    var d = H.data('explore');
    if (d.v !== 1) d.v = 1;
    ['list', 'saved', 'ideas', 'mine'].forEach(function (k) { if (!Array.isArray(d[k])) d[k] = []; });
    if (typeof d.key !== 'string') d.key = '';
    if (!d.last || typeof d.last !== 'object') d.last = {};
    return d;
  }

  /* ---------- dates (local calendar day, ISO text) ---------- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function tday() { var n = new Date(); return n.getFullYear() + '-' + pad(n.getMonth() + 1) + '-' + pad(n.getDate()); }
  function isIso(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '')); if (!m) return false;
    var t = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    return t.getUTCFullYear() === +m[1] && t.getUTCMonth() === +m[2] - 1 && t.getUTCDate() === +m[3];
  }
  function dnum(s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s); return Date.UTC(+m[1], +m[2] - 1, +m[3]) / 864e5; }
  function days(from, to) { return Math.round(dnum(to) - dnum(from)); }
  function fdate(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || '')); return '<bdi class="num" dir="ltr">' + (m ? m[3] + '/' + m[2] + '/' + m[1] : esc(iso)) + '</bdi>'; }
  function nfmt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function str(v) { return typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : ''; }

  /* ---------- own icons ---------- */
  var IC = {
    search: '<circle cx="8.6" cy="8.6" r="5.4"/><path d="m12.700 12.700 4.300 4.300"/>',
    out: '<path d="M8 4.500H4.500v11h11V12M11 4.500h4.500V9M15.500 4.500 9 11"/>',
    open: '<path d="M6.500 9V6.500a3.500 3.500 0 0 1 6.800-1.200M5 9h10v7.500H5z"/>',
    note: '<path d="M4 16l.8-3.300L13.500 4l2.500 2.500-8.700 8.700zM11.800 5.700l2.500 2.500"/>',
    link: '<path d="M8.500 11.500a3 3 0 0 0 4.200 0l2.800-2.800a3 3 0 0 0-4.200-4.200l-1 1M11.500 8.500a3 3 0 0 0-4.200 0l-2.800 2.800a3 3 0 0 0 4.200 4.200l1-1"/>'
  };
  function ic(n) { return IC[n] ? '<svg class="ic" viewBox="0 0 20 20" aria-hidden="true" focusable="false">' + IC[n] + '</svg>' : H.ic(n); }

  /* ---------- OpenAlex client ---------- */
  var MSG = {
    net: 'مقدرناش نوصل لفهرس OpenAlex. اتأكد من النت وجرّب تاني. لو المشكلة مستمرة ممكن يكون الموقع نفسه واقف دلوقتي.',
    time: 'الفهرس اتأخر في الرد أكتر من 20 ثانية. جرّب تاني، أو صغّر البحث.',
    limit: 'وصلنا للحد المسموح من OpenAlex دلوقتي (رد 429). استنى شوية وجرّب تاني. لو بتدوّر كتير، حُط مفتاح OpenAlex المجاني بتاعك من «إعدادات الفهرس» تحت.',
    auth: 'OpenAlex رفض الطلب (مفتاح غلط أو مطلوب مفتاح). راجع المفتاح في «إعدادات الفهرس» تحت.',
    bad: 'الفهرس مفهمش البحث ده. جرّب كلمات أبسط من غير رموز.',
    server: 'في مشكلة عند OpenAlex نفسه دلوقتي. جرّب بعد شوية.',
    shape: 'الرد اللي جه من الفهرس مش بالشكل المتوقع، فمش هنعرض حاجة مش متأكدين منها. جرّب تاني بعد شوية.'
  };
  function fail(kind, status) { return { kind: kind, status: status || 0, msg: MSG[kind] + (status ? ' (كود ' + status + ')' : '') }; }
  function build(params) {
    var q = [], k = D().key;
    Object.keys(params).forEach(function (n) { if (params[n] !== '' && params[n] != null) q.push(n + '=' + encodeURIComponent(params[n])); });
    if (k) q.push('api_key=' + encodeURIComponent(k));
    return API + '?' + q.join('&');
  }
  function call(params, done) {
    var ctl = window.AbortController ? new AbortController() : null, over = false, timed = false;
    var t = setTimeout(function () { timed = true; if (ctl) ctl.abort(); end(fail('time')); }, TIMEOUT);
    function end(err, json) { if (over) return; over = true; clearTimeout(t); done(err, json); }
    var req;
    try { req = fetch(build(params), ctl ? { signal: ctl.signal } : {}); } catch (e) { return end(fail('net')); }
    req.then(function (r) {
      if (r.status === 429) return end(fail('limit', 429));
      if (r.status === 401 || r.status === 403) return end(fail('auth', r.status));
      if (r.status === 400 || r.status === 404) return end(fail('bad', r.status));
      if (!r.ok) return end(fail('server', r.status));
      return r.json().then(function (j) {
        if (!j || typeof j !== 'object' || !j.meta || typeof j.meta.count !== 'number') return end(fail('shape'));
        end(null, j);
      }, function () { end(fail('shape')); });
    }, function () { end(fail(timed ? 'time' : 'net')); });
  }
  function combine(q, pop) { return pop ? '(' + q + ') AND (' + pop + ')' : q; }
  function filterStr(f) {
    var p = [], a = parseInt(f.from, 10), b = parseInt(f.to, 10);
    if (a && b) p.push('publication_year:' + Math.min(a, b) + '-' + Math.max(a, b));
    else if (a) p.push('publication_year:>' + (a - 1));
    else if (b) p.push('publication_year:<' + (b + 1));
    if (f.oa) p.push('open_access.is_oa:true');
    if (f.lang) p.push('language:' + f.lang);
    if (f.type) p.push('type:' + f.type);
    return p.join(',');
  }

  /* ---------- reading a work exactly as the index returned it ---------- */
  function abstractOf(inv) {
    if (!inv || typeof inv !== 'object') return '';
    var out = [], n = 0;
    Object.keys(inv).forEach(function (w) {
      var at = inv[w]; if (!Array.isArray(at)) return;
      at.forEach(function (i) { if (typeof i === 'number' && i >= 0 && i < 6000 && n < 6000) { out[i] = w; n++; } });
    });
    var parts = []; for (var i = 0; i < out.length; i++) if (out[i] != null) parts.push(out[i]);
    return parts.join(' ').replace(/<[^>]+>/g, '').trim();
  }
  function norm(w) {
    w = w && typeof w === 'object' ? w : {};
    var au = Array.isArray(w.authorships) ? w.authorships.map(function (a) { return a && a.author ? str(a.author.display_name) : ''; }).filter(Boolean) : [];
    var src = w.primary_location && w.primary_location.source, b = w.biblio && typeof w.biblio === 'object' ? w.biblio : {};
    var y = parseInt(w.publication_year, 10);
    return {
      id: /^https:\/\/openalex\.org\/W\d+$/.test(w.id || '') ? w.id : '',
      doi: /^https:\/\/doi\.org\/10\.\S+$/i.test(w.doi || '') ? w.doi : '',
      title: (str(w.title) || str(w.display_name)).replace(/<[^>]+>/g, ''),
      year: y >= 1500 && y <= 2100 ? y : null,
      authors: au, auN: au.length,
      venue: src ? str(src.display_name) : '',
      cites: typeof w.cited_by_count === 'number' && w.cited_by_count >= 0 ? w.cited_by_count : null,
      oa: w.open_access && typeof w.open_access.is_oa === 'boolean' ? w.open_access.is_oa : null,
      lang: str(w.language), type: str(w.type),
      vol: str(b.volume), issue: str(b.issue), fp: str(b.first_page), lp: str(b.last_page),
      abs: abstractOf(w.abstract_inverted_index)
    };
  }
  function pkey(p) { return p.id || p.doi || (p.title + '|' + (p.year || '')); }
  function slim(p) {
    var au = p.authors.length > 20 ? p.authors.slice(0, 19).concat(p.authors[p.authors.length - 1]) : p.authors.slice();
    return { id: p.id, doi: p.doi, title: p.title, year: p.year, authors: au, auN: p.auN, venue: p.venue, cites: p.cites, oa: p.oa, lang: p.lang, type: p.type,
      vol: p.vol, issue: p.issue, fp: p.fp, lp: p.lp, note: '', added: tday() };
  }

  /* ---------- APA 7 line, RIS, BibTeX: built from the stored API fields only ---------- */
  function apaName(n) {
    n = str(n); var fam, given, t;
    if (n.indexOf(',') > -1) { t = n.split(','); fam = t[0].trim(); given = t.slice(1).join(' ').trim(); }
    else { t = n.split(' '); if (t.length === 1) return n; fam = t.pop(); given = t.join(' '); }
    var ini = given.split(' ').filter(Boolean).map(function (g) {
      return g.split('-').map(function (x) { x = x.replace(/\./g, ''); return x ? x.charAt(0).toUpperCase() + '.' : ''; }).filter(Boolean).join('-');
    }).filter(Boolean).join(' ');
    return fam + (ini ? ', ' + ini : '');
  }
  function apaAuthors(list, total) {
    var a = list.map(apaName), n = a.length;
    if (!n) return '';
    if ((total || n) > 20 && n >= 20) return a.slice(0, 19).join(', ') + ', … ' + a[n - 1];
    if (n === 1) return a[0];
    if (n === 2) return a[0] + ', & ' + a[1];
    return a.slice(0, n - 1).join(', ') + ', & ' + a[n - 1];
  }
  function dot(s) { return /[.?!]$/.test(s) ? s : s + '.'; }
  function apa(p) {
    var au = apaAuthors(p.authors || [], p.auN), y = '(' + (p.year || 'n.d.') + ')', t = p.title || '[بدون عنوان في الفهرس]';
    var s = au ? dot(au) + ' ' + y + '. ' + dot(t) : dot(t).slice(0, -1) + ' ' + y + '.';
    if (p.venue) {
      s += ' ' + p.venue;
      if (p.vol) s += ', ' + p.vol + (p.issue ? '(' + p.issue + ')' : '');
      if (p.fp) s += ', ' + p.fp + (p.lp && p.lp !== p.fp ? '–' + p.lp : '');
      s += '.';
    }
    if (p.doi) s += ' ' + p.doi;
    return s;
  }
  function bareDoi(p) { return p.doi ? p.doi.replace(/^https:\/\/doi\.org\//i, '') : ''; }
  var RIS_TY = { article: 'JOUR', review: 'JOUR', book: 'BOOK', 'book-chapter': 'CHAP', dissertation: 'THES', preprint: 'UNPB', report: 'RPRT' };
  function ris(list) {
    return list.map(function (p) {
      var L = ['TY  - ' + (RIS_TY[p.type] || 'GEN')];
      function add(tag, v) { if (v !== '' && v != null) L.push(tag + '  - ' + String(v).replace(/[\r\n]+/g, ' ')); }
      (p.authors || []).forEach(function (a) { add('AU', a); });
      add('TI', p.title); add('PY', p.year); add(RIS_TY[p.type] === 'JOUR' || !RIS_TY[p.type] ? 'JO' : 'T2', p.venue);
      add('VL', p.vol); add('IS', p.issue); add('SP', p.fp); add('EP', p.lp); add('DO', bareDoi(p)); add('UR', p.doi || p.id); add('LA', p.lang); add('N1', p.note);
      L.push('ER  - '); return L.join('\r\n');
    }).join('\r\n\r\n') + '\r\n';
  }
  function tex(s) { return String(s == null ? '' : s).replace(/\\/g, '\\textbackslash ').replace(/([{}&%$#_])/g, '\\$1').replace(/[\r\n]+/g, ' '); }
  var BIB_TY = { article: 'article', review: 'article', book: 'book', 'book-chapter': 'incollection', dissertation: 'phdthesis', preprint: 'unpublished' };
  function bibtex(list) {
    var used = {};
    return list.map(function (p) {
      var fam = p.authors && p.authors[0] ? apaName(p.authors[0]).split(',')[0] : '';
      var base = (fam.toLowerCase().replace(/[^a-z]/g, '') || 'ref') + (p.year || 'nd') + ((p.title || '').toLowerCase().match(/[a-z]{4,}/) || [''])[0];
      var k = base, i = 1; while (used[k]) k = base + String.fromCharCode(96 + (++i)); used[k] = 1;
      var ty = BIB_TY[p.type] || 'misc', F = [];
      function add(n, v) { if (v !== '' && v != null) F.push('  ' + n + ' = {' + tex(v) + '}'); }
      add('author', (p.authors || []).join(' and ') + (p.auN > (p.authors || []).length ? ' and others' : ''));
      add('title', p.title); add(ty === 'article' ? 'journal' : ty === 'incollection' ? 'booktitle' : 'howpublished', p.venue);
      add('year', p.year); add('volume', p.vol); add('number', p.issue); add('pages', p.fp ? p.fp + (p.lp && p.lp !== p.fp ? '--' + p.lp : '') : '');
      add('doi', bareDoi(p)); add('url', p.doi || p.id); add('note', p.note);
      return '@' + ty + '{' + k + ',\n' + F.join(',\n') + '\n}';
    }).join('\n\n') + '\n';
  }
  function download(name, text, mime) {
    var u = URL.createObjectURL(new Blob([text], { type: mime })), a = document.createElement('a');
    a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(u); }, 2000);
  }

  /* ---------- shell ---------- */
  var TABS = [['', 'بحث في الأدبيات'], ['list', 'قايمة القراءة'], ['idea', 'ورقة الجدوى'], ['board', 'لوحة الفرص'], ['radar', 'رادار الأسبوع']];
  function shell(cur, head, lead, body) {
    var n = D().list.length;
    return '<div class="mexplore' + (H.calm() ? ' mexplore-calm' : '') + '"><header class="head mexplore-head"><p class="mexplore-eyebrow">مستكشف الأدبيات والفرص</p>' +
      '<h1 class="mega" data-reveal="words">' + head + '</h1><p class="lead">' + lead + '</p></header>' +
      '<nav class="mexplore-nav" aria-label="أجزاء المستكشف">' + TABS.map(function (t) {
        return '<a href="#explore' + (t[0] ? '/' + t[0] : '') + '"' + (t[0] === cur ? ' aria-current="page"' : '') + '>' + t[1] + (t[0] === 'list' && n ? ' <span class="num mexplore-badge">' + n + '</span>' : '') + '</a>';
      }).join('') + '</nav>' + body + '</div>';
  }
  function errBox(e) { return '<div class="mexplore-err" role="alert"><strong>مفيش نتايج اتعرضت</strong><p>' + esc(e.msg) + '</p></div>'; }

  /* ---------- search view ---------- */
  var ses = { q: '', pop: '', f: { from: '', to: '', oa: false, lang: '', type: '' }, page: 1, res: null, err: null, busy: false, years: null, yerr: null, dens: null, derr: null, dbusy: false, run: 0, open: {} };
  var LANGS = [['en', 'الإنجليزية'], ['ar', 'العربية'], ['fr', 'الفرنسية'], ['es', 'الإسبانية'], ['de', 'الألمانية'], ['tr', 'التركية']];
  var TYPES_W = [['article', 'مقال في دورية'], ['review', 'مراجعة'], ['book-chapter', 'فصل في كتاب'], ['book', 'كتاب'], ['dissertation', 'رسالة علمية'], ['preprint', 'نسخة قبل النشر']];
  function label(list, v) { for (var i = 0; i < list.length; i++) if (list[i][0] === v) return list[i][1]; return v; }
  function hasArabic(s) { return /[\u0600-\u06FF]/.test(s); }

  function searchView(main) {
    var d = D();
    if (!ses.res && !ses.q && d.last.q) { ses.q = d.last.q; ses.pop = d.last.pop || ''; ses.f = { from: d.last.from || '', to: d.last.to || '', oa: !!d.last.oa, lang: d.last.lang || '', type: d.last.type || '' }; }
    var f = ses.f, anyF = f.from || f.to || f.oa || f.lang || f.type;
    main.innerHTML = shell('', 'دوّر في <em>المنشور فعلاً</em> قبل ما تقول «محدّش درسه»',
      'بحث مباشر في فهرس OpenAlex المفتوح. كل عنوان ورابط واستشهاد هنا جاي من الفهرس زي ما هو، من غير أي إضافة من عندنا.',
      '<form id="mx-form" class="mexplore-search" role="search" novalidate>' +
        '<label for="mx-q">كلمات البحث<span class="hint">اكتب بالإنجليزي لو تقدر: بيلاقي أكتر بكتير. مثال: <bdi dir="ltr">academic self-efficacy</bdi></span></label>' +
        '<div class="mexplore-qrow"><input type="text" id="mx-q" inputmode="search" enterkeyhint="search" autocomplete="off" dir="auto" maxlength="200" value="' + esc(ses.q) + '">' +
        '<button class="btn primary big" type="submit" id="mx-go">' + ic('search') + 'دوّر</button></div>' +
        '<details class="mexplore-filters"' + (anyF ? ' open' : '') + '><summary>فلاتر: السنة، اللغة، النوع، الوصول المفتوح</summary><div class="mexplore-fgrid">' +
          '<div><label for="mx-from">من سنة</label><input type="number" id="mx-from" min="1900" max="2100" inputmode="numeric" value="' + esc(f.from) + '"></div>' +
          '<div><label for="mx-to">لحد سنة</label><input type="number" id="mx-to" min="1900" max="2100" inputmode="numeric" value="' + esc(f.to) + '"></div>' +
          '<div><label for="mx-lang">لغة البحث المنشور</label><select id="mx-lang"><option value="">كل اللغات</option>' + H.opts(LANGS, f.lang) + '</select></div>' +
          '<div><label for="mx-type">النوع</label><select id="mx-type"><option value="">كل الأنواع</option>' + H.opts(TYPES_W, f.type) + '</select></div>' +
          '<label class="mexplore-check"><input type="checkbox" id="mx-oa"' + (f.oa ? ' checked' : '') + '><span>وصول مفتوح بس (تقدر تقرا النص كامل)</span></label>' +
        '</div></details>' +
        '<p class="mexplore-fielderr" id="mx-qerr" role="alert" hidden></p>' +
      '</form>' +
      '<div class="mexplore-cols"><section id="mx-results" class="mexplore-results" aria-live="polite" aria-busy="false"></section>' +
      '<aside class="mexplore-side" id="mx-side"></aside></div>' +
      '<details class="mexplore-settings" id="mx-settings"><summary>إعدادات الفهرس ومفتاح OpenAlex (اختياري)</summary>' +
        '<p class="small muted">OpenAlex خدمة مفتوحة، بس بقت تطلب مفتاح مجاني للاستخدام الكتير، ومن غيره الحد اليومي صغير. لو البحث وقف برسالة «الحد المسموح»، اعمل حساب مجاني على openalex.org وانسخ المفتاح هنا. المفتاح بيتحفظ على جهازك ده بس، وبيتبعت لـ OpenAlex مع كل طلب بحث.</p>' +
        '<form id="mx-keyform" class="mexplore-keyrow"><label for="mx-key" class="sr">مفتاح OpenAlex</label><input type="text" id="mx-key" dir="ltr" autocomplete="off" spellcheck="false" maxlength="120" value="' + esc(d.key) + '"><button class="btn" type="submit">احفظ المفتاح</button></form>' +
      '</details>');
    drawResults(); drawSide();
    $('#mx-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var q = str($('#mx-q').value), er = $('#mx-qerr');
      if (q.length < 2) { er.textContent = 'اكتب كلمة أو اتنين عن موضوعك الأول.'; er.hidden = false; $('#mx-q').focus(); return; }
      var a = $('#mx-from').value.trim(), b = $('#mx-to').value.trim();
      if ((a && !/^(19|20)\d\d$/.test(a)) || (b && !/^(19|20)\d\d$/.test(b))) { er.textContent = 'السنة لازم تبقى 4 أرقام بين 1900 و2099.'; er.hidden = false; return; }
      er.hidden = true;
      ses.q = q; ses.f = { from: a, to: b, oa: $('#mx-oa').checked, lang: $('#mx-lang').value, type: $('#mx-type').value };
      ses.page = 1; ses.dens = null; ses.derr = null; ses.open = {};
      var L = D().last = { q: q, pop: ses.pop, from: a, to: b, oa: ses.f.oa, lang: ses.f.lang, type: ses.f.type }; void L; H.save();
      runSearch(true);
    });
    $('#mx-keyform').addEventListener('submit', function (e) { e.preventDefault(); D().key = $('#mx-key').value.trim(); H.save(); H.toast(D().key ? 'المفتاح اتحفظ على جهازك' : 'اتمسح المفتاح'); });
    $('#mx-results').addEventListener('click', onResultClick);
    $('#mx-side').addEventListener('submit', function (e) {
      if (e.target.id !== 'mx-popform') return; e.preventDefault();
      var pop = str($('#mx-pop').value);
      if (!pop) { $('#mx-pop').focus(); return; }
      ses.pop = pop; D().last.pop = pop; H.save(); runDensity();
    });
  }
  function alive() { return !!$('#mx-results'); }
  function runSearch(withYears) {
    var run = ++ses.run, fs = filterStr(ses.f);
    ses.busy = true; ses.err = null; if (withYears) { ses.years = null; ses.yerr = null; }
    if (alive()) { drawResults(); drawSide(); }
    call({ search: ses.q, filter: fs, 'per-page': PER, page: ses.page, select: SELECT }, function (err, j) {
      if (run !== ses.run) return;
      ses.busy = false;
      if (err) { ses.err = err; ses.res = null; }
      else if (!Array.isArray(j.results)) { ses.err = fail('shape'); ses.res = null; }
      else ses.res = { count: j.meta.count, items: j.results.map(norm), q: ses.q, fs: fs, page: ses.page };
      if (alive()) { drawResults(); drawSide(); var h = $('#mx-count'); if (h) h.focus(); }
    });
    if (withYears) call({ search: ses.q, filter: fs, group_by: 'publication_year' }, function (err, j) {
      if (run !== ses.run) return;
      if (err) ses.yerr = err;
      else if (!Array.isArray(j.group_by)) ses.yerr = fail('shape');
      else ses.years = j.group_by.map(function (g) { return { y: parseInt(g && g.key, 10), n: g && typeof g.count === 'number' ? g.count : 0 }; }).filter(function (g) { return g.y >= 1500 && g.y <= 2100 && g.n > 0; }).sort(function (a, b) { return a.y - b.y; });
      if (alive()) drawSide();
    });
  }
  function runDensity() {
    var run = ses.run, pop = ses.pop;
    ses.dbusy = true; ses.derr = null; ses.dens = null; drawSide();
    call({ search: combine(ses.q, pop), filter: filterStr(ses.f), 'per-page': 1, select: 'id' }, function (err, j) {
      if (run !== ses.run || pop !== ses.pop) return;
      ses.dbusy = false;
      if (err) ses.derr = err; else ses.dens = { pop: pop, n: j.meta.count };
      if (alive()) drawSide();
    });
  }
  function saved(p) { var k = pkey(p); return D().list.some(function (x) { return pkey(x) === k; }); }
  function metaLine(p) {
    var a = p.authors || [], names = a.slice(0, 3).join('، ') + (p.auN > 3 ? ' و' + (p.auN - 3) + ' آخرين' : '');
    return [names || 'المؤلف مش مسجّل في الفهرس', p.year || 'السنة مش مسجّلة', p.venue || 'جهة النشر مش مسجّلة'].map(esc).join(' <span aria-hidden="true">·</span> ');
  }
  function doiLink(p) {
    if (p.doi) return '<a class="mexplore-doi" href="' + esc(p.doi) + '" target="_blank" rel="noopener noreferrer">' + ic('out') + '<bdi dir="ltr">' + esc(bareDoi(p)) + '</bdi><span class="sr"> (رابط DOI، يفتح في صفحة جديدة)</span></a>';
    if (p.id) return '<a class="mexplore-doi" href="' + esc(p.id) + '" target="_blank" rel="noopener noreferrer">' + ic('out') + 'صفحته في OpenAlex</a><span class="small muted">مفيش DOI مسجّل</span>';
    return '<span class="small muted">مفيش DOI ولا رابط مسجّل في الفهرس</span>';
  }
  function flags(p) {
    var h = '';
    if (p.oa === true) h += '<span class="mexplore-oa">' + ic('open') + 'وصول مفتوح</span>';
    if (p.type) h += '<span>' + esc(label(TYPES_W, p.type)) + '</span>';
    if (p.lang) h += '<span>' + esc(label(LANGS, p.lang)) + '</span>';
    return h ? '<p class="mexplore-flags">' + h + '</p>' : '';
  }
  function drawResults() {
    var box = $('#mx-results'); if (!box) return;
    box.setAttribute('aria-busy', ses.busy ? 'true' : 'false');
    if (ses.busy) { box.innerHTML = '<div class="mexplore-wait" role="status"><span class="mexplore-pulse" aria-hidden="true"></span>بندوّر في الفهرس…</div>'; return; }
    if (ses.err) { box.innerHTML = errBox(ses.err) + '<p><button class="btn" type="button" data-act="retry">جرّب تاني</button></p>'; return; }
    if (!ses.res) {
      box.innerHTML = '<div class="mexplore-intro"><h2>قبل ما تبدأ</h2><ol class="mexplore-steps">' +
        '<li><strong>الإنجليزي بيلاقي أكتر.</strong> أغلب المفهرس منشور بالإنجليزية، فجرّب مصطلحك الإنجليزي أولاً، وبعدين العربي.</li>' +
        '<li><strong>الدوريات العربية مفهرسة بشكل ضعيف.</strong> رسايل الجامعات ومجلات الكليات كتير منها مش موجود هنا. دوّر كمان في دار المنظومة وبنك المعرفة ومكتبة كليتك.</li>' +
        '<li><strong>«نتايج قليلة» مش دليل على فجوة بحثية.</strong> ممكن تكون الكلمات مختلفة، أو البحث منشور ومش مفهرس. الفجوة بتتثبت بمراجعة منظمة، مش بعدّاد.</li></ol></div>';
      return;
    }
    var r = ses.res, pages = Math.min(MAX_PAGE, Math.ceil(r.count / PER)), isSaved = D().saved.some(function (s) { return s.q === r.q && s.fs === r.fs; });
    var h = '<header class="mexplore-rhead"><h2 id="mx-count" tabindex="-1"><span class="num mexplore-big">' + nfmt(r.count) + '</span> ' + (r.count === 1 ? 'نتيجة' : 'نتيجة') + ' في الفهرس عن <bdi dir="auto">«' + esc(r.q) + '»</bdi></h2>' +
      (r.count ? '<button class="btn" type="button" data-act="savesearch"' + (isSaved ? ' disabled' : '') + '>' + (isSaved ? H.ic('check') + 'البحث ده محفوظ للرادار' : H.ic('plus') + 'احفظ البحث للرادار') + '</button>' : '') + '</header>';
    if (!r.count) {
      h += '<div class="mexplore-none"><p class="mexplore-none-t">الفهرس مرجّعش حاجة بالكلمات دي.</p><p>ده معناه إن <strong>الفهرس</strong> مفيهوش تطابق، مش إن الموضوع محدّش درسه. ' +
        (hasArabic(r.q) ? 'إنت كاتب بالعربي، والدوريات العربية مفهرسة بشكل ضعيف: جرّب المصطلح الإنجليزي.' : 'جرّب مرادفات، أو كلمات أقل، أو شيل الفلاتر.') + '</p></div>';
      box.innerHTML = h; return;
    }
    if (r.count < 20) h += '<p class="notice">نتايج قليلة في الفهرس مش دليل على فجوة بحثية. ' + (hasArabic(r.q) ? 'الدوريات العربية مفهرسة بشكل ضعيف، فجرّب المصطلح الإنجليزي كمان.' : 'جرّب مرادفات وصياغات تانية قبل ما تستنتج حاجة.') + '</p>';
    else if (hasArabic(r.q)) h += '<p class="notice">إنت بتدوّر بالعربي. الدوريات العربية مفهرسة بشكل ضعيف، فالعدد ده أقل من المنشور فعلاً. جرّب المصطلح الإنجليزي كمان.</p>';
    h += '<ol class="mexplore-papers" start="' + ((r.page - 1) * PER + 1) + '">' + r.items.map(function (p, i) {
      var sv = saved(p), open = !!ses.open[i];
      return '<li class="mexplore-paper" data-i="' + i + '"><div class="mexplore-cite">' + (p.cites == null ? '<strong>؟</strong><span>الاستشهادات مش مسجّلة</span>' : '<strong class="num">' + nfmt(p.cites) + '</strong><span>استشهاد</span>') + '</div>' +
        '<div class="mexplore-pbody"><h3 dir="auto">' + (p.title ? esc(p.title) : '<span class="muted">[بدون عنوان في الفهرس]</span>') + '</h3>' +
        '<p class="mexplore-meta" dir="auto">' + metaLine(p) + '</p>' + flags(p) +
        '<div class="mexplore-acts"><button class="btn ghost" type="button" data-act="abs" aria-expanded="' + open + '" aria-controls="mx-abs-' + i + '">الملخص</button>' +
        '<button class="btn" type="button" data-act="save"' + (sv ? ' disabled' : '') + '>' + (sv ? H.ic('check') + 'في قايمتك' : H.ic('plus') + 'احفظ في قايمة القراءة') + '</button>' + doiLink(p) + '</div>' +
        '<div class="mexplore-abs" id="mx-abs-' + i + '"' + (open ? '' : ' hidden') + '>' + (p.abs ? '<p dir="auto">' + esc(p.abs) + '</p><p class="small muted">الملخص متركّب من فهرس الكلمات في OpenAlex، فممكن الترقيم يختلف شوية عن الأصل.</p>' : '<p class="muted">الفهرس مفيهوش ملخص للبحث ده. افتح الرابط واقراه من المصدر.</p>') + '</div></div></li>';
    }).join('') + '</ol>';
    if (pages > 1) h += '<nav class="mexplore-pager" aria-label="صفحات النتايج"><button class="btn" type="button" data-act="prev"' + (r.page <= 1 ? ' disabled' : '') + '>' + H.ic('back') + 'السابق</button><span class="num">صفحة ' + r.page + ' من ' + nfmt(pages) + '</span><button class="btn" type="button" data-act="next"' + (r.page >= pages ? ' disabled' : '') + '>التالي' + H.ic('fwd') + '</button></nav>';
    h += '<p class="small muted mexplore-src">المصدر: فهرس OpenAlex. عدد الاستشهادات زي ما الفهرس مسجّله وقت البحث، وممكن يختلف عن قواعد بيانات تانية.</p>';
    box.innerHTML = h;
  }
  function onResultClick(e) {
    var b = e.target.closest('[data-act]'); if (!b) return;
    var act = b.getAttribute('data-act'), li = b.closest('[data-i]'), i = li ? +li.getAttribute('data-i') : -1, r = ses.res;
    if (act === 'retry') return runSearch(!ses.years);
    if (!r) return;
    if (act === 'abs') { ses.open[i] = !ses.open[i]; b.setAttribute('aria-expanded', String(!!ses.open[i])); $('#mx-abs-' + i).hidden = !ses.open[i]; }
    else if (act === 'save') {
      var p = r.items[i]; if (!p || saved(p)) return;
      D().list.unshift(slim(p)); H.save(); H.toast('اتحفظ في قايمة القراءة');
      b.disabled = true; b.innerHTML = H.ic('check') + 'في قايمتك';
      var bd = $('.mexplore-nav a[href="#explore/list"]'); if (bd) bd.innerHTML = 'قايمة القراءة <span class="num mexplore-badge">' + D().list.length + '</span>';
    }
    else if (act === 'prev' || act === 'next') { ses.page = Math.max(1, r.page + (act === 'next' ? 1 : -1)); ses.open = {}; runSearch(false); }
    else if (act === 'savesearch') saveSearch(b);
  }
  /* A saved search keeps a snapshot (count + the newest 25 ids) so the radar can show a real difference later. */
  function snapshot(q, fs, done) {
    call({ search: q, filter: fs, 'per-page': PER, sort: 'publication_date:desc', select: 'id,doi,title,display_name,publication_year' }, function (err, j) {
      if (err) return done(err);
      if (!Array.isArray(j.results)) return done(fail('shape'));
      done(null, { count: j.meta.count, items: j.results.map(norm).filter(function (p) { return p.id; }) });
    });
  }
  function saveSearch(btn) {
    var r = ses.res, d = D();
    if (d.saved.length >= 12) { H.toast('عندك 12 بحث محفوظ. امسح واحد من الرادار الأول.'); return; }
    btn.disabled = true;
    snapshot(r.q, r.fs, function (err, s) {
      if (err) { btn.disabled = false; H.toast(err.kind === 'limit' ? 'الفهرس وصل للحد المسموح. جرّب بعد شوية.' : 'مقدرناش نحفظ البحث دلوقتي. جرّب تاني.'); return; }
      d.saved.unshift({ id: H.uid(), q: r.q, fs: r.fs, count: s.count, ids: s.items.map(function (p) { return p.id; }), at: tday(), last: null });
      H.save(); H.toast('البحث اتحفظ. هتلاقيه في رادار الأسبوع');
      if (btn.isConnected) btn.innerHTML = H.ic('check') + 'البحث ده محفوظ للرادار';
    });
  }

  /* ---------- per-year chart and density ---------- */
  function chart(years) {
    var hi = years[years.length - 1].y, lo = Math.max(years[0].y, hi - 39), before = 0, map = {}, max = 0, total = 0, y;
    years.forEach(function (g) { total += g.n; if (g.y < lo) before += g.n; else { map[g.y] = g.n; if (g.n > max) max = g.n; } });
    var n = hi - lo + 1, W = 320, Hh = 132, top = 14, base = 108, bw = W / n, peak = lo;
    for (y = lo; y <= hi; y++) if ((map[y] || 0) === max) peak = y;
    var s = '<svg class="mexplore-chart" viewBox="0 0 ' + W + ' ' + Hh + '" role="img" aria-label="عدد الأبحاث المفهرسة في كل سنة من ' + lo + ' لحد ' + hi + '. الأعلى سنة ' + peak + ' بعدد ' + max + '.">' +
      '<line class="mexplore-axis" x1="0" x2="' + W + '" y1="' + base + '" y2="' + base + '"/>';
    for (y = lo; y <= hi; y++) {
      var v = map[y] || 0, bh = v ? Math.max(1.5, (v / max) * (base - top)) : 0, x = (hi - y) * bw; /* newest on the left: time runs right to left like the page */
      if (v) s += '<rect class="mexplore-bar' + (y === peak ? ' peak' : '') + '" x="' + (x + bw * 0.14).toFixed(2) + '" y="' + (base - bh).toFixed(2) + '" width="' + (bw * 0.72).toFixed(2) + '" height="' + bh.toFixed(2) + '" rx="' + Math.min(2, bw * 0.3).toFixed(2) + '"><title>' + y + ': ' + nfmt(v) + '</title></rect>';
    }
    var px = (hi - peak) * bw + bw / 2;
    s += '<text class="mexplore-ct peak" x="' + Math.min(W - 16, Math.max(16, px)).toFixed(1) + '" y="9" text-anchor="middle">' + nfmt(max) + '</text>' +
      '<text class="mexplore-ct" x="' + (W - 1) + '" y="126" text-anchor="start" direction="ltr">' + lo + '</text><text class="mexplore-ct" x="1" y="126" text-anchor="end" direction="ltr">' + hi + '</text></svg>';
    return { svg: s, total: total, before: before, lo: lo, hi: hi, peak: peak, max: max, map: map };
  }
  function drawSide() {
    var box = $('#mx-side'); if (!box) return;
    if (!ses.res && !ses.busy) { box.innerHTML = ''; box.hidden = true; return; }
    box.hidden = false;
    var h = '<section class="tile block sun mexplore-ytile"><p class="block-label">النشر عبر السنين</p>';
    if (ses.yerr) h += '<p>مقدرناش نجيب توزيع السنين. ' + esc(ses.yerr.msg) + '</p>';
    else if (!ses.years) h += '<p role="status">بنعدّ…</p>';
    else if (!ses.years.length) h += '<p>مفيش سنين مسجّلة للنتايج دي في الفهرس.</p>';
    else {
      var c = chart(ses.years), cy = new Date().getFullYear();
      h += '<h2 class="mexplore-ypeak">القمة سنة <span class="num">' + c.peak + '</span></h2>' + c.svg +
        '<table class="sr"><caption>عدد الأبحاث المفهرسة لكل سنة</caption><tbody>' + Object.keys(c.map).map(function (y) { return '<tr><th scope="row">' + y + '</th><td>' + c.map[y] + '</td></tr>'; }).join('') + '</tbody></table>' +
        '<p class="small">كل عمود = عدد المفهرس في السنة دي للبحث بتاعك. ' + (c.before ? 'وقبل ' + c.lo + ': <span class="num">' + nfmt(c.before) + '</span>. ' : '') + (c.hi >= cy ? 'سنة ' + cy + ' لسه مكمّلتش، فعمودها ناقص.' : '') + '</p>';
    }
    h += '</section>';
    var r = ses.res;
    h += '<section class="tile mexplore-dens"><h2>مؤشر كثافة الأدبيات</h2><p class="mexplore-denslabel">كثافة في الفهرس، مش دليل على فجوة</p>';
    if (!r) h += '<p class="muted" role="status">مستنيين نتيجة البحث…</p>';
    else {
      h += '<form id="mx-popform" class="mexplore-poprow"><label for="mx-pop">ضيّقها على فئة أو بلد<span class="hint">كلمة بالإنجليزي زي <bdi dir="ltr">Egypt</bdi> أو <bdi dir="ltr">Arab</bdi> أو <bdi dir="ltr">children</bdi></span></label>' +
        '<div class="mexplore-qrow"><input type="text" id="mx-pop" dir="auto" maxlength="80" autocomplete="off" value="' + esc(ses.pop) + '"><button class="btn" type="submit"' + (ses.dbusy ? ' disabled' : '') + '>قِس</button></div></form>';
      h += '<dl class="mexplore-bars"><div><dt><bdi dir="auto">' + esc(r.q) + '</bdi></dt><dd><span class="mexplore-track"><i data-w="100"></i></span><strong class="num">' + nfmt(r.count) + '</strong></dd></div>';
      if (ses.dbusy) h += '<div><dt>بنعدّ…</dt><dd role="status"></dd></div>';
      else if (ses.derr) h += '</dl>' + errBox(ses.derr) + '<dl hidden>';
      else if (ses.dens) {
        var pct = r.count ? Math.min(100, ses.dens.n / r.count * 100) : 0;
        h += '<div><dt><bdi dir="auto">' + esc(r.q) + '</bdi> + <bdi dir="auto">' + esc(ses.dens.pop) + '</bdi></dt><dd><span class="mexplore-track"><i class="b" data-w="' + pct.toFixed(2) + '"></i></span><strong class="num" id="mx-densn">' + nfmt(ses.dens.n) + '</strong></dd></div>';
      }
      h += '</dl>';
      if (ses.dens && !ses.dbusy && !ses.derr) h += '<p id="mx-denspct">' + (r.count ? 'يعني <strong class="num">' + (Math.round(ses.dens.n / r.count * 1000) / 10) + '%</strong> من المفهرس عن موضوعك فيه كلمة «<bdi dir="auto">' + esc(ses.dens.pop) + '</bdi>» كمان.' : '') + '</p>';
      h += '<p class="small muted">الرقمين عدّ مباشر من الفهرس: الأول لكلماتك لوحدها، والتاني لكلماتك مع الكلمة اللي زوّدتها (الاتنين لازم يظهروا في العنوان أو الملخص أو النص). النسبة = التاني ÷ الأول. رقم صغير ممكن معناه فهرسة ضعيفة أو كلمات مختلفة، مش بالضرورة إن محدّش درس الفئة دي.</p>';
    }
    h += '</section>';
    box.innerHTML = h;
    $$('.mexplore-track i', box).forEach(function (el) { el.style.setProperty('width', Math.max(el.getAttribute('data-w') > 0 ? 1.5 : 0, +el.getAttribute('data-w')) + '%'); });
  }

  /* ---------- reading list ---------- */
  var noteOpen = {};
  function listView(main) {
    var d = D(), L = d.list, projects = H.state().projects || [];
    var body = '';
    if (!L.length) body = '<div class="mexplore-empty"><svg class="mexplore-emptyart" viewBox="0 0 120 80" aria-hidden="true"><path d="M20 62h80M28 62V26h22v36M54 62V18h18v44M76 62V34h16v28"/><use href="#star4" x="86" y="6" width="16" height="16"/></svg>' +
      '<p class="mexplore-none-t">قايمتك فاضية</p><p>دوّر على موضوعك، ومن كل نتيجة دوس «احفظ في قايمة القراءة». القايمة بتتحفظ على جهازك ده.</p><p><a class="btn primary" href="#explore">ابدأ بحث</a></p></div>';
    else {
      body = '<div class="mexplore-listbar"><p><strong class="num mexplore-big">' + L.length + '</strong> ' + (L.length === 1 ? 'بحث محفوظ' : 'أبحاث محفوظة') + ' على جهازك</p><div class="row"><button class="btn" type="button" id="mx-ris">' + H.ic('download') + 'تصدير RIS لـ Zotero</button><button class="btn" type="button" id="mx-bib">' + H.ic('download') + 'تصدير BibTeX</button></div></div>' +
        '<p class="notice">سطر APA هنا متركّب آلياً من بيانات الفهرس: راجع ترتيب أسماء المؤلفين (خصوصاً الأسماء العربية والمركّبة) وحروف العنوان الكبيرة قبل ما تعتمده. ومتستشهدش ببحث مقريتهوش.</p>' +
        '<ol class="mexplore-saved">' + L.map(function (p, i) {
          var open = !!noteOpen[pkey(p)] || !!p.note;
          return '<li class="mexplore-sitem" data-i="' + i + '"><div class="mexplore-shead"><h2 dir="auto">' + (p.title ? esc(p.title) : '[بدون عنوان في الفهرس]') + '</h2><button class="btn icon" type="button" data-act="del" aria-label="شيل «' + esc(p.title || 'البحث') + '» من القايمة">' + H.ic('trash') + '</button></div>' +
            '<p class="mexplore-meta" dir="auto">' + metaLine(p) + '</p>' +
            '<p class="mexplore-apa" dir="auto">' + esc(apa(p)) + '</p>' +
            '<div class="mexplore-acts">' + doiLink(p) + '<button class="btn ghost" type="button" data-act="note" aria-expanded="' + open + '">' + ic('note') + 'دوّن ملاحظة</button></div>' +
            '<div class="mexplore-note"' + (open ? '' : ' hidden') + '><label for="mx-note-' + i + '">ملاحظتك على البحث ده<span class="hint">قريته؟ إيه اللي يهمّك فيه؟ بتتحفظ لوحدها.</span></label><textarea id="mx-note-' + i + '" data-note maxlength="2000" dir="auto">' + esc(p.note || '') + '</textarea></div>' +
            (projects.length ? '<div class="mexplore-attach"><label for="mx-proj-' + i + '">اربطه بمشروع</label><div class="mexplore-qrow"><select id="mx-proj-' + i + '">' + projects.map(function (pr) { return '<option value="' + esc(pr.id) + '">' + esc(pr.title || 'مشروع بدون عنوان') + '</option>'; }).join('') + '</select><button class="btn" type="button" data-act="attach">' + ic('link') + 'أضِفه للدراسات السابقة</button></div></div>'
              : '<p class="small muted">عايز تربطه بمشروع؟ <a href="#projects">اعمل مشروع بحثي الأول</a>.</p>') + '</li>';
        }).join('') + '</ol>';
    }
    main.innerHTML = shell('list', 'قايمة <em>القراءة</em>', 'الأبحاث اللي حفظتها، بسطر مرجع جاهز وملاحظاتك. صدّرها لـ Zotero أو اربطها بمشروعك.', body);
    if (!L.length) return;
    $('#mx-ris').addEventListener('click', function () { download('malaka-reading-list.ris', ris(D().list), 'application/x-research-info-systems'); H.toast('اتنزّل ملف RIS'); });
    $('#mx-bib').addEventListener('click', function () { download('malaka-reading-list.bib', bibtex(D().list), 'application/x-bibtex'); H.toast('اتنزّل ملف BibTeX'); });
    var ol = $('.mexplore-saved');
    ol.addEventListener('change', function (e) {
      if (!e.target.hasAttribute('data-note')) return;
      var p = D().list[+e.target.closest('[data-i]').getAttribute('data-i')]; if (!p) return;
      p.note = e.target.value.trim().slice(0, 2000); if (H.save()) H.toast('اتحفظ');
    });
    ol.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return;
      var li = b.closest('[data-i]'), i = +li.getAttribute('data-i'), p = D().list[i], act = b.getAttribute('data-act'); if (!p) return;
      if (act === 'note') { var bx = $('.mexplore-note', li), o = bx.hidden; bx.hidden = !o; noteOpen[pkey(p)] = o; b.setAttribute('aria-expanded', String(o)); if (o) $('textarea', bx).focus(); }
      else if (act === 'del') { if (confirm('تشيل البحث ده من قايمتك؟ ملاحظتك عليه هتتمسح.')) { D().list.splice(i, 1); H.save(); listView(main); H.toast('اتشال'); } }
      else if (act === 'attach') {
        var pr = (H.state().projects || []).filter(function (x) { return x.id === $('select', li).value; })[0]; if (!pr) return;
        var line = apa(p), cur = String((pr.d && pr.d.lit) || '');
        if (cur.indexOf(line) > -1 || (p.doi && cur.indexOf(p.doi) > -1)) { H.toast('البحث ده موجود في المشروع ده قبل كده'); return; }
        if (!confirm('هنضيف السطر ده لخانة «أهم الدراسات السابقة» في مشروع «' + (pr.title || 'مشروع بدون عنوان') + '»:\n\n' + line + '\n\nتمام؟')) return;
        if (!pr.d || typeof pr.d !== 'object') pr.d = {};
        pr.d.lit = (cur.trim() ? cur.replace(/\s+$/, '') + '\n' : '') + line; pr.updated = H.today();
        if (H.save()) H.toast('اتضاف للمشروع');
      }
    });
  }
