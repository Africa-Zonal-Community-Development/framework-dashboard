/* Africa Zonal Community Development Framework — 2026 results dashboard.
   Data: window.AZF_DATA from data/azf-data.js (built by scripts/build_data.py). */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };

  /* Load live data from Supabase (edited in the admin console); fall back to the
     bundled snapshot in data/azf-data.js if the database can't be reached. */
  function loadLive() {
    var C = window.AZF_CONFIG;
    if (!C || !window.fetch) return Promise.reject(new Error('no config'));
    var h = { apikey: C.supabaseKey, Authorization: 'Bearer ' + C.supabaseKey };
    var get = function (path) {
      return fetch(C.supabaseUrl + '/rest/v1/' + path, { headers: h }).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status); return r.json();
      });
    };
    return Promise.all([
      get('territories?select=tty,territory,countries&order=sort.asc,tty.asc'),
      get('indicators?select=*&order=sort.asc,key.asc'),
      get('results?select=key,tty,value,note&limit=20000'),
      get('indicators?select=updated_at&order=updated_at.desc&limit=1'),
      get('results?select=updated_at&order=updated_at.desc&limit=1')
    ]).then(function (a) {
      var num = function (v) { return v === null || v === undefined || v === '' ? null : +v; };
      var stamps = [a[3][0], a[4][0]].filter(Boolean).map(function (x) { return x.updated_at; }).sort();
      return {
        live: true,
        source: 'live database',
        built: stamps.length ? stamps[stamps.length - 1].slice(0, 10) : '',
        territories: a[0],
        indicators: a[1].map(function (d) {
          return { key: d.key, so: d.so, er: d.er || '', er_name: d.er_name || '', indicator: d.indicator, full: d.full_text || d.indicator,
            unit: d.unit, z2025: num(d.z2025), z2026: num(d.z2026), z2026_note: d.z2026_note, sdg: d.sdg, global_manual: d.global_manual };
        }),
        results: a[2].map(function (r) { return { key: r.key, tty: r.tty, value: num(r.value), note: r.note }; })
      };
    });
  }
  function boot() {
    var timer = new Promise(function (_, rej) { setTimeout(function () { rej(new Error('timeout')); }, 6000); });
    Promise.race([loadLive(), timer]).then(start, function () {
      if (window.AZF_DATA) start(window.AZF_DATA);
      else $('lede').textContent = 'The dashboard data could not be loaded. Please refresh the page.';
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

  function start(D) {

  var COL = {
    P: { c: '#02538A', l: '#B1CBDA', x: '#D8E9F7', name: 'Goal & Purpose' },
    '1': { c: '#B98900', l: '#FFE699', x: '#FFF6D7', name: 'Outcome 1 · Quality education & employment skills' },
    '2': { c: '#D45A12', l: '#F8CCAF', x: '#FDEBDF', name: 'Outcome 2 · Reduced disease burden' },
    '3': { c: '#A63D6E', l: '#E5B5CB', x: '#F6E2EB', name: 'Outcome 3 · Economic inclusion' },
    '4': { c: '#2A8A52', l: '#C4DFB4', x: '#EAF2E3', name: 'Outcome 4 · Safe environments for all' }
  };
  var KPIS = [
    { key: '05', so: 'P', tag: 'Purpose', label: 'Individuals reached through all TSA projects & programmes' },
    { key: '05a', so: 'P', tag: 'Purpose', label: 'Unique individuals reached through projects', note: 'New measure in 2026' },
    { key: '1.1.2', so: '1', tag: 'Outcome 1', label: 'Schools operated by TSA' },
    { key: '2.1.1', so: '2', tag: 'Outcome 2', label: 'People reached by health prevention measures' },
    { key: '3.2.2', so: '3', tag: 'Outcome 3', label: 'People in savings & lending groups / entrepreneurship programmes' },
    { key: '4.1.5', so: '4', tag: 'Outcome 4', label: "People sensitized on gender issues & women's rights" }
  ];

  var IND = D.indicators, RES = D.results, TTY = D.territories;
  var byKey = {}; IND.forEach(function (d) { byKey[d.key] = d; });
  var ttyBy = {}; TTY.forEach(function (t) { ttyBy[t.tty] = t; });
  var val = {}; RES.forEach(function (r) { val[r.key + '|' + r.tty] = r; });
  var S = { so: 'all', tty: '', key: '05', only: false };

  // ---------- helpers ----------
  var nf = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 1 });
  function fmt(v, unit) {
    if (v === null || v === undefined || isNaN(+v)) return '—';
    return unit === 'pct' ? Math.round(+v) + '%' : nf.format(+v);
  }
  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'text') e.textContent = attrs[k];
      else if (k === 'class') e.className = attrs[k];
      else if (k === 'style') Object.keys(attrs.style).forEach(function (p) { e.style.setProperty(p, attrs.style[p]); });
      else e.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c != null) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  function change(d) {
    if (d.unit === 'text' || d.z2025 === null || d.z2026 === null) return null;
    if (d.unit === 'pct') return { v: Math.round(d.z2026 - d.z2025), u: ' pts' };
    if (d.z2025 > 0) return { v: Math.round((d.z2026 / d.z2025 - 1) * 100), u: '%' };
    return null;
  }
  function chgEl(d) {
    var c = change(d);
    if (!c) return el('span', { class: 'muted', text: '—' });
    var word = c.v >= 0 ? 'up' : 'down';
    return el('span', { class: word }, [(c.v > 0 ? '+' : c.v < 0 ? '−' : '') + Math.abs(c.v) + c.u]);
  }
  function nReported(key) { return RES.filter(function (r) { return r.key === key && r.value !== null; }).length; }
  function visible() {
    return IND.filter(function (d) {
      if (S.so !== 'all' && d.so !== S.so) return false;
      if (S.only && (d.z2026 === null || d.unit === 'text')) return false;
      return true;
    });
  }
  function mix(a, b, t) {
    var pa = [1, 3, 5].map(function (i) { return parseInt(a.substr(i, 2), 16); });
    var pb = [1, 3, 5].map(function (i) { return parseInt(b.substr(i, 2), 16); });
    return 'rgb(' + pa.map(function (x, i) { return Math.round(x + (pb[i] - x) * t); }).join(',') + ')';
  }
  function announce(msg) { var a = $('announce'); a.textContent = ''; setTimeout(function () { a.textContent = msg; }, 30); }

  // ---------- static parts ----------
  function drawHeader() {
    var reached = byKey['05'];
    var nT = new Set(RES.filter(function (r) { return r.value !== null; }).map(function (r) { return r.tty; })).size;
    var lede = $('lede'); lede.textContent = '';
    lede.append('In 2026, ', el('strong', { text: String(nT) }), ' of ' + TTY.length + ' reporting units submitted figures. TSA projects and programmes reached ',
      el('strong', { text: fmt(reached.z2026) }), ' people, against ', el('strong', { text: fmt(reached.z2025) }), ' in 2025.');
    var ul = $('kpis');
    KPIS.forEach(function (k) {
      var d = byKey[k.key]; if (!d) return;
      var col = COL[k.so];
      var chg = k.note ? el('span', { class: 'chg', text: k.note }) : el('span', { class: 'chg' }, [chgEl(d), ' vs 2025 (' + fmt(d.z2025, d.unit) + ')']);
      ul.appendChild(el('li', { class: 'kpi', style: { '--k': col.c, '--kl': col.l } }, [
        el('span', { class: 'tag', text: k.tag }),
        el('span', { class: 'val', text: fmt(d.z2026, d.unit) }),
        el('span', { class: 'lab', text: k.label }),
        chg
      ]));
    });
    var sel = $('tty-select');
    TTY.forEach(function (t) { sel.appendChild(el('option', { value: t.tty, text: t.territory })); });
    var story = byKey['02'];
    $('story').textContent = story && story.z2026_note ? story.z2026_note : 'No synthesis submitted.';
    $('built').textContent = D.live ? 'Figures load live from the admin database' + (D.built ? ', last edited ' + D.built : '') + '.' : 'Showing the bundled data snapshot (' + D.source + ', ' + D.built + ').';
  }

  // ---------- indicator table ----------
  function drawTable() {
    var tb = $('ind-body'); tb.textContent = '';
    var lastGrp = null;
    var tty = S.tty ? ttyBy[S.tty] : null;
    $('th-tty').textContent = tty ? tty.territory : 'Selected territory';
    visible().forEach(function (d) {
      var col = COL[d.so], grp = d.so + '|' + d.er;
      if (grp !== lastGrp) {
        lastGrp = grp;
        tb.appendChild(el('tr', { class: 'grp', style: { '--gx': col.x } }, [
          el('td', { colspan: '7', text: d.er ? 'Expected result ' + d.er + ' · ' + (d.er_name || '') : col.name })
        ]));
      }
      var isSel = d.key === S.key;
      var btn = el('button', { type: 'button', class: 'pick', 'aria-pressed': String(isSel), title: d.full, text: d.indicator });
      btn.addEventListener('click', function (e) { e.stopPropagation(); selectKey(d.key, true); });
      var v25, v26;
      if (d.unit === 'text') { v25 = el('span', { class: 'muted', text: '—' }); v26 = el('span', { class: 'muted', text: d.z2026_note ? 'Qualitative' : 'No data' }); }
      else { v25 = document.createTextNode(fmt(d.z2025, d.unit)); v26 = el('span', { class: 'v26', text: fmt(d.z2026, d.unit) }); }
      var ttyCell;
      if (tty) {
        var r = val[d.key + '|' + S.tty];
        ttyCell = el('td', { class: 'n', 'data-label': tty.territory }, [r && r.value !== null ? el('strong', { text: fmt(r.value, d.unit) }) : el('span', { class: 'muted', text: r && r.note ? r.note : '—' })]);
      } else {
        ttyCell = el('td', { class: 'n blank', 'data-label': 'Selected territory' });
      }
      var tr = el('tr', { class: 'row' + (isSel ? ' sel' : ''), style: { '--rc': col.c, '--rx': col.x } }, [
        el('td', { class: 'ref', text: d.key }),
        el('td', { class: 'label' }, [btn]),
        el('td', { class: 'n', 'data-label': '2025' }, [v25]),
        el('td', { class: 'n', 'data-label': '2026' }, [v26]),
        el('td', { class: 'n', 'data-label': 'Change' }, [chgEl(d)]),
        el('td', { class: 'n', 'data-label': 'Territories reporting' }, [el('span', { class: 'pill', text: String(nReported(d.key)) })]),
        ttyCell
      ]);
      tr.addEventListener('click', function () { selectKey(d.key, true); });
      tb.appendChild(tr);
    });
    if (!tb.children.length) tb.appendChild(el('tr', {}, [el('td', { colspan: '7', class: 'muted', text: 'No indicators match these filters.' })]));
  }

  // ---------- bar list (accessible HTML chart) ----------
  function barList(ol, rows, opt) {
    ol.textContent = '';
    if (!rows.length) { ol.appendChild(el('li', { class: 'empty', text: opt.empty })); return; }
    var max = opt.max || Math.max.apply(null, rows.map(function (r) { return r.v; })) || 1;
    rows.forEach(function (r) {
      var pct = Math.max(0, Math.min(100, r.v / max * 100));
      var pressed = r.id === S.tty;
      var b = el('button', { type: 'button', class: 'bar-btn', 'aria-pressed': String(pressed),
        'aria-label': r.label + ': ' + r.text + (r.note ? ' (' + r.note + ')' : ''), title: r.note || '' }, [
        el('span', { class: 'bl', 'aria-hidden': 'true', text: r.label }),
        el('span', { class: 'bt', 'aria-hidden': 'true' }, [
          el('span', { class: 'bf', style: { width: 'calc((100% - 78px) * ' + (pct / 100).toFixed(4) + ')', '--fill': opt.fill, '--stroke': opt.stroke } }),
          el('span', { class: 'bv', text: r.text })
        ])
      ]);
      b.addEventListener('click', function () { selectTty(S.tty === r.id && opt.toggle ? '' : r.id, true); });
      ol.appendChild(el('li', {}, [b]));
    });
  }

  function drawSelected() {
    var d = byKey[S.key]; if (!d) return;
    var col = COL[d.so];
    $('sel-title').textContent = d.key + ' — ' + d.full;
    var meta = [col.name]; if (d.er) meta.push('Expected result ' + d.er + (d.er_name ? ' · ' + d.er_name : '')); if (d.sdg) meta.push(d.sdg);
    $('sel-meta').textContent = meta.join('  ·  ');
    $('sel-z25').textContent = d.unit === 'text' ? '—' : fmt(d.z2025, d.unit);
    $('sel-z26').textContent = d.unit === 'text' ? (d.z2026_note ? 'Qualitative' : '—') : fmt(d.z2026, d.unit);
    var rows = RES.filter(function (r) { return r.key === d.key && r.value !== null; })
      .sort(function (a, b) { return b.value - a.value; })
      .map(function (r) { return { id: r.tty, label: ttyBy[r.tty].territory, v: r.value, text: fmt(r.value, d.unit), note: r.note }; });
    barList($('bars'), rows, { fill: col.l, stroke: col.c, max: d.unit === 'pct' ? 100 : null,
      empty: d.unit === 'text' ? 'Qualitative indicator — see the stories section below.' : 'No territory submitted a figure for this indicator in 2026.' });
    var notes = $('bar-notes'); notes.textContent = '';
    if (d.z2026_note && d.unit !== 'text') notes.appendChild(el('li', {}, [el('b', { text: 'Zone: ' }), d.z2026_note]));
    RES.filter(function (r) { return r.key === d.key && r.note; }).forEach(function (r) {
      notes.appendChild(el('li', {}, [el('b', { text: ttyBy[r.tty].territory + ': ' }), r.note]));
    });
    if (d.unit === 'pct') notes.appendChild(el('li', {}, [el('b', { text: 'Scale: ' }), 'bars run from 0% to 100%.']));
  }

  // ---------- heat map (table with roving focus) ----------
  function drawHeat() {
    var t = $('heat'); t.textContent = '';
    var inds = visible().filter(function (d) { return d.unit !== 'text'; });
    var head = el('tr', {}, [el('th', { scope: 'col' }, [el('span', { class: 'sr-only', text: 'Indicator' })])]);
    TTY.forEach(function (tt) {
      var b = el('button', { type: 'button', 'aria-pressed': String(tt.tty === S.tty), 'aria-label': 'Select ' + tt.territory, title: tt.territory, text: tt.tty });
      b.addEventListener('click', function () { selectTty(S.tty === tt.tty ? '' : tt.tty, true); });
      head.appendChild(el('th', { scope: 'col' }, [el('abbr', { title: tt.territory }, [b])]));
    });
    t.appendChild(el('thead', {}, [head]));
    var tb = el('tbody');
    var first = true;
    inds.forEach(function (d) {
      var col = COL[d.so];
      var lb = el('button', { type: 'button', 'aria-pressed': String(d.key === S.key), title: d.full, text: d.key + '  ' + d.indicator });
      lb.addEventListener('click', function () { selectKey(d.key, true); });
      var tr = el('tr', {}, [el('th', { scope: 'row' }, [lb])]);
      var vals = TTY.map(function (tt) { var r = val[d.key + '|' + tt.tty]; return r && r.value !== null ? r.value : null; });
      var mx = d.unit === 'pct' ? 100 : Math.max.apply(null, vals.map(function (v) { return v || 0; })) || 1;
      TTY.forEach(function (tt, i) {
        var v = vals[i], r = val[d.key + '|' + tt.tty];
        var isSel = d.key === S.key && tt.tty === S.tty;
        var label = tt.territory + ', ' + d.key + ' ' + d.indicator + ': ' + (v !== null ? fmt(v, d.unit) : (r && r.note ? r.note : 'not reported'));
        var c = el('button', { type: 'button', class: 'cell' + (isSel ? ' sel' : ''), 'aria-label': label, title: label, tabindex: first ? '0' : '-1', 'data-k': d.key, 'data-t': tt.tty });
        first = false;
        if (v !== null) c.style.background = mix(col.x, col.c, 0.15 + 0.85 * Math.sqrt(Math.max(0, v) / mx));
        c.addEventListener('click', function () { S.key = d.key; S.tty = tt.tty; $('tty-select').value = tt.tty; redraw(); announce(label); });
        tr.appendChild(el('td', {}, [c]));
      });
      tb.appendChild(tr);
    });
    t.appendChild(tb);
  }
  // Arrow-key navigation inside the heat map so it is one tab stop, not hundreds.
  $('heat').addEventListener('keydown', function (e) {
    var cell = e.target.closest && e.target.closest('.cell'); if (!cell) return;
    var td = cell.parentElement, tr = td.parentElement, ci = Array.prototype.indexOf.call(tr.children, td);
    var target = null;
    if (e.key === 'ArrowRight') target = td.nextElementSibling;
    else if (e.key === 'ArrowLeft') target = ci > 1 ? td.previousElementSibling : null;
    else if (e.key === 'ArrowDown') target = tr.nextElementSibling && tr.nextElementSibling.children[ci];
    else if (e.key === 'ArrowUp') target = tr.previousElementSibling && tr.previousElementSibling.children[ci];
    else if (e.key === 'Home') target = tr.children[1];
    else if (e.key === 'End') target = tr.lastElementChild;
    if (!target) return;
    var nb = target.querySelector('.cell'); if (!nb) return;
    e.preventDefault();
    cell.setAttribute('tabindex', '-1'); nb.setAttribute('tabindex', '0'); nb.focus();
  });

  // ---------- coverage & profile ----------
  function drawCoverage() {
    var col = S.so === 'all' ? COL.P : COL[S.so];
    var keep = {}; IND.forEach(function (d) { if (S.so === 'all' || d.so === S.so) keep[d.key] = 1; });
    var rows = TTY.map(function (t) {
      var n = RES.filter(function (r) { return r.tty === t.tty && r.value !== null && keep[r.key]; }).length;
      return { id: t.tty, label: t.territory, v: n, text: n + (n === 1 ? ' indicator' : ' indicators') };
    }).sort(function (a, b) { return b.v - a.v; });
    barList($('cov-bars'), rows, { fill: col.l, stroke: col.c, toggle: true, empty: '' });
  }
  function drawProfile() {
    var t = ttyBy[S.tty], box = $('tty-profile');
    box.textContent = '';
    $('tty-name').textContent = t ? t.territory : 'All territories';
    $('tty-countries').textContent = t ? 'Covers: ' + t.countries : 'Pick a territory in the filters, the coverage chart or the reporting map.';
    if (!t) return;
    var keep = {}; visible().forEach(function (d) { keep[d.key] = d; });
    var rows = RES.filter(function (r) { return r.tty === t.tty && r.value !== null && keep[r.key]; });
    if (!rows.length) { box.appendChild(el('p', { class: 'empty', text: 'No 2026 figures for this selection.' })); return; }
    var tb = el('tbody');
    rows.forEach(function (r) {
      var d = keep[r.key];
      var b = el('button', { type: 'button', class: 'pick', 'aria-pressed': String(r.key === S.key), text: d.indicator, title: d.full });
      b.addEventListener('click', function () { selectKey(r.key, true); });
      tb.appendChild(el('tr', {}, [el('td', { class: 'ref', text: r.key }), el('td', {}, [b]), el('td', { class: 'n' }, [el('strong', { text: fmt(r.value, d.unit) })])]));
    });
    box.appendChild(el('div', { class: 'table-scroll', style: { 'max-height': '380px' }, tabindex: '0', role: 'region', 'aria-label': t.territory + ' figures' }, [
      el('table', { class: 'profile' }, [
        el('caption', { class: 'sr-only', text: '2026 figures reported by ' + t.territory }),
        el('thead', {}, [el('tr', {}, [el('th', { scope: 'col', text: 'Ref' }), el('th', { scope: 'col', text: 'Indicator' }), el('th', { scope: 'col', class: 'n', text: '2026' })])]),
        tb
      ])
    ]));
  }

  // ---------- state changes ----------
  function syncPressed() {
    document.querySelectorAll('.chip, .hot').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.so === S.so)); });
  }
  function redraw() { syncPressed(); drawTable(); drawSelected(); drawHeat(); drawCoverage(); drawProfile(); writeHash(); }
  function setSo(so) {
    S.so = so;
    if (so !== 'all') {
      var cur = byKey[S.key];
      if (!cur || cur.so !== so) {
        var f = IND.find(function (d) { return d.so === so && d.unit !== 'text' && d.z2026 !== null; });
        if (f) S.key = f.key;
      }
    }
    redraw();
    announce(so === 'all' ? 'Showing all outcomes' : 'Showing ' + COL[so].name);
  }
  function selectKey(k, say) {
    S.key = k; redraw();
    if (say) announce('Selected indicator ' + k + ': ' + byKey[k].indicator + '. Results by territory updated.');
  }
  function selectTty(code, say) {
    S.tty = code; $('tty-select').value = code; redraw();
    if (say) announce(code ? 'Selected territory ' + ttyBy[code].territory : 'Showing all territories');
  }
  function writeHash() {
    var p = [];
    if (S.so !== 'all') p.push('so=' + S.so);
    if (S.tty) p.push('tty=' + S.tty);
    if (S.key !== '05') p.push('ind=' + encodeURIComponent(S.key));
    var h = p.length ? '#' + p.join('&') : ' ';
    try { history.replaceState(null, '', h === ' ' ? location.pathname + location.search : h); } catch (e) { /* file:// */ }
  }
  function readHash() {
    (location.hash || '').replace(/^#/, '').split('&').forEach(function (kv) {
      var p = kv.split('='); var v = decodeURIComponent(p[1] || '');
      if (p[0] === 'so' && (v === 'all' || COL[v])) S.so = v;
      if (p[0] === 'tty' && ttyBy[v]) S.tty = v;
      if (p[0] === 'ind' && byKey[v]) S.key = v;
    });
  }

  document.querySelectorAll('.chip').forEach(function (b) { b.addEventListener('click', function () { setSo(b.dataset.so); }); });
  document.querySelectorAll('.hot').forEach(function (b) { b.addEventListener('click', function () { setSo(S.so === b.dataset.so ? 'all' : b.dataset.so); }); });
  $('tty-select').addEventListener('change', function (e) { selectTty(e.target.value, true); });
  $('only-data').addEventListener('change', function (e) { S.only = e.target.checked; redraw(); });

  drawHeader();
  readHash();
  $('tty-select').value = S.tty;
  redraw();
  }
})();
