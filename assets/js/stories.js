/* Stories of change — content from "Consolidated Assessment of 24 Stories, 2026",
   linked to framework indicators whose live values come from Supabase
   (fallback: data/azf-data.js). */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var SC = window.AZF_STORIES;
  var STORY = SC.STORY, SO = SC.SO, ICON = SC.ICON, PW = SC.PW, THEMES = SC.THEMES, WORDS = SC.WORDS, NEW_THEMES = SC.NEW_THEMES, ROLES = SC.ROLES;
  var IND = {}, sel = 1, word = null;

  // ---------- helpers ----------
  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k]; if (v == null || v === false) return;
      if (k === 'text') e.textContent = v; else if (k === 'class') e.className = v; else if (k === 'html') e.innerHTML = v;
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v); else e.setAttribute(k, v);
    });
    (kids || []).forEach(function (c) { if (c != null) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  function icon(name) { return el('span', { class: 'pw-ic', 'aria-hidden': 'true', html: '<svg viewBox="0 0 24 24">' + ICON[name] + '</svg>' }); }
  function fmt(v, unit) { if (v == null || isNaN(+v)) return '—'; return unit === 'pct' ? Math.round(+v) + '%' : new Intl.NumberFormat('en-GB').format(+v); }
  function say(t) { var a = $('announce'); a.textContent = ''; setTimeout(function () { a.textContent = t; }, 30); }

  // ---------- data ----------
  function useData(D) {
    D.indicators.forEach(function (d) { IND[d.key] = d; });
    var keys = {}; PW.forEach(function (p) { p.ind.forEach(function (k) { if (IND[k]) keys[k] = 1; }); });
    $('st-linked').textContent = String(Object.keys(keys).length);
    var i01 = IND['01'];
    if (i01 && (i01.z2026 != null)) $('ind01').textContent = 'reported: ' + fmt(i01.z2026, i01.unit);
    $('built').textContent = D.live ? 'Indicator values load live from the results database.' : 'Indicator values from the bundled data snapshot.';
    drawDetail(false);
  }

  // ---------- pathways ----------
  function drawCards() {
    var g = $('pw-grid'); g.textContent = '';
    PW.forEach(function (p) {
      var b = el('button', { type: 'button', class: 'pw-card pw-' + p.id, 'aria-pressed': String(p.id === sel),
        'aria-label': 'Pathway ' + p.id + ': ' + p.name + '. Leads to ' + p.chain[2] + '.',
        onclick: function () { select(p.id, true); } }, [
        el('span', { class: 'pw-top' }, [icon(p.icon), el('span', {}, [el('span', { class: 'pw-num', text: 'PATHWAY ' + p.id }), el('br'), el('span', { class: 'pw-name', text: p.name })])]),
        el('span', { class: 'pw-end' }, ['→ ', el('b', { text: p.chain[2] })])
      ]);
      if (word) { var w = WORDS.find(function (x) { return x[0] === word; }); b.classList.add(w[3].indexOf(p.id) >= 0 ? 'hit' : 'dim'); }
      g.appendChild(b);
    });
  }
  function select(id, focusDetail) {
    sel = id; drawCards(); drawDetail(focusDetail);
    try { history.replaceState(null, '', '#pathway-' + id); } catch (e) { /* file:// */ }
  }
  function drawDetail(focus) {
    var p = PW.find(function (x) { return x.id === sel; }), box = $('pw-detail');
    box.className = 'pw-detail pw-' + p.id; box.textContent = '';
    box.setAttribute('aria-label', 'Pathway ' + p.id + ' details');
    var left = el('div', {}, [
      el('p', { class: 'pd-sub', text: 'What goes in' }),
      el('ul', { class: 'inputs' }, p.inputs.map(function (x) { return el('li', { text: x }); })),
      el('p', { class: 'pd-sub', text: 'How change unfolds' }),
      el('ol', { class: 'chain' }, p.chain.map(function (x) { return el('li', { text: x }); })),
      el('p', { class: 'pd-desc', text: p.desc })
    ]);
    var right = el('div', {}, [el('p', { class: 'pd-sub', text: 'Measured in the framework — 2026 zone results' })]);
    if (p.ind.length) {
      right.appendChild(el('ul', { class: 'ind-cards' }, p.ind.map(function (k) {
        var d = IND[k];
        if (!d) return el('li', {}, [el('span', { class: 'lab', text: k + ' (loading…)' })]);
        var so = SO[d.so] || SO.P;
        return el('li', {}, [
          el('span', { class: 'lab' }, [el('a', { href: 'index.html#ind=' + encodeURIComponent(k), class: 'ref', text: k }), ' ', d.indicator,
            el('span', { class: 'so-tag', style: 'background:' + so.l, text: so.name.split(' · ')[0] })]),
          el('span', { class: 'v' }, [fmt(d.z2026, d.unit), el('small', { text: d.z2025 != null ? '2025: ' + fmt(d.z2025, d.unit) : '2026' })])
        ]);
      })));
    } else {
      right.appendChild(el('p', { class: 'ind-gap' }, [el('strong', { text: 'Measurement gap. ' }), p.gap]));
    }
    right.appendChild(el('p', { class: 'pd-sub', style: 'margin-top:14px', text: 'Stories cited' }));
    right.appendChild(el('ul', { class: 'cited' }, p.stories.map(function (s) { return el('li', { text: STORY[s] }); })));
    box.appendChild(el('div', { class: 'pd-head' }, [icon(p.icon), el('div', {}, [
      el('h3', { text: p.id + '. ' + p.name }),
      el('p', { text: p.inputs.join(' · ') + '  →  ' + p.chain[2] })
    ])]));
    box.appendChild(el('div', { class: 'pd-grid' }, [left, right]));
    box.appendChild(el('div', { class: 'pd-nav' }, [
      el('button', { type: 'button', text: '← Previous pathway', onclick: function () { select(sel === 1 ? 8 : sel - 1, true); } }),
      el('button', { type: 'button', text: 'Next pathway →', onclick: function () { select(sel === 8 ? 1 : sel + 1, true); } })
    ]));
    if (focus) { box.focus({ preventScroll: true }); if (box.getBoundingClientRect().top > window.innerHeight * .6) box.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); say('Showing pathway ' + p.id + ', ' + p.name); }
  }

  // ---------- outcomes cloud ----------
  function drawCloud() {
    var c = $('cloud'); c.textContent = '';
    // emphasis order mixed so big words sit in the middle
    var order = WORDS.slice().sort(function (a, b) { return a[0].localeCompare(b[0]); });
    var big = order.filter(function (w) { return w[1] >= 4; }), rest = order.filter(function (w) { return w[1] < 4; });
    var half = Math.ceil(rest.length / 2);
    rest.slice(0, half).concat(big, rest.slice(half)).forEach(function (w) {
      c.appendChild(el('button', { type: 'button', class: 'word w' + w[1], style: '--wc:' + w[2], 'aria-pressed': String(word === w[0]),
        onclick: function () { pickWord(word === w[0] ? null : w[0]); } }, [w[0]]));
    });
  }
  function pickWord(w) {
    word = w; drawCloud(); drawCards();
    var r = $('cloud-result'); r.textContent = '';
    if (!w) { say('Outcome highlight cleared'); return; }
    var item = WORDS.find(function (x) { return x[0] === w; });
    var ps = item[3].map(function (id) { return PW.find(function (p) { return p.id === id; }); });
    r.append(el('strong', { text: w }), ' comes through ' + (ps.length === 8 ? 'all eight pathways' : ps.length === 1 ? 'pathway ' : 'pathways ') + (ps.length === 8 ? '' : ''));
    if (ps.length < 8) ps.forEach(function (p, i) {
      r.append(el('button', { type: 'button', text: p.id + ' ' + p.name, onclick: function () { select(p.id, true); $('pathways').scrollIntoView(); } }));
      if (i < ps.length - 1) r.append(i === ps.length - 2 ? ' and ' : ', ');
    });
    r.append('. ', el('button', { type: 'button', text: 'Clear', onclick: function () { pickWord(null); } }));
    say(w + ': ' + ps.length + ' pathway' + (ps.length === 1 ? '' : 's') + ' highlighted');
  }

  // ---------- themes, roles ----------
  function drawThemes() {
    var box = $('theme-list');
    THEMES.forEach(function (t, i) {
      var so = SO[t.so];
      box.appendChild(el('details', { class: 'theme', style: '--tc:' + so.l.replace('#B1CBDA', '#02538A'), open: i === 0 ? '' : null }, [
        el('summary', {}, [el('span', { text: t.t }), el('span', { class: 'so-tag', style: 'background:' + so.l, text: so.name })]),
        el('div', { class: 'theme-body' }, [
          el('p', { style: 'margin:0', text: t.body }),
          el('div', { class: 'rel' }, ['Pathways: '].concat(t.pw.map(function (id) {
            var p = PW.find(function (x) { return x.id === id; });
            return el('button', { type: 'button', class: 'pw-' + id, text: id + ' · ' + p.name, onclick: function () { select(id, true); $('pathways').scrollIntoView(); } });
          }))),
          el('p', { class: 'hint-sm', style: 'margin:8px 0 0;font-size:.8rem;color:var(--muted)', text: 'Stories cited: ' + t.stories.map(function (s) { return STORY[s]; }).join('; ') })
        ])
      ]));
    });
    var nt = $('new-themes'); NEW_THEMES.forEach(function (x) { nt.appendChild(el('li', { text: x })); });
    var rl = $('roles-list'); ROLES.forEach(function (r) { rl.appendChild(el('li', {}, [el('span', { 'aria-hidden': 'true', text: r[0] }), r[1]])); });
  }

  // ---------- lightbox ----------
  var lastFocus = null;
  document.querySelectorAll('.zoom').forEach(function (b) {
    b.addEventListener('click', function () {
      lastFocus = b; $('lb-img').src = b.dataset.src; $('lb-img').alt = b.dataset.alt;
      $('lightbox').hidden = false; document.body.style.overflow = 'hidden'; $('lb-close').focus();
    });
  });
  function closeLb() { $('lightbox').hidden = true; document.body.style.overflow = ''; if (lastFocus) lastFocus.focus(); }
  $('lb-close').addEventListener('click', closeLb);
  $('lightbox').addEventListener('click', function (e) { if (e.target === this) closeLb(); });
  document.addEventListener('keydown', function (e) {
    if ($('lightbox').hidden) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'Tab') { e.preventDefault(); $('lb-close').focus(); }
  });

  // ---------- start ----------
  var m = /pathway-(\d)/.exec(location.hash); if (m && +m[1] >= 1 && +m[1] <= 8) sel = +m[1];
  drawCards(); drawDetail(false); drawCloud(); drawThemes();
  window.AZF_loadData().then(useData, function () { $('built').textContent = 'Indicator values could not be loaded.'; });
})();
