/* AZF dashboard — admin console.
   Sign-in: approved admin email -> one-time code by email -> session.
   Limits: 5 code requests and 5 sign-ins per email per hour (enforced in the database).
   Editing: Row Level Security only lets emails in public.admins write. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var C = window.AZF_CONFIG;
  var sb = window.supabase.createClient(C.supabaseUrl, C.supabaseKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'azf-admin-auth' }
  });

  var SO = { P: 'Goal & Purpose', '1': '1 · Education', '2': '2 · Health & WASH', '3': '3 · Economic inclusion', '4': '4 · Safe environments' };
  var SO_COL = { P: '#02538A', '1': '#B98900', '2': '#D45A12', '3': '#A63D6E', '4': '#2A8A52' };
  var DB = { territories: [], indicators: [], results: [], admins: [] };
  var me = null, curKey = null, pendingEmail = '';

  // ---------- small helpers ----------
  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === undefined || v === null || v === false) return;
      if (k === 'text') e.textContent = v; else if (k === 'class') e.className = v;
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? '' : v);
    });
    (kids || []).forEach(function (c) { if (c != null) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  function msg(id, text, kind) { var m = $(id); m.textContent = text || ''; m.className = 'msg' + (kind ? ' ' + kind : ''); if (text) say(text); }
  function say(t) { var l = $('live'); l.textContent = ''; setTimeout(function () { l.textContent = t; }, 30); }
  function numOrNull(v) { v = String(v == null ? '' : v).trim(); if (v === '') return null; var n = Number(v.replace(/[’',\s%]/g, '')); return isNaN(n) ? NaN : n; }
  function txtOrNull(v) { v = String(v == null ? '' : v).trim(); return v === '' ? null : v; }
  function when(ts) { try { return new Date(ts).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }); } catch (e) { return ts; } }
  function busy(form, on) { form.querySelectorAll('button').forEach(function (b) { b.disabled = on; }); }
  function errText(e) {
    if (!e) return 'Something went wrong.';
    var m = e.message || String(e);
    if (/at least one admin/i.test(m)) return 'At least one admin must remain.';
    if (/duplicate key/i.test(m)) return 'That reference or code already exists.';
    if (/row-level security|permission denied/i.test(m)) return 'You are not allowed to make this change. Are you still signed in as an admin?';
    return m;
  }

  // ---------- sign in ----------
  $('email-form').addEventListener('submit', async function (ev) {
    ev.preventDefault();
    var email = $('email').value.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { $('email').setAttribute('aria-invalid', 'true'); msg('email-msg', 'Enter a valid email address.', 'err'); $('email').focus(); return; }
    $('email').removeAttribute('aria-invalid');
    busy(this, true); msg('email-msg', 'Checking…');
    try {
      var r = await sb.rpc('request_signin_code', { p_email: email });
      if (r.error) throw r.error;
      if (r.data === 'not_allowed') { msg('email-msg', 'This email is not on the admin list. Ask an existing admin to add you.', 'err'); return; }
      if (r.data === 'rate_limited') { msg('email-msg', 'You have used all 5 sign-in attempts for this hour. Please try again later.', 'err'); return; }
      if (r.data !== 'ok') { msg('email-msg', 'Enter a valid email address.', 'err'); return; }
      // If an email arrives with a link instead of a code, the link should come back to this page.
      var back = location.protocol.indexOf('http') === 0 ? location.origin + location.pathname : undefined;
      var s = await sb.auth.signInWithOtp({ email: email, options: { shouldCreateUser: true, emailRedirectTo: back } });
      if (s.error) {
        var code = s.error.code || '';
        if (code === 'over_email_send_rate_limit' || s.error.status === 429) throw new Error('The email service is busy (too many codes sent recently). Please wait a few minutes and try again.');
        if (code === 'email_address_not_authorized') throw new Error('The email service can’t send to this address yet. The site owner needs to finish the email (SMTP) setup.');
        throw s.error;
      }
      pendingEmail = email;
      $('code-email').textContent = email;
      $('email-form').hidden = true; $('code-form').hidden = false;
      $('code').value = ''; $('code').focus();
      msg('code-msg', 'Code sent. Check your inbox.', 'ok');
    } catch (e) { msg('email-msg', errText(e), 'err'); }
    finally { busy(this, false); }
  });

  $('code-form').addEventListener('submit', async function (ev) {
    ev.preventDefault();
    var token = $('code').value.replace(/\D/g, '');
    if (token.length < 6) { $('code').setAttribute('aria-invalid', 'true'); msg('code-msg', 'Enter the code from the email.', 'err'); $('code').focus(); return; }
    $('code').removeAttribute('aria-invalid');
    busy(this, true); msg('code-msg', 'Signing in…');
    try {
      var r = await sb.auth.verifyOtp({ email: pendingEmail, token: token, type: 'email' });
      if (r.error) {
        var m = r.error.message || '';
        if (/expired|invalid/i.test(m)) throw new Error('That code is wrong or has expired. Check the latest email, or go back and request a new code.');
        throw r.error;
      }
      await enter(r.data.session);
    } catch (e) { msg('code-msg', errText(e), 'err'); }
    finally { busy(this, false); }
  });
  $('code').addEventListener('input', function () { this.value = this.value.replace(/\D/g, '').slice(0, 10); });
  $('back-btn').addEventListener('click', function () {
    $('code-form').hidden = true; $('email-form').hidden = false; msg('code-msg', ''); msg('email-msg', ''); $('email').focus();
  });
  $('sign-out').addEventListener('click', async function () {
    await sb.auth.signOut(); me = null; showSignin('You have signed out.');
  });

  function showSignin(note) {
    $('console').hidden = true; $('who').hidden = true; $('signin').hidden = false;
    $('code-form').hidden = true; $('email-form').hidden = false;
    msg('email-msg', note || '', note ? 'ok' : '');
  }

  async function enter(session) {
    if (!session) return showSignin();
    var a = await sb.rpc('is_admin');
    if (a.error || a.data !== true) { await sb.auth.signOut(); return showSignin(); }
    me = (session.user.email || '').toLowerCase();
    $('who-email').textContent = me;
    $('who').hidden = false; $('signin').hidden = true; $('console').hidden = false;
    await loadAll();
    say('Signed in as ' + me + '. Admin console ready.');
    document.getElementById('tab-ind').focus();
  }

  // ---------- data ----------
  async function loadAll() {
    var r = await Promise.all([
      sb.from('territories').select('*').order('sort').order('tty'),
      sb.from('indicators').select('*').order('sort').order('key'),
      sb.from('results').select('*').limit(20000),
      sb.from('admins').select('*').order('email')
    ]);
    var bad = r.find(function (x) { return x.error; });
    if (bad) { alert('Could not load data: ' + errText(bad.error)); return; }
    DB.territories = r[0].data; DB.indicators = r[1].data; DB.results = r[2].data; DB.admins = r[3].data;
    if (!curKey || !DB.indicators.some(function (d) { return d.key === curKey; })) curKey = DB.indicators.length ? DB.indicators[0].key : null;
    drawIndList(); fillIndForm(); drawResSelect(); drawRes(); drawTty(); drawAdmins();
  }
  var indByKey = function (k) { return DB.indicators.find(function (d) { return d.key === k; }); };

  // ---------- tabs ----------
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role=tab]'));
  function openTab(t, focus) {
    if (!$('p-res').hidden && t.id !== 'tab-res' && RES.dirty) { if (!confirmLeave()) return; drawRes(); }
    tabs.forEach(function (b) {
      var on = b === t;
      b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1;
      $(b.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) t.focus();
    if (t.id === 'tab-log') loadLog();
  }
  tabs.forEach(function (b, i) {
    b.addEventListener('click', function () { openTab(b); });
    b.addEventListener('keydown', function (e) {
      var j = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : null;
      if (j === null) return; e.preventDefault(); openTab(tabs[(j + tabs.length) % tabs.length], true);
    });
  });

  // ---------- indicators ----------
  function drawIndList() {
    var q = $('ind-search').value.trim().toLowerCase(), so = $('ind-so').value, ul = $('ind-list');
    ul.textContent = '';
    DB.indicators.filter(function (d) {
      return (!so || d.so === so) && (!q || (d.key + ' ' + d.indicator + ' ' + (d.full_text || '')).toLowerCase().indexOf(q) >= 0);
    }).forEach(function (d) {
      ul.appendChild(el('li', {}, [el('button', { type: 'button', 'aria-current': d.key === curKey ? 'true' : null,
        onclick: function () { curKey = d.key; drawIndList(); fillIndForm(); $('f-ind').focus(); } }, [
        el('span', { class: 'k' }, [el('span', { class: 'so-dot', style: 'background:' + SO_COL[d.so], 'aria-hidden': 'true' }), d.key]),
        el('span', { text: d.indicator })
      ])]));
    });
    if (!ul.children.length) ul.appendChild(el('li', { class: 'hint-sm', text: 'No indicators match.' }));
  }
  $('ind-search').addEventListener('input', drawIndList);
  $('ind-so').addEventListener('change', drawIndList);

  var F = { key: 'f-key', sort: 'f-sort', so: 'f-so', unit: 'f-unit', er: 'f-er', er_name: 'f-er-name', indicator: 'f-ind', full_text: 'f-full', z2025: 'f-z25', z2026: 'f-z26', z2026_note: 'f-note', sdg: 'f-sdg', global_manual: 'f-gm' };
  function fillIndForm(blank) {
    var d = blank ? { key: '', sort: (DB.indicators.reduce(function (m, x) { return Math.max(m, x.sort || 0); }, 0) + 1), so: $('ind-so').value || 'P', unit: 'count' } : indByKey(curKey) || {};
    Object.keys(F).forEach(function (k) { $(F[k]).value = d[k] == null ? '' : d[k]; $(F[k]).removeAttribute('aria-invalid'); });
    $('ind-form').dataset.mode = blank ? 'new' : 'edit';
    $('ind-form-h').textContent = blank ? 'New indicator' : 'Edit indicator ' + (d.key || '');
    $('ind-del').hidden = !!blank;
    $('ind-meta').textContent = !blank && d.updated_at ? 'Last changed ' + when(d.updated_at) + (d.updated_by ? ' by ' + d.updated_by : '') : '';
    msg('ind-msg', '');
  }
  $('ind-new').addEventListener('click', function () { curKey = null; drawIndList(); fillIndForm(true); $('f-key').focus(); });

  $('ind-form').addEventListener('submit', async function (ev) {
    ev.preventDefault();
    var row = {};
    Object.keys(F).forEach(function (k) { row[k] = $(F[k]).value; });
    row.key = row.key.trim(); row.indicator = row.indicator.trim();
    row.sort = parseInt(row.sort, 10) || 0;
    ['er', 'er_name'].forEach(function (k) { row[k] = row[k].trim(); });
    ['full_text', 'z2026_note', 'sdg', 'global_manual'].forEach(function (k) { row[k] = txtOrNull(row[k]); });
    row.z2025 = numOrNull(row.z2025); row.z2026 = numOrNull(row.z2026);
    var bad = null;
    if (!row.key) bad = 'f-key'; else if (!row.indicator) bad = 'f-ind'; else if (Number.isNaN(row.z2025)) bad = 'f-z25'; else if (Number.isNaN(row.z2026)) bad = 'f-z26';
    if (bad) { $(bad).setAttribute('aria-invalid', 'true'); $(bad).focus(); msg('ind-msg', bad === 'f-key' ? 'A reference is required.' : bad === 'f-ind' ? 'A short label is required.' : 'Totals must be numbers.', 'err'); return; }
    if (row.unit === 'pct' && ((row.z2025 !== null && row.z2025 > 100) || (row.z2026 !== null && row.z2026 > 100)) && !confirm('A percentage above 100 was entered. Save anyway?')) return;
    busy(this, true); msg('ind-msg', 'Saving…');
    try {
      var r = this.dataset.mode === 'new'
        ? await sb.from('indicators').insert(row).select().single()
        : await sb.from('indicators').update(row).eq('key', curKey).select().single();
      if (r.error) throw r.error;
      curKey = r.data.key;
      await loadAll();
      msg('ind-msg', 'Saved. The public dashboard shows the change on its next load.', 'ok');
    } catch (e) { msg('ind-msg', errText(e), 'err'); }
    finally { busy(this, false); }
  });
  $('ind-del').addEventListener('click', async function () {
    var d = indByKey(curKey); if (!d) return;
    if (!confirm('Delete indicator ' + d.key + ' and all its territory results? This cannot be undone (the activity log keeps a copy).')) return;
    var r = await sb.from('indicators').delete().eq('key', d.key);
    if (r.error) return msg('ind-msg', errText(r.error), 'err');
    curKey = null; await loadAll(); msg('ind-msg', 'Indicator deleted.', 'ok');
  });

  // ---------- territory results ----------
  // Two ways in: one indicator across all territories, or one territory across all indicators.
  var RES = { mode: 'ind', dirty: 0 };
  var UNIT_HINT = { pct: 'Percent: enter 0–100 (85 or 85% both work).', tty: 'Territory count: enter 1 if the territory meets it.', text: 'Qualitative: use the note.', count: 'Count: whole numbers.' };
  var ttyName = function (c) { var t = DB.territories.find(function (x) { return x.tty === c; }); return t ? t.territory : c; };
  function fmtVal(v, unit) { if (v == null || v === '') return '—'; var n = Number(v); if (isNaN(n)) return String(v); return unit === 'pct' ? Math.round(n * 10) / 10 + '%' : n.toLocaleString('en-GB'); }
  function parseVal(v) { v = String(v == null ? '' : v).replace(/%/g, ''); return numOrNull(v); }
  function resRows() { return Array.prototype.slice.call($('res-body').querySelectorAll('tr[data-key]')); }
  function countDirty() {
    var n = resRows().filter(function (tr) { return tr.classList.contains('changed'); }).length;
    RES.dirty = n;
    $('res-dirty').textContent = n ? n + ' unsaved change' + (n === 1 ? '' : 's') : 'No unsaved changes';
    $('res-dirty').className = 'dirty-count' + (n ? ' on' : '');
    $('res-save').disabled = !n; $('res-discard').disabled = !n;
  }
  function confirmLeave() { return !RES.dirty || confirm('You have ' + RES.dirty + ' unsaved change' + (RES.dirty === 1 ? '' : 's') + '. Discard them?'); }
  window.addEventListener('beforeunload', function (e) { if (RES.dirty) { e.preventDefault(); e.returnValue = ''; } });

  function drawResSelect() {
    var s = $('res-ind'), keep = s.value || curKey;
    s.textContent = '';
    var lastSo = null, grp = null;
    DB.indicators.forEach(function (d) {
      if (d.so !== lastSo) { lastSo = d.so; grp = el('optgroup', { label: SO[d.so] }); s.appendChild(grp); }
      grp.appendChild(el('option', { value: d.key, text: d.key + ' — ' + d.indicator }));
    });
    if (keep && indByKey(keep)) s.value = keep;
    var t = $('res-tty'), keepT = t.value;
    t.textContent = '';
    DB.territories.forEach(function (x) { t.appendChild(el('option', { value: x.tty, text: x.territory + ' (' + x.tty + ')' })); });
    if (keepT) t.value = keepT;
  }

  function makeRow(key, tty, label, unit, extraTitle) {
    var r = DB.results.find(function (x) { return x.key === key && x.tty === tty; }) || {};
    var orig = r.value == null ? '' : String(Number(r.value));
    var v = el('input', { class: 'inp num-inp', type: 'text', inputmode: 'decimal', autocomplete: 'off', 'aria-label': label + ' — 2026 value', value: orig, 'data-orig': orig });
    var n = el('input', { class: 'inp', type: 'text', autocomplete: 'off', 'aria-label': label + ' — note', value: r.note || '', 'data-orig': r.note || '' });
    var suffix = unit === 'pct' ? el('span', { class: 'unit', 'aria-hidden': 'true', text: '%' }) : null;
    var upd = !r.key ? 'not reported' : (!r.updated_by || r.updated_by === 'postgres') ? 'imported from Excel' : when(r.updated_at) + ' · ' + r.updated_by.split('@')[0];
    var tr = el('tr', { 'data-key': key, 'data-tty': tty, 'data-exists': r.key ? '1' : '', 'data-unit': unit }, [
      el('th', { scope: 'row', class: 'tname', title: extraTitle || null, text: label }),
      el('td', { 'data-label': '2026 value' }, [el('span', { class: 'num-wrap' }, [v, suffix])]),
      el('td', { 'data-label': 'Note' }, [n]),
      el('td', { 'data-label': 'Last updated', class: 'upd', text: upd })
    ]);
    var mark = function () {
      var bad = v.value.trim() !== '' && Number.isNaN(parseVal(v.value));
      v.setAttribute('aria-invalid', bad ? 'true' : 'false');
      var same = (v.value.trim() === '' ? '' : String(parseVal(v.value))) === v.dataset.orig && n.value.trim() === n.dataset.orig;
      tr.classList.toggle('changed', !same); countDirty();
    };
    v.addEventListener('input', mark); n.addEventListener('input', mark);
    return tr;
  }

  function drawRes() {
    var tb = $('res-body'); tb.textContent = '';
    var ctx = $('res-context'); ctx.textContent = '';
    $('res-ind-fld').hidden = RES.mode !== 'ind'; $('res-tty-fld').hidden = RES.mode !== 'tty'; $('res-so-fld').hidden = RES.mode !== 'tty';
    $('res-sum').hidden = RES.mode !== 'ind';
    if (RES.mode === 'ind') {
      var key = $('res-ind').value, d = indByKey(key);
      if (!d) return;
      $('res-col1').textContent = 'Territory'; $('res-caption').textContent = 'Territory results for ' + key;
      var n = DB.results.filter(function (r) { return r.key === key && r.value != null; }).length;
      ctx.append(el('strong', { text: key + ' · ' + d.indicator }), el('br'),
        el('span', { text: 'Zone 2025: ' + fmtVal(d.z2025, d.unit) + '   ·   Zone 2026: ' + fmtVal(d.z2026, d.unit) + '   ·   ' + n + ' territor' + (n === 1 ? 'y' : 'ies') + ' reported   ·   ' + UNIT_HINT[d.unit] }));
      DB.territories.forEach(function (t) { tb.appendChild(makeRow(key, t.tty, t.territory, d.unit)); });
    } else {
      var tty = $('res-tty').value, so = $('res-so').value;
      if (!tty) return;
      $('res-col1').textContent = 'Indicator'; $('res-caption').textContent = 'Results for ' + ttyName(tty);
      var nr = DB.results.filter(function (r) { return r.tty === tty && r.value != null; }).length;
      ctx.append(el('strong', { text: ttyName(tty) }), el('br'), el('span', { text: nr + ' indicators reported. Percent indicators are marked %.' }));
      var lastSo = null;
      DB.indicators.filter(function (d) { return d.unit !== 'text' && (!so || d.so === so); }).forEach(function (d) {
        if (d.so !== lastSo) { lastSo = d.so; tb.appendChild(el('tr', { class: 'grp-row' }, [el('td', { colspan: '4', text: SO[d.so] })])); }
        tb.appendChild(makeRow(d.key, tty, d.key + ' · ' + d.indicator, d.unit, d.full_text));
      });
    }
    countDirty(); msg('res-msg', ''); loadResHistory();
  }

  // Enter moves to the same column in the next row
  $('res-body').addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' || e.target.tagName !== 'INPUT') return;
    e.preventDefault();
    var td = e.target.closest('td'), tr = td.parentElement, ci = Array.prototype.indexOf.call(tr.children, td);
    var next = tr.nextElementSibling;
    while (next && !next.dataset.key) next = next.nextElementSibling;
    if (next) { var inp = next.children[ci].querySelector('input'); if (inp) { inp.focus(); inp.select(); } }
  });
  // Ctrl/Cmd + S saves
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's' && !$('p-res').hidden) { e.preventDefault(); if (RES.dirty) $('res-form').requestSubmit(); }
  });

  document.querySelectorAll('input[name=res-mode]').forEach(function (r) {
    r.addEventListener('change', function () {
      if (!confirmLeave()) { document.querySelector('input[name=res-mode][value=' + RES.mode + ']').checked = true; return; }
      RES.mode = r.value; drawRes();
    });
  });
  ['res-ind', 'res-tty', 'res-so'].forEach(function (id) {
    var prev = null;
    $(id).addEventListener('focus', function () { prev = this.value; });
    $(id).addEventListener('change', function () { if (!confirmLeave()) { this.value = prev; return; } prev = this.value; drawRes(); });
  });
  $('res-discard').addEventListener('click', function () { drawRes(); msg('res-msg', 'Changes discarded.'); });

  $('res-form').addEventListener('submit', async function (ev) {
    ev.preventDefault();
    var ups = [], dels = [], bad = null;
    resRows().forEach(function (tr) {
      if (!tr.classList.contains('changed')) return;
      var ins = tr.querySelectorAll('input'), v = ins[0], n = ins[1];
      var val = parseVal(v.value);
      if (Number.isNaN(val)) { bad = bad || v; return; }
      var note = txtOrNull(n.value);
      if (val === null && note === null) { if (tr.dataset.exists) dels.push({ key: tr.dataset.key, tty: tr.dataset.tty }); }
      else ups.push({ key: tr.dataset.key, tty: tr.dataset.tty, value: val, note: note });
    });
    if (bad) { bad.focus(); return msg('res-msg', 'Some values aren’t numbers (highlighted in red). Fix them or leave them empty.', 'err'); }
    var pctBad = ups.filter(function (u) { var d = indByKey(u.key); return d && d.unit === 'pct' && u.value != null && (u.value < 0 || u.value > 100); });
    if (pctBad.length && !confirm(pctBad.length + ' percentage value(s) are outside 0–100. Save anyway?')) return;
    if (!ups.length && !dels.length) return msg('res-msg', 'No changes to save.');
    busy(this, true); msg('res-msg', 'Saving…');
    try {
      if (ups.length) { var a = await sb.from('results').upsert(ups, { onConflict: 'key,tty' }); if (a.error) throw a.error; }
      for (var i = 0; i < dels.length; i++) {
        var b = await sb.from('results').delete().eq('key', dels[i].key).eq('tty', dels[i].tty); if (b.error) throw b.error;
      }
      var total = ups.length + dels.length;
      RES.dirty = 0;
      await loadAll();
      msg('res-msg', 'Saved ' + total + ' change' + (total === 1 ? '' : 's') + '. Each one is recorded in the change history below and in the Activity log.', 'ok');
    } catch (e) { msg('res-msg', errText(e), 'err'); }
    finally { busy(this, false); countDirty(); }
  });

  $('res-sum').addEventListener('click', async function () {
    var key = $('res-ind').value, d = indByKey(key);
    if (!d) return;
    if (d.unit === 'pct') return msg('res-msg', 'Percent indicators can’t be summed; enter the zone figure on the Indicators tab.', 'err');
    if (RES.dirty) return msg('res-msg', 'Save your changes first, then set the total.', 'err');
    var sum = DB.results.filter(function (r) { return r.key === key && r.value != null; }).reduce(function (s, r) { return s + Number(r.value); }, 0);
    if (!confirm('Set the 2026 zone total for ' + key + ' to ' + sum.toLocaleString('en-GB') + ' (sum of saved territory values)? It is ' + fmtVal(d.z2026, d.unit) + ' now.')) return;
    var r = await sb.from('indicators').update({ z2026: sum }).eq('key', key);
    if (r.error) return msg('res-msg', errText(r.error), 'err');
    await loadAll(); msg('res-msg', 'Zone 2026 total set to ' + sum.toLocaleString('en-GB') + '.', 'ok');
  });

  // History of result changes for what is on screen
  function describeResult(x) {
    var o = x.old_row || {}, n = x.new_row || {}, k = n.key || o.key, t = n.tty || o.tty, d = indByKey(k) || {};
    var parts = [];
    if (x.action === 'INSERT') parts.push('added ' + fmtVal(n.value, d.unit) + (n.note ? ' (note: ' + n.note + ')' : ''));
    else if (x.action === 'DELETE') parts.push('removed ' + fmtVal(o.value, d.unit) + (o.note ? ' (note: ' + o.note + ')' : ''));
    else {
      if (JSON.stringify(o.value) !== JSON.stringify(n.value)) parts.push(fmtVal(o.value, d.unit) + ' → ' + fmtVal(n.value, d.unit));
      if ((o.note || '') !== (n.note || '')) parts.push('note: ' + (o.note || '∅') + ' → ' + (n.note || '∅'));
      if (!parts.length) parts.push('saved (no change)');
    }
    return { item: ttyName(t) + ' · ' + k + (d.indicator ? ' ' + d.indicator : ''), change: parts.join('; ') };
  }
  async function loadResHistory() {
    var ul = $('res-hist'); ul.textContent = '';
    var q = sb.from('audit_log').select('*').eq('table_name', 'results').order('at', { ascending: false }).limit(40);
    q = RES.mode === 'ind' ? q.like('row_key', $('res-ind').value + '|%') : q.like('row_key', '%|' + $('res-tty').value);
    var r = await q;
    if (r.error) { ul.appendChild(el('li', { text: errText(r.error) })); return; }
    if (!r.data.length) { ul.appendChild(el('li', { class: 'hint-sm', text: 'No changes yet. Figures loaded from the Excel are the starting point.' })); return; }
    r.data.forEach(function (x) {
      var dsc = describeResult(x);
      ul.appendChild(el('li', {}, [el('span', { class: 'h-when', text: when(x.at) + ' · ' + (x.actor === 'postgres' ? 'setup' : (x.actor || '')) }), el('span', { class: 'h-item', text: dsc.item }), el('span', { class: 'h-chg', text: dsc.change })]));
    });
  }

  // ---------- territories ----------
  function ttyRow(t) {
    var mk = function (k, label, extra) { return el('input', Object.assign({ class: 'inp', 'aria-label': label, value: t[k] == null ? '' : t[k], 'data-k': k }, extra || {})); };
    var tr = el('tr', { 'data-orig': t.tty || '' }, [
      el('td', { 'data-label': 'Code' }, [mk('tty', 'Territory code', { maxlength: '8', style: 'max-width:110px;text-transform:uppercase' })]),
      el('td', { 'data-label': 'Name' }, [mk('territory', 'Territory name')]),
      el('td', { 'data-label': 'Countries covered' }, [mk('countries', 'Countries covered')]),
      el('td', { 'data-label': 'Order' }, [mk('sort', 'Display order', { type: 'number', style: 'max-width:90px' })]),
      el('td', {}, [el('button', { type: 'button', class: 'btn btn-danger btn-sm', text: 'Delete', 'aria-label': 'Delete ' + (t.territory || 'new territory'),
        onclick: async function () {
          if (!tr.dataset.orig) { tr.remove(); return; }
          if (!confirm('Delete ' + t.territory + ' and all its results?')) return;
          var r = await sb.from('territories').delete().eq('tty', tr.dataset.orig);
          if (r.error) return msg('tty-msg', errText(r.error), 'err');
          await loadAll(); msg('tty-msg', 'Territory deleted.', 'ok');
        } })])
    ]);
    tr.addEventListener('input', function () { tr.className = 'changed'; });
    return tr;
  }
  function drawTty() { var tb = $('tty-body'); tb.textContent = ''; DB.territories.forEach(function (t) { tb.appendChild(ttyRow(t)); }); msg('tty-msg', ''); }
  $('tty-add').addEventListener('click', function () {
    var tr = ttyRow({ sort: DB.territories.length }); tr.className = 'changed'; $('tty-body').appendChild(tr); tr.querySelector('input').focus();
  });
  $('tty-form').addEventListener('submit', async function (ev) {
    ev.preventDefault();
    var rows = Array.prototype.slice.call($('tty-body').querySelectorAll('tr.changed'));
    if (!rows.length) return msg('tty-msg', 'No changes to save.');
    busy(this, true); msg('tty-msg', 'Saving…');
    try {
      for (var i = 0; i < rows.length; i++) {
        var tr = rows[i], o = {};
        tr.querySelectorAll('input').forEach(function (inp) { o[inp.dataset.k] = inp.value.trim(); });
        o.tty = o.tty.toUpperCase(); o.sort = parseInt(o.sort, 10) || 0; o.countries = txtOrNull(o.countries);
        if (!o.tty || !o.territory) throw new Error('Each territory needs a code and a name.');
        var r = tr.dataset.orig ? await sb.from('territories').update(o).eq('tty', tr.dataset.orig) : await sb.from('territories').insert(o);
        if (r.error) throw r.error;
      }
      await loadAll(); msg('tty-msg', 'Territories saved.', 'ok');
    } catch (e) { msg('tty-msg', errText(e), 'err'); }
    finally { busy(this, false); }
  });

  // ---------- admins ----------
  function drawAdmins() {
    var ul = $('adm-list'); ul.textContent = '';
    DB.admins.forEach(function (a) {
      var self = a.email === me;
      ul.appendChild(el('li', {}, [
        el('span', {}, [a.email, self ? el('strong', { text: ' (you)' }) : null]),
        self ? null : el('button', { type: 'button', class: 'btn btn-danger btn-sm', text: 'Remove', 'aria-label': 'Remove admin ' + a.email,
          onclick: async function () {
            if (!confirm('Remove ' + a.email + ' as admin? They will lose access at their next sign-in or token refresh.')) return;
            var r = await sb.from('admins').delete().eq('email', a.email);
            if (r.error) return msg('adm-msg', errText(r.error), 'err');
            await loadAll(); msg('adm-msg', a.email + ' removed.', 'ok');
          } })
      ]));
    });
  }
  $('adm-form').addEventListener('submit', async function (ev) {
    ev.preventDefault();
    var e = $('adm-email').value.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) { $('adm-email').setAttribute('aria-invalid', 'true'); return msg('adm-msg', 'Enter a valid email address.', 'err'); }
    $('adm-email').removeAttribute('aria-invalid');
    var r = await sb.from('admins').insert({ email: e, added_by: me });
    if (r.error) return msg('adm-msg', errText(r.error), 'err');
    $('adm-email').value = ''; await loadAll(); msg('adm-msg', e + ' can now sign in.', 'ok');
  });

  // ---------- activity ----------
  var LOG = [];
  function describe(x) {
    if (x.table_name === 'results') { var d = describeResult(x); return { item: d.item, change: d.change }; }
    var o = x.old_row || {}, n = x.new_row || {};
    var label = { indicators: 'Indicator ', territories: 'Territory ', admins: 'Admin ' }[x.table_name] + (x.row_key || '');
    if (x.action === 'INSERT') return { item: label, change: 'added' };
    if (x.action === 'DELETE') return { item: label, change: 'deleted' };
    var ch = Object.keys(n).filter(function (k) { return k !== 'updated_at' && k !== 'updated_by' && JSON.stringify(o[k]) !== JSON.stringify(n[k]); })
      .map(function (k) { return k + ': ' + short(o[k]) + ' → ' + short(n[k]); }).join('; ');
    return { item: label, change: ch || 'saved (no change)' };
  }
  async function loadLog() {
    var tb = $('log-body'); tb.textContent = '';
    var q = sb.from('audit_log').select('*').order('at', { ascending: false }).limit(500);
    if ($('log-filter').value) q = q.eq('table_name', $('log-filter').value);
    if ($('log-who').value) q = q.eq('actor', $('log-who').value);
    var r = await q;
    if (r.error) { tb.appendChild(el('tr', {}, [el('td', { colspan: '4', text: errText(r.error) })])); return; }
    LOG = r.data;
    if (!LOG.length) tb.appendChild(el('tr', {}, [el('td', { colspan: '4', class: 'hint-sm', text: 'No changes recorded for this filter yet.' })]));
    LOG.forEach(function (x) {
      var d = describe(x);
      tb.appendChild(el('tr', {}, [
        el('td', { 'data-label': 'When', text: when(x.at) }), el('td', { 'data-label': 'Who', text: x.actor || '' }),
        el('td', { 'data-label': 'What changed', text: d.item }), el('td', { class: 'chg', 'data-label': 'Old → new', text: d.change })
      ]));
    });
    $('log-count').textContent = LOG.length ? 'Showing ' + LOG.length + ' change' + (LOG.length === 1 ? '' : 's') + (LOG.length === 500 ? ' (latest 500)' : '') + '.' : '';
    var who = $('log-who'), keep = who.value;
    var people = await sb.from('admins').select('email');
    who.textContent = ''; who.appendChild(el('option', { value: '', text: 'Anyone' }));
    (people.data || []).forEach(function (a) { who.appendChild(el('option', { value: a.email, text: a.email })); });
    who.value = keep;
    var s = await sb.from('signin_log').select('*').order('at', { ascending: false }).limit(30);
    var ul = $('signin-list'); ul.textContent = '';
    (s.data || []).forEach(function (x) { ul.appendChild(el('li', {}, [el('span', { text: x.email }), el('span', { class: 'hint-sm', text: (x.kind === 'signin' ? 'signed in' : 'requested a code') + ' · ' + when(x.at) })])); });
    if (!ul.children.length) ul.appendChild(el('li', { class: 'hint-sm', text: 'No sign-ins recorded in the last 30 days.' }));
  }
  function short(v) { if (v === null || v === undefined) return '∅'; v = typeof v === 'string' ? v : JSON.stringify(v); return v.length > 60 ? v.slice(0, 57) + '…' : v; }
  $('log-refresh').addEventListener('click', loadLog);
  $('log-filter').addEventListener('change', loadLog);
  $('log-who').addEventListener('change', loadLog);
  $('log-csv').addEventListener('click', function () {
    var q = function (v) { v = v == null ? '' : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var lines = [['When (UTC)', 'Who', 'Area', 'Action', 'What changed', 'Old → new'].join(',')];
    LOG.forEach(function (x) { var d = describe(x); lines.push([x.at, x.actor, x.table_name, x.action, d.item, d.change].map(q).join(',')); });
    var a = el('a', { href: URL.createObjectURL(new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv' })), download: 'azf-activity-log.csv' });
    document.body.appendChild(a); a.click(); setTimeout(function () { a.remove(); }, 500);
  });

  // ---------- export ----------
  function snapshot() {
    var num = function (v) { return v == null ? null : Number(v); };
    return {
      source: 'AZF admin database export',
      built: new Date().toISOString().slice(0, 10),
      outcomes: { P: 'Goal & Purpose', '1': 'Quality education & employment skills', '2': 'Reduced disease burden', '3': 'Economic inclusion', '4': 'Safe environments for all' },
      territories: DB.territories.map(function (t) { return { tty: t.tty, territory: t.territory, countries: t.countries }; }),
      indicators: DB.indicators.map(function (d) { return { key: d.key, so: d.so, er: d.er || '', er_name: d.er_name || '', indicator: d.indicator, full: d.full_text || d.indicator, unit: d.unit, z2025: num(d.z2025), z2026: num(d.z2026), z2026_note: d.z2026_note, sdg: d.sdg, global_manual: d.global_manual }; }),
      results: DB.results.map(function (r) { return { key: r.key, tty: r.tty, value: num(r.value), note: r.note }; })
    };
  }
  function download(name, text, type) {
    var a = el('a', { href: URL.createObjectURL(new Blob([text], { type: type })), download: name });
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    msg('exp-msg', name + ' downloaded.', 'ok');
  }
  $('exp-js').addEventListener('click', function () { download('azf-data.js', '/* Exported from the AZF admin console. */\nwindow.AZF_DATA = ' + JSON.stringify(snapshot(), null, 1) + ';\n', 'text/javascript'); });
  $('exp-json').addEventListener('click', function () { download('azf-data.json', JSON.stringify(snapshot(), null, 1), 'application/json'); });
  $('exp-csv').addEventListener('click', function () {
    var q = function (v) { v = v == null ? '' : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var ttys = DB.territories.map(function (t) { return t.tty; });
    var lines = [['Ref', 'Outcome', 'Indicator', 'Unit', 'Zone 2025', 'Zone 2026'].concat(ttys).map(q).join(',')];
    DB.indicators.forEach(function (d) {
      lines.push([d.key, d.so, d.indicator, d.unit, d.z2025, d.z2026].concat(ttys.map(function (t) {
        var r = DB.results.find(function (x) { return x.key === d.key && x.tty === t; }); return r ? (r.value != null ? r.value : r.note) : '';
      })).map(q).join(','));
    });
    download('azf-results.csv', '﻿' + lines.join('\r\n'), 'text/csv');
  });

  // ---------- start ----------
  sb.auth.getSession().then(function (r) {
    // A sign-in link lands here with tokens or an error in the address; tidy the address afterwards.
    var h = location.hash || '';
    if (/error_description=/.test(h)) {
      var m = decodeURIComponent((/error_description=([^&]+)/.exec(h) || [])[1] || '').replace(/\+/g, ' ');
      try { history.replaceState(null, '', location.pathname); } catch (e) { /* ignore */ }
      showSignin(); msg('email-msg', (m || 'That sign-in link did not work') + '. Please request a new code.', 'err'); return;
    }
    if (/access_token=/.test(h)) { try { history.replaceState(null, '', location.pathname); } catch (e) { /* ignore */ } }
    if (r.data && r.data.session) enter(r.data.session); else showSignin();
  });
  sb.auth.onAuthStateChange(function (event) { if (event === 'SIGNED_OUT' && me) { me = null; showSignin('Your session ended. Please sign in again.'); } });
})();
