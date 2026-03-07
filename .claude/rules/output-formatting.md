# Output Formatting & Styling

*Always-loaded rules (no path scope). Covers CLI styling, agent attribution, and reminder system format.*

## CLI Accent Styling Reference
> **"Make it red" = backtick-wrap it.** Whenever the user asks to make text, labels, dividers, or any element "red" or "colored" in the CLI, the answer is **always** backtick-wrapping (`` `text` ``). This is the only reliable method for red/accent styling. Do not attempt bare Unicode characters, HTML tags, or any other approach — they do not work. Backtick-wrapping works on any text content: labels, dividers, status indicators, headers, etc.

The Claude Code CLI renders certain markdown constructs with colored/accented styling that can be used intentionally for visual emphasis in chat output. This section documents what works and what doesn't, based on empirical testing.

### What triggers colored/accent styling

| Construct | Styling | Where it works | Example |
|-----------|---------|---------------|---------|
| Backtick-wrapped text (`` `text` ``) | **Red/accent** with bordered background | Inside and outside blockquotes | `` > `Label Text` `` |
| Code-inside-link (`` [`text`](url) ``) | **Red/accent** on the code portion, clickable | Inside and outside blockquotes | `` > [`Homepage`](https://...) `` |
| Bare `─` box-drawing line (15+ chars) | **Unreliable — may not render red** | Theoretically outside blockquotes only, but not consistently observed | `───────────────` |
| Diff code block — `+` lines | **Green** syntax highlighting | Fenced code block with `diff` language | `` ```diff `` then `+ added line` |
| Diff code block — `-` lines | **Red** syntax highlighting | Fenced code block with `diff` language | `` ```diff `` then `- removed line` |
| Colored emoji sequences | **Native emoji color** (red, yellow, green, etc.) | Anywhere | `🔴🟡🟢🟥⬛` |
| Checkboxes (`- [x]`, `- [ ]`) | Rendered checkbox with visual checked/unchecked state | Inside and outside blockquotes | `> - [x] Done` / `> - [ ] Pending` |
| Language-hinted code blocks | **Multi-color** syntax highlighting (strings, keys, values) | Fenced code blocks with language hint | `` ```python ``, `` ```json ``, `` ```yaml `` |

### What does NOT trigger styling

| Construct | Result | Notes |
|-----------|--------|-------|
| Bare `─` box-drawing line (< 15 chars) | Plain white | Minimum length threshold not met |
| Bare `─` inside blockquotes | Plain white | Blockquote context suppresses the red treatment |
| Spaced `─` characters (`─ ─ ─ ─`) | Plain white | Spaces break detection |
| Other box-drawing chars (`━`, `┄`, `╌`, `╍`, `┅`) | Plain white | Only `─` (U+2500) triggers it |
| `· · · · ·` (middle dots) | Plain white | No special treatment |
| HTML tags (`<span style>`, `<mark>`, `<sub>`, etc.) | Plain text — tags visible | CLI does not interpret inline HTML |
| GitHub alert syntax (`[!NOTE]`, `[!WARNING]`) | Plain text | CLI does not support admonition rendering |
| Bold/italic wrapping code (`**\`text\`**`, `*\`text\`*`) | Same as plain backtick | No additional styling from bold/italic wrapper |
| Strikethrough (`~~text~~`) | Plain text | No dimming or gray effect |
| Definition lists (`: text`) | Plain text | No special rendering |
| LaTeX/math (`$E=mc^2$`, `$$...$$`) | Plain text | CLI does not render math notation |
| `<kbd>` tags | Plain text — tags visible | CLI does not interpret keyboard key HTML |
| Unicode symbols (`▶`, `◉`, `⊕`, `⟫`, `❯`) | Plain white text | No color treatment — rendered but unstyled |

