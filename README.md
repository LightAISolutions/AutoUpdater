# ​‌‌‌‌‌‌‌​​‌‌‌‌‌​ReadMe - AutoUpdater

A GitHub Pages deployment framework with automatic version polling, auto-refresh, and Google Apps Script (GAS) embedding support.

Last updated: `2026-03-07 10:56:54 PM EST` · Repo version: `v01.07r`

**Live site:** [LightAISolutions.github.io/AutoUpdater](https://LightAISolutions.github.io/AutoUpdater)

<p align="center">
  <img src="repository-information/readme-qr-code.png" alt="QR code to live site" width="200">
</p>

## How It Works

### Auto-Refresh via Version Polling
Every hosted page polls a lightweight `html.version.txt` file (from `live-site-pages/html-versions/`) every 10 seconds. When a new version is deployed, the page detects the mismatch and auto-reloads — showing a green "Website Ready" splash with audio feedback.

### CI/CD Auto-Merge Flow
1. Push to a `claude/*` branch
2. GitHub Actions automatically merges into `main`, deploys to GitHub Pages, and cleans up the branch
3. No pull requests needed — the workflow handles everything

### GAS Embedding Architecture
Google Apps Script projects are embedded as iframes in GitHub Pages. The framework handles:

&emsp;Automatic GAS deployment via `doPost` when `.gs` files change<br>
&emsp;"Code Ready" blue splash on GAS updates (client-side polling)<br>
&emsp;Google Sign-In from the parent page (stable OAuth origin)

## GCP Project Setup & Troubleshooting

> **Tip:** Links below navigate away from this page. **Ctrl + click** (or right-click → *Open in new tab*) to keep this ReadMe visible while you work.

Each GAS web app deployment requires a Google Cloud Platform (GCP) project. To set up:

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → create a **new project**
2. **Critical**: set the project **Location** to your organization root or "No organization" — do **not** place it inside any managed folder
3. Copy the **project number** (not project ID) from the project dashboard
4. In the GCP project, enable the **Apps Script API**: APIs & Services → Library → search "Apps Script API" → Enable
5. In Apps Script, go to Project Settings (gear icon) → Google Cloud Platform (GCP) Project → Change project → paste the project number

### "You cannot switch to a Cloud Platform project in an Apps Script-managed folder"

This error occurs when the GCP project you're targeting lives inside Google's hidden `apps-script` managed folder (`organization → system-gsuite → apps-script`). Even projects created from [console.cloud.google.com](https://console.cloud.google.com/) can end up there on Workspace accounts.

**How to diagnose:**
1. Go to [Google Cloud Console → Manage Resources](https://console.cloud.google.com/cloud-resource-manager)
2. Look for a folder hierarchy: **your org → system-gsuite → apps-script**
3. If your GCP project is inside the `apps-script` folder, that's the problem

**How to fix — Option A (move the project):**

Moving a project out of the managed folder requires the **Project Mover** IAM role, which you likely don't have by default — even as the organization owner/admin.

1. Go to [IAM & Admin](https://console.cloud.google.com/iam-admin/iam) → use the top dropdown to select your **organization** (not a project or folder)
2. Click **Grant Access** → enter your own email
3. In "Select a role" → **Resource Manager** → **Project Mover** → **Save**
4. Go to [Manage Resources](https://console.cloud.google.com/cloud-resource-manager) → find your project inside the `apps-script` folder
5. Click the three-dot menu → **Migrate**
6. Move it to your organization root or "No organization"
7. Retry changing the GCP project in Apps Script settings

**How to fix — Option B (create a new project):**
1. Go to [Google Cloud Console](https://console.cloud.google.com/) → create a new project
2. When setting the **Location**, explicitly choose your organization root or "No organization"
3. Verify the project number does **not** start with `sys-` (those are auto-created default projects and won't work)
4. Enable the Apps Script API in the new project
5. Use this project's number in Apps Script settings

**Key requirements:**
- The GCP project must be a **manually created, standard project** — not an auto-generated one
- It must live **outside** the `system-gsuite → apps-script` managed folder
- Project numbers starting with `sys-` are auto-created defaults and cannot be used
- You need **Project Browser** and **OAuth Config Editor** roles (or equivalent) on the project
- Moving projects requires the **Project Mover** role (`roles/resourcemanager.projectMover`) granted at the **organization level** — even org owners/admins don't have this by default
- Switching from a default project to a standard project is one-way — you cannot switch back
- On Google Workspace accounts, the GCP project must be in the **same Cloud Organization** as the script owner, just not inside the managed folder

### "Apps Script API has not been used in project X"

This error means the Apps Script API is not enabled in the GCP project associated with your script. Fix:
1. Note the project number from the error message
2. Go to [Google Cloud Console](https://console.cloud.google.com/) → select that project
3. APIs & Services → Library → search "Apps Script API" → **Enable**
4. If the project number doesn't match any project you own, your script is using a default GCP project that you can't access — follow the "cannot switch" fix above to assign your own GCP project first

## Project Structure

```
AutoUpdater/
├── live-site-pages/             # Deployed to GitHub Pages
│   ├── .nojekyll               # Disables Jekyll processing on GitHub Pages
│   ├── index.html              # Live landing page
│   ├── gas-project-creator.html       # GAS project creator dashboard
│   ├── gas-code-templates/       # GAS code files (.js.txt) for Copy Code.gs buttons
│   │   └── gas-project-creator-code.js.txt # Shared GAS template source
│   ├── html-versions/           # HTML page version files for auto-refresh polling
│   │   ├── indexhtml.version.txt
│   │   ├── gas-project-creatorhtml.version.txt
│   │   └── testation7html.version.txt
│   │   ├── testation8html.version.txt     # Version file for testation8 page auto-refresh
│   │   ├── Sinexcel_Researchhtml.version.txt     # Version file for Sinexcel_Research page auto-refresh
│   ├── gs-versions/             # GAS version files for GAS version pill polling
│   │   ├── indexgs.version.txt
│   │   └── testation7gs.version.txt
│   │   ├── testation8gs.version.txt       # Deployed GAS version for pill polling
│   │   ├── Sinexcel_Researchgs.version.txt       # Deployed GAS version for pill polling
│   ├── html-changelogs/         # HTML changelogs (source of truth + deployed)
│   │   ├── indexhtml.changelog.md                 # Homepage changelog
│   │   ├── indexhtml.changelog-archive.md         # Older sections (rotated)
│   │   ├── gas-project-creatorhtml.changelog.md   # GAS Project Creator changelog
│   │   ├── gas-project-creatorhtml.changelog-archive.md  # Older sections (rotated)
│   │   ├── testation7html.changelog.md            # Testation7 changelog
│   │   ├── testation8html.changelog.md           # HTML changelog for popup
│   │   ├── Sinexcel_Researchhtml.changelog.md           # HTML changelog for popup
│   │   ├── Sinexcel_Researchhtml.changelog-archive.md   # Older changelog sections (rotated)
│   │   ├── testation8html.changelog-archive.md   # Older changelog sections (rotated)
│   │   └── testation7html.changelog-archive.md    # Older sections (rotated)
│   ├── gs-changelogs/           # GAS changelogs (source of truth + deployed)
│   │   ├── indexgs.changelog.md                   # Index GAS changelog
│   │   ├── indexgs.changelog-archive.md           # Older sections (rotated)
│   │   ├── testation7gs.changelog.md              # Testation7 GAS changelog
│   │   ├── testation8gs.changelog.md             # GAS changelog for popup
│   │   ├── Sinexcel_Researchgs.changelog.md             # GAS changelog for popup
│   │   ├── Sinexcel_Researchgs.changelog-archive.md     # Older changelog sections (rotated)
│   │   ├── testation8gs.changelog-archive.md     # Older changelog sections (rotated)
│   │   └── testation7gs.changelog-archive.md      # Older sections (rotated)
│   ├── testation7.html           # Testation7 GAS embedding page
│   ├── testation8.html                # Testation8 GAS embedding page
│   ├── Sinexcel_Research.html                # Sinexcel_Research GAS embedding page
│   └── sounds/                 # Audio feedback files
├── live-site-templates/        # Templates for new pages
│   ├── HtmlAndGasTemplateAutoUpdate.html     # Universal HTML page template (GAS features auto-activate when gs.version.txt exists)
│   └── HtmlAndGasTemplateAutoUpdatehtml.version.txt # Template version file (frozen at v01.00w)
├── googleAppsScripts/          # Google Apps Script projects
│   ├── Index/                 # GAS for live-site-pages/index.html
│   │   ├── index.gs           # Self-updating GAS web app
│   │   └── index.config.json  # Project config (source of truth)
│   ├── Testation7/              # GAS for live-site-pages/testation7.html
│   │   ├── testation7.gs        # Self-updating GAS web app
│   │   └── testation7.config.json  # Project config (source of truth)
│   ├── Testation8/              # GAS for live-site-pages/testation8.html
│   │   ├── testation8.gs        # Self-updating GAS web app
│   │   └── testation8.config.json  # Project config (source of truth)
│   └── Sinexcel_Research/              # GAS for live-site-pages/Sinexcel_Research.html
│       ├── Sinexcel_Research.gs        # Self-updating GAS web app
│       └── Sinexcel_Research.config.json  # Project config (source of truth)
├── .claude/
│   ├── rules/                  # Always-loaded + path-scoped rules
│   │   ├── behavioral-rules.md        # Always loaded — execution style, pushback, etc.
│   │   ├── changelogs.md              # Path-scoped — CHANGELOG rules
│   │   ├── chat-bookends.md           # Always loaded — response formatting rules
│   │   ├── chat-bookends-reference.md # Always loaded — bookend examples & tables
│   │   ├── gas-scripts.md             # Path-scoped — GAS rules
│   │   ├── html-pages.md             # Path-scoped — HTML page rules
│   │   ├── init-scripts.md           # Path-scoped — init script rules
│   │   ├── output-formatting.md      # Always loaded — CLI styling, attribution
│   │   ├── repo-docs.md              # Path-scoped — documentation rules
│   │   └── workflows.md              # Path-scoped — workflow rules
│   ├── skills/                  # Invokable workflow skills
│   │   ├── imported--diff-review/       # /diff-review — pre-push differential review
│   │   │   └── SKILL.md
│   │   ├── imported--frontend-design/   # /frontend-design — distinctive UI creation
│   │   │   └── SKILL.md
│   │   ├── imported--git-cleanup/       # /git-cleanup — stale branch/worktree cleanup
│   │   │   └── SKILL.md
│   │   ├── imported--security-review/   # /security-review — OWASP/web security audit
│   │   │   └── SKILL.md
│   │   ├── imported--skill-creator/     # /skill-creator — create new skills
│   │   │   └── SKILL.md
│   │   ├── imported--webapp-testing/    # /webapp-testing — Playwright page testing
│   │   │   └── SKILL.md
│   │   ├── initialize/          # /initialize — first deployment setup
│   │   │   └── SKILL.md
│   │   ├── maintenance-mode/    # /maintenance-mode — toggle maintenance overlay
│   │   │   └── SKILL.md
│   │   ├── new-page/            # /new-page — create new HTML page with boilerplate
│   │   │   └── SKILL.md
│   │   ├── phantom-update/      # /phantom-update — timestamp alignment
│   │   │   └── SKILL.md
│   │   ├── reconcile/           # /reconcile — end multi-session mode
│   │   │   └── SKILL.md
│   │   └── remember-session/    # /remember-session — save session context
│   │       └── SKILL.md
│   └── settings.json           # Claude Code project settings
├── .github/
│   ├── workflows/              # CI/CD pipeline
│   ├── ISSUE_TEMPLATE/         # Bug report & feature request forms
│   ├── PULL_REQUEST_TEMPLATE.md # PR checklist
│   ├── FUNDING.yml             # Sponsor button config
│   └── last-processed-commit.sha # Inherited branch guard (commit SHA tracking)
├── repository-information/
│   ├── backups/                # Temporary safety-net backups of critical files
│   │   └── CLAUDE.md.bak      # Latest CLAUDE.md backup
│   ├── ARCHITECTURE.md         # System diagram (Mermaid)
│   ├── CHANGELOG.md            # Version history
│   ├── CHANGELOG-archive.md    # Older changelog sections (rotated from CHANGELOG.md)
│   ├── CODING-GUIDELINES.md    # Domain-specific coding knowledge
│   ├── GOVERNANCE.md           # Project governance
│   ├── IMPROVEMENTS.md         # Potential improvements
│   ├── STATUS.md               # Project status dashboard
│   ├── TODO.md                 # Actionable to-do items
│   ├── readme-qr-code.png             # QR code linking to this repo
│   ├── REMINDERS.md            # Reminders for Developer (developer's own notes)
│   ├── SESSION-CONTEXT.md      # Previous Session Context (Claude-written session log)
│   ├── SKILLS-REFERENCE.md     # Complete Claude Code skills inventory (custom + imported + bundled)
│   ├── repository.version.txt  # Repo version (v01.XXr — bumps every push)
│   ├── TOKEN-BUDGETS.md        # Token cost reference for CLAUDE.md
│   └── SUPPORT.md              # Getting help
├── scripts/
│   ├── init-repo.sh            # One-shot fork initialization script
│   └── setup-gas-project.sh    # GAS project file creation script
├── .gitattributes              # Line ending normalization (LF)
├── CITATION.cff                # Citation metadata
├── CLAUDE.md                   # Developer instructions
├── CODE_OF_CONDUCT.md          # Community standards
├── CONTRIBUTING.md             # How to contribute
├── LICENSE.md                  # Proprietary license
└── SECURITY.md                 # Vulnerability reporting
```

## Documentation

> <sub>**Tip:** Links below navigate away from this page. `Right-click` → `Open link in new window` to keep this ReadMe visible while you work.</sub>

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](repository-information/ARCHITECTURE.md) | Visual system diagram (Mermaid) |
| [CHANGELOG.md](repository-information/CHANGELOG.md) | Version history |
| [CHANGELOG-archive.md](repository-information/CHANGELOG-archive.md) | Older changelog sections |
| [CLAUDE.md](CLAUDE.md) | Developer instructions and conventions |
| [IMPROVEMENTS.md](repository-information/IMPROVEMENTS.md) | Potential improvements to explore |
| [REMINDERS.md](repository-information/REMINDERS.md) | Reminders for Developer (developer's own notes) |
| [SESSION-CONTEXT.md](repository-information/SESSION-CONTEXT.md) | Previous Session Context (Claude-written) |
| [STATUS.md](repository-information/STATUS.md) | Current project status and versions |
| [TODO.md](repository-information/TODO.md) | Actionable planned items |

## Community

> <sub>**Tip:** Links below navigate away from this page. `Right-click` → `Open link in new window` to keep this ReadMe visible while you work.</sub>

| Document | Description |
|----------|-------------|
| [Code of Conduct](CODE_OF_CONDUCT.md) | Community standards and expectations |
| [Contributing](CONTRIBUTING.md) | How to contribute to this project |
| [Security Policy](SECURITY.md) | How to report vulnerabilities |
| [Support](repository-information/SUPPORT.md) | Getting help |
| [Governance](repository-information/GOVERNANCE.md) | Project ownership and decision making |

Developed by: LightAISolutions
