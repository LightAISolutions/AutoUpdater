# Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), with project-specific versioning (`w` = website, `g` = Google Apps Script, `r` = repository). Older sections are rotated to [CHANGELOG-archive.md](CHANGELOG-archive.md) when this file exceeds 100 version sections.

`Sections: 2/100`

## [Unreleased]

## [v01.02r] — 2026-03-07 08:57:30 PM EST

### Added
- GAS data table on Research page — fetches all rows from the Summary sheet and renders them as an HTML table with header row, striped rows, and loading/error states

#### `Research.gs` — 01.01g
##### Added
- Sheet data table — displays all rows and columns from the Summary sheet as a formatted HTML table with header row, striped rows, and loading/error states

## [v01.01r] — 2026-03-07 04:17:16 PM EST

### Added
- Set up Research GAS project — new embedding page (`live-site-pages/Research.html`), GAS script (`googleAppsScripts/Research/Research.gs`), config, version files, and changelogs. Registered in GAS Projects table, STATUS.md, ARCHITECTURE.md, README tree, and workflow deploy step

