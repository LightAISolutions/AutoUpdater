# Project Architecture

```mermaid
graph TB
    subgraph "Repository: htmltemplateautoupdate"
        direction TB

        subgraph "Developer Workflow"
            DEV["Developer / Claude Code"]
            CB["claude/* branch"]
            DEV -->|"push"| CB
        end

        subgraph "CI/CD — auto-merge-claude.yml"
            direction TB
            TRIGGER{"Push to claude/*?"}
            CB --> TRIGGER
            TRIGGER -->|Yes| SHA_CHECK{"Commit SHA\n= last-processed?"}
            SHA_CHECK -->|Yes| DELETE_STALE["Delete inherited branch\n(skip merge)"]
            SHA_CHECK -->|No| MERGE["Merge into main"]
            MERGE --> UPDATE_SHA["Update\nlast-processed-commit.sha"]
            UPDATE_SHA --> DIFF["Check git diff"]
            DIFF -->|"live-site-pages/ changed"| PAGES_FLAG["pages-changed = true"]
            DIFF -->|".gs changed"| GAS_DEPLOY["Deploy GAS via curl POST\nto doPost(action=deploy)"]
            GAS_DEPLOY --> DELETE_BR
            MERGE --> DELETE_BR["Delete claude/* branch"]
            PAGES_FLAG --> DEPLOY_PAGES
            TRIGGER -->|"Direct push to main"| DEPLOY_PAGES
        end

        subgraph "GitHub Pages Deployment"
            DEPLOY_PAGES["Deploy live-site-pages/ to\nGitHub Pages"]
            LIVE["Live Site\nShadowAISolutions.github.io/htmltemplateautoupdate"]
            DEPLOY_PAGES --> LIVE
        end

        subgraph "live-site-pages/ — Hosted Content"
            direction LR
            NOJEKYLL[".nojekyll"]
            INDEX["index.html"]
            GASTPL_PAGE["gas-project-creator.html"]
            GASTPL_CODE["gas-code-templates/\ngas-project-creator-code.js.txt"]
            TSTA7_PAGE["testation7.html"]
            TSTT_PAGE["testation8.html"]
            SND1["sounds/Website_Ready_Voice_1.mp3"]
            SND2["sounds/Code_Ready_Voice_1.mp3"]

            subgraph "html-versions/"
                VERTXT["indexhtml.version.txt"]
                GASTPL_VERTXT["gas-project-creatorhtml.version.txt"]
                TSTA7_VERTXT["testation7html.version.txt"]
                TSTT_VERTXT["testation8html.version.txt"]
            end

            subgraph "gs-versions/"
                TSTA7_GVERTXT["testation7gs.version.txt"]
                TSTT_GSVER["testation8gs.version.txt"]
            end

            subgraph "html-changelogs/"
                INDEX_CL["indexhtml.changelog.md"]
                INDEX_CL_ARCH["indexhtml.changelog-archive.md"]
                GASTPL_CL["gas-project-creatorhtml.changelog.md"]
                GASTPL_CL_ARCH["gas-project-creatorhtml.changelog-archive.md"]
                TSTA7_CL["testation7html.changelog.md"]
                TSTA7_CL_ARCH["testation7html.changelog-archive.md"]
                TSTT_CL["testation8html.changelog.md"]
                TSTT_CLARCH["testation8html.changelog-archive.md"]
            end

            subgraph "gs-changelogs/"
                INDEX_GCL["indexgs.changelog.md"]
                INDEX_GCL_ARCH["indexgs.changelog-archive.md"]
                TSTA7_GCL["testation7gs.changelog.md"]
                TSTA7_GCL_ARCH["testation7gs.changelog-archive.md"]
                TSTT_GSCL["testation8gs.changelog.md"]
                TSTT_GSCLARCH["testation8gs.changelog-archive.md"]
            end
        end

        subgraph "Auto-Refresh Loop (Client-Side)"
            direction TB
            BROWSER["Browser loads index.html"]
            POLL["Poll indexhtml.version.txt\nevery 10s"]
            COMPARE{"Remote version\n≠ loaded version?"}
            RELOAD["Set web-pending-sound\nReload page"]
            SPLASH["Show green 'Website Ready'\nsplash + play sound"]
            BROWSER --> POLL
            POLL --> COMPARE
            COMPARE -->|Yes| RELOAD
            RELOAD --> SPLASH
            COMPARE -->|No| POLL
        end

        subgraph "Google Apps Scripts"
            direction LR
            GAS_INDEX["googleAppsScripts/Index/index.gs"]
            GAS_CFG["index.config.json\n(source of truth for\nTITLE, DEPLOYMENT_ID,\nSPREADSHEET_ID, etc.)"]
            GAS_TSTA7["googleAppsScripts/Testation7/\ntestation7.gs"]
            GAS_TSTA7_CFG["testation7.config.json\n(source of truth for\nTITLE, DEPLOYMENT_ID,\nSPREADSHEET_ID, etc.)"]
            GAS_TSTT["googleAppsScripts/Testation8/\ntestation8.gs"]
            GAS_TSTT_CFG["testation8.config.json\n(source of truth for\nTITLE, DEPLOYMENT_ID,\nSPREADSHEET_ID, etc.)"]
        end

        subgraph "GAS Self-Update Loop"
            direction TB
            GAS_APP["GAS Web App\n(Apps Script)"]
            GAS_PULL["pullAndDeployFromGitHub()\nfetches .gs from GitHub"]
            GAS_DEPLOY_STEP["Overwrites project +\ncreates new version +\nupdates deployment"]
            GAS_POSTMSG["postMessage\n{type: gas-reload}"]
            GAS_APP --> GAS_PULL
            GAS_PULL --> GAS_DEPLOY_STEP
            GAS_DEPLOY_STEP --> GAS_POSTMSG
        end

        subgraph "Template Files"
            TPL["HtmlAndGasTemplateAutoUpdate.html\n(universal template — never bumped)"]
            TPL_VER["HtmlAndGasTemplateAutoUpdatehtml.version.txt"]
        end

        subgraph "Project Config"
            CLAUDE_MD["CLAUDE.md\n(project instructions)"]
            RULES[".claude/rules/\n(always-loaded + path-scoped rules)"]
            SKILLS[".claude/skills/\n(invokable workflow skills)"]
            REPO_VER["repository.version.txt"]
            SETTINGS[".claude/settings.json\n(git * auto-allowed)"]
            SHA_FILE[".github/last-processed-commit.sha\n(inherited branch guard)"]
        end

        subgraph "Scripts"
            INIT_SCRIPT["scripts/init-repo.sh\n(one-shot fork initialization)"]
            GAS_SETUP["scripts/setup-gas-project.sh\n(GAS project file creation)"]
            INIT_SCRIPT -.->|"auto-detects org/repo\nreplaces 22 files"| CLAUDE_MD
        end
    end

    TPL -.->|"copy to create\nnew pages"| INDEX
    GAS_CFG -.->|"syncs to\n(Pre-Commit #15)"| GAS_INDEX
    GAS_CFG -.->|"syncs to\n(Pre-Commit #15)"| INDEX
    GAS_TSTA7_CFG -.->|"syncs to\n(Pre-Commit #15)"| GAS_TSTA7
    GAS_TSTA7_CFG -.->|"syncs to\n(Pre-Commit #15)"| TSTA7_PAGE
    GAS_TSTT_CFG -.->|"syncs to\n(Pre-Commit #15)"| GAS_TSTT
    GAS_TSTT_CFG -.->|"syncs to\n(Pre-Commit #15)"| TSTT_PAGE
    GASTPL_CODE -.->|"template source\n(setup-gas-project.sh)"| GAS_INDEX
    GASTPL_CODE -.->|"template source\n(setup-gas-project.sh)"| GAS_TSTA7
    GASTPL_CODE -.->|"template source\n(setup-gas-project.sh)"| GAS_TSTT
    LIVE -.->|"serves"| BROWSER
    INDEX -.->|"iframes"| GAS_APP
    TSTA7_PAGE -.->|"iframes"| GAS_APP
    TSTT_PAGE -.->|"iframes"| GAS_APP
    GAS_POSTMSG -.->|"tells embedding\npage to reload"| BROWSER
    GAS_INDEX -.->|"source of truth\nfor GAS app\n(index.gs)"| GAS_PULL
    GAS_TSTA7 -.->|"source of truth\nfor GAS app\n(testation7.gs)"| GAS_PULL
    GAS_TSTT -.->|"source of truth\nfor GAS app\n(testation8.gs)"| GAS_PULL
    GAS_DEPLOY -.->|"curl POST\naction=deploy"| GAS_APP
    SHA_FILE -.->|"read by"| SHA_CHECK
    UPDATE_SHA -.->|"writes"| SHA_FILE

    style DEV fill:#4a90d9,color:#fff
    style LIVE fill:#66bb6a,color:#fff
    style SHA_FILE fill:#ef5350,color:#fff
    style DELETE_STALE fill:#ef9a9a,color:#000
    style SPLASH fill:#1b5e20,color:#fff
    style TPL fill:#ffa726,color:#000
    style GAS_INDEX fill:#ff7043,color:#fff
    style GAS_CFG fill:#ffe082,color:#000
    style GAS_TSTA7 fill:#ff7043,color:#fff
    style GAS_TSTA7_CFG fill:#ffe082,color:#000
    style GAS_TPL_PAGE fill:#ffa726,color:#000
    style GAS_APP fill:#42a5f5,color:#fff
    style GAS_TSTT fill:#ff7043,color:#fff
    style GAS_TSTT_CFG fill:#ffe082,color:#000
    style CLAUDE_MD fill:#ce93d8,color:#000
    style RULES fill:#ce93d8,color:#000
    style SKILLS fill:#ce93d8,color:#000
    style INIT_SCRIPT fill:#78909c,color:#fff
```

Developed by: ShadowAISolutions
