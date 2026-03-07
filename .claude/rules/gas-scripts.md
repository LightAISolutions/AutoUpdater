---
paths:
  - "googleAppsScripts/**/*.gs"
  - "googleAppsScripts/**/*.config.json"
  - "live-site-pages/gs-versions/**"
  - "live-site-pages/**/*.html"
  - "live-site-pages/*-code.js.txt"
---

# Google Apps Script Rules

*Actionable rules: see Pre-Commit Checklist items #1, #15 in CLAUDE.md.*

## Version Bumping

- The `VERSION` variable is near the top of each `.gs` file (look for `var VERSION = "..."`)
- Format includes a `g` suffix: e.g. `"01.13g"` → `"01.14g"`
- Each GAS project also has a `<page-name>gs.version.txt` in `live-site-pages/gs-versions/` that mirrors the `VERSION` variable value (e.g. `01.00g`). This file is bumped alongside `VERSION` by Pre-Commit #1. There is no copy in `googleAppsScripts/` — the `live-site-pages/gs-versions/` file is the single location, polled by the HTML layer for GAS version display
- Do NOT bump VERSION if the commit doesn't touch the `.gs` file

### GAS Projects
Each GAS project has a code file and a corresponding embedding page. Register them in the table below as you add them. *For step-by-step instructions on adding a new GAS deploy step to the workflow, see the "HOW TO ADD A NEW GAS PROJECT" comment block at the top of `.github/workflows/auto-merge-claude.yml`.*

| Project | Code File | Config File | Embedding Page |
|---------|-----------|-------------|----------------|
| Index | `googleAppsScripts/Index/index.gs` | `googleAppsScripts/Index/index.config.json` | `live-site-pages/index.html` |


## GAS Project Config (config.json)

Each GAS project directory contains a `<page-name>.config.json` file that is the **single source of truth** for project-unique variables. This mirrors the `version.txt` pattern — one small file to edit, with sync rules that propagate values to `<page-name>.gs` and the embedding HTML page.

### Naming convention
All GAS files are named after the HTML page they serve — mirroring the `indexhtml.version.txt` pattern:
- `index.gs` — GAS code for `index.html`
- `index.config.json` — config for `index.html`
- `dashboard.gs` — GAS code for `dashboard.html`
- `dashboard.config.json` — config for `dashboard.html`

The `.config.json` double extension ensures the config file sorts **after** the `.gs` file alphabetically (same reasoning as `html.version.txt` sorting after `.html`).

### Config file contents

| Key | Description | Syncs to |
|-----|-------------|----------|
| `TITLE` | Project title shown in browser tabs and GAS UI | `<page-name>.gs` `var TITLE`, HTML `<title>` tag |
| `DEPLOYMENT_ID` | GAS deployment ID (`AKfycb...` string) | `<page-name>.gs` `var DEPLOYMENT_ID`, HTML `var _e` inside GAS IIFE (reverse+base64 encoded) |
| `SPREADSHEET_ID` | Google Sheets ID for version tracking | `<page-name>.gs` `var SPREADSHEET_ID` |
| `SHEET_NAME` | Sheet tab name | `<page-name>.gs` `var SHEET_NAME` |
| `SOUND_FILE_ID` | Google Drive file ID for deploy notification sound | `<page-name>.gs` `var SOUND_FILE_ID` |

### What is NOT in config.json
- `VERSION` — auto-bumped by Pre-Commit item #1, lives only in `<page-name>.gs`
- `GITHUB_OWNER`, `GITHUB_REPO`, `FILE_PATH` — derived from repo structure, managed by init script
- `EMBED_PAGE_URL`, `SPLASH_LOGO_URL` — repo-wide settings, managed by init script
- `GITHUB_BRANCH` — always `main`

### Obfuscated deployment URL (var _e inside GAS IIFE)
The encoded deployment URL lives in `var _e` inside the GAS iframe IIFE — not as a global variable. This keeps it out of the browser console and DevTools Sources panel. The decode logic is inline (no named function). Derivation from `DEPLOYMENT_ID`:
- If `DEPLOYMENT_ID` is not a placeholder:
  1. Construct the full URL: `https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec`
  2. Reverse the URL string
  3. Base64-encode the reversed string
  4. Store as `var _e = 'encoded_value';` inside the GAS IIFE
- If `DEPLOYMENT_ID` is a placeholder (`YOUR_DEPLOYMENT_ID`) → `var _e = '';` (empty, IIFE exits early)

To generate via command line: `echo -n 'https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec' | rev | base64 -w0`

The inline decode reverses this: `atob()` then string-reverse. The iframe is created dynamically via srcdoc trampoline (no `src` attribute set). This is obfuscation, not security — the Network tab still shows the URL

