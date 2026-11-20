#!/usr/bin/env python3
"""Convert 'Overview AZF results submitted ... by Territory' Excel into data/azf-data.js.

Usage:  python3 scripts/build_data.py path/to/Overview_AZF_results.xlsx
Needs:  pip install openpyxl
"""
import json, re, sys, datetime, pathlib
import openpyxl

ROOT = pathlib.Path(__file__).resolve().parent.parent
TERRITORIES = {
 'ANG': ('Angola', 'Angola'),
 'BUR': ('Burundi', 'Burundi (Rwanda & Burundi Territory)'),
 'CON': ('Congo (Brazzaville)', 'Congo-Brazzaville, Gabon'),
 'DRC': ('DR Congo', 'Democratic Republic of Congo'),
 'GHA': ('Ghana', 'Ghana, Togo'),
 'KYE': ('Kenya East', 'Kenya'),
 'KYW': ('Kenya West', 'Kenya'),
 'LIB': ('Liberia, Sierra Leone & Guinea', 'Liberia, Sierra Leone, Guinea'),
 'MALI': ('Mali & Burkina Faso', 'Mali, Burkina Faso (Region)'),
 'MAL': ('Malawi', 'Malawi'),
 'MOZ': ('Mozambique', 'Mozambique'),
 'NIG': ('Nigeria', 'Nigeria'),
 'RWA': ('Rwanda', 'Rwanda (Rwanda & Burundi Territory)'),
 'SAF': ('Southern Africa', 'South Africa, Lesotho, Namibia, Eswatini, St Helena'),
 'TNZ': ('Tanzania', 'Tanzania'),
 'UGA': ('Uganda', 'Uganda'),
 'ZAM': ('Zambia', 'Zambia'),
 'ZIM': ('Zimbabwe & Botswana', 'Zimbabwe, Botswana, Madagascar'),
}
OUTCOMES = {'P': 'Goal & Purpose', '1': 'Quality education & employment skills', '2': 'Reduced disease burden',
            '3': 'Economic inclusion', '4': 'Safe environments for all'}
# Column layout of the sheet (0-based)
COL_B, COL_C, COL_SDG, COL_NR, COL_IND, COL_GM, COL_Z25, COL_Z26, COL_T0 = 1, 2, 3, 4, 5, 6, 8, 9, 10

def num(v):
    """Return (number|None, note|None) from a cell like 1'076'860, 0.85, '64% (note)'."""
    if v is None: return None, None
    if isinstance(v, (int, float)): return float(v), None
    s = str(v).strip()
    if not s: return None, None
    if re.match(r'^(no data|nodata|not collected|no data collected yet)$', s, re.I): return None, s
    m = re.match(r"^([\d']+(?:\.\d+)?)\s*(%?)", s)
    if m:
        n = float(m.group(1).replace("'", ''))
        if m.group(2): n /= 100
        rest = re.sub(r'\s+', ' ', s[m.end():]).strip()
        return n, rest or None
    return None, re.sub(r'\s+', ' ', s)

def clean_key(raw, so, seq, text):
    k = (str(raw).strip() if raw is not None else '')
    if not k:
        low = text.lower()
        if 'water' in low: return '2.2-water'
        if 'sanitation' in low: return '2.2-sanitation'
        return f'{so}-x{seq}'
    k = k.split('/')[0].strip().rstrip('.') or k.replace('/', '').strip()
    return k

def unit_of(text):
    low = text.lower().lstrip(' -')
    if low.startswith(('%', 'ratio', 'a) %')): return 'pct'
    if '# of territories' in low or 'nr of territories' in low: return 'tty'
    if low.startswith(('stories', 'anecdotal', 'number of long-term case')): return 'text'
    return 'count'

def short_label(text):
    s = re.split(r'\s\(|\(', text)[0].strip().rstrip('.:')
    s = re.sub(r'^# number of', '# of', s)
    s = re.sub(r'^(-\s*%|a\) %)', '%', s).strip()
    return s[0].upper() + s[1:] if s[:1].isalpha() else s

