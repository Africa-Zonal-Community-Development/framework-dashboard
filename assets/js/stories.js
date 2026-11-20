/* Stories of change — content from "Consolidated Assessment of 24 Stories, 2026",
   linked to framework indicators whose live values come from Supabase
   (fallback: data/azf-data.js). */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var STORY = {
    tamela: 'Tamela Kidawenda (disability inclusion)',
    tnz: 'Tanzania community project (CD24 TNZ)',
    wambura: 'Wambura',
    all: 'Consolidated stories, 2026'
  };
  var SO = {
    P: { name: 'Goal & Purpose', l: '#B1CBDA' }, '1': { name: 'Outcome 1 · Education', l: '#FFE699' },
    '2': { name: 'Outcome 2 · Health & WASH', l: '#F8CCAF' }, '3': { name: 'Outcome 3 · Economic inclusion', l: '#E5B5CB' },
    '4': { name: 'Outcome 4 · Safe environments', l: '#C4DFB4' }
  };
  var ICON = {
    chart: '<path d="M4 20h16"/><path d="M7 16v-4"/><path d="M12 16V9"/><path d="M17 16V5"/><path d="M5 9l5-4 4 3 5-5"/>',
    coins: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>',
    book: '<path d="M2 5c3-1 7-1 10 1 3-2 7-2 10-1v14c-3-1-7-1-10 1-3-2-7-2-10-1z"/><path d="M12 6v14"/>',
    people: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M15 15c3 0 6 2 6 5"/>',
    drop: '<path d="M12 3c3 4.5 6 8 6 11a6 6 0 0 1-12 0c0-3 3-6.5 6-11z"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
    access: '<circle cx="12" cy="4.5" r="1.8"/><path d="M8 9h8"/><path d="M12 9v6"/><path d="M12 15l-3 6"/><path d="M12 15l3 6"/>',
    leaf: '<path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15"/><path d="M5 19L14 10"/>'
  };
  var PW = [
    { id: 1, name: 'Economic empowerment', icon: 'chart', inputs: ['Vocational skills', 'Enterprise support', 'Agricultural training'],
      chain: ['Skills and resources', 'Income and business growth', 'Greater self-reliance'],
      desc: 'Livelihood support, vocational skills, entrepreneurship and agricultural training enabled people to earn income, accumulate assets, improve housing and become increasingly self-reliant.',
      ind: ['1.3', '1.2.2', '3.2.1', '3.5'], so: '3', stories: ['all', 'wambura'] },
    { id: 2, name: 'Financial inclusion', icon: 'coins', inputs: ['VSLAs', 'Savings groups', 'Financial literacy', 'Formal finance'],
      chain: ['Savings and access to credit', 'Investment and asset building', 'Financial resilience'],
      desc: 'Village Savings and Loan Associations, savings groups and access to credit let people save regularly, borrow affordably and invest in businesses, farming, livestock and housing — and cope better with shocks.',
      ind: ['3.2.2', '3.2.1', '3.5'], so: '3', stories: ['tnz', 'wambura'] },
    { id: 3, name: 'Education & learning', icon: 'book', inputs: ['School access', 'Sponsorship', 'Literacy', 'Vocational training'],
      chain: ['Learning and achievement', 'Confidence and aspirations', 'Expanded future opportunities'],
      desc: 'Education support was one of the strongest pathways. Improved literacy, achievement and employable skills led to greater self-belief, professional ambitions and wider life prospects.',
      ind: ['1.1.1', '1.1.2', '1.1.4', '1.1.5', '1.2.1'], so: '1', stories: ['tamela', 'all'] },
    { id: 4, name: 'Social support & inclusion', icon: 'people', inputs: ['Peer support', 'Mentoring', 'Community groups', 'Sport'],
      chain: ['Belonging and confidence', 'Positive choices and participation', 'Inclusion and leadership'],
      desc: 'Community groups, sports programmes, mentoring and collective action strengthened belonging, confidence, positive decision-making and community leadership.',
      ind: ['04', '03', '4.1.5'], so: 'P', stories: ['all'] },
    { id: 5, name: 'Essential services', icon: 'drop', inputs: ['Water', 'Sanitation', 'Nutrition', 'Safe living conditions'],
      chain: ['Better health and time savings', 'Dignity and productivity', 'Improved wellbeing'],
      desc: 'Access to clean water, sanitation, nutrition, irrigation and safe living conditions improved health, saved time, enhanced dignity and raised productivity — a foundation for wider change.',
      ind: ['2.2.1b', '2.2.2b', '2.2.3', '2.2-water', '2.1.1'], so: '2', stories: ['all', 'tnz'] },
    { id: 6, name: 'Protection & care', icon: 'shield', inputs: ['Protection services', 'Counselling', 'Reintegration', 'Child sponsorship'],
      chain: ['Safety and recovery', 'Agency and empowerment', 'Renewed hope and opportunity'],
      desc: 'Counselling, child protection, sponsorship and reintegration support helped vulnerable children, street-connected youth and survivors of exploitation recover, return to learning or work, and plan positive futures.',
      ind: ['4.1.4', '4.2.4', '4.1.1', '4.2.7'], so: '4', stories: ['all'] },
    { id: 7, name: 'Disability inclusion', icon: 'access', inputs: ['Inclusive education', 'Tailored support', 'Sport'],
      chain: ['Accessible learning and participation', 'Skills and confidence', 'Greater inclusion and aspirations'],
      desc: 'Specialised education and inclusive support enabled children living with disabilities to build confidence, develop their talents, take full part in school life and pursue ambitious goals.',
      ind: [], gap: 'No framework indicator measures disability inclusion directly yet, although it emerged strongly in the latest stories. Consider adding one (for example, # of learners with disabilities supported in TSA schools).',
      so: '1', stories: ['tamela'] },
    { id: 8, name: 'Resilient livelihoods', icon: 'leaf', inputs: ['Livestock', 'Climate-smart farming', 'Nutrition gardens'],
      chain: ['Improved production and nutrition', 'Income diversification and assets', 'Food security and household resilience'],
      desc: 'Livestock support, sustainable agriculture, kitchen gardens and better farming practices raised production, strengthened food security, generated income and improved resilience to shocks.',
      ind: ['3.1.2', '3.4', '3.1.3', '3.2', '3.3.1'], so: '3', stories: ['tnz', 'wambura'] }
  ];
  var THEMES = [
    { t: 'Economic empowerment and livelihood development', so: '3', pw: [1, 8], stories: ['all', 'tnz', 'wambura'],
      body: 'Livelihood support, vocational training, agricultural development, entrepreneurship, savings groups and livestock initiatives raised incomes, built assets, diversified livelihoods, improved housing and strengthened financial security. Participants moved from economic uncertainty to greater self-reliance.' },
    { t: 'Education, skills development and future opportunities', so: '1', pw: [3, 7], stories: ['all', 'tamela', 'wambura'],
      body: 'One of the strongest pathways. Stories show better literacy, achievement, vocational skills, employability, confidence and aspirations, with participants moving from exclusion or limited options to higher attainment and professional ambitions. Tamela Kidawenda’s story shows how inclusive education unlocks the potential of children living with disabilities.' },
    { t: 'Financial inclusion and asset building', so: '3', pw: [2], stories: ['tnz', 'wambura'],
      body: 'Savings groups, VSLAs, financial literacy and formal financial services let people save, borrow affordably, invest in productive assets, build businesses and absorb shocks. Several moved from little or no financial security to running thriving enterprises.' },
    { t: 'Health, food security and access to essential services', so: '2', pw: [5, 8], stories: ['all', 'tnz', 'wambura'],
      body: 'Clean water, sanitation, nutrition support, irrigation, kitchen gardens and improved farming led to better health and nutrition, less vulnerability to food shortages, higher productivity, and greater dignity. Basic services laid the foundation for wider economic and social change.' },
    { t: 'Social inclusion, disability inclusion and participation', so: 'P', pw: [4, 7], stories: ['tamela'],
      body: 'Community groups, peer support, mentoring, sport, education initiatives and disability-inclusive services strengthened confidence, belonging, participation and leadership. Specialised support removed barriers so people could take full part in education, recreation and community life.' },
    { t: 'Protection, recovery and empowerment', so: '4', pw: [6], stories: ['all'],
      body: 'Protection services, counselling, child sponsorship, reintegration and community initiatives helped vulnerable children, street-connected youth and survivors of exploitation recover, regain confidence and pursue education and livelihoods.' }
  ];
  // word, emphasis (1–5), colour, pathways it belongs to
  var WORDS = [
    ['Education', 4, '#D45A12', [3, 7]], ['Confidence', 3, '#1B3F8B', [3, 4, 7]], ['Opportunity', 3, '#0B7B8A', [3, 6]],
    ['Empowerment', 3, '#C8174B', [1, 6]], ['Resilience', 5, '#0B6F80', [1, 2, 8]], ['Belonging', 2, '#2E7D32', [4]],
    ['Inclusion', 3, '#6A2DA8', [4, 7]], ['Employment', 2, '#1B3F8B', [1, 3]], ['Livelihood security', 3, '#2E7D32', [1, 8]],
    ['Wellbeing', 4, '#6A2DA8', [5]], ['Disability inclusion', 2, '#6A2DA8', [7]], ['Income', 3, '#1565C0', [1, 8]],
    ['Hope', 5, '#C8174B', [1, 2, 3, 4, 5, 6, 7, 8]], ['Literacy', 2, '#2E7D32', [3]], ['Health', 3, '#2E7D32', [5]],
    ['Savings', 3, '#D45A12', [2]], ['Learning', 2, '#D45A12', [3]], ['Self-reliance', 3, '#1565C0', [1]],
    ['Dignity', 5, '#3C8A2E', [5, 6]], ['Food security', 3, '#D45A12', [8, 5]], ['Participation', 2, '#C8174B', [4, 7]],
    ['Financial security', 2, '#1B3F8B', [2]], ['Career aspirations', 1, '#1565C0', [3, 7]], ['Improved nutrition', 1, '#0B7B8A', [5, 8]],
    ["Women's empowerment", 1, '#B85A00', [1, 2]], ['Asset building', 1, '#6A2DA8', [2, 8]], ['Time savings', 1, '#0B7B8A', [5]],
    ['Entrepreneurship', 1, '#B85A00', [1, 2]], ['Better housing', 1, '#1B3F8B', [1, 2]], ['Safety', 1, '#C8174B', [6]],
    ['Positive choices', 1, '#2E7D32', [4]], ['Productivity', 1, '#1565C0', [5, 8]], ['Recovery', 1, '#2E7D32', [6]],
    ['Social support', 1, '#C8174B', [4]], ['Community leadership', 1, '#6A2DA8', [4]], ['Future opportunities', 1, '#1565C0', [3, 6]]
  ];
  var NEW_THEMES = ['Disability inclusion', 'Livestock development', "Women's economic empowerment", 'Agricultural commercialisation', 'Formal financial access', 'Sports participation', 'Career aspirations', 'Community leadership'];
  var ROLES = [['🧑‍💼', 'Entrepreneurs'], ['🛠️', 'Skilled workers'], ['🌾', 'Farmers'], ['💰', 'Savers'], ['🗣️', 'Community leaders'], ['🤝', 'Peer educators'], ['📣', 'Advocates'], ['⭐', 'Role models']];

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
