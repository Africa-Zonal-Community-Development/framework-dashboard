/* Two-page summary: page 1 from the results data, page 2 from the stories content. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var SC = window.AZF_STORIES;
  var OC = {
    P: { name: 'Goal & Purpose', c: '#02538A', x: '#E3EEF6', keys: ['05', '05a', '03'] },
    '1': { name: '1 · Quality education & employment skills', c: '#E0A800', x: '#FFF6D7', keys: ['1.1.1', '1.2.1.1', '1.3'] },
    '2': { name: '2 · Reduced disease burden', c: '#F46D1D', x: '#FDEBDF', keys: ['2.2.1b', '2.1.5', '2.2.3'] },
    '3': { name: '3 · Economic inclusion', c: '#B8457A', x: '#F6E2EB', keys: ['3.2.2', '3.1.2', '3.3.1'] },
    '4': { name: '4 · Safe environments for all', c: '#2E9A5B', x: '#EAF2E3', keys: ['4.1.5', '4.1.1', '4.2.4'] }
  };
  var SHORT = {
    '05': 'people reached by all TSA projects & programmes', '05a': 'unique individuals reached through projects',
    '03': 'show positive change in attitudes to gender', '04': 'report they can advocate with duty bearers',
    '1.1.2': 'schools operated by TSA', '1.1.1.1': 'children enrolled in basic education', '1.2.1.1': 'youth enrolled in upper secondary', '1.1.1': 'of learners passed to the next grade (basic education)', '1.3': 'of youth in work after employment-skills training',
    '2.1.1': 'people reached by health prevention', '2.1.6': 'TSA clinics and medical institutions', '2.1.4': 'people treated for NCDs or communicable diseases', '2.2.1b': 'household members with safe water', '2.1.5': 'women with quality antenatal care', '2.2.3': 'people reached by hygiene promotion',
    '3.2.2': 'people in savings & lending groups', '3.1.2': 'household members less food insecure', '3.3.1': 'disaster-affected people reached',
    '4.1.5': 'people sensitized on gender & women\u2019s rights', '4.1.1': 'caregivers trained in non-violent parenting & protection', '4.2.4': 'trafficking survivors supported to reintegrate',
    '3.2.1': 'household members able to meet essential needs', '1.2.2': 'of trainees completed vocational courses', '4.1.4': 'people supported after GBV incidents',
    '2.2.2b': 'household members with safe sanitation', '3.4': 'of households less food insecure', '3.5': 'of households meet essential needs'
  };
  function lab(d) { return SHORT[d.key] || d.indicator.replace(/^# of |^Number of /, '').replace(/^% of /, '% '); }
  var KPIS = [['05', 'P', 'Individuals reached through all TSA projects & programmes'], ['05a', 'P', 'Unique individuals reached through projects (new in 2026)'],
    ['1.1.2', '1', 'Schools operated by TSA'], ['1.1.1.1', '1', 'Children enrolled in basic education in TSA schools'],
    ['2.1.6', '2', 'TSA clinics and medical institutions'], ['2.1.4', '2', 'People treated for NCDs or communicable diseases'],
    ['2.1.1', '2', 'People reached by health prevention measures'], ['3.2.2', '3', 'People in savings & lending groups / entrepreneurship'],
    ['4.1.5', '4', "People sensitized on gender issues & women's rights"]];

  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k]; if (v == null) return;
      if (k === 'text') e.textContent = v; else if (k === 'class') e.className = v; else if (k === 'html') e.innerHTML = v; else e.setAttribute(k, v);
    });
    (kids || []).forEach(function (c) { if (c != null) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  var nf = new Intl.NumberFormat('en-GB');
  function fmt(v, unit) { if (v == null || isNaN(+v)) return '—'; return unit === 'pct' ? Math.round(+v) + '%' : nf.format(Math.round(+v)); }
  function chg(d) {
    if (!d || d.z2025 == null || d.z2026 == null || d.unit === 'text') return null;
    if (d.unit === 'pct') return { v: Math.round(d.z2026 - d.z2025), u: ' pts' };
    if (d.z2025 > 0) return { v: Math.round((d.z2026 / d.z2025 - 1) * 100), u: '%' };
    return null;
  }
  function chgEl(d, suffix) {
    var c = chg(d); if (!c) return null;
    return el('span', {}, [el('span', { class: c.v >= 0 ? 'up' : 'down', text: (c.v > 0 ? '+' : c.v < 0 ? '−' : '') + Math.abs(c.v) + c.u }), suffix || '']);
  }

  function page1(D) {
    var by = {}; D.indicators.forEach(function (d) { by[d.key] = d; });
    var tty = {}; D.territories.forEach(function (t) { tty[t.tty] = t.territory; });
    var vals = D.results.filter(function (r) { return r.value != null; });
    var nT = new Set(vals.map(function (r) { return r.tty; })).size;
    var r05 = by['05'];
    var lede = $('s-lede'); lede.textContent = '';
    lede.append('In 2026, ', el('strong', { text: nT + ' of ' + D.territories.length }), ' reporting units across the Africa Zone submitted results. TSA projects and programmes reached ',
      el('strong', { text: fmt(r05 && r05.z2026) }), ' people (', fmt(r05 && r05.z2025), ' in 2025), across ',
      el('strong', { text: String(D.indicators.filter(function (d) { return d.unit !== 'text'; }).length) }), ' framework indicators and four Strategic Outcomes.');

    var k = $('s-kpis'); k.textContent = '';
    KPIS.forEach(function (x) {
      var d = by[x[0]]; if (!d) return;
      var c = chgEl(d, ' vs 2025 (' + fmt(d.z2025, d.unit) + ')');
      k.appendChild(el('div', { class: 's-kpi', style: '--k:' + OC[x[1]].c }, [
        el('span', { class: 'v', text: fmt(d.z2026, d.unit) }), el('span', { class: 'l', text: x[2] }),
        el('span', { class: 'c' }, [c || 'Not collected in 2025'])
      ]));
    });

    var o = $('s-outcomes'); o.textContent = '';
    ['P', '1', '2', '3', '4'].forEach(function (so) {
      var cfg = OC[so];
      var inds = D.indicators.filter(function (d) { return d.so === so && d.unit !== 'text'; });
      var withData = inds.filter(function (d) { return d.z2026 != null; }).length;
      o.appendChild(el('div', { class: 's-oc', style: '--c:' + cfg.c + ';--x:' + cfg.x }, [
        el('h3', { text: cfg.name }),
        el('ul', {}, cfg.keys.map(function (key) {
          var d = by[key]; if (!d) return null;
          var c = chgEl(d);
          return el('li', {}, [el('b', { text: fmt(d.z2026, d.unit) }), lab(d), c ? ' (' : '', c, c ? ')' : '']);
        })),
        el('p', { class: 'meta', text: withData + ' of ' + inds.length + ' indicators with 2026 data' })
      ]));
    });

    function bars(id, rows, color, unitText) {
      var ol = $(id); ol.textContent = '';
      var max = Math.max.apply(null, rows.map(function (r) { return r.v; })) || 1;
      rows.forEach(function (r) {
        ol.appendChild(el('li', {}, [el('span', { class: 'n', text: r.n, title: r.n }),
          el('span', { class: 't' }, [el('span', { class: 'f', style: 'width:' + (r.v / max * 72).toFixed(1) + '%;--bc:' + color }), el('span', { class: 'val', text: nf.format(r.v) + (unitText || '') })])]));
      });
    }
    var reach = D.results.filter(function (r) { return r.key === '05' && r.value != null; })
      .sort(function (a, b) { return b.value - a.value; }).map(function (r) { return { n: tty[r.tty], v: r.value }; });
    bars('s-reach', reach, '#02538A');
    var cov = D.territories.map(function (t) { return { n: t.territory, v: vals.filter(function (r) { return r.tty === t.tty; }).length }; })
      .sort(function (a, b) { return b.v - a.v; });
    bars('s-cov', cov, '#0095CC');

  }

  function page2(D) {
    var by = {}; D.indicators.forEach(function (d) { by[d.key] = d; });
    var g = $('s-pw'); g.textContent = '';
    SC.PW.forEach(function (p) {
      var key = p.ind.find(function (k) { return by[k] && by[k].z2026 != null; });
      var d = key && by[key];
      g.appendChild(el('div', { class: 's-pwc pw-' + p.id }, [
        el('div', { class: 's-pwh' }, [el('span', { class: 'ic', 'aria-hidden': 'true', html: '<svg viewBox="0 0 24 24">' + SC.ICON[p.icon] + '</svg>' }), el('b', { text: p.id + '. ' + p.name })]),
        el('ol', { class: 's-chain' }, p.chain.map(function (s) { return el('li', { text: s }); })),
        d ? el('p', { class: 's-ev' }, [el('b', { text: fmt(d.z2026, d.unit) }), ' ', lab(d), ' (', key, ')'])
          : el('p', { class: 's-ev gap', text: 'No dedicated framework indicator yet' })
      ]));
    });
    var w = $('s-words'); w.textContent = '';
    SC.WORDS.filter(function (x) { return x[1] >= 3; }).sort(function (a, b) { return b[1] - a[1]; }).forEach(function (x) {
      w.appendChild(el('span', { style: 'color:' + dark(x[2]) + ';font-size:' + (6.4 + x[1] * 1.3) + 'pt', text: x[0] }));
    });
    $('s-new').textContent = SC.NEW_THEMES.join(' · ');
    var th = $('s-themes'); th.textContent = '';
    var SOC = { P: '#02538A', '1': '#E0A800', '2': '#F46D1D', '3': '#B8457A', '4': '#2E9A5B' };
    SC.THEMES.forEach(function (t) {
      th.appendChild(el('li', { style: '--c:' + SOC[t.so] }, [el('b', { text: t.t }), el('span', { text: t.short || t.body })]));
    });
    var ro = $('s-roles'); ro.textContent = '';
    SC.ROLES.forEach(function (r) { ro.appendChild(el('li', { text: r[1] })); });
  }

  function dark(hex) {
    var n = parseInt(hex.slice(1), 16), f = 0.72;
    return 'rgb(' + [n >> 16, (n >> 8) & 255, n & 255].map(function (v) { return Math.round(v * f); }).join(',') + ')';
  }
  function fit() {
    var px = 210 * 96 / 25.4, s = Math.min(1, (window.innerWidth - 24) / px);
    document.querySelectorAll('.sheet').forEach(function (sh) { sh.style.zoom = s < 1 ? s.toFixed(3) : ''; });
  }
  window.addEventListener('resize', fit);
  window.addEventListener('beforeprint', function () { document.querySelectorAll('.sheet').forEach(function (sh) { sh.style.zoom = ''; }); });
  window.addEventListener('afterprint', fit);
  fit();
  $('print-btn').addEventListener('click', function () { window.print(); });

  window.AZF_loadData().then(function (D) {
    page1(D); page2(D);
    var stamp = (D.live ? 'Live figures' : 'Figures') + ' as of ' + new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    $('s-stamp1').textContent = stamp; $('s-stamp2').textContent = stamp;
    document.body.setAttribute('data-ready', '1');
  }, function () { $('s-lede').textContent = 'The figures could not be loaded. Please refresh the page.'; });
})();