def main(path):
    ws = openpyxl.load_workbook(path, data_only=True).active
    rows = list(ws.iter_rows(values_only=True))
    codes = [str(c).strip() for c in rows[0][COL_T0:COL_T0 + 18]]
    inds, res = [], []
    so, er, ern, pending, seq = 'P', '', '', None, 0
    for r in rows[1:]:
        b = r[COL_B].strip() if isinstance(r[COL_B], str) else r[COL_B]
        c = r[COL_C]
        if b:
            bs = str(b).upper()
            if bs.startswith('PURPOSE'): so, er, ern = 'P', '', ''
            elif bs.startswith(('STRATEGIC OUTCOME', 'SO ')): so, er, ern = re.findall(r'\d', bs)[0], '', ''
            elif bs.startswith('EXPECTED RESULT'):
                er = re.findall(r'[\d.]+', bs)[0]; ern = (c or pending or '').strip(); pending = None
        elif c and r[COL_IND]:
            pending = c
        ind = r[COL_IND]
        if not ind or not str(ind).strip(): continue
        seq += 1
        full = re.sub(r'\s+', ' ', str(ind)).strip()
        unit = unit_of(full)
        key = clean_key(r[COL_NR], so, seq, full)
        z25, n25 = num(r[COL_Z25]); z26, n26 = num(r[COL_Z26])
        if unit == 'text':
            z25 = z26 = None
            n26 = re.sub(r'\n{2,}', '\n', str(r[COL_Z26]).strip()) if r[COL_Z26] else None
        if unit == 'pct':
            z25 = None if z25 is None else round(z25 * 100, 1)
            z26 = None if z26 is None else round(z26 * 100, 1)
        for i, cd in enumerate(codes):
            v, nt = num(r[COL_T0 + i])
            if v is None and nt is None: continue
            if unit == 'pct' and v is not None: v = round(v * 100, 1)
            res.append({'key': key, 'tty': cd, 'value': v, 'note': nt})
        inds.append({'key': key, 'so': so, 'er': er, 'er_name': ern, 'indicator': short_label(full), 'full': full,
                     'unit': unit, 'z2025': z25, 'z2026': z26, 'z2026_note': n26,
                     'sdg': str(r[COL_SDG]).strip() if r[COL_SDG] else None,
                     'global_manual': re.sub(r'\s+', ' ', str(r[COL_GM])).strip() if r[COL_GM] else None})
    for d in inds:  # sheet puts the ER 3.3 label one row late
        if d['key'] == '3.3.1': d['er'] = '3.3'
        if d['key'].startswith('3.3.'): d['er_name'] = 'Resilience to the effects of climate change'
    keys = [d['key'] for d in inds]
    dup = {k for k in keys if keys.count(k) > 1}
    if dup: sys.exit(f'Duplicate indicator refs: {dup}')
    data = {
        'source': pathlib.Path(path).name,
        'built': datetime.date.today().isoformat(),
        'outcomes': OUTCOMES,
        'territories': [{'tty': c, 'territory': TERRITORIES[c][0], 'countries': TERRITORIES[c][1]} for c in codes],
        'indicators': inds,
        'results': res,
    }
    out = ROOT / 'data' / 'azf-data.js'
    out.write_text('/* Generated by scripts/build_data.py - do not edit by hand. */\nwindow.AZF_DATA = '
                   + json.dumps(data, ensure_ascii=False, indent=1) + ';\n', encoding='utf-8')
    (ROOT / 'data' / 'azf-data.json').write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'Wrote {out.relative_to(ROOT)}: {len(inds)} indicators, {len(res)} territory values')

if __name__ == '__main__':
    if len(sys.argv) != 2: sys.exit(__doc__)
    main(sys.argv[1])
