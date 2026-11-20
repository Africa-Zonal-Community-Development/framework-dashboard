/* Shared data loader for the AZF pages.
   Reads live data from Supabase (edited in the admin console) and falls back to
   the bundled snapshot in data/azf-data.js if the database can't be reached. */
(function () {
  'use strict';
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

  var cached = null;
  window.AZF_loadData = function () {
    if (cached) return cached;
    var timer = new Promise(function (_, rej) { setTimeout(function () { rej(new Error('timeout')); }, 6000); });
    cached = Promise.race([loadLive(), timer]).catch(function () {
      if (window.AZF_DATA) return window.AZF_DATA;
      throw new Error('no data');
    });
    return cached;
  };
})();
