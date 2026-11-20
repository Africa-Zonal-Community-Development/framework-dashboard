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

## Stories of change page

`stories.html` (the **Stories of change** tab) presents the *Consolidated Assessment of 24 Stories, 2026* (indicator 02):

- **Hypothesis and verdict:** "reducing vulnerabilities leads to long-term transformation", with very strong qualitative support.
- **Eight pathways explorer:** select a pathway to see its inputs, its three-step chain of change, and the stories cited. It also shows the **framework indicators that measure that pathway, with live 2026 and 2025 zone figures**, each linking back to the dashboard. Disability inclusion is flagged as having no dedicated indicator yet.
- **Outcomes word cloud:** select an outcome (for example *Savings*) to highlight the pathways that produce it.
- **Six evidence themes,** each tagged with its Strategic Outcome.
- **From recipients to role models,** the original graphics from the Word document (click to enlarge), and a note on the evidence (AI-generated synthesis, qualitative, follow-up needed).

The narrative is kept in `assets/js/stories.js` (`PW`, `THEMES`, `WORDS`). The figures come from the same database as the dashboard.

## Share button and 2-page summary

- **Share this dashboard** (button under the dashboard introduction): opens the phone's share sheet, or copies the link on a computer. The link keeps the current view, such as a selected outcome, territory or pathway.
- **Download 2-page summary** (button under the dashboard introduction) downloads the PDF. `summary.html` is the printable version with live figures: page 1 covers the results dashboard (headline figures, highlights by Strategic Outcome, reach and reporting by territory, notes). Page 2 covers the stories of change (hypothesis, the eight pathways each with a measured indicator, evidence themes, outcomes and roles, caveats). It renders from live figures, and **Print / save as PDF** produces exactly two A4 pages. `assets/AZF-2026-summary.pdf` is a ready-made copy, which needs regenerating if the figures change.

## Admin console (sign in and edit)

`admin.html` (linked as **Admin sign in** in the page footer) lets approved admins edit everything:
- indicators: labels, outcome, expected result, type, 2025 and 2026 zone totals, notes, SDGs;
- the figure and note for every territory;
- the territory list;
- the admin list.

It also shows an activity log of every change and has exports (`azf-data.js`, JSON, CSV).

**Entering results** (Territory results tab) works in two ways:
- **One indicator, all territories:** fill in a column across the zone, then optionally set the zone total to the sum.
- **One territory, all indicators:** type in a whole territory report at once, filtered by outcome.

Numbers can be typed as `143468`, `143,468`, `143'468` or `85%`. **Enter** moves down a row, and **Ctrl/Cmd + S** saves. Changed rows are highlighted until saved, invalid values are flagged, and the page warns before you leave with unsaved changes.

**Every result change is logged** automatically in the database (`audit_log`) with who made it, when, and the old and new values. The log appears under the form ("Change history for these results") and in the **Activity log** tab, which you can filter by area or person and download as CSV.

- **Sign-in:** enter an approved email, receive a one-time code by email, and type it in. There are no passwords.
- **Admins:** `dns.brns15@gmail.com` and `sarahmakanjera@gmail.com`. Admins can add or remove others in the console.
- **Limits:** each email gets 5 code requests and 5 sign-ins per hour, enforced in the database (`request_signin_code`, `admin_access_token_hook`).
- **Security:** Row Level Security means anyone can read, but only emails in `public.admins` can write. Every change is recorded in `public.audit_log`.
- **Backend:** the Supabase project *AZF Framework Dashboard* (`qrupztbikmjnjytxtfso`, organisation ASLP). The connection details are in `assets/js/config.js`. The publishable key there is meant to be public.

The public dashboard reads the live database, so saved edits appear on the next page load. If the database can't be reached, the page falls back to the bundled snapshot in `data/azf-data.js`.

### One-time Supabase setup (dashboard settings)

These settings can't be made from code. They are done once in the Supabase dashboard for the project:

1. **Send codes instead of links.** Go to **Authentication → Emails → Templates → Magic Link**. Set the subject to `Your AZF dashboard sign-in code` and the body to:
   `<h2>Your sign-in code</h2><p>Enter this code to sign in to the AZF dashboard admin console:</p><p style="font-size:28px;letter-spacing:4px"><strong>{{ .Token }}</strong></p><p>If you didn't request this, ignore this email.</p>`
2. **Turn on the server-side checks.** Go to **Authentication → Hooks**:
   - **Customize Access Token** → Postgres → `public.admin_access_token_hook` (admins only, 5 sign-ins per hour).
   - **Before User Created** → Postgres → `public.admin_only_signup_hook` (blocks accounts for non-admin emails).
3. **Email delivery.** Supabase's built-in email only sends to members of the Supabase organisation's team, and only a few emails per hour. To email any admin, set up custom SMTP under **Authentication → Emails → SMTP Settings** (for example Resend, Brevo, or a Gmail app password). The alternative is to invite each admin to the Supabase organisation.
4. **URL configuration.** Under **Authentication → URL Configuration**, set the Site URL to `https://africa-zonal-community-development.github.io/framework-dashboard/`.

## Updating the bundled snapshot

The page falls back to `data/azf-data.js`. You can refresh it in two ways:
- From the admin console: **Export → Download azf-data.js**, then commit that file to `data/`.
- From an Excel export:

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
`https://africa-zonal-community-development.github.io/framework-dashboard/`.

The site is plain HTML, CSS and JavaScript with no build step and no external libraries. It also works when `index.html` is opened directly from a downloaded copy.

## Notes on the data

- Territory names and coverage follow the Africa Zone listing on salvationarmy.org. Burundi and Rwanda are kept as separate columns, as in the sheet.
- Percentages are stored on a 0–100 scale. Change is shown as % for counts and as percentage points for % indicators.
- The sheet's first "2025" column, which is filled for only three indicators, is not used.
- Several 2026 figures are provisional where exams were still being written. Some large year-on-year swings (for example 2.1.2 and 2.1.3) are worth checking with territories before publishing.
