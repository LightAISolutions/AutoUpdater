# Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), with project-specific versioning (`w` = website, `g` = Google Apps Script, `r` = repository). Older sections are rotated to [CHANGELOG-archive.md](CHANGELOG-archive.md) when this file exceeds 100 version sections.

`Sections: 8/100`

## [Unreleased]

## [v01.08r] — 2026-03-07 11:05:36 PM EST

### Added
- Oracle news scraper button in Sinexcel_Research GAS app — scrapes DatacenterDynamics.com and displays all Oracle-related articles with links

### Changed
- ABB scraper generalized — `scrapeABBNews()` refactored into `scrapeKeyword(keyword)`, a single backend function supporting any search keyword

#### `Sinexcel_Research.gs` — 01.05g
##### Added
- Oracle news scraper button — fetches DatacenterDynamics.com news pages and surfaces all Oracle-related articles with clickable links
##### Changed
- ABB scraper generalized — `scrapeABBNews()` replaced by `scrapeKeyword(keyword)`, enabling any keyword to be searched from the same backend function

## [v01.07r] — 2026-03-07 10:56:54 PM EST

### Added
- ABB news scraper button in Sinexcel_Research GAS app — scrapes DatacenterDynamics.com and displays all ABB-related articles with links

#### `Sinexcel_Research.gs` — 01.04g
##### Added
- ABB news scraper button — fetches DatacenterDynamics.com news pages and surfaces all ABB-related articles with clickable links

## [v01.06r] — 2026-03-07 10:46:41 PM EST

### Removed
- Reverted Drive folder dashboard and Claude Code research system prompt from Sinexcel_Research GAS (01.04g → 01.03g)

## [v01.05r] — 2026-03-07 09:57:34 PM EST

### Changed
- Renamed Research GAS project to Sinexcel_Research — renamed all associated files, directories, changelogs, version files, and updated all internal references

#### `Sinexcel_Research.gs` — 01.03g
##### Changed
- Project renamed from Research to Sinexcel_Research — updated FILE_PATH and EMBED_PAGE_URL internal variables

## [v01.04r] — 2026-03-07 09:35:58 PM EST

### Removed
- All visible content from the Research GAS app — page is now a blank canvas

#### `Research.gs` — 01.02g
##### Removed
- All visible content from the GAS app — page is now a blank canvas

## [v01.03r] — 2026-03-07 09:00:54 PM EST

### Changed
- Updated time estimation heuristics in chat-bookends rules — added separate estimate for large file reads (~20s), rebase+stash cycles (~25s), and complex template literal edits (~15s)

## [v01.02r] — 2026-03-07 08:57:30 PM EST

### Added
- GAS data table on Research page — fetches all rows from the Summary sheet and renders them as an HTML table with header row, striped rows, and loading/error states

#### `Research.gs` — 01.01g
##### Added
- Sheet data table — displays all rows and columns from the Summary sheet as a formatted HTML table with header row, striped rows, and loading/error states

## [v01.01r] — 2026-03-07 04:17:16 PM EST

### Added
- Set up Research GAS project — new embedding page (`live-site-pages/Research.html`), GAS script (`googleAppsScripts/Research/Research.gs`), config, version files, and changelogs. Registered in GAS Projects table, STATUS.md, ARCHITECTURE.md, README tree, and workflow deploy step

