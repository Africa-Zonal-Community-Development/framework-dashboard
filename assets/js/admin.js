/* AZF dashboard — admin console.
   Sign-in: approved admin email -> one-time code by email -> session.
   Limits: 5 code requests and 5 sign-ins per email per hour (enforced in the database).
   Editing: Row Level Security only lets emails in public.admins write. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var C = window.AZF_CONFIG;
  var sb = window.supabase.createClient(C.supabaseUrl, C.supabaseKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: 'azf-admin-auth' }
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
  function numOrNull(v) { v = String(v == null ? '' : v).trim(); if (v === '') return null; var n = Number(v.replace(/[’',\s]/g, '')); return isNaN(n) ? NaN : n; }
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
      var s = await sb.auth.signInWithOtp({ email: email, options: { shouldCreateUser: true } });
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
  function drawResSelect() {
    var s = $('res-ind'), keep = s.value || curKey;
    s.textContent = '';
    DB.indicators.forEach(function (d) { s.appendChild(el('option', { value: d.key, text: d.key + ' — ' + d.indicator })); });
    if (keep && indByKey(keep)) s.value = keep;
  }
  function drawRes() {
    var key = $('res-ind').value, d = indByKey(key), tb = $('res-body');
    tb.textContent = '';
    if (!d) return;
    $('res-hint').textContent = d.unit === 'pct' ? 'Percent indicator: enter 0–100 (e.g. 85 for 85%).' : d.unit === 'tty' ? 'Territory-count indicator: enter 1 if the territory meets it.' : d.unit === 'text' ? 'Qualitative indicator: use the note column.' : 'Count indicator: enter whole numbers.';
    DB.territories.forEach(function (t) {
      var r = DB.results.find(function (x) { return x.key === key && x.tty === t.tty; }) || {};
      var v = el('input', { class: 'inp', type: 'text', inputmode: 'decimal', 'aria-label': t.territory + ' value', value: r.value == null ? '' : r.value, 'data-orig': r.value == null ? '' : r.value });
      var n = el('input', { class: 'inp', type: 'text', 'aria-label': t.territory + ' note', value: r.note || '', 'data-orig': r.note || '' });
      var tr = el('tr', { 'data-tty': t.tty, 'data-exists': r.key ? '1' : '' }, [
        el('td', { class: 'tname', text: t.territory + ' (' + t.tty + ')' }),
        el('td', { 'data-label': 'Value' }, [v]),
        el('td', { 'data-label': 'Note' }, [n])
      ]);
      var mark = function () { tr.className = (v.value !== v.dataset.orig || n.value !== n.dataset.orig) ? 'changed' : ''; };
      v.addEventListener('input', mark); n.addEventListener('input', mark);
      tb.appendChild(tr);
    });
    msg('res-msg', '');
  }
  $('res-ind').addEventListener('change', drawRes);
  $('res-form').addEventListener('submit', async function (ev) {
    ev.preventDefault();
    var key = $('res-ind').value, ups = [], dels = [], bad = null;
    $('res-body').querySelectorAll('tr').forEach(function (tr) {
      var ins = tr.querySelectorAll('input'), v = ins[0], n = ins[1];
      if (v.value === v.dataset.orig && n.value === n.dataset.orig) return;
      var val = numOrNull(v.value);
      if (Number.isNaN(val)) { bad = bad || v; v.setAttribute('aria-invalid', 'true'); return; }
      v.removeAttribute('aria-invalid');
      var note = txtOrNull(n.value);
      if (val === null && note === null) { if (tr.dataset.exists) dels.push(tr.dataset.tty); }
      else ups.push({ key: key, tty: tr.dataset.tty, value: val, note: note });
    });
    if (bad) { bad.focus(); return msg('res-msg', 'Values must be numbers (leave blank if not reported).', 'err'); }
    if (!ups.length && !dels.length) return msg('res-msg', 'No changes to save.');
    busy(this, true); msg('res-msg', 'Saving…');
    try {
      if (ups.length) { var a = await sb.from('results').upsert(ups, { onConflict: 'key,tty' }); if (a.error) throw a.error; }
      if (dels.length) { var b = await sb.from('results').delete().eq('key', key).in('tty', dels); if (b.error) throw b.error; }
      await loadAll(); $('res-ind').value = key; drawRes();
      msg('res-msg', 'Saved ' + (ups.length + dels.length) + ' change' + (ups.length + dels.length === 1 ? '' : 's') + '.', 'ok');
    } catch (e) { msg('res-msg', errText(e), 'err'); }
    finally { busy(this, false); }
  });
  $('res-sum').addEventListener('click', async function () {
    var key = $('res-ind').value, d = indByKey(key);
    if (!d) return;
    if (d.unit === 'pct') return msg('res-msg', 'Percent indicators can’t be summed; enter the zone figure on the Indicators tab.', 'err');
    var sum = DB.results.filter(function (r) { return r.key === key && r.value != null; }).reduce(function (s, r) { return s + Number(r.value); }, 0);
    if (!confirm('Set the 2026 zone total for ' + key + ' to ' + sum.toLocaleString() + ' (sum of saved territory values)?')) return;
    var r = await sb.from('indicators').update({ z2026: sum }).eq('key', key);
    if (r.error) return msg('res-msg', errText(r.error), 'err');
    await loadAll(); $('res-ind').value = key; drawRes(); msg('res-msg', 'Zone 2026 total set to ' + sum.toLocaleString() + '.', 'ok');
  });

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
  async function loadLog() {
    var tb = $('log-body'); tb.textContent = '';
    var r = await sb.from('audit_log').select('*').order('at', { ascending: false }).limit(200);
    if (r.error) { tb.appendChild(el('tr', {}, [el('td', { colspan: '5', text: errText(r.error) })])); return; }
    if (!r.data.length) tb.appendChild(el('tr', {}, [el('td', { colspan: '5', class: 'hint-sm', text: 'No changes yet.' })]));
    r.data.forEach(function (x) {
      var change = '';
      if (x.action === 'UPDATE' && x.old_row && x.new_row) {
        change = Object.keys(x.new_row).filter(function (k) { return k !== 'updated_at' && k !== 'updated_by' && JSON.stringify(x.old_row[k]) !== JSON.stringify(x.new_row[k]); })
          .map(function (k) { return k + ': ' + short(x.old_row[k]) + ' → ' + short(x.new_row[k]); }).join('; ');
      } else if (x.action === 'INSERT') change = 'added';
      else if (x.action === 'DELETE') change = 'deleted';
      tb.appendChild(el('tr', {}, [
        el('td', { 'data-label': 'When', text: when(x.at) }), el('td', { 'data-label': 'Who', text: x.actor || '' }),
        el('td', { 'data-label': 'What', text: x.table_name + ' · ' + x.action.toLowerCase() }), el('td', { 'data-label': 'Item', text: x.row_key || '' }),
        el('td', { class: 'chg', 'data-label': 'Change', text: change })
      ]));
    });
    var s = await sb.from('signin_log').select('*').order('at', { ascending: false }).limit(30);
    var ul = $('signin-list'); ul.textContent = '';
    (s.data || []).forEach(function (x) { ul.appendChild(el('li', {}, [el('span', { text: x.email }), el('span', { class: 'hint-sm', text: (x.kind === 'signin' ? 'signed in' : 'requested a code') + ' · ' + when(x.at) })])); });
    if (!ul.children.length) ul.appendChild(el('li', { class: 'hint-sm', text: 'No sign-ins recorded in the last 30 days.' }));
  }
  function short(v) { if (v === null || v === undefined) return '∅'; v = typeof v === 'string' ? v : JSON.stringify(v); return v.length > 60 ? v.slice(0, 57) + '…' : v; }
  $('log-refresh').addEventListener('click', loadLog);

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
  sb.auth.getSession().then(function (r) { if (r.data && r.data.session) enter(r.data.session); else showSignin(); });
  sb.auth.onAuthStateChange(function (event) { if (event === 'SIGNED_OUT' && me) { me = null; showSignin('Your session ended. Please sign in again.'); } });
})();