### Key findings
- **Backtick wrapping is the most reliable method** — it works both inside and outside blockquotes with consistent red/accent styling
- **Code-inside-link** (`` [`text`](url) ``) gives you red accent styling that is also a clickable link — useful when you want a label that navigates somewhere
- **Diff code blocks** are the only way to get **green** text — use `` ```diff `` with `+` prefixed lines. Also produces red for `-` prefixed lines (distinct from the backtick red — this is syntax highlighting red)
- **Colored emoji** are the only way to get arbitrary colors (red, yellow, green, black, etc.) — they render at native emoji color regardless of context
- **Checkboxes** (`- [x]` / `- [ ]`) render with visual checked/unchecked state — useful for progress indicators or checklists within formatted output
- **Language-hinted code blocks** (`` ```python ``, `` ```json ``, `` ```yaml ``) produce multi-color syntax highlighting — different colors for strings, keys, values, keywords
- The bare `─` (U+2500) character was theorized to get red styling outside blockquotes, but this is **unreliable in practice** — use backtick-wrapping (`` `─────────────────────────` ``) for guaranteed red/accent styling on divider lines
- This is a **Claude Code CLI rendering behavior** — these styles do not appear on GitHub, VS Code markdown preview, or other markdown renderers

### Recommended patterns

**Color techniques:**
- **Red labels/headers**: `` > `Label Text` `` — backtick-wrapped text in blockquotes for section headers (used in Unaffected/Affected URLs)
- **Red clickable labels**: `` > [`Label`](url) `` — code-inside-link for accent-styled labels that also navigate somewhere
- **Green text**: `` ```diff `` with `+ text` lines — the only way to produce green in the CLI
- **Red text (alt)**: `` ```diff `` with `- text` lines — syntax-highlighted red (different shade from backtick red)
- **Colored bars/indicators**: emoji sequences (`🔴🟡🟢⬛🟥`) — arbitrary color through native emoji rendering
- **Status indicators**: `` > `✏️ Modified` `` or `` > `✅ Complete` `` — combine emoji with accent styling for maximum visibility
- **Multi-color syntax blocks**: `` ```python `` / `` ```json `` / `` ```yaml `` — richly colored output for structured data or code snippets

**Interactive/state techniques:**
- **Progress checklists**: `> - [x] Step 1 done` / `> - [ ] Step 2 pending` — visual checked/unchecked indicators

**Structural techniques:**
- **Sub-grouping**: `>>` nested blockquotes — create visual hierarchy within a blockquoted block
- **Structured data**: markdown tables inside blockquotes — present tabular information with the blockquote's left-border context
- **Visual weight/density**: unicode block chars (`▓░▒■◆`) — create visual separators or indicators with more presence than standard text
- **General rule**: whenever you need text to visually "pop" inside a blockquote, wrap it in backticks. For structural separation, use nested blockquotes or tables

### Where this is currently used
- **End-of-response block header** — `` `─────────────────────────` `` + `` `END OF RESPONSE BLOCK` `` + `` `─────────────────────────` `` uses backtick-wrapping to render the dividers and header in red/accent, visually separating work phases from the end-of-response block
- **Unaffected/Affected URLs sections** — all labels (`Template Repo`, `Repository`, `Homepage`, `✏️ Homepage`, etc.) use backtick-wrapped text on their own line to create red "headers" above each URL entry

### Other useful formatting constructs
These don't trigger color styling, but provide distinct visual structure in the CLI that can be used intentionally:

| Construct | Visual effect | Use case | Example |
|-----------|--------------|----------|---------|
| Nested blockquote levels (`>>`, `>>>`) | Progressively indented with stacked left borders | Visual hierarchy, sub-grouping within blockquoted content | `>> indented sub-item` |
| Markdown table inside blockquote | Renders as a formatted table with borders inside the blockquote | Structured data display within blockquoted sections | `> \| Col A \| Col B \|` |
| Unicode block characters (`▓`, `░`, `▒`, `■`, `◆`) | Dense visual blocks — distinct texture from standard text | Progress bars, visual separators, density indicators | `> ▓▓▓▓▓░░░░░` |

### Known limitations

**Image alt text (`![text](url)`)** — as of 2026-02-25, the Claude Code CLI does **not** render inline images. The `![alt](url)` syntax renders as a "Show image" clickable button that opens the URL in an external browser when clicked. The alt text itself is not visually displayed in the terminal. This is a known limitation — open feature requests exist (GitHub issues #2266 and #6389) for terminal graphics protocol support (Sixel, Kitty, iTerm2), but none have been implemented. The underlying `ink` (React for CLIs) framework does not natively support image rendering. **Do not use `![alt](url)` for styling purposes** unless the CLI adds inline image support in the future — check the feature requests for status updates before relying on this construct

## Agent Attribution
When subagents (Explore, Plan, Bash, etc.) are spawned via the Task tool, their contributions must be visibly attributed in the chat output so the user can see which agent produced what.

### Naming convention
- **Agent 0** — the main orchestrator (Claude itself, the one the user is talking to). Always present
- **Agent 1, Agent 2, ...** — subagents, numbered in the order they are first spawned within the session. The number persists if the same agent is resumed (e.g. Agent 1 remains Agent 1 even if resumed later)
- Format: `Agent N (type)` — e.g. `Agent 1 (Explore)`, `Agent 2 (Plan)`, `Agent 3 (Bash)`

### Inline prefix tagging
- **Agent 0 (Main) is never prefixed** — it's the default. All untagged output is understood to come from Agent 0
- **Subagent output gets prefixed** with `[Agent N (Type)]` at the start of any line that comes from or summarizes a subagent's contribution. Examples: `[Agent 1 (Explore)] Found auth middleware in src/middleware/...` or `[Agent 2 (Plan)] Recommends adding a validation layer before...`
- This applies to inline commentary during work, SUMMARY bullets, and any other output where a subagent's contribution is being relayed
- Do not change the prompts sent to subagents — this is purely an output/display convention
- Do not prefix routine tool calls (Read, Edit, Grep, Glob) — only Task-spawned subagents get prefixed
- If a subagent found nothing useful, no need to mention it

### Token Budget Reference
*See `repository-information/TOKEN-BUDGETS.md` — section "Agent Attribution"*

## Reminders for Developer
*Rule: see Session Start Checklist — "Reminders for Developer" in the Always Run section. File location and format below.*

The developer's own notes and reminders, surfaced at the start of every session. **These are the developer's property** — Claude surfaces them but does not modify, complete, or remove them without explicit developer approval (see "User-Owned Content" rule in behavioral-rules.md).

### File location
`repository-information/REMINDERS.md`

### How it works
- **Adding reminders**: when the user says "remind me next time" (or similar — "next session remember", "don't let me forget", "bring this up next time"), add an entry to `## Active Reminders` with a timestamp and description
- **Surfacing reminders**: during the Session Start Checklist, read the file and output any active reminders before proceeding to the user's request. Format: `📌 Reminders For Developer:` followed by bullet points. Session context from SESSION-CONTEXT.md is surfaced immediately after (see CLAUDE.md Session Start Checklist)
- **Completing reminders**: only when the developer **explicitly** says a reminder is done or dismisses it, move it from `## Active Reminders` to `## Completed Reminders` with a completion timestamp. Never complete a reminder autonomously based on task similarity
- **Trigger phrases**: the user does not need to use exact phrasing — any intent to be reminded in a future session should be captured. Examples: "remind me next time", "next session bring up", "don't forget to mention", "remember to tell me"

### Entry format
```
- `YYYY-MM-DD HH:MM:SS AM/PM EST` — **Brief title** — longer description if needed
```

### Completed entry format
```
- ~~`YYYY-MM-DD HH:MM:SS AM/PM EST` — **Brief title** — description~~ — completed `YYYY-MM-DD HH:MM:SS AM/PM EST`
```

Developed by: ShadowAISolutions
