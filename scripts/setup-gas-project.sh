#!/usr/bin/env bash
# ──────────────
# setup-gas-project.sh — Fully automated GAS project setup
#
# Creates all files and updates all documentation for a new GAS project:
#   - HTML embedding page (from HtmlAndGasTemplateAutoUpdate.html template)
#   - .gs script (from gas-project-creator-code.js.txt)
#   - .config.json
#   - Version files (html + gs)
#   - Changelogs (html + gs, plus archives) — created directly in live-site-pages/
#   - GAS Projects table registration (.claude/rules/gas-scripts.md)
#   - STATUS.md (Hosted Pages + GAS Projects tables)
#   - ARCHITECTURE.md (Mermaid diagram nodes, edges, styles)
#   - README.md (structure tree — 3 insertion points)
#   - Workflow deploy step (auto-merge-claude.yml — webhook for GAS self-update)
#
# Usage:
#   bash scripts/setup-gas-project.sh <<'CONFIG'
#   { "PROJECT_ENVIRONMENT_NAME": "myapp", "TITLE": "My App", ... }
#   CONFIG
#
#   bash scripts/setup-gas-project.sh config.json
#
# After running: Claude just needs to commit and push.
# ──────────────
set -euo pipefail

# ── Repo root ──
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

# ── Color helpers ──
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "${CYAN}[INFO]${NC} $*"; }
ok()    { echo -e "${GREEN}[OK]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
err()   { echo -e "${RED}[ERROR]${NC} $*" >&2; }

# ── Phase 0: Parse Input ──
info "Phase 0: Parsing input..."

JSON_INPUT=""
if [ $# -ge 1 ] && [ -f "$1" ]; then
    JSON_INPUT="$(cat "$1")"
    info "Reading config from file: $1"
elif ! [ -t 0 ]; then
    JSON_INPUT="$(cat)"
    info "Reading config from stdin"
else
    err "No input provided. Pipe JSON via stdin or pass a config file path."
    echo ""
    echo "Usage:"
    echo "  bash scripts/setup-gas-project.sh <<'CONFIG'"
    echo '  { "PROJECT_ENVIRONMENT_NAME": "myapp", "TITLE": "My App", ... }'
    echo "  CONFIG"
    echo ""
    echo "  bash scripts/setup-gas-project.sh config.json"
    exit 1
fi

# Parse JSON fields using Python (already a dependency for QR codes)
parse_json() {
    python3 -c "
import json, sys
data = json.loads(sys.stdin.read())
key = sys.argv[1]
default = sys.argv[2] if len(sys.argv) > 2 else ''
print(data.get(key, default))
" "$@" <<< "$JSON_INPUT"
}

ENV_NAME="$(parse_json PROJECT_ENVIRONMENT_NAME)"
TITLE="$(parse_json TITLE 'CHANGE THIS PROJECT TITLE GAS TEMPLATE')"
DEPLOYMENT_ID="$(parse_json DEPLOYMENT_ID 'YOUR_DEPLOYMENT_ID')"
SPREADSHEET_ID="$(parse_json SPREADSHEET_ID 'YOUR_SPREADSHEET_ID')"
SHEET_NAME="$(parse_json SHEET_NAME 'Live_Sheet')"
SOUND_FILE_ID="$(parse_json SOUND_FILE_ID '')"
SPLASH_LOGO_URL="$(parse_json SPLASH_LOGO_URL 'https://www.shadowaisolutions.com/SAIS_Logo.png')"

if [ -z "$ENV_NAME" ]; then
    err "PROJECT_ENVIRONMENT_NAME is required and cannot be empty."
    exit 1
fi

# ── Auto-detect repo info ──
REMOTE_URL="$(git remote get-url origin 2>/dev/null || echo '')"
GITHUB_OWNER="$(echo "$REMOTE_URL" | sed -E 's|.*[:/]([^/]+)/[^/]+(\.git)?$|\1|')"
GITHUB_REPO="$(echo "$REMOTE_URL" | sed -E 's|.*[:/][^/]+/([^/]+?)(\.git)?$|\1|')"
GITHUB_BRANCH="main"

# ── Derive project directory name ──
# Capitalize first letter of each segment separated by _ or -
# e.g. test_link → TestLink, my-app → MyApp
derive_project_dir() {
    echo "$1" | sed -E 's/(^|[_-])([a-z])/\U\2/g' | sed 's/[_-]//g'
}

PROJECT_DIR="$(derive_project_dir "$ENV_NAME")"

info "Environment name: $ENV_NAME"
info "Project directory: $PROJECT_DIR"
info "Title: $TITLE"
info "GitHub: $GITHUB_OWNER/$GITHUB_REPO (branch: $GITHUB_BRANCH)"

# ── Path constants ──
HTML_PAGE="live-site-pages/${ENV_NAME}.html"
HTML_VERSION="live-site-pages/html-versions/${ENV_NAME}html.version.txt"
GAS_DIR="googleAppsScripts/${PROJECT_DIR}"
GAS_FILE="${GAS_DIR}/${ENV_NAME}.gs"
GAS_CONFIG="${GAS_DIR}/${ENV_NAME}.config.json"
GAS_VERSION="live-site-pages/gs-versions/${ENV_NAME}gs.version.txt"
HTML_CL="live-site-pages/html-changelogs/${ENV_NAME}html.changelog.md"
HTML_CL_ARCHIVE="live-site-pages/html-changelogs/${ENV_NAME}html.changelog-archive.md"
GAS_CL="live-site-pages/gs-changelogs/${ENV_NAME}gs.changelog.md"
GAS_CL_ARCHIVE="live-site-pages/gs-changelogs/${ENV_NAME}gs.changelog-archive.md"
GAS_SCRIPTS_RULES=".claude/rules/gas-scripts.md"

# ── Template sources ──
TPL_HTML="live-site-templates/HtmlAndGasTemplateAutoUpdate.html"
TPL_GS="live-site-pages/gas-code-templates/gas-project-creator-code.js.txt"

# ── Phase 1: Pre-flight Checks ──
info "Phase 1: Pre-flight checks..."

for f in "$TPL_HTML" "$TPL_GS"; do
    if [ ! -f "$f" ]; then
        err "Template file not found: $f"
        exit 1
    fi
done
ok "Template files exist"

# Check if project already exists
UPDATE_MODE=false
if [ -f "$HTML_PAGE" ] || [ -d "$GAS_DIR" ] || [ -f "$GAS_CONFIG" ]; then
    UPDATE_MODE=true
    warn "Project already exists — switching to UPDATE mode"
    warn "Will sync config values into existing files without recreating"
fi

if [ "$UPDATE_MODE" = true ]; then
    # ── Update Mode ──
    info "Updating existing project: $ENV_NAME"

    # Update config.json
    if [ -f "$GAS_CONFIG" ]; then
        cat > "$GAS_CONFIG" <<CFGEOF
{
  "TITLE": "${TITLE}",
  "DEPLOYMENT_ID": "${DEPLOYMENT_ID}",
  "SPREADSHEET_ID": "${SPREADSHEET_ID}",
  "SHEET_NAME": "${SHEET_NAME}",
  "SOUND_FILE_ID": "${SOUND_FILE_ID}"
}
CFGEOF
        ok "Updated $GAS_CONFIG"
    fi

    # Update .gs file config vars
    if [ -f "$GAS_FILE" ]; then
        sed -i "s|var TITLE = .*;|var TITLE = \"${TITLE}\";|" "$GAS_FILE"
        sed -i "s|var DEPLOYMENT_ID = .*;|var DEPLOYMENT_ID = \"${DEPLOYMENT_ID}\";|" "$GAS_FILE"
        sed -i "s|var SPREADSHEET_ID = .*;|var SPREADSHEET_ID = \"${SPREADSHEET_ID}\";|" "$GAS_FILE"
        sed -i "s|var SHEET_NAME     = .*;|var SHEET_NAME     = \"${SHEET_NAME}\";|" "$GAS_FILE"
        sed -i "s|var SOUND_FILE_ID = .*;|var SOUND_FILE_ID = \"${SOUND_FILE_ID}\";|" "$GAS_FILE"
        ok "Updated config vars in $GAS_FILE"
    fi

    # Update HTML page title and var _e
    if [ -f "$HTML_PAGE" ]; then
        # Update <title>
        sed -i "s|<title>.*</title>|<title>${TITLE}</title>|" "$HTML_PAGE"

        # Update var _e (encoded deployment URL)
        if [ "$DEPLOYMENT_ID" != "YOUR_DEPLOYMENT_ID" ] && [ -n "$DEPLOYMENT_ID" ]; then
            ENCODED=$(echo -n "https://script.google.com/macros/s/${DEPLOYMENT_ID}/exec" | rev | base64 -w0)
            sed -i "s|var _e = '[^']*';|var _e = '${ENCODED}';|" "$HTML_PAGE"
        else
            sed -i "s|var _e = '[^']*';|var _e = '';|" "$HTML_PAGE"
        fi
        ok "Updated $HTML_PAGE"
    fi

    echo ""
    ok "Update complete. Files modified:"
    [ -f "$GAS_CONFIG" ] && echo "  - $GAS_CONFIG"
    [ -f "$GAS_FILE" ] && echo "  - $GAS_FILE"
    [ -f "$HTML_PAGE" ] && echo "  - $HTML_PAGE"
    exit 0
fi

# ── Create Mode ──
info "Creating new project: $ENV_NAME"
echo ""

# ── Phase 2: Create Directory Structure ──
info "Phase 2: Creating directories..."
mkdir -p "$GAS_DIR"
mkdir -p "live-site-pages/sounds"
ok "Directories created"

# ── Phase 3: Copy & Substitute Templates ──
info "Phase 3: Copying and substituting templates..."

# --- HTML page ---
cp "$TPL_HTML" "$HTML_PAGE"
sed -i "s|CHANGE THIS PROJECT TITLE TEMPLATE|${TITLE}|g" "$HTML_PAGE"

# Set meta build-version (should already be v01.00w from template, but ensure)
sed -i 's|<meta name="build-version" content="[^"]*">|<meta name="build-version" content="v01.00w">|' "$HTML_PAGE"

# Update splash logo URL if provided and different from default
if [ "$SPLASH_LOGO_URL" != "YOUR_SPLASH_LOGO_URL" ] && [ -n "$SPLASH_LOGO_URL" ]; then
    sed -i "s|var DEVELOPER_LOGO_URL = '[^']*';|var DEVELOPER_LOGO_URL = '${SPLASH_LOGO_URL}';|" "$HTML_PAGE"
fi

# Encode and set var _e (deployment URL)
if [ "$DEPLOYMENT_ID" != "YOUR_DEPLOYMENT_ID" ] && [ -n "$DEPLOYMENT_ID" ]; then
    ENCODED=$(echo -n "https://script.google.com/macros/s/${DEPLOYMENT_ID}/exec" | rev | base64 -w0)
    sed -i "s|var _e = '[^']*';|var _e = '${ENCODED}';|" "$HTML_PAGE"
else
    sed -i "s|var _e = '[^']*';|var _e = '';|" "$HTML_PAGE"
fi
ok "Created $HTML_PAGE"

# --- GAS script ---
cp "$TPL_GS" "$GAS_FILE"
# Reset VERSION to initial
sed -i 's|var VERSION = "[^"]*";|var VERSION = "01.00g";|' "$GAS_FILE"
# Set config-tracked variables
sed -i "s|var TITLE = .*;|var TITLE = \"${TITLE}\";|" "$GAS_FILE"
sed -i "s|var DEPLOYMENT_ID = .*;|var DEPLOYMENT_ID = \"${DEPLOYMENT_ID}\";|" "$GAS_FILE"
sed -i "s|var SPREADSHEET_ID = .*;|var SPREADSHEET_ID = \"${SPREADSHEET_ID}\";|" "$GAS_FILE"
sed -i "s|var SHEET_NAME     = .*;|var SHEET_NAME     = \"${SHEET_NAME}\";|" "$GAS_FILE"
sed -i "s|var SOUND_FILE_ID = .*;|var SOUND_FILE_ID = \"${SOUND_FILE_ID}\";|" "$GAS_FILE"
# Set repo-derived variables
sed -i "s|var GITHUB_OWNER  = .*;|var GITHUB_OWNER  = \"${GITHUB_OWNER}\";|" "$GAS_FILE"
sed -i "s|var GITHUB_REPO   = .*;|var GITHUB_REPO   = \"${GITHUB_REPO}\";|" "$GAS_FILE"
sed -i "s|var GITHUB_BRANCH = .*;|var GITHUB_BRANCH = \"${GITHUB_BRANCH}\";|" "$GAS_FILE"
sed -i "s|var FILE_PATH     = .*;|var FILE_PATH     = \"${GAS_FILE}\";|" "$GAS_FILE"
EMBED_URL="https://${GITHUB_OWNER}.github.io/${GITHUB_REPO}/${ENV_NAME}.html"
sed -i "s|var EMBED_PAGE_URL = .*;|var EMBED_PAGE_URL = \"${EMBED_URL}\";|" "$GAS_FILE"
if [ "$SPLASH_LOGO_URL" != "YOUR_SPLASH_LOGO_URL" ] && [ -n "$SPLASH_LOGO_URL" ]; then
    sed -i "s|var SPLASH_LOGO_URL = .*;|var SPLASH_LOGO_URL = \"${SPLASH_LOGO_URL}\";|" "$GAS_FILE"
fi
# Fix template comment references: <page-name>.gs/.config.json → {env_name}.gs/.config.json
sed -i "s|<page-name>\.gs|${ENV_NAME}.gs|g" "$GAS_FILE"
sed -i "s|<page-name>\.config\.json|${ENV_NAME}.config.json|g" "$GAS_FILE"
ok "Created $GAS_FILE"

# --- Config JSON ---
cat > "$GAS_CONFIG" <<CFGEOF
{
  "TITLE": "${TITLE}",
  "DEPLOYMENT_ID": "${DEPLOYMENT_ID}",
  "SPREADSHEET_ID": "${SPREADSHEET_ID}",
  "SHEET_NAME": "${SHEET_NAME}",
  "SOUND_FILE_ID": "${SOUND_FILE_ID}"
}
CFGEOF
ok "Created $GAS_CONFIG"

# ── Phase 4: Create Version Files ──
info "Phase 4: Creating version files..."
echo -n '|v01.00w|' > "$HTML_VERSION"
echo -n '01.00g' > "$GAS_VERSION"
ok "Created $HTML_VERSION"
ok "Created $GAS_VERSION"

# ── Phase 5: Create Changelog Files ──
info "Phase 5: Creating changelog files..."

# HTML changelog
cat > "$HTML_CL" <<CLEOF
# Changelog — ${TITLE}

All notable user-facing changes to this page are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Older sections are rotated to [${ENV_NAME}html.changelog-archive.md](${ENV_NAME}html.changelog-archive.md) when this file exceeds 50 version sections.

\`Sections: 0/50\`

## [Unreleased]

*(No changes yet)*

Developed by: ShadowAISolutions
CLEOF
ok "Created $HTML_CL"

# HTML changelog archive
cat > "$HTML_CL_ARCHIVE" <<CLEOF
# Changelog Archive — ${TITLE}

Older version sections rotated from [${ENV_NAME}html.changelog.md](${ENV_NAME}html.changelog.md). Full granularity preserved — entries are moved here verbatim when the main changelog exceeds 50 version sections.

## Rotation Logic

Same rotation logic as the repository changelog archive — see [CHANGELOG-archive.md](../../repository-information/CHANGELOG-archive.md) for the full procedure. In brief: count version sections, skip if ≤50, never rotate today's sections, rotate the oldest full date group together.

---

*(No archived sections yet)*

Developed by: ShadowAISolutions
CLEOF
ok "Created $HTML_CL_ARCHIVE"

# GAS changelog
cat > "$GAS_CL" <<CLEOF
# Changelog — ${TITLE} (Google Apps Script)

All notable user-facing changes to this script are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Older sections are rotated to [${ENV_NAME}gs.changelog-archive.md](${ENV_NAME}gs.changelog-archive.md) when this file exceeds 50 version sections.

\`Sections: 0/50\`

## [Unreleased]

*(No changes yet)*

Developed by: ShadowAISolutions
CLEOF
ok "Created $GAS_CL"

# GAS changelog archive
cat > "$GAS_CL_ARCHIVE" <<CLEOF
# Changelog Archive — ${TITLE} (Google Apps Script)

Older version sections rotated from [${ENV_NAME}gs.changelog.md](${ENV_NAME}gs.changelog.md). Full granularity preserved — entries are moved here verbatim when the main changelog exceeds 50 version sections.

## Rotation Logic

Same rotation logic as the repository changelog archive — see [CHANGELOG-archive.md](../../repository-information/CHANGELOG-archive.md) for the full procedure. In brief: count version sections, skip if ≤50, never rotate today's sections, rotate the oldest full date group together.

---

*(No archived sections yet)*

Developed by: ShadowAISolutions
CLEOF
ok "Created $GAS_CL_ARCHIVE"


# ── Phase 6: Register in GAS Projects Table ──
info "Phase 6: Registering in GAS Projects table..."

TABLE_ROW="| ${PROJECT_DIR} | \`${GAS_FILE}\` | \`${GAS_CONFIG}\` | \`${HTML_PAGE}\` |"

if grep -q "| ${PROJECT_DIR} |" "$GAS_SCRIPTS_RULES" 2>/dev/null; then
    warn "Project ${PROJECT_DIR} already registered in GAS Projects table — skipping"
else
    # Find the last row of the table (line starting with |, not the header separator)
    LAST_TABLE_LINE=$(grep -n '^| ' "$GAS_SCRIPTS_RULES" | grep -v '|---' | tail -1 | cut -d: -f1)
    if [ -n "$LAST_TABLE_LINE" ]; then
        sed -i "${LAST_TABLE_LINE}a\\${TABLE_ROW}" "$GAS_SCRIPTS_RULES"
        ok "Registered ${PROJECT_DIR} in GAS Projects table"
    else
        warn "Could not find GAS Projects table — manual registration needed"
    fi
fi

# ── Phase 7: Update STATUS.md ──
info "Phase 7: Updating STATUS.md..."
STATUS_FILE="repository-information/STATUS.md"
if [ -f "$STATUS_FILE" ]; then
    # Add to Hosted Pages table (before the blank line after the last page row)
    HOSTED_ROW="| ${PROJECT_DIR} | \`${HTML_PAGE}\` | v01.00w | *(deploy to activate)* | Active |"
    if grep -q "| ${PROJECT_DIR} |" "$STATUS_FILE"; then
        warn "${PROJECT_DIR} already in STATUS.md Hosted Pages — skipping"
    else
        # Insert after the last row in Hosted Pages (last | row before ## GAS Projects)
        LAST_HOSTED=$(grep -n '^| .* | Active |' "$STATUS_FILE" | head -$(grep -c '^| .* | Active |' "$STATUS_FILE") | while IFS=: read -r num _; do
            if [ "$num" -lt "$(grep -n '## GAS Projects' "$STATUS_FILE" | cut -d: -f1)" ]; then echo "$num"; fi
        done | tail -1)
        if [ -n "$LAST_HOSTED" ]; then
            sed -i "${LAST_HOSTED}a\\${HOSTED_ROW}" "$STATUS_FILE"
            ok "Added ${PROJECT_DIR} to Hosted Pages"
        else
            warn "Could not find Hosted Pages table — manual update needed"
        fi
    fi

    # Add to GAS Projects table
    GAS_STATUS_ROW="| ${PROJECT_DIR} | \`${GAS_FILE}\` | \`${HTML_PAGE}\` | 01.00g | Active |"
    if grep -q "| ${PROJECT_DIR} |.*${ENV_NAME}.gs" "$STATUS_FILE"; then
        warn "${PROJECT_DIR} already in STATUS.md GAS Projects — skipping"
    else
        LAST_GAS=$(grep -n '^| .* | Active |' "$STATUS_FILE" | while IFS=: read -r num _; do
            GAS_LINE=$(grep -n '## GAS Projects' "$STATUS_FILE" | cut -d: -f1)
            TPL_LINE=$(grep -n '## Templates' "$STATUS_FILE" | cut -d: -f1)
            if [ "$num" -gt "$GAS_LINE" ] && [ "$num" -lt "$TPL_LINE" ]; then echo "$num"; fi
        done | tail -1)
        if [ -n "$LAST_GAS" ]; then
            sed -i "${LAST_GAS}a\\${GAS_STATUS_ROW}" "$STATUS_FILE"
            ok "Added ${PROJECT_DIR} to GAS Projects"
        else
            warn "Could not find GAS Projects table — manual update needed"
        fi
    fi
else
    warn "STATUS.md not found — skipping"
fi

# ── Phase 8: Update ARCHITECTURE.md ──
info "Phase 8: Updating ARCHITECTURE.md..."
ARCH_FILE="repository-information/ARCHITECTURE.md"
# Derive a short Mermaid node prefix from PROJECT_DIR (e.g. Testation2 → TSTA2)
# Use first letter + consonants, uppercase, max 6 chars
NODE_PREFIX=$(echo "$PROJECT_DIR" | sed 's/[aeiou]//gi' | cut -c1-4 | tr '[:lower:]' '[:upper:]')
# Ensure at least 3 chars by falling back to first 4 chars of PROJECT_DIR
if [ ${#NODE_PREFIX} -lt 3 ]; then
    NODE_PREFIX=$(echo "$PROJECT_DIR" | cut -c1-4 | tr '[:lower:]' '[:upper:]')
fi

if [ -f "$ARCH_FILE" ]; then
    # Check if already added
    if grep -q "${NODE_PREFIX}_PAGE" "$ARCH_FILE"; then
        warn "${NODE_PREFIX} nodes already in ARCHITECTURE.md — skipping"
    else
        # 1. Add page nodes in live-site-pages subgraph (before SND1)
        SND_LINE=$(grep -n 'SND1\["sounds/' "$ARCH_FILE" | head -1 | cut -d: -f1)
        if [ -n "$SND_LINE" ]; then
            sed -i "${SND_LINE}i\\            ${NODE_PREFIX}_PAGE[\"${ENV_NAME}.html\"]\n            ${NODE_PREFIX}_VERTXT[\"${ENV_NAME}html.version.txt\"]\n            ${NODE_PREFIX}_CL[\"${ENV_NAME}html.changelog.md\"]\n            ${NODE_PREFIX}_CLARCH[\"${ENV_NAME}html.changelog-archive.md\"]\n            ${NODE_PREFIX}_GSCL[\"${ENV_NAME}gs.changelog.md\"]\n            ${NODE_PREFIX}_GSCLARCH[\"${ENV_NAME}gs.changelog-archive.md\"]\n            ${NODE_PREFIX}_GSVER[\"${ENV_NAME}gs.version.txt\"]" "$ARCH_FILE"
            # Note: gs.version.txt lives in live-site-pages/ (no copy in googleAppsScripts/)
            ok "Added page nodes to live-site-pages"
        fi

        # 2. Add GAS nodes in Google Apps Scripts subgraph (before "end" of that subgraph)
        # Find the last GAS_*_CFG line and insert after it
        LAST_GAS_CFG=$(grep -n 'GAS_.*_CFG\[' "$ARCH_FILE" | tail -1 | cut -d: -f1)
        if [ -n "$LAST_GAS_CFG" ]; then
            sed -i "${LAST_GAS_CFG}a\\            GAS_${NODE_PREFIX}[\"googleAppsScripts/${PROJECT_DIR}/\\\n${ENV_NAME}.gs\"]\n            GAS_${NODE_PREFIX}_CFG[\"${ENV_NAME}.config.json\\\n(source of truth for\\\nTITLE, DEPLOYMENT_ID,\\\nSPREADSHEET_ID, etc.)\"]" "$ARCH_FILE"
            ok "Added GAS nodes to Google Apps Scripts"
        fi

        # 3. Add template copy edges (after last GASTPL_CODE template source edge)
        LAST_TPL_COPY=$(grep -n 'GASTPL_CODE -\.->|"template source' "$ARCH_FILE" | tail -1 | cut -d: -f1)
        if [ -n "$LAST_TPL_COPY" ]; then
            sed -i "${LAST_TPL_COPY}a\\    GASTPL_CODE -.->|\"template source\\\n(setup-gas-project.sh)\"| GAS_${NODE_PREFIX}" "$ARCH_FILE"
        fi

        # 4. Add config sync edges (after last *_CFG sync edge pair)
        LAST_SYNC=$(grep -n '_CFG -\.->|"syncs to' "$ARCH_FILE" | tail -1 | cut -d: -f1)
        if [ -n "$LAST_SYNC" ]; then
            sed -i "${LAST_SYNC}a\\    GAS_${NODE_PREFIX}_CFG -.->|\"syncs to\\\n(Pre-Commit #15)\"| GAS_${NODE_PREFIX}\n    GAS_${NODE_PREFIX}_CFG -.->|\"syncs to\\\n(Pre-Commit #15)\"| ${NODE_PREFIX}_PAGE" "$ARCH_FILE"
        fi

        # 5. Add iframe edge (after last *_PAGE iframes edge)
        LAST_IFRAME=$(grep -n '_PAGE -\.->|"iframes"| GAS_APP' "$ARCH_FILE" | tail -1 | cut -d: -f1)
        if [ -n "$LAST_IFRAME" ]; then
            sed -i "${LAST_IFRAME}a\\    ${NODE_PREFIX}_PAGE -.->|\"iframes\"| GAS_APP" "$ARCH_FILE"
        fi

        # 6. Add source of truth edge (after last GAS_* source of truth edge)
        LAST_SOT=$(grep -n 'GAS_.* -\.->|"source of truth' "$ARCH_FILE" | tail -1 | cut -d: -f1)
        if [ -n "$LAST_SOT" ]; then
            sed -i "${LAST_SOT}a\\    GAS_${NODE_PREFIX} -.->|\"source of truth\\\nfor GAS app\\\n(${ENV_NAME}.gs)\"| GAS_PULL" "$ARCH_FILE"
        fi

        # 7. Add styles (after last style line)
        LAST_STYLE=$(grep -n '    style GAS_' "$ARCH_FILE" | tail -1 | cut -d: -f1)
        if [ -n "$LAST_STYLE" ]; then
            sed -i "${LAST_STYLE}a\\    style GAS_${NODE_PREFIX} fill:#ff7043,color:#fff\n    style GAS_${NODE_PREFIX}_CFG fill:#ffe082,color:#000" "$ARCH_FILE"
        fi
        ok "Added edges and styles to ARCHITECTURE.md"
    fi
else
    warn "ARCHITECTURE.md not found — skipping"
fi

# ── Phase 9: Update README.md Structure Tree ──
info "Phase 9: Updating README.md structure tree..."
if [ -f "README.md" ]; then
    # Check if already added
    if grep -q "${ENV_NAME}.html.*GAS embedding page" "README.md"; then
        warn "${ENV_NAME} already in README.md structure tree — skipping"
    else
        # 1. Add page files in live-site-pages section (before "└── sounds/")
        SOUNDS_LINE=$(grep -n '│   └── sounds/' "README.md" | head -1 | cut -d: -f1)
        if [ -n "$SOUNDS_LINE" ]; then
            sed -i "${SOUNDS_LINE}i\\│   ├── ${ENV_NAME}.html                # ${PROJECT_DIR} GAS embedding page" "README.md"
            ok "Added page entry to README.md tree"

            # Add version/changelog files to their respective subfolder sections
            # html-versions/
            HV_LAST=$(grep -n '│   │   .\+html\.version\.txt' "README.md" | tail -1 | cut -d: -f1)
            if [ -n "$HV_LAST" ]; then
                sed -i "${HV_LAST}a\\│   │   ├── ${ENV_NAME}html.version.txt     # Version file for ${ENV_NAME} page auto-refresh" "README.md"
                ok "Added html-versions entry"
            fi
            # gs-versions/
            GV_LAST=$(grep -n '│   │   .\+gs\.version\.txt' "README.md" | tail -1 | cut -d: -f1)
            if [ -n "$GV_LAST" ]; then
                sed -i "${GV_LAST}a\\│   │   ├── ${ENV_NAME}gs.version.txt       # Deployed GAS version for pill polling" "README.md"
                ok "Added gs-versions entry"
            fi
            # html-changelogs/
            HC_LAST=$(grep -n '│   │   .\+html\.changelog.*\.md' "README.md" | grep -v archive | tail -1 | cut -d: -f1)
            if [ -n "$HC_LAST" ]; then
                sed -i "${HC_LAST}a\\│   │   ├── ${ENV_NAME}html.changelog.md           # HTML changelog for popup\n│   │   ├── ${ENV_NAME}html.changelog-archive.md   # Older changelog sections (rotated)" "README.md"
                ok "Added html-changelogs entries"
            fi
            # gs-changelogs/
            GC_LAST=$(grep -n '│   │   .\+gs\.changelog.*\.md' "README.md" | grep -v archive | tail -1 | cut -d: -f1)
            if [ -n "$GC_LAST" ]; then
                sed -i "${GC_LAST}a\\│   │   ├── ${ENV_NAME}gs.changelog.md             # GAS changelog for popup\n│   │   ├── ${ENV_NAME}gs.changelog-archive.md     # Older changelog sections (rotated)" "README.md"
                ok "Added gs-changelogs entries"
            fi
        fi

        # 2. Add GAS directory in googleAppsScripts section (before the last "└──" entry)
        # Find the last directory in googleAppsScripts (the └── line) and insert before it
        # First, change └── to ├── for the current last entry, then add new entry before .claude/
        CLAUDE_DIR_LINE=$(grep -n '^├── \.claude/' "README.md" | head -1 | cut -d: -f1)
        if [ -n "$CLAUDE_DIR_LINE" ]; then
            # Change the current └── to ├── in the googleAppsScripts section
            LAST_GAS_DIR=$(grep -n '│   └── .*/.*# GAS for' "README.md" | tail -1 | cut -d: -f1)
            if [ -n "$LAST_GAS_DIR" ]; then
                sed -i "${LAST_GAS_DIR}s/│   └──/│   ├──/" "README.md"
                # Fix the sub-items of the old last entry (change │       to │   │  )
                NEXT=$((LAST_GAS_DIR + 1))
                NEXT2=$((LAST_GAS_DIR + 2))
                sed -i "${NEXT}s/│       ├──/│   │   ├──/" "README.md"
                sed -i "${NEXT2}s/│       └──/│   │   └──/" "README.md"
            fi
            # Insert new entry before .claude/
            sed -i "${CLAUDE_DIR_LINE}i\\│   └── ${PROJECT_DIR}/              # GAS for live-site-pages/${ENV_NAME}.html\n│       ├── ${ENV_NAME}.gs        # Self-updating GAS web app\n│       └── ${ENV_NAME}.config.json  # Project config (source of truth)" "README.md"
            ok "Added GAS directory to README.md tree"
        fi

    fi
else
    warn "README.md not found — skipping"
fi

# ── Phase 10: Add Workflow Deploy Step ──
info "Phase 10: Adding workflow deploy step..."
WORKFLOW_FILE=".github/workflows/auto-merge-claude.yml"
if [ -f "$WORKFLOW_FILE" ]; then
    if grep -q "Deploy ${PROJECT_DIR}" "$WORKFLOW_FILE"; then
        warn "${PROJECT_DIR} deploy step already in workflow — skipping"
    elif [ "$DEPLOYMENT_ID" = "YOUR_DEPLOYMENT_ID" ] || [ -z "$DEPLOYMENT_ID" ]; then
        warn "DEPLOYMENT_ID is placeholder — skipping workflow deploy step (add manually after first deploy)"
    else
        # Insert before "- name: Delete branch" (the first occurrence after GAS DEPLOY STEPS)
        DELETE_LINE=$(grep -n '      - name: Delete branch' "$WORKFLOW_FILE" | head -1 | cut -d: -f1)
        if [ -n "$DELETE_LINE" ]; then
            DEPLOY_BLOCK="      - name: Deploy ${PROJECT_DIR}\n        if: steps.guard.outputs.skip != 'true'\n        run: |\n          PRE=\${{ steps.merge.outputs.pre_merge_sha }}\n          git diff --name-only \"\$PRE\" HEAD | grep -q \"googleAppsScripts/${PROJECT_DIR}/${ENV_NAME}.gs\" \&\& \\\\\n          curl -L -X POST \\\\\n            \"https://script.google.com/macros/s/${DEPLOYMENT_ID}/exec\" \\\\\n            -d \"action=deploy\" \\\\\n            --max-time 120 || true\n"
            sed -i "${DELETE_LINE}i\\${DEPLOY_BLOCK}" "$WORKFLOW_FILE"
            ok "Added Deploy ${PROJECT_DIR} step to workflow"
        else
            warn "Could not find 'Delete branch' step in workflow — manual update needed"
        fi
    fi
else
    warn "Workflow file not found — skipping"
fi

# ── Phase 11: Sounds Directory ──
info "Phase 10: Ensuring sounds directory..."
if [ -f "live-site-pages/sounds/Website_Ready_Voice_1.mp3" ]; then
    ok "Sounds directory already populated"
else
    warn "Sound file not found — live-site-pages/sounds/Website_Ready_Voice_1.mp3 missing"
fi

# ── Phase 12: Verification ──
info "Phase 12: Verification..."
echo ""

ERRORS=0

# Check all expected files exist
EXPECTED_FILES=(
    "$HTML_PAGE"
    "$HTML_VERSION"
    "$GAS_FILE"
    "$GAS_CONFIG"
    "$GAS_VERSION"
    "$HTML_CL"
    "$HTML_CL_ARCHIVE"
    "$GAS_CL"
    "$GAS_CL_ARCHIVE"
)

for f in "${EXPECTED_FILES[@]}"; do
    if [ -f "$f" ]; then
        ok "  $f"
    else
        err "  MISSING: $f"
        ERRORS=$((ERRORS + 1))
    fi
done

# Check for remaining template placeholders in new files
echo ""
info "Checking for remaining template placeholders..."
PLACEHOLDER_CHECK=$(grep -rn "CHANGE THIS PROJECT TITLE TEMPLATE\|<page-name>\.gs\|<page-name>\.config\.json" \
    "$HTML_PAGE" "$GAS_FILE" "$GAS_CONFIG" 2>/dev/null || true)

if [ -n "$PLACEHOLDER_CHECK" ]; then
    warn "Remaining template references found (may need manual review):"
    echo "$PLACEHOLDER_CHECK"
else
    ok "No template placeholders found in new files"
fi

# ── Summary ──
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ "$ERRORS" -eq 0 ]; then
    echo -e "${GREEN}✓ Project '${ENV_NAME}' created successfully (${#EXPECTED_FILES[@]} files)${NC}"
else
    echo -e "${RED}✗ Project creation completed with ${ERRORS} error(s)${NC}"
fi
echo ""
echo "Files created:"
for f in "${EXPECTED_FILES[@]}"; do
    echo "  $f"
done
echo ""
echo "Registered as: ${PROJECT_DIR} in GAS Projects table"
echo ""
echo "Also updated:"
echo "  - repository-information/STATUS.md (Hosted Pages + GAS Projects)"
echo "  - repository-information/ARCHITECTURE.md (Mermaid diagram)"
echo "  - README.md (structure tree)"
echo "  - .claude/rules/gas-scripts.md (GAS Projects table)"
echo "  - .github/workflows/auto-merge-claude.yml (GAS deploy webhook step)"
echo ""
echo "Claude just needs to: commit and push (Pre-Commit checklist applies)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

exit "$ERRORS"
# Developed by: ShadowAISolutions
