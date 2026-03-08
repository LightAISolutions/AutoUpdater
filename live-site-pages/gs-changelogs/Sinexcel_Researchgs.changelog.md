# Changelog — Database (Google Apps Script)

All notable user-facing changes to this script are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Older sections are rotated to [Sinexcel_Researchgs.changelog-archive.md](Sinexcel_Researchgs.changelog-archive.md) when this file exceeds 50 version sections.

`Sections: 4/50`

## [Unreleased]

## [01.04g] — 2026-03-07 10:18:08 PM EST — v01.06r

### Added
- Drive folder dashboard — create research sessions, generate Google Drive folders, log all files in the spreadsheet
- System prompt generator — produces a complete, pre-filled Claude Code prompt for deep market research on any target company
- Research sessions table — shows all sessions with status, file count, and action buttons (Open Folder, Copy Prompt, View Files, Mark Complete)
- File index tab — browse and open all generated research files filtered by company
- GAS API endpoints — `saveFile` (Claude Code uploads content directly to Drive), `logFile`, `createFolder`, `updateStatus`, `getIndex`, `getFiles`
- JSON body support in `doPost` — Claude Code can POST research file content as JSON for clean, size-safe uploads

## [01.03g] — 2026-03-07 09:57:34 PM EST — v01.05r

### Changed
- Project renamed from Research to Sinexcel_Research

## [01.02g] — 2026-03-07 09:35:58 PM EST — v01.04r

### Removed
- All visible content from the GAS app — page is now a blank canvas

## [01.01g] — 2026-03-07 08:57:30 PM EST — v01.02r

### Added
- Sheet data table — displays all rows and columns from the Summary sheet as a formatted HTML table with header row, striped rows, and loading/error states

Developed by: LightAISolutions
