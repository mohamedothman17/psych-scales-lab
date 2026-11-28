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
    var h = '<header class="mexplore-rhead"><h2 id="mx-count" tabindex="-1"><span class="num mexplore-big">' + nfmt(r.count) + '</span> ' + "نتيجة" + ' في الفهرس عن <bdi dir="auto">«' + esc(r.q) + '»</bdi></h2>' +
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
        '<button class="btn" type="button" data-act="save"' + (sv ? ' disabled' : '') + '>' + (sv ? H.ic('check') + 'في قايمتك' : H.ic('plus') + 'احفظ للقراءة') + '</button>' + doiLink(p) + '</div>' +
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
    var n = Math.max(hi - lo + 1, 12), W = 320, Hh = 132, top = 14, base = 108, bw = W / n, peak = lo;
    for (y = lo; y <= hi; y++) if ((map[y] || 0) === max) peak = y;
    var s = '<svg class="mexplore-chart" viewBox="0 0 ' + W + ' ' + Hh + '" role="img" aria-label="عدد الأبحاث المفهرسة في كل سنة من ' + lo + ' لحد ' + hi + '. الأعلى سنة ' + peak + ' بعدد ' + max + '.">' +
      '<line class="mexplore-axis" x1="0" x2="' + W + '" y1="' + base + '" y2="' + base + '"/>';
    for (y = lo; y <= hi; y++) {
      var v = map[y] || 0, bh = v ? Math.max(1.5, (v / max) * (base - top)) : 0, x = (y - lo) * bw;
      if (v) s += '<rect class="mexplore-bar' + (y === peak ? ' peak' : '') + '" x="' + (x + bw * 0.14).toFixed(2) + '" y="' + (base - bh).toFixed(2) + '" width="' + (bw * 0.72).toFixed(2) + '" height="' + bh.toFixed(2) + '" rx="' + Math.min(2, bw * 0.3).toFixed(2) + '"><title>' + y + ': ' + nfmt(v) + '</title></rect>';
    }
    var px = (peak - lo) * bw + bw / 2;
    s += '<text class="mexplore-ct peak" direction="ltr" x="' + Math.min(W - 16, Math.max(16, px)).toFixed(1) + '" y="9" text-anchor="middle">' + nfmt(max) + '</text>' +
      '<text class="mexplore-ct" x="0" y="126" text-anchor="start" direction="ltr">' + lo + '</text><text class="mexplore-ct" x="' + W + '" y="126" text-anchor="end" direction="ltr">' + hi + '</text></svg>';
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

  /* ---------- topic feasibility worksheet: the user rates, the page only adds up ---------- */
  var CRIT = [
    ['imp', 'الأهمية', 'الموضوع بيحل مشكلة حقيقية أو بيضيف لمعرفة محتاجينها؟', 'أهمية ضعيفة', 'أهمية واضحة ومبرَّرة'],
    ['nov', 'دليل الجِدّة', 'دوّرت بنفسك ولقيت إن زاويتك مش متغطّية؟ قيّم قوة الدليل، مش إحساسك.', 'لسه مدوّرتش', 'راجعت بشكل منظم'],
    ['feas', 'إمكانية التنفيذ', 'تقدر تنفّذه فعلاً بالإمكانيات والتصاريح المتاحة؟', 'صعب جداً', 'في إيدك'],
    ['data', 'الوصول للبيانات', 'العينة أو البيانات تقدر توصل لها؟', 'مفيش طريق واضح', 'الوصول مضمون'],
    ['meth', 'ملاءمة المنهج', 'في منهج وأدوات مناسبة تجاوب على السؤال؟', 'مش واضح', 'المنهج والأدوات جاهزين'],
    ['skill', 'ملاءمة مهاراتك', 'مهاراتك في القياس والإحصاء تكفي، أو تقدر تتعلم الناقص في وقتك؟', 'فجوة كبيرة', 'مهاراتي تكفي'],
    ['cost', 'التكلفة والوقت', 'في حدود وقتك وميزانيتك؟', 'فوق طاقتي', 'في الحدود'],
    ['eth', 'المخاطر الأخلاقية', 'المخاطر على المشاركين قليلة وتقدر تتحكم فيها؟', 'مخاطر عالية', 'مخاطر قليلة ومتحكَّم فيها']
  ];
  function ideaSum(it) { var t = 0, n = 0; CRIT.forEach(function (c) { var v = +it.s[c[0]]; if (v >= 1 && v <= 5) { t += v; n++; } }); return { total: t, rated: n }; }
  function ideaStar(it) {
    var R = 78, pts = [], h = '<svg class="mexplore-star" viewBox="-110 -104 220 208" role="img" aria-label="رسم لتقييماتك في المعايير الثمانية">';
    for (var ring = 1; ring <= 5; ring++) h += '<circle class="mexplore-ring" r="' + (R * ring / 5) + '"/>';
    CRIT.forEach(function (c, i) {
      var a = (-90 + i * 45) * Math.PI / 180, v = +it.s[c[0]] || 0, x = Math.cos(a), y = Math.sin(a);
      h += '<line class="mexplore-spoke" x2="' + (x * R).toFixed(1) + '" y2="' + (y * R).toFixed(1) + '"/>';
      h += '<text class="mexplore-slabel" x="' + (x * (R + 15)).toFixed(1) + '" y="' + (y * (R + 13) + 4).toFixed(1) + '" text-anchor="middle">' + (i + 1) + '</text>';
      pts.push((x * R * v / 5).toFixed(1) + ',' + (y * R * v / 5).toFixed(1));
      if (v) h += '<circle class="mexplore-pt" cx="' + (x * R * v / 5).toFixed(1) + '" cy="' + (y * R * v / 5).toFixed(1) + '" r="3.4"/>';
    });
    return h + '<polygon class="mexplore-poly" points="' + pts.join(' ') + '"/></svg>';
  }
  function ideaView(main, id) {
    var d = D(), it = d.ideas.filter(function (x) { return x.id === id; })[0] || d.ideas[0];
    var lead = 'إنت اللي بتقيّم فكرتك على 8 معايير واضحة وبتكتب مبرراتك. المنصة بتجمع الأرقام وتعرضها بس، ومبتحكمش على الفكرة.';
    var make = '<form id="mx-newidea" class="mexplore-newidea"><label for="mx-ititle">اكتب فكرة أو عنوان مبدئي</label><div class="mexplore-qrow"><input type="text" id="mx-ititle" maxlength="200" dir="auto"><button class="btn' + (it ? '' : ' primary') + '" type="submit">' + H.ic('plus') + 'ورقة جديدة</button></div></form>';
    var body;
    if (!it) body = '<div class="mexplore-empty"><p class="mexplore-none-t">مفيش أفكار لسه</p><p>اكتب فكرتك وابدأ قيّمها معيار معيار.</p></div>' + make;
    else {
      var s = ideaSum(it);
      body = (d.ideas.length > 1 ? '<div class="mexplore-ideapick"><label for="mx-ipick">أفكارك</label><select id="mx-ipick">' + d.ideas.map(function (x) { return '<option value="' + esc(x.id) + '"' + (x.id === it.id ? ' selected' : '') + '>' + esc(x.title) + '</option>'; }).join('') + '</select></div>' : '') +
        '<div class="mexplore-ideagrid"><div class="mexplore-crits"><h2 class="mexplore-ideatitle" dir="auto">' + esc(it.title) + '</h2>' + CRIT.map(function (c, i) {
          var v = +it.s[c[0]] || 0;
          return '<fieldset class="mexplore-crit" data-k="' + c[0] + '"><legend><span class="num mexplore-cno">' + (i + 1) + '</span>' + c[1] + '</legend><p class="mexplore-cq">' + c[2] + '</p>' +
            '<div class="mexplore-scale"><span class="small">' + c[3] + '</span><div class="mexplore-dots">' + [1, 2, 3, 4, 5].map(function (n) {
              return '<label><input type="radio" name="mx-s-' + c[0] + '" value="' + n + '"' + (v === n ? ' checked' : '') + '><span class="num">' + n + '</span><span class="sr"> من 5</span></label>';
            }).join('') + '</div><span class="small">' + c[4] + '</span></div>' +
            '<label for="mx-n-' + c[0] + '" class="mexplore-nlabel">مبررك</label><textarea id="mx-n-' + c[0] + '" data-n="' + c[0] + '" maxlength="600" dir="auto" rows="2">' + esc(it.n[c[0]] || '') + '</textarea></fieldset>';
        }).join('') + '</div>' +
        '<aside class="mexplore-total tile block lilac"><p class="block-label">مجموع تقييمك إنت</p><p class="mexplore-sum"><strong class="num" id="mx-sum">' + s.total + '</strong><span> من 40</span></p><p id="mx-rated">قيّمت <span class="num">' + s.rated + '</span> من 8 معايير</p>' +
          '<div id="mx-star">' + ideaStar(it) + '</div>' +
          '<p class="small">المجموع = جمع الأرقام اللي اخترتها، من غير أوزان ولا تعديل. مفيش حد فاصل بيقول «كويسة» أو «وحشة»: معيار واحد ضعيف (زي الأخلاقيات أو الوصول للبيانات) ممكن يوقف الفكرة حتى لو المجموع عالي.</p>' +
          '<p class="small"><strong>الجِدّة عمرها ما بتبقى مضمونة.</strong> ممكن يكون في بحث منشور بلغة تانية أو في مصدر مش مفهرس. ناقش الورقة دي مع مشرفك.</p>' +
          '<p><button class="btn danger" type="button" id="mx-idel">' + H.ic('trash') + 'امسح الورقة دي</button></p></aside></div>' + make;
    }
    main.innerHTML = shell('idea', 'ورقة <em>جدوى</em> الموضوع', lead, body);
    $('#mx-newidea').addEventListener('submit', function (e) {
      e.preventDefault(); var t = str($('#mx-ititle').value); if (!t) { $('#mx-ititle').focus(); return; }
      if (d.ideas.length >= 20) { H.toast('عندك 20 ورقة. امسح واحدة الأول.'); return; }
      var n = { id: H.uid(), title: t.slice(0, 200), s: {}, n: {}, at: tday() }; d.ideas.unshift(n); H.save(); ideaView(main, n.id);
    });
    if (!it) return;
    var pick = $('#mx-ipick'); if (pick) pick.addEventListener('change', function () { ideaView(main, pick.value); });
    $('.mexplore-crits').addEventListener('change', function (e) {
      var t = e.target;
      if (t.type === 'radio') { it.s[t.closest('[data-k]').getAttribute('data-k')] = +t.value; }
      else if (t.hasAttribute('data-n')) it.n[t.getAttribute('data-n')] = t.value.trim().slice(0, 600);
      else return;
      H.save(); var s2 = ideaSum(it);
      $('#mx-sum').textContent = s2.total; $('#mx-rated').innerHTML = 'قيّمت <span class="num">' + s2.rated + '</span> من 8 معايير'; $('#mx-star').innerHTML = ideaStar(it);
    });
    $('#mx-idel').addEventListener('click', function () { if (confirm('تمسح ورقة «' + it.title + '» بتقييماتها؟')) { d.ideas = d.ideas.filter(function (x) { return x !== it; }); H.data('explore').ideas = d.ideas; H.save(); ideaView(main); H.toast('اتمسحت'); } });
  }

  /* ---------- opportunities: only what a person verified recently ---------- */
  var OTYPES = [['scholarship', 'منحة دراسية'], ['grant', 'تمويل بحثي'], ['fellowship', 'زمالة'], ['conference', 'مؤتمر'], ['cfp', 'دعوة لتقديم أوراق']];
  var OKEYS = ['id', 'title', 'organiser', 'type', 'url', 'deadline', 'eligibility', 'funding', 'location', 'added', 'verified', 'verifier', 'notes'];
  function httpsUrl(u) { try { var x = new URL(String(u)); return x.protocol === 'https:' && x.hostname.indexOf('.') > 0; } catch (e) { return false; } }
  function anyUrl(u) { try { var x = new URL(String(u)); return x.protocol === 'https:' || x.protocol === 'http:'; } catch (e) { return false; } }
  function validOpp(o) {
    return !!o && typeof o === 'object' && !!str(o.id) && !!str(o.title) && !!str(o.organiser) && OTYPES.some(function (t) { return t[0] === o.type; }) &&
      httpsUrl(o.url) && isIso(o.deadline) && isIso(o.verified) && !!str(o.verifier);
  }
  function cleanOpp(o) { var c = {}; OKEYS.forEach(function (k) { c[k] = typeof o[k] === 'string' ? o[k].trim() : ''; }); return c; }
  /* shown = deadline today or later, verified not in the future, and verified at most 30 days ago */
  function fresh(o, t) { return o.verified <= t && days(o.verified, t) <= FRESH_DAYS; }
  function shown(o, t) { return o.deadline >= t && fresh(o, t); }
  var board = null, boardWait = null;
  function loadBoard(done, force) {
    if (board && !force) return done(board);
    if (boardWait) { boardWait.push(done); return; }
    boardWait = [done];
    function end(b) { board = b; var q = boardWait; boardWait = null; q.forEach(function (f) { f(b); }); }
    fetch('data/opportunities.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) {
      if (!Array.isArray(j)) throw 0;
      var ok = j.filter(validOpp).map(cleanOpp), seen = {};
      ok = ok.filter(function (o) { if (seen[o.id]) return false; seen[o.id] = 1; return true; });
      end({ ok: true, all: ok, bad: j.length - ok.length });
    }).catch(function () { end({ ok: false, all: [], bad: 0 }); });
  }
  var LEVEL_WORDS = { 'ليسانس/بكالوريوس': ['بكالوريوس', 'ليسانس', 'undergraduate', 'bachelor'], 'دبلوم': ['دبلوم', 'diploma'], 'ماجستير': ['ماجستير', 'master', 'msc', 'postgraduate', 'graduate student', 'دراسات عليا'],
    'دكتوراه': ['دكتوراه', 'phd', 'doctoral', 'doctorate', 'postgraduate', 'graduate student', 'دراسات عليا'], 'بعد الدكتوراه': ['بعد الدكتوراه', 'postdoc', 'post-doc', 'early career', 'early-career'], 'ممارس من غير دراسة حالية': ['ممارس', 'practitioner', 'professional'] };
  var STAGE_TYPES = { 'لسه بدوّر على موضوع': ['scholarship', 'fellowship', 'grant'], 'عندي موضوع وبكتب الخطة': ['scholarship', 'fellowship', 'grant'], 'بجمع بيانات': ['grant', 'conference'], 'بحلّل': ['grant', 'conference'], 'بكتب': ['conference', 'cfp'], 'خلّصت وبنشر': ['conference', 'cfp'] };
  function match(o, pf) {
    var out = [], el = (o.eligibility || '').toLowerCase(), hay = (o.title + ' ' + o.eligibility + ' ' + o.notes).toLowerCase();
    var lw = LEVEL_WORDS[pf.level];
    if (lw && el && lw.some(function (w) { return el.indexOf(w) > -1; })) out.push('شروط التقديم مذكور فيها مرحلتك (' + pf.level + ')');
    var fw = String(pf.field || '').toLowerCase().split(/[\s،,]+/).filter(function (w) { return w.length >= 3 && w !== 'علم'; });
    var hit = fw.filter(function (w) { return hay.indexOf(w) > -1; })[0];
    if (hit) out.push('كلمة «' + hit + '» من تخصصك موجودة في الوصف');
    var st = STAGE_TYPES[pf.stage];
    if (st && st.indexOf(o.type) > -1) out.push('النوع ده بيناسب مرحلتك في البحث (' + pf.stage + ')');
    return out;
  }
  function oppCard(o, t, extra) {
    var left = days(t, o.deadline), m = extra && extra.match;
    return '<li class="mexplore-opp t-' + esc(o.type) + '"><div class="mexplore-left"><strong class="num">' + (left <= 0 ? '0' : left) + '</strong><span>' + (left <= 0 ? 'آخر يوم النهارده' : left === 1 ? 'يوم فاضل' : left === 2 ? 'يومين فاضلين' : left <= 10 ? 'أيام فاضلة' : 'يوم فاضل') + '</span></div>' +
      '<div class="mexplore-obody"><p class="mexplore-otype">' + esc(label(OTYPES, o.type)) + (o.location ? ' <span aria-hidden="true">·</span> ' + esc(o.location) : '') + '</p><h3 dir="auto">' + esc(o.title) + '</h3><p class="mexplore-meta" dir="auto">' + esc(o.organiser) + '</p>' +
      '<dl class="mexplore-ofacts"><div><dt>آخر ميعاد</dt><dd>' + fdate(o.deadline) + '</dd></div>' + (o.eligibility ? '<div><dt>مين يقدّم</dt><dd dir="auto">' + esc(o.eligibility) + '</dd></div>' : '') + (o.funding ? '<div><dt>التمويل</dt><dd dir="auto">' + esc(o.funding) + '</dd></div>' : '') + (o.notes ? '<div><dt>ملاحظة</dt><dd dir="auto">' + esc(o.notes) + '</dd></div>' : '') + '</dl>' +
      (m && m.length ? '<ul class="mexplore-why">' + m.map(function (x) { return '<li>' + H.ic('check') + esc(x) + '</li>'; }).join('') + '</ul>' : '') +
      '<p class="mexplore-ofoot"><a class="btn" href="' + esc(o.url) + '" target="_blank" rel="noopener noreferrer">' + ic('out') + 'الصفحة الرسمية<span class="sr"> (تفتح في صفحة جديدة)</span></a><span class="mexplore-ver">' + H.ic('check') + 'اتراجعت يوم ' + fdate(o.verified) + ' · ' + esc(o.verifier) + '</span></p>' +
      '<p class="small muted">اتأكد من الميعاد والشروط من الصفحة الرسمية قبل ما تقدّم.</p></div></li>';
  }
  var bf = { type: '', me: false };
  function emptyArt() {
    return '<svg class="mexplore-boardart" viewBox="0 0 320 150" aria-hidden="true"><path class="l" d="M36 104 96 52l62 40 58-58 68 50"/>' +
      [[36, 104], [96, 52], [158, 92], [216, 34], [284, 84]].map(function (p) { return '<use class="s" href="#star4" x="' + (p[0] - 11) + '" y="' + (p[1] - 11) + '" width="22" height="22"/>'; }).join('') + '</svg>';
  }
  function rulesBox(pf) {
    return '<details class="mexplore-rules"><summary>«مناسبة لي» بتتحسب إزاي؟</summary><p>3 قواعد بسيطة بتقارن ملفك بنص الفرصة. الفرصة بتظهر لو قاعدة واحدة على الأقل اتحققت، وبنكتب لك على كل كارت أنهي قاعدة.</p><ol>' +
      '<li><strong>المرحلة:</strong> مرحلتك الدراسية (' + esc(pf.level || 'مش محددة في ملفك') + ') أو مرادفها الإنجليزي مكتوبة في «مين يقدّم».</li>' +
      '<li><strong>التخصص:</strong> أي كلمة من تخصصك (' + esc(pf.field || 'مش محدد في ملفك') + ') موجودة في العنوان أو الشروط أو الملاحظة.</li>' +
      '<li><strong>مرحلة البحث:</strong> بتدوّر أو بتكتب الخطة ← منح دراسية وزمالات وتمويل. بتجمع بيانات أو بتحلّل ← تمويل ومؤتمرات. بتكتب أو بتنشر ← مؤتمرات ودعوات أوراق. (مرحلتك: ' + esc(pf.stage || 'مش محددة في ملفك') + ')</li></ol>' +
      '<p class="small muted">دي مطابقة كلمات، مش حكم على أهليتك. الشروط الرسمية هي المرجع. <a href="#profile">عدّل ملفك</a></p></details>';
  }
  function boardView(main) {
    main.innerHTML = shell('board', 'فرص <em>متراجعة</em> بتاريخها', 'منح وزمالات ومؤتمرات ودعوات أوراق. مفيش حاجة بتظهر هنا إلا لو حد فتح صفحتها الرسمية وراجعها في آخر 30 يوم، وميعادها لسه مفتوح.', '<div id="mx-board" aria-live="polite"><p role="status">بنحمّل اللوحة…</p></div><div id="mx-mine"></div>' +
      '<p class="mexplore-ownerlink small"><a href="#explore/manage">لصاحب المنصة: إدارة اللوحة</a></p>');
    drawMine(main);
    loadBoard(function (b) { if ($('#mx-board')) drawBoard(b); }, true);
  }
  function drawBoard(b) {
    var box = $('#mx-board'), t = tday(), pf = H.state().profile || {};
    var live = b.all.filter(function (o) { return shown(o, t); }).sort(function (x, y) { return x.deadline < y.deadline ? -1 : 1; });
    var stale = b.all.filter(function (o) { return o.deadline >= t && !fresh(o, t); }).length;
    if (!b.ok) { box.innerHTML = '<div class="mexplore-err" role="alert"><strong>اللوحة متحمّلتش</strong><p>مقدرناش نقرا ملف الفرص. مش هنعرض حاجة مش متأكدين منها. جرّب تحدّث الصفحة.</p></div>'; return; }
    if (!live.length) {
      box.innerHTML = '<section class="mexplore-boardempty"><div class="mexplore-be-art">' + emptyArt() + '</div><div><h2>اللوحة فاضية دلوقتي، وده مقصود</h2>' +
        '<p>اللوحة دي بتتجمّع بالإيد. لحد النهارده <strong>مفيش ولا فرصة اتراجعت واتضافت</strong>' + (stale ? ' (في <span class="num">' + stale + '</span> ' + (stale === 1 ? 'فرصة مستخبية' : 'فرص مستخبية') + ' لأن مراجعتها عدّى عليها أكتر من 30 يوم)' : '') + '، فمفيش حاجة نعرضها. مش هنملاها بفرص من الذاكرة أو من مواقع تجميع، لأن ميعاد غلط ممكن يضيّع عليك تقديم.</p>' +
        '<h3>الفرص بتتضاف إزاي؟</h3><ol class="mexplore-steps"><li>صاحب المنصة بيفتح الصفحة الرسمية للجهة بنفسه ويتأكد من الميعاد والشروط.</li><li>بيسجّلها بتاريخ المراجعة واسم اللي راجع.</li><li>بتظهر هنا طول ما ميعادها مفتوح ومراجعتها مكمّلتش 30 يوم. بعد كده بتختفي لوحدها لحد ما تتراجع تاني.</li></ol>' +
        '<p>لحد ما ده يحصل، سجّل الفرص اللي بتلاقيها بنفسك في قايمتك تحت.</p></div></section>';
      return;
    }
    var rows = live.map(function (o) { return { o: o, m: match(o, pf) }; });
    var vis = rows.filter(function (r) { return (!bf.type || r.o.type === bf.type) && (!bf.me || r.m.length); });
    if (bf.me) vis.sort(function (x, y) { return y.m.length - x.m.length; });
    var present = OTYPES.filter(function (ty) { return live.some(function (o) { return o.type === ty[0]; }); });
    box.innerHTML = '<div class="mexplore-bfilters" role="group" aria-label="فلترة الفرص"><button class="chipbtn" type="button" data-ty="" aria-pressed="' + (!bf.type) + '">الكل <span class="num">' + live.length + '</span></button>' +
      present.map(function (ty) { return '<button class="chipbtn" type="button" data-ty="' + ty[0] + '" aria-pressed="' + (bf.type === ty[0]) + '">' + ty[1] + '</button>'; }).join('') +
      '<button class="chipbtn mexplore-me" type="button" data-me aria-pressed="' + bf.me + '">' + H.ic('profile') + 'مناسبة لي</button></div>' + rulesBox(pf) +
      (stale ? '<p class="small muted"><span class="num">' + stale + '</span> ' + (stale === 1 ? 'فرصة مستخبية' : 'فرص مستخبية') + ' لأن مراجعتها عدّى عليها أكتر من 30 يوم.</p>' : '') +
      (vis.length ? '<ul class="mexplore-opps">' + vis.map(function (r) { return oppCard(r.o, t, { match: bf.me ? r.m : null }); }).join('') + '</ul>'
        : '<p class="mexplore-none-t">مفيش فرص بالفلتر ده.</p>' + (bf.me ? '<p>مفيش قاعدة من التلاتة اتحققت مع ملفك. ده مش معناه إنك مش مؤهل: شوف «الكل» واقرا الشروط الرسمية.</p>' : ''));
    $('.mexplore-bfilters', box).addEventListener('click', function (e) {
      var c = e.target.closest('button'); if (!c) return;
      if (c.hasAttribute('data-me')) bf.me = !bf.me; else bf.type = c.getAttribute('data-ty');
      drawBoard(b);
    });
  }
  /* the user's own private finds: never mixed with the verified board */
  function drawMine(main) {
    var box = $('#mx-mine'); if (!box) return;
    var d = D(), t = tday();
    box.innerHTML = '<section class="mexplore-mine"><header><h2>فرص سجّلتها بنفسك</h2><p class="mexplore-minetag">أضفتها أنا، مش متراجعة من المنصة</p><p class="small muted">قايمة خاصة على جهازك ده بس. المنصة مراجعتش أي حاجة فيها، ومحدش غيرك شايفها.</p></header>' +
      (d.mine.length ? '<ul class="mexplore-minelist">' + d.mine.map(function (o, i) {
        var late = o.deadline && o.deadline < t;
        return '<li data-i="' + i + '"><div><h3 dir="auto">' + esc(o.title) + '</h3><p class="mexplore-meta">' + esc(label(OTYPES, o.type)) + (o.deadline ? ' <span aria-hidden="true">·</span> ' + (late ? '<span class="mexplore-late">الميعاد فات يوم ' + fdate(o.deadline) + '</span>' : 'آخر ميعاد ' + fdate(o.deadline) + ' (فاضل <span class="num">' + days(t, o.deadline) + '</span> يوم)') : ' <span aria-hidden="true">·</span> من غير ميعاد مسجّل') + '</p>' +
          (o.notes ? '<p class="small" dir="auto">' + esc(o.notes) + '</p>' : '') + (o.url ? '<p><a href="' + esc(o.url) + '" target="_blank" rel="noopener noreferrer">الرابط اللي سجّلته</a></p>' : '') + '</div><button class="btn icon" type="button" data-del aria-label="امسح «' + esc(o.title) + '»">' + H.ic('trash') + '</button></li>';
      }).join('') + '</ul>' : '<p class="muted">لسه مسجّلتش حاجة.</p>') +
      '<details class="mexplore-addmine"><summary>' + H.ic('plus') + 'سجّل فرصة لقيتها</summary><form id="mx-mineform" novalidate><label for="mx-mt">اسم الفرصة</label><input type="text" id="mx-mt" maxlength="200" dir="auto">' +
      '<div class="mexplore-fgrid"><div><label for="mx-mty">النوع</label><select id="mx-mty">' + H.opts(OTYPES, 'scholarship') + '</select></div><div><label for="mx-md">آخر ميعاد (اختياري)</label><input type="date" id="mx-md" class="mexplore-in"></div></div>' +
      '<label for="mx-mu">الرابط (اختياري)</label><input type="text" id="mx-mu" class="mexplore-ltr" dir="ltr" inputmode="url" maxlength="500" placeholder="https://">' +
      '<label for="mx-mn">ملاحظاتك</label><textarea id="mx-mn" maxlength="500" dir="auto" rows="2"></textarea><p class="mexplore-fielderr" id="mx-merr" role="alert" hidden></p><p><button class="btn" type="submit">احفظ في قايمتي</button></p></form></details></section>';
    $('#mx-mineform').addEventListener('submit', function (e) {
      e.preventDefault(); var er = $('#mx-merr'), title = str($('#mx-mt').value), u = $('#mx-mu').value.trim(), dl = $('#mx-md').value;
      var msg = !title ? 'اكتب اسم الفرصة.' : u && !anyUrl(u) ? 'الرابط لازم يبدأ بـ https:// أو http://' : dl && !isIso(dl) ? 'التاريخ مش مظبوط.' : d.mine.length >= 50 ? 'عندك 50 فرصة. امسح القديم الأول.' : '';
      if (msg) { er.textContent = msg; er.hidden = false; return; }
      d.mine.unshift({ id: H.uid(), title: title, type: $('#mx-mty').value, deadline: dl, url: u, notes: str($('#mx-mn').value), added: t }); H.save(); drawMine(main); H.toast('اتحفظ');
    });
    box.querySelector('.mexplore-mine').addEventListener('click', function (e) {
      var b = e.target.closest('[data-del]'); if (!b) return;
      if (confirm('تمسح الفرصة دي من قايمتك؟')) { d.mine.splice(+b.closest('[data-i]').getAttribute('data-i'), 1); H.save(); drawMine(main); }
    });
  }

  /* ---------- owner tool: validate, keep a local working copy, export the file ---------- */
  var editId = '';
  function manageView(main) {
    main.innerHTML = shell('board', 'إدارة <em>لوحة الفرص</em>', 'الأداة دي لصاحب المنصة. اللي بتعمله هنا بيفضل على جهازك لحد ما تنزّل الملف وترفعه مكان hub/data/opportunities.json.', '<div id="mx-manage"><p role="status">بنحمّل الملف المنشور…</p></div>');
    loadBoard(function (b) { if ($('#mx-manage')) drawManage(main, b); }, true);
  }
  function drawManage(main, b) {
    var d = D(), t = tday(), box = $('#mx-manage');
    if (!Array.isArray(d.drafts)) { d.drafts = b.all.map(cleanOpp); H.save(); }
    var W = d.drafts, ed = W.filter(function (o) { return o.id === editId; })[0] || null;
    var soon = W.filter(function (o) { return o.deadline >= t && (!fresh(o, t) || FRESH_DAYS - days(o.verified, t) <= 7); });
    var past = W.filter(function (o) { return o.deadline < t; });
    function v(k) { return ed ? esc(ed[k]) : ''; }
    box.innerHTML = '<p class="notice">قبل أي إضافة: افتح الصفحة الرسمية للجهة بنفسك، واتأكد من الميعاد والشروط. متضيفش حاجة من الذاكرة أو من موقع تجميع. اللوحة بتخبّي لوحدها أي فرصة مراجعتها أقدم من 30 يوم.</p>' +
      '<div class="mexplore-mgrid"><form id="mx-of" class="card mexplore-oform" novalidate><h2>' + (ed ? 'تعديل فرصة' : 'فرصة جديدة') + '</h2>' +
      '<label for="mo-title">اسم الفرصة</label><input type="text" id="mo-title" maxlength="200" dir="auto" value="' + v('title') + '">' +
      '<label for="mo-organiser">الجهة المنظمة</label><input type="text" id="mo-organiser" maxlength="200" dir="auto" value="' + v('organiser') + '">' +
      '<div class="mexplore-fgrid"><div><label for="mo-type">النوع</label><select id="mo-type">' + H.opts(OTYPES, ed ? ed.type : 'scholarship') + '</select></div>' +
      '<div><label for="mo-deadline">آخر ميعاد للتقديم</label><input type="date" id="mo-deadline" class="mexplore-in" value="' + v('deadline') + '"></div></div>' +
      '<label for="mo-url">الرابط الرسمي<span class="hint">لازم https ومن موقع الجهة نفسها</span></label><input type="text" id="mo-url" class="mexplore-ltr" dir="ltr" inputmode="url" maxlength="500" placeholder="https://" value="' + v('url') + '">' +
      '<label for="mo-eligibility">مين يقدّم<span class="hint">المرحلة والتخصص والجنسية زي ما الجهة كاتباها</span></label><textarea id="mo-eligibility" maxlength="500" dir="auto" rows="2">' + v('eligibility') + '</textarea>' +
      '<div class="mexplore-fgrid"><div><label for="mo-funding">التمويل</label><input type="text" id="mo-funding" maxlength="300" dir="auto" value="' + v('funding') + '"></div><div><label for="mo-location">المكان</label><input type="text" id="mo-location" maxlength="120" dir="auto" value="' + v('location') + '"></div></div>' +
      '<label for="mo-notes">ملاحظات</label><textarea id="mo-notes" maxlength="500" dir="auto" rows="2">' + v('notes') + '</textarea>' +
      '<label for="mo-verifier">اسم اللي راجع</label><input type="text" id="mo-verifier" maxlength="80" dir="auto" value="' + esc(ed ? ed.verifier : d.verifier || '') + '">' +
      '<p class="mexplore-vday">تاريخ المراجعة هيتسجّل: ' + fdate(t) + ' (النهارده)</p>' +
      '<label class="mexplore-check"><input type="checkbox" id="mo-ok"><span>فتحت الصفحة الرسمية بنفسي النهارده واتأكدت من الميعاد والشروط</span></label>' +
      '<ul class="mexplore-fielderr" id="mo-err" role="alert" hidden></ul>' +
      '<p class="row"><button class="btn primary" type="submit">' + (ed ? 'احفظ التعديل' : 'أضِف للمسودة') + '</button>' + (ed ? '<button class="btn" type="button" id="mo-cancel">إلغاء</button>' : '') + '</p></form>' +
      '<div class="mexplore-mside"><section class="tile block mint"><p class="block-label">المسودة على جهازك</p><p class="mexplore-sum"><strong class="num" id="mx-dcount">' + W.length + '</strong><span> ' + (W.length === 1 ? 'فرصة' : 'فرصة') + '</span></p><p>الملف المنشور دلوقتي فيه <span class="num">' + b.all.length + '</span>' + (b.bad ? '، و<span class="num">' + b.bad + '</span> عنصر مرفوض لأنه ناقص أو غلط' : '') + '.</p>' +
      '<p class="row"><button class="btn inked" type="button" id="mx-export">' + H.ic('download') + 'نزّل opportunities.json</button></p><p class="small">بعد التنزيل: ارفع الملف مكان <bdi dir="ltr">hub/data/opportunities.json</bdi> في المستودع. الفرص اللي ميعادها فات بتتشال من الملف المُصدَّر.</p>' +
      '<p><button class="btn onblock" type="button" id="mx-reset">ابدأ من الملف المنشور</button></p></section>' +
      '<section class="mexplore-soon"><h2>محتاجة مراجعة قريب</h2>' + (soon.length ? '<ul>' + soon.map(function (o) {
        var age = days(o.verified, t), leftV = FRESH_DAYS - age;
        return '<li><strong dir="auto">' + esc(o.title) + '</strong><span class="small">' + (age < 0 ? 'مستخبية: تاريخ مراجعتها في المستقبل، وده غلط في الملف' : leftV < 0 ? 'مستخبية من اللوحة: مراجعتها من <span class="num">' + age + '</span> يوم' : leftV === 0 ? 'النهارده آخر يوم تظهر فيه لو متراجعتش' : 'هتختفي بعد <span class="num">' + leftV + '</span> يوم لو متراجعتش') + '</span></li>';
      }).join('') + '</ul>' : '<p class="muted">مفيش حاجة هتختفي في السبع أيام الجاية.</p>') + (past.length ? '<p class="small"><span class="num">' + past.length + '</span> ميعادها فات وهتتشال عند التصدير.</p>' : '') + '</section></div></div>' +
      '<section class="mexplore-dlist"><h2>كل عناصر المسودة</h2>' + (W.length ? '<ul>' + W.slice().sort(function (x, y) { return x.deadline < y.deadline ? -1 : 1; }).map(function (o) {
        var st = o.deadline < t ? ['late', 'الميعاد فات'] : o.verified > t ? ['stale', 'مستخبية: تاريخ المراجعة في المستقبل'] : !fresh(o, t) ? ['stale', 'مستخبية: محتاجة مراجعة'] : ['live', 'ظاهرة على اللوحة بعد النشر'];
        return '<li data-id="' + esc(o.id) + '"><div><h3 dir="auto">' + esc(o.title) + '</h3><p class="mexplore-meta">' + esc(label(OTYPES, o.type)) + ' <span aria-hidden="true">·</span> آخر ميعاد ' + fdate(o.deadline) + ' <span aria-hidden="true">·</span> اتراجعت يوم ' + fdate(o.verified) + '</p><p class="mexplore-st ' + st[0] + '">' + st[1] + '</p></div>' +
          '<div class="row"><a class="btn ghost" href="' + esc(o.url) + '" target="_blank" rel="noopener noreferrer">' + ic('out') + 'افتح الرسمي</a><button class="btn" type="button" data-act="bump"' + (o.deadline < t || o.verified === t ? ' disabled' : '') + '>' + H.ic('check') + (o.verified === t ? 'اتراجعت النهارده' : 'راجِع تاني') + '</button><button class="btn ghost" type="button" data-act="edit">عدّل</button><button class="btn icon" type="button" data-act="del" aria-label="امسح «' + esc(o.title) + '»">' + H.ic('trash') + '</button></div></li>';
      }).join('') + '</ul>' : '<p class="muted">المسودة فاضية، زي الملف المنشور.</p>') + '</section>';
    function redraw() { drawManage(main, b); }
    $('#mx-of').addEventListener('submit', function (e) {
      e.preventDefault();
      var o = ed ? cleanOpp(ed) : { id: 'op-' + H.uid(), added: t }, errs = [];
      ['title', 'organiser', 'type', 'deadline', 'url', 'eligibility', 'funding', 'location', 'notes', 'verifier'].forEach(function (k) { o[k] = k === 'type' || k === 'deadline' ? $('#mo-' + k).value : str($('#mo-' + k).value); });
      o.url = $('#mo-url').value.trim();
      if (!o.title) errs.push('اكتب اسم الفرصة.');
      if (!o.organiser) errs.push('اكتب الجهة المنظمة.');
      if (!httpsUrl(o.url)) errs.push('الرابط الرسمي لازم يبدأ بـ https:// ويكون عنوان كامل.');
      if (!isIso(o.deadline)) errs.push('اختار آخر ميعاد للتقديم.'); else if (o.deadline <= t) errs.push('آخر ميعاد لازم يكون في المستقبل.');
      if (!o.verifier) errs.push('اكتب اسم اللي راجع.');
      if (!$('#mo-ok').checked) errs.push('أكّد إنك فتحت الصفحة الرسمية النهارده.');
      var er = $('#mo-err');
      if (errs.length) { er.innerHTML = errs.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join(''); er.hidden = false; return; }
      o.verified = t; d.verifier = o.verifier; o = cleanOpp(o);
      if (ed) W[W.indexOf(ed)] = o; else W.push(o);
      editId = ''; H.save(); redraw(); H.toast(ed ? 'اتعدّلت في المسودة' : 'اتضافت للمسودة');
    });
    var cn = $('#mo-cancel'); if (cn) cn.addEventListener('click', function () { editId = ''; redraw(); });
    $('#mx-export').addEventListener('click', function () {
      var out = W.filter(function (o) { return validOpp(o) && o.deadline >= t; }).map(cleanOpp);
      download('opportunities.json', JSON.stringify(out, null, 2) + '\n', 'application/json');
      H.toast('اتنزّل الملف وفيه ' + out.length + ' فرصة');
    });
    $('#mx-reset').addEventListener('click', function () { if (confirm('تمسح مسودتك وتبدأ من الملف المنشور (' + b.all.length + ' عنصر)؟')) { d.drafts = b.all.map(cleanOpp); editId = ''; H.save(); redraw(); } });
    $('.mexplore-dlist').addEventListener('click', function (e) {
      var bt = e.target.closest('[data-act]'); if (!bt) return;
      var id = bt.closest('[data-id]').getAttribute('data-id'), o = W.filter(function (x) { return x.id === id; })[0], act = bt.getAttribute('data-act'); if (!o) return;
      if (act === 'bump') {
        var who = d.verifier || o.verifier;
        if (confirm('فتحت الصفحة الرسمية لـ «' + o.title + '» دلوقتي، والميعاد (' + o.deadline + ') والشروط لسه زي ما هي؟\n\nلو آه، هنسجّل المراجعة بتاريخ النهارده باسم ' + who + '.')) { o.verified = t; o.verifier = who; H.save(); redraw(); H.toast('اتسجّلت المراجعة'); }
      } else if (act === 'edit') { editId = id; redraw(); $('#mo-title').focus(); }
      else if (act === 'del') { if (confirm('تمسح «' + o.title + '» من المسودة؟')) { W.splice(W.indexOf(o), 1); if (editId === id) editId = ''; H.save(); redraw(); } }
    });
  }

  /* ---------- weekly radar: real differences only ---------- */
  var radarBusy = false, radarDiff = null;
  function boardDiff(b, t) {
    var d = D(), now = {}, prev = d.seen && d.seen.items, out = { first: !prev, from: d.seen && d.seen.at, add: [], gone: 0, re: [] };
    b.all.filter(function (o) { return shown(o, t); }).forEach(function (o) { now[o.id] = o.verified; if (prev) { if (!prev[o.id]) out.add.push(o); else if (prev[o.id] !== o.verified) out.re.push(o); } });
    if (prev) Object.keys(prev).forEach(function (id) { if (!now[id]) out.gone++; });
    if (b.ok) { d.seen = { at: t, items: now }; H.save(); }
    return out;
  }
  function radarView(main) {
    main.innerHTML = shell('radar', 'رادار <em>الأسبوع</em>', 'إيه اللي اتغيّر من آخر مرة في أبحاثك المحفوظة وفي لوحة الفرص. بنقارن لقطة قديمة بلقطة جديدة، ولو مفيش فرق بنقول مفيش.', '<div id="mx-radar"></div><div id="mx-rboard" aria-live="polite"><p role="status">بنقارن اللوحة…</p></div>');
    drawRadar(main);
    loadBoard(function (b) {
      var box = $('#mx-rboard'); if (!box) return;
      var t = tday(); if (!radarDiff || radarDiff.day !== t) { radarDiff = boardDiff(b, t); radarDiff.day = t; radarDiff.ok = b.ok; }
      var x = radarDiff, h = '<section class="mexplore-rb"><h2>لوحة الفرص</h2>';
      if (!x.ok) h += '<p>مقدرناش نقرا ملف الفرص، فمفيش مقارنة.</p>';
      else if (x.first) h += '<p>دي أول زيارة للرادار، فمفيش لقطة قديمة نقارن بيها. من الزيارة الجاية هتشوف الفرق.</p>';
      else if (!x.add.length && !x.re.length && !x.gone) h += '<p>مفيش أي تغيير في اللوحة من آخر زيارة يوم ' + fdate(x.from) + '.</p>';
      else h += '<p>من آخر زيارة يوم ' + fdate(x.from) + ':</p><ul class="mexplore-rlist">' +
        x.add.map(function (o) { return '<li><strong>اتضافت:</strong> <a href="#explore/board" dir="auto">' + esc(o.title) + '</a> (آخر ميعاد ' + fdate(o.deadline) + ')</li>'; }).join('') +
        x.re.map(function (o) { return '<li><strong>اتراجعت تاني:</strong> <span dir="auto">' + esc(o.title) + '</span> يوم ' + fdate(o.verified) + '</li>'; }).join('') +
        (x.gone ? '<li><span class="num">' + x.gone + '</span> ' + (x.gone === 1 ? 'فرصة اختفت' : 'فرص اختفت') + ' (ميعادها فات أو مراجعتها قدمت).</li>' : '') + '</ul>';
      box.innerHTML = h + '<p><a class="btn" href="#explore/board">افتح اللوحة</a></p></section>';
    }, true);
  }
  function drawRadar(main) {
    var box = $('#mx-radar'); if (!box) return;
    var d = D(), S = d.saved;
    if (!S.length) { box.innerHTML = '<div class="mexplore-empty"><p class="mexplore-none-t">مفيش أبحاث محفوظة للرادار</p><p>اعمل بحث في الأدبيات، ومن فوق النتايج دوس «احفظ البحث للرادار». بعدها تيجي هنا كل أسبوع وتشوف إيه الجديد.</p><p><a class="btn primary" href="#explore">ابدأ بحث</a></p></div>'; return; }
    box.innerHTML = '<div class="mexplore-listbar"><p><strong class="num mexplore-big">' + S.length + '</strong> ' + (S.length === 1 ? 'بحث محفوظ' : 'أبحاث محفوظة') + '</p><button class="btn primary" type="button" id="mx-rrun"' + (radarBusy ? ' disabled' : '') + '>' + ic('search') + (radarBusy ? 'بنراجع الفهرس…' : 'شغّل الرادار دلوقتي') + '</button></div>' +
      '<p class="small muted">التشغيل بيبعت طلب واحد للفهرس عن كل بحث محفوظ، فبنشغّله لما تطلب بس عشان منستهلكش حدّك اليومي.</p>' +
      '<ul class="mexplore-rsaved">' + S.map(function (s, i) {
        var l = s.last, h = '<li data-i="' + i + '"><div class="mexplore-rcount"><strong class="num">' + nfmt(s.count) + '</strong><span>في الفهرس يوم ' + fdate(s.at) + '</span></div><div class="mexplore-rbody"><h2><bdi dir="auto">' + esc(s.q) + '</bdi></h2>' + (s.fs ? '<p class="small muted"><bdi dir="ltr">' + esc(s.fs) + '</bdi></p>' : '');
        if (s.err) h += '<p class="mexplore-late">آخر محاولة فشلت: ' + esc(s.err) + '</p>';
        if (!l) h += '<p class="muted">لسه متشغّلش عليه الرادار من يوم ما حفظته.</p>';
        else {
          h += '<p class="mexplore-delta">' + (l.delta > 0 ? '<strong class="num up">+' + nfmt(l.delta) + '</strong> زيادة في العدد' : l.delta < 0 ? '<strong class="num">' + nfmt(l.delta) + '</strong> العدد قلّ (الفهرس بيتنضّف وبيدمج المكرر)' : 'العدد زي ما هو') + ' بين ' + fdate(l.from) + ' و' + fdate(l.to) + '</p>';
          if (l.fresh && l.fresh.length) h += '<p class="small">عناوين مكانتش في أحدث 25 في اللقطة اللي فاتت:</p><ul class="mexplore-rlist">' + l.fresh.map(function (p) { return '<li><span dir="auto">' + esc(p.title || '[بدون عنوان في الفهرس]') + '</span>' + (p.year ? ' <span class="num muted">(' + p.year + ')</span>' : '') + ' ' + (p.doi ? '<a href="' + esc(p.doi) + '" target="_blank" rel="noopener noreferrer"><bdi dir="ltr">' + esc(p.doi.replace(/^https:\/\/doi\.org\//i, '')) + '</bdi></a>' : p.id ? '<a href="' + esc(p.id) + '" target="_blank" rel="noopener noreferrer">OpenAlex</a>' : '') + '</li>'; }).join('') + '</ul>';
          else h += '<p class="small muted">مفيش عناوين جديدة في أحدث 25 منشور.</p>';
        }
        return h + '</div><button class="btn icon" type="button" data-del aria-label="امسح البحث المحفوظ «' + esc(s.q) + '»">' + H.ic('trash') + '</button></li>';
      }).join('') + '</ul><p class="small muted">«عنوان جديد» معناه إنه ظهر في أحدث 25 منشور بترتيب تاريخ النشر ومكانش موجود في اللقطة اللي قبلها. بحث قديم اتفهرس متأخر ممكن ميظهرش هنا.</p>';
    $('#mx-rrun').addEventListener('click', function () {
      if (radarBusy) return; radarBusy = true; drawRadar(main);
      var i = 0, t = tday();
      (function next() {
        if (i >= S.length) { radarBusy = false; H.save(); if ($('#mx-radar')) drawRadar(main); H.toast('الرادار خلّص'); return; }
        var s = S[i++];
        snapshot(s.q, s.fs, function (err, snap) {
          if (err) s.err = err.msg;
          else {
            delete s.err;
            var old = {}; (s.ids || []).forEach(function (id) { old[id] = 1; });
            s.last = { from: s.at, to: t, delta: snap.count - s.count, fresh: snap.items.filter(function (p) { return !old[p.id]; }).slice(0, 10).map(function (p) { return { id: p.id, doi: p.doi, title: p.title.slice(0, 300), year: p.year }; }) };
            s.count = snap.count; s.ids = snap.items.map(function (p) { return p.id; }); s.at = t;
          }
          next();
        });
      })();
    });
    $('.mexplore-rsaved').addEventListener('click', function (e) {
      var b = e.target.closest('[data-del]'); if (!b) return;
      if (confirm('تمسح البحث المحفوظ ده؟')) { S.splice(+b.closest('[data-i]').getAttribute('data-i'), 1); H.save(); drawRadar(main); }
    });
  }

  H.register('explore', function (main, a, b) {
    if (a === 'list') listView(main);
    else if (a === 'idea') ideaView(main, b);
    else if (a === 'board') boardView(main);
    else if (a === 'manage') manageView(main);
    else if (a === 'radar') radarView(main);
    else searchView(main);
  });
  /* exposed for the automated test only: pure formatters */
  window.HubExplore = { apa: apa, apaName: apaName, ris: ris, bibtex: bibtex, abstractOf: abstractOf, norm: norm, filterStr: filterStr, shown: shown, days: days, match: match, validOpp: validOpp, combine: combine };
})();
