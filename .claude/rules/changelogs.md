---
paths:
  - "repository-information/CHANGELOG.md"
  - "repository-information/CHANGELOG-archive.md"
  - "live-site-pages/html-changelogs/**"
  - "live-site-pages/gs-changelogs/**"
---

# Changelog Rules

*Actionable rules: see Pre-Commit Checklist items #7 and #17 in CLAUDE.md.*

## Quick Reference

### Repo CHANGELOG (Pre-Commit #7)
- Entries go under `## [Unreleased]` during intermediate commits
- On the **push commit**, entries move from `[Unreleased]` into a new version section
- Version section header format: `## [vXX.XXr] — YYYY-MM-DD HH:MM:SS AM/PM EST`
  - Header always shows only the repo version — `w`/`g` versions are carried by per-file subheadings in the body
  - No commit SHA in the header — SHAs are added during archive rotation (see CHANGELOG-archive.md "SHA enrichment")
- Categories follow [Keep a Changelog](https://keepachangelog.com/en/1.1.0/): `### Added`, `### Changed`, `### Fixed`, `### Deprecated`, `### Removed`, `### Security`
- Only include categories that have entries — no empty headings
- Entry format: `- Description` (no per-entry timestamps)
- **Per-file subheadings**: when a version section includes changes to HTML pages or GAS scripts that have their own changelogs, add `#### \`filename\` — vXX.XXw` (or `#### \`filename\` — XX.XXg` for GAS) subheadings after the main category entries, showing the version that file became. If a change affects a file but does not bump its version, use `#### \`filename\` — vXX.XXw (no change)` to show the current version with a "(no change)" note. Each file subheading lists that file's user-facing changes with `#####` category headings. Repo-only entries do not get subheadings
- Capacity counter (`Sections: X/100`) must be updated on every push commit
- **Archive rotation** triggers when counter exceeds 100 — see `repository-information/CHANGELOG-archive.md` for the full rotation logic

### Page & GAS Changelogs (Pre-Commit #17)
- **User-facing** — describe what a visitor/user would notice, not internal details
- Writing style: "Faster page loading" not "Optimized database queries"
- Never mention file names, function names, commit SHAs, deployment IDs, or internal architecture
- Version section format for pages: `## [vXX.XXw] — YYYY-MM-DD HH:MM:SS AM/PM EST — vXX.XXr`
- Version section format for GAS: `## [XX.XXg] — YYYY-MM-DD HH:MM:SS AM/PM EST — vXX.XXr`
- **Every version bump gets an entry** — if the change is purely internal with no user-visible effect, add `- Minor internal improvements` under `### Changed`. No version should exist in the changelog without at least one entry
- Same 100-section archive rotation as the repo CHANGELOG
- **Single source of truth** — page changelogs live directly in `live-site-pages/html-changelogs/` (`.md` files) and GAS changelogs in `live-site-pages/gs-changelogs/` (`.md` files). These are both the source of truth and the deployed files fetched by the live site's changelog popup — no separate deployment copy is needed

### Changelog Security (MANDATORY — applies to ALL changelogs)
Changelogs in this repo are **publicly accessible** — page changelogs are deployed to GitHub Pages and fetched by the browser. Even on private repos, GitHub Pages content is public. Every changelog entry must be safe for public consumption.

**HIPAA / PHI — never include any of the following in a changelog entry:**
- Patient names, dates of birth, ages, or any demographic identifiers
- Social Security numbers, Medical Record Numbers (MRNs), or account numbers
- Phone numbers, fax numbers, email addresses, or physical addresses
- Insurance plan names, policy numbers, or payer identifiers
- Medical conditions, diagnoses, medications, or treatment details
- Lab results, vitals, or clinical observations
- Provider names tied to specific patient interactions
- Any combination of data points that could identify a specific individual (even if each alone is non-identifying)

**Attack surface — never reveal internal implementation details:**
- Database table names, column names, or query patterns (e.g. ~~"Fixed SQL injection in patient_records.ssn column"~~)
- API endpoint paths, parameter names, or authentication mechanisms (e.g. ~~"Added /api/v2/patients?mrn= lookup"~~)
- Specific vulnerability types that were fixed (e.g. ~~"Patched XSS in discharge notes textarea"~~)
- Third-party service names, SDK versions, or integration details (e.g. ~~"Upgraded Stripe SDK to fix payment bypass"~~)
- Internal file names, function names, class names, or variable names
- Error message text that appears in logs or responses
- Authentication/authorization flow details (e.g. ~~"Added JWT refresh token rotation"~~)
- Infrastructure details — server names, IP ranges, cloud regions, deployment pipelines

**How to write secure changelog entries — examples:**

| Unsafe (never write this) | Safe (write this instead) |
|---------------------------|--------------------------|
| Fixed SQL injection in patient lookup query | Improved data validation on search forms |
| Added SSN field to intake form | Added new identifier field to intake workflow |
| Patched XSS vulnerability in notes textarea | Fixed text input sanitization issue |
| Fixed bug where patient DOB showed in error messages | Fixed an issue where sensitive data could appear in error messages |
| Upgraded auth to use OAuth 2.0 PKCE flow | Improved login security |
| Added /api/discharge endpoint for PDF export | Added discharge document export feature |
| Fixed race condition in prescription refill cron job | Fixed timing issue with prescription refill processing |
| Migrated from MySQL 5.7 to PostgreSQL 15 | Upgraded backend database for better performance |
| Added insurance eligibility check via Availity API | Added real-time insurance verification |
| Fixed CORS issue allowing cross-origin data access | Fixed a security issue with cross-origin requests |

**The general rule:** describe **what the user experiences**, not **how the system works**. A changelog reader should learn "what changed for me" without learning anything about the technical implementation, data model, or security posture of the application.

**Repo CHANGELOG (`repository-information/CHANGELOG.md`)** — this file is **exempt** from the security restrictions above. It lives in `repository-information/` which is never deployed to GitHub Pages — only collaborators with repo access can see it, and they already have full access to the source code. The repo CHANGELOG should use **technically precise descriptions** (file names, function names, implementation details, vulnerability specifics) because that level of detail is valuable for developer context and audit trails. The security rules above apply exclusively to the **publicly deployed** page and GAS changelogs in `live-site-pages/`.

### Changelog Popup Toggle (per-page)
The changelog popup can be independently enabled or disabled per page using the `SHOW_CHANGELOG` variable in each HTML page's configuration block. This is **separate from `SHOW_WEB_VERSION`** — the version indicator pill can remain visible (for developer reference) while the changelog popup is hidden from users.

- `var SHOW_CHANGELOG = true;` exists in each HTML page's config block (near `SHOW_WEB_VERSION`)
- When `SHOW_CHANGELOG = false`: the version indicator still appears (if `SHOW_WEB_VERSION = true`), but clicking it does nothing — no popup, no fetch. The cursor changes to `default` to signal non-interactivity. On GAS-enabled pages, the GAS pill click is also disabled. The changelog CSS, DOM elements, and JavaScript are still present but the click handler is gated
- When `SHOW_CHANGELOG = true` (default): current behavior — clicking the version indicator opens the changelog popup, clicking the GAS pill opens the GAS changelog popup
- **Recommended for clinic/healthcare apps**: set `SHOW_CHANGELOG = false` to minimize public information exposure. The changelog files still exist in the repo for developer reference but are not surfaced to end users

### Archive Rotation Summary
- **Quick rule**: 100 triggers, date groups move. A date group is ALL sections sharing the same date — could be 1 section or 500. Never split a date group. Today's sections (EST) are always exempt. Repeat until ≤100 non-exempt sections remain
- Full rotation logic is documented in `repository-information/CHANGELOG-archive.md` (see "Rotation Logic" section)
- **SHA enrichment is MANDATORY during rotation** — every section header moved to the archive MUST have a commit SHA link appended. This applies to the repo CHANGELOG archive AND all page/GAS changelog archives. Look up the commit via `git log --oneline --all --grep="^vXX.XXr "` for repo sections, or by searching for the repo version cross-reference for page/GAS sections. **Post-rotation verification**: run `grep '^## \[v' ARCHIVE_FILE | grep -v '— \[' | head -5` — if any lines appear, SHA enrichment was missed and must be completed before committing. This is the most commonly skipped rotation step — see CHANGELOG-archive.md "Post-rotation verification" for the mandatory check

Developed by: ShadowAISolutions
