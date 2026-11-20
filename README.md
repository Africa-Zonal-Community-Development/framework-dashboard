# Africa Zonal Community Development Framework — 2026 Results Dashboard

An interactive, mobile-friendly dashboard of the **2026 results submitted by territory** for The Salvation Army Africa Zone's Community Development Framework (AZF). It is styled after the *TSA African Zone Framework Data update 2026* deck: the framework wheel, the navy wave, and one colour per Strategic Outcome.

## What it shows

- **Headline figures:** individuals reached, schools operated, people reached by health prevention, savings-group members and people sensitised on gender, each compared with 2025.
- **Framework wheel and outcome filters:** tap a petal (or a button) to filter the whole page to one Strategic Outcome.
- **Indicator results:** all 71 indicators grouped by Expected Result, with 2025 and 2026 zone totals, the change, territories reporting, and the figure for a chosen territory.
- **Results by territory:** a ranked chart for the selected indicator, with the notes territories gave in the sheet.
- **Reporting map:** every indicator against every territory.
- **Reporting coverage and territory profile.**
- **Stories of change:** the synthesis of the 24 stories (indicator 02).

Selections are kept in the address bar (for example `#so=2&tty=KYW&ind=2.1.1`), so a link opens on the same view.

## Accessibility and mobile

- The layout works from 320 px phones to wide screens. On phones the indicator table becomes stacked cards, and the reporting map scrolls sideways with the indicator names pinned.
- Charts are built from real HTML text and buttons, not images, so screen readers read every value.
- Everything works by keyboard. The reporting map is one tab stop: use the arrow keys, Home and End to move between cells.
- The page has a skip link, landmarks, table captions, `aria-pressed` toggles and a live region that announces each selection.
- Touch targets are at least 44 px, focus outlines are visible, and the page respects reduced motion and Windows high-contrast mode.
- The page passes an automated axe-core audit (WCAG 2.1 A/AA and best practice) with no violations.

## Updating the data

The page reads `data/azf-data.js`, which is generated from the Excel export:

```bash
pip install openpyxl
python3 scripts/build_data.py "Overview_AZF_results_submitted_for_2026_by_Territory.xlsx"
```

The script expects the sheet layout of the v19112026 file:
- column F holds the indicator text;
- columns I and J hold the 2025 and 2026 reported results;
- columns K–AB hold the territories, ANG … ZIM.

It writes both `data/azf-data.js`, used by the page, and `data/azf-data.json`, for reuse elsewhere. Commit the regenerated files and the site updates.

## Publishing on GitHub Pages

Go to **Settings → Pages**, choose **Deploy from a branch**, then **`main`** and **`/ (root)`**. The site then appears at
`https://africa-zonal-community-development.github.io/fraework-dashboard/`.

The site is plain HTML, CSS and JavaScript with no build step and no external libraries. It also works when `index.html` is opened directly from a downloaded copy.

## Notes on the data

- Territory names and coverage follow the Africa Zone listing on salvationarmy.org. Burundi and Rwanda are kept as separate columns, as in the sheet.
- Percentages are stored on a 0–100 scale. Change is shown as % for counts and as percentage points for % indicators.
- The sheet's first "2025" column, which is filled for only three indicators, is not used.
- Several 2026 figures are provisional where exams were still being written. Some large year-on-year swings (for example 2.1.2 and 2.1.3) are worth checking with territories before publishing.