### Template config
The setup script (`scripts/setup-gas-project.sh`) generates config.json files inline with placeholder values when creating new projects — there is no separate template config file to maintain.

## Commit Message Naming
*Rule: see Pre-Commit Checklist item #9 in CLAUDE.md.*
- All version types use the `v` prefix — suffix indicates type: `r` = repository, `g` = Google Apps Script, `w` = website
- The **push commit** (final commit before `git push`) starts with the repo version prefix (`v01.XXr`) since repo version bumps on the push commit
- When `.gs` or HTML versions are also bumped on the push commit, append them in order: `r`, `g`, `w`
- **Intermediate commits** (earlier commits in the same session) use `g`/`w` prefixes only if those versions were bumped on that commit; otherwise, use a plain descriptive message
- Push commit examples:
  - `v01.05r Fix typo in CLAUDE.md` (repo-only change)
  - `v01.06r v01.19g Fix sign-in popup to auto-close after authentication`
  - `v01.07r v01.19g v01.12w Add auth wall with build version bump`
- Intermediate commit examples:
  - `v01.14g Fix sign-in popup timing` (GAS change, no repo version)
  - `v01.02w Update page layout` (HTML change, no repo version)
  - `Fix typo in CLAUDE.md` (no version bumps at all)
- SHA backfill commit: always uses `Backfill CHANGELOG SHA` — no version prefix, exempt from all push commit rules (see Pre-Commit #7)

## Coding Guidelines Reference

Domain-specific coding constraints are maintained in a dedicated reference file. Consult these when working on the relevant feature area:

| Topic | Reference |
|-------|-----------|
| GAS Code Constraints | *See `repository-information/CODING-GUIDELINES.md` — section "GAS Code Constraints"* |
| Race Conditions — Config vs. Data Fetch | *See `repository-information/CODING-GUIDELINES.md` — section "Race Conditions — Config vs. Data Fetch"* |
| API Call Optimization (Scaling Goal) | *See `repository-information/CODING-GUIDELINES.md` — section "API Call Optimization (Scaling Goal)"* |
| UI Dialogs — No Browser Defaults | *See `repository-information/CODING-GUIDELINES.md` — section "UI Dialogs — No Browser Defaults"* |
| AudioContext & Browser Autoplay Policy | *See `repository-information/CODING-GUIDELINES.md` — section "AudioContext & Browser Autoplay Policy"* |
| Google Sign-In (GIS) for GAS Embedded Apps | *See `repository-information/CODING-GUIDELINES.md` — section "Google Sign-In (GIS) for GAS Embedded Apps"* |
| GCP Project Setup & Troubleshooting | *See `repository-information/CODING-GUIDELINES.md` — section "GCP Project Setup & Troubleshooting"* |
| Testation7 | `googleAppsScripts/Testation7/testation7.gs` | `googleAppsScripts/Testation7/testation7.config.json` | `live-site-pages/testation7.html` |
| Testation8 | `googleAppsScripts/Testation8/testation8.gs` | `googleAppsScripts/Testation8/testation8.config.json` | `live-site-pages/testation8.html` |

## GAS Architecture Overview

### What This Is
A Google Apps Script web app that pulls its own source code from a GitHub repository and redeploys itself. GitHub is the source of truth — the `.gs` file is the ONLY file you need to edit.

Updates reach the live web app via webhook:
Push to a `claude/*` branch → GitHub Action merges to main → workflow calls `doPost(action=deploy)` → GAS pulls + deploys itself

### Page Reload (Embedding Solution)
The GAS sandbox iframe blocks programmatic navigation from async callbacks. Solution: embed the web app as a full-screen iframe on a GitHub Pages page. The embedding page polls a version file on GitHub Pages to detect updates and reloads automatically.

### Architecture — Dynamic Loader Pattern
- `doGet()` serves a STATIC HTML shell (never changes)
- All visible content is fetched at runtime via `getAppData()`
- `getAppData()` returns `{version, title}` → `applyData()` updates DOM
- After a pull, `getAppData()` runs on the NEW server code
- This bypasses Google's aggressive server-side HTML caching

### Auto-Deploy Flow (push → live in ~30 seconds)
1. Claude Code pushes to `claude/*` branch
2. GitHub Action merges to main
3. GitHub Action calls `doPost(action=deploy)`
4. `doPost()` calls `pullAndDeployFromGitHub()` directly
5. GAS pulls new code from GitHub, overwrites project, deploys
6. Embedding page detects version change via `gs.version.txt` polling
7. App shows new version — zero manual clicks

### Version Limit Management (200 Version Cap)
Apps Script has a hard 200 version limit. The API does NOT support deleting versions. When 180+ is reached, a warning appears. Manually clean up: Apps Script editor → Project History → Bulk delete.

### Setup Steps
1. Create an Apps Script project, paste the code
2. Enable "Show appsscript.json" in Project Settings, set contents:
   ```json
   {
     "timeZone": "America/New_York",
     "runtimeVersion": "V8",
     "dependencies": {},
     "webapp": {
       "executeAs": "USER_DEPLOYING",
       "access": "ANYONE_ANONYMOUS"
     },
     "exceptionLogging": "STACKDRIVER",
     "oauthScopes": [
       "https://www.googleapis.com/auth/script.projects",
       "https://www.googleapis.com/auth/script.external_request",
       "https://www.googleapis.com/auth/script.deployments",
       "https://www.googleapis.com/auth/spreadsheets",
       "https://www.googleapis.com/auth/script.send_mail"
     ]
   }
   ```
3. Create or use a GCP project where you have Owner access
4. Enable Apps Script API in GCP project (APIs & Services → Library)
5. Link GCP project in Apps Script (Project Settings → Change project)
6. Enable Apps Script API at script.google.com/home/usersettings
7. Deploy as Web app (Deploy → New deployment → Web app → Anyone)
8. Copy Deployment ID into `DEPLOYMENT_ID` in the `.gs` file
9. Set `GITHUB_TOKEN` in Script Properties: Key: `GITHUB_TOKEN`, Value: `github_pat_...` token (fine-grained token with "Public repositories" read-only access)
10. Run any function from editor to trigger OAuth authorization
11. If using Google Sheets: create spreadsheet, copy ID into `SPREADSHEET_ID`
12. If using installable trigger for sheet caching: Apps Script editor → Triggers → + Add Trigger → Function: `onEditWriteB1ToCache`, Event source: From spreadsheet, Event type: On edit

## GAS Webhook Auto-Deploy (Confirmed Working)

When a `.gs` file is pushed and merged to `main`, the `auto-merge-claude.yml` workflow triggers a webhook (`doPost(action=deploy)`) on the corresponding GAS web app. This causes the GAS script to pull its latest source from GitHub and redeploy itself — **without the embedding HTML page needing to be open**. The GAS backend updates server-side; the next time a user loads the page, they get the new version automatically.

- **Confirmed 2026-03-06**: Testation7 GAS updated from 01.00g → 01.01g via webhook with no page open — the workflow deploy step successfully triggered `doPost`, and the GAS app pulled and redeployed itself
- Each GAS project gets its own deploy step in the workflow (added by `setup-gas-project.sh` during project creation)
- The webhook URL is constructed from the `DEPLOYMENT_ID` in each project's `.config.json`

## GAS Template Source File

`live-site-pages/gas-code-templates/gas-project-creator-code.js.txt` is the **single source of truth** for the base GAS template. It contains placeholder values (`YOUR_DEPLOYMENT_ID`, `YOUR_SPREADSHEET_ID`, `YOUR_ORG_NAME`, etc.) and serves two purposes:

1. **Browser "Copy Code.gs" button** — GAS-enabled HTML pages fetch this file and do find-and-replace with the user's config values before copying to clipboard
2. **Setup script template** — `scripts/setup-gas-project.sh` copies this file as the starting point for new GAS projects, then substitutes config values via sed

There is no separate `.gs` template file — this single file eliminates the sync problem that existed when two copies had to be kept in lockstep. It lives in `live-site-pages/` because it must be accessible via GitHub Pages `fetch()`, and the setup script can read it from any location in the repo.

*Template source propagation: when this file is modified, changes must be propagated to all existing `.gs` files — see `.claude/rules/html-pages.md` — section "Template Source Propagation" (Pre-Commit #20)*

## Template vs Project Code Separation

All GAS code files (`.gs` and `gas-project-creator-code.js.txt`) use section dividers to distinguish **template code** (shared across all projects, propagated via Pre-Commit #20) from **project-specific code** (unique to one project, never overwritten during propagation).

### Divider format
Dividers use 14 `═` characters. Each marker is a 3-line block (divider, label, divider):
```javascript
// ══════════════
// TEMPLATE START
// ══════════════

// ══════════════
// TEMPLATE END
// ══════════════

// ══════════════
// PROJECT START
// ══════════════

// ══════════════
// PROJECT END
// ══════════════
```

### File structure (top to bottom)
1. **Config variables** — always first, no divider needed (every file starts with these)
2. **PROJECT block** — project-specific variables and standalone functions (e.g. `SPLASH_LOGO_URL`, `readPushedVersionFromCache()`). Empty on new projects — placeholder for future additions
3. **TEMPLATE block** — all template functions (`doGet`, `doPost`, `getAppData`, `getSoundBase64`, `writeVersionToSheet`, `readB1FromCacheOrSheet`, `onEditWriteB1ToCache`, `fetchGitHubQuotaAndLimits`, `pullAndDeployFromGitHub`)
4. `// Developed by:` branding line — always last

### Project code inside template territory
Project-specific code sometimes **must** live inside a template function (e.g. a cache write after a deploy, a custom UI within `doGet()`). This is explicitly allowed but must be clearly marked using **inline project markers** — a distinct notation from the block dividers so there is no confusion between structural boundaries and inline annotations.

**Single-line additions** — append `// PROJECT: description` to the end of the line:
```javascript
CacheService.getScriptCache().put("pushed_version", value, 3600); // PROJECT: auto-update cache
```

**Multi-line additions or whole-function divergence** — place `// PROJECT: description` on its own line before the block:
```javascript
// PROJECT: custom UI (entire doGet diverged from template)
function doGet() {
```

**Key distinction**: block dividers (`// ═══...` (14 chars) + `// TEMPLATE START/END` + `// PROJECT START/END`) mark **structural boundaries** between large code regions. Inline `// PROJECT:` markers flag **individual lines or sections embedded within template territory**. Never use block dividers inside a template function — always use inline markers there.

### Project override markers
When a project **modifies existing template code** (not adding new code, but changing template behavior — e.g. different return values, altered logic flow, changed constants), the modified lines must be marked with `PROJECT OVERRIDE` so template propagation can detect them and stop before overwriting.

**Single-line overrides** — append `// PROJECT OVERRIDE: reason` to the end of the line:
```javascript
const MAX_RETRIES = 10; // PROJECT OVERRIDE: more retries for slow API
```

**Multi-line overrides** — wrap the modified block with start/end markers:
```javascript
// PROJECT OVERRIDE START: custom doGet response
function doGet(e) {
  // entirely different response logic for this project
  return HtmlService.createHtmlOutput('<h1>Custom</h1>');
}
// PROJECT OVERRIDE END
```

**Key distinction from inline `// PROJECT:` markers**: `// PROJECT:` marks **additions** (new code inserted into template territory). `// PROJECT OVERRIDE:` marks **modifications** (existing template code that was changed). Both live inside TEMPLATE regions, but they signal different things to the propagation system:
- `// PROJECT:` lines are preserved as-is — template propagation works around them
- `// PROJECT OVERRIDE:` lines trigger a **hard stop** — template propagation must halt for that file and ask the user what to do, because the template change may conflict with the override

### Rules for new code
- **New project-specific features** should go in the PROJECT block when possible — standalone functions, new variables, and self-contained logic belong there
- **Project code inside template functions** is allowed when required (e.g. the feature needs to hook into a specific point in a template function's flow). It must be marked with inline `// PROJECT:` markers — never mixed unmarked into template functions
- `// PROJECT OVERRIDE:` markers for project-specific modifications to existing template code — these trigger a propagation halt (see "Project override markers" above)
- **Template updates** (Pre-Commit #20) propagate changes only within TEMPLATE markers — PROJECT blocks and inline `// PROJECT:` lines are preserved as-is. When `// PROJECT OVERRIDE` markers are found in a TEMPLATE region that a template change touches, propagation **stops for that file** and alerts the user
- **Keep clusters large** — prefer grouping related project-specific code together rather than scattering small project additions throughout the file. When practical, extract project logic into standalone functions in the PROJECT block and call them from template functions with an inline `// PROJECT:` marker
- **The template source file** (`gas-project-creator-code.js.txt`) has an empty PROJECT block — it defines the insertion point but contains no project code itself

## GAS UI Layout Awareness

GAS UI elements (iframe panels, toggle buttons, status indicators, overlays) are **guests** inside the host HTML page. They must defer to the host page's existing layout — the HTML page should never need to accommodate GAS elements. When making changes to GAS-related UI on any HTML page:
- **Check for conflicts** with the version indicator (`#version-indicator`, fixed bottom-right), changelog overlay, splash screens, and any other fixed/absolute elements already on the page
- **Avoid overlapping** interactive elements — if two fixed-position controls would occupy the same corner or edge, move the GAS element to an unoccupied position
- **Test mental layout** — before finalizing CSS for any new fixed-position GAS UI element, mentally walk through all existing fixed elements on the page and verify no visual or interactive overlap occurs at any viewport size
- This rule applies automatically to all GAS UI changes — the developer does not need to explicitly request layout-awareness each time

Developed by: ShadowAISolutions
