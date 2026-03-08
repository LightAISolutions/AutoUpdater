var VERSION = "01.04g";
var TITLE = "Database";
var GITHUB_OWNER  = "LightAISolutions";
var GITHUB_REPO   = "AutoUpdater";
var GITHUB_BRANCH = "main";
var FILE_PATH     = "googleAppsScripts/Sinexcel_Research/Sinexcel_Research.gs";
var DEPLOYMENT_ID = "AKfycbzla54SKYVqPZLUlymdW8vsmGpe46jO7eACnWEU86BLlav_gMHQVnzkhotsSIVbyp-p";
var SPREADSHEET_ID = "1dE9Lwui0IBJMApl-O9O7VI6mY3S6a5C1CpUFyReaURk";
var SHEET_NAME     = "Summary";
var SOUND_FILE_ID = "1bzVp6wpTHdJ4BRX8gbtDN73soWpmq1kN";
var EMBED_PAGE_URL = "https://LightAISolutions.github.io/AutoUpdater/Sinexcel_Research.html";

// ══════════════
// PROJECT START
// ══════════════

var SESSIONS_SHEET = "Sessions";
var FILES_SHEET    = "Files";
var DRIVE_ROOT_NAME = "Sinexcel Research";

function getSheetTableData() {
  if (!SPREADSHEET_ID || SPREADSHEET_ID === "YOUR_SPREADSHEET_ID") return { headers: [], rows: [] };
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return { headers: [], rows: [] };
  var data = sheet.getDataRange().getValues();
  if (data.length === 0) return { headers: [], rows: [] };
  var headers = data[0].map(function(h) { return h !== null && h !== undefined ? String(h) : ''; });
  var rows = data.slice(1).map(function(row) {
    return row.map(function(cell) { return cell !== null && cell !== undefined ? String(cell) : ''; });
  });
  return { headers: headers, rows: rows };
}

// ── Drive helpers ──

function getRootResearchFolder() {
  var folders = DriveApp.getFoldersByName(DRIVE_ROOT_NAME);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(DRIVE_ROOT_NAME);
}

function _ensureSessionsSheet(ss) {
  var sheet = ss.getSheetByName(SESSIONS_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(SESSIONS_SHEET);
    var hdr = [["Company / Topic", "Research Date", "Drive Folder URL", "Folder ID", "Status", "Notes", "Files"]];
    sheet.getRange(1, 1, 1, 7).setValues(hdr).setFontWeight("bold").setBackground("#1a1f2e").setFontColor("#e2e8f0");
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 200); sheet.setColumnWidth(2, 120);
    sheet.setColumnWidth(3, 240); sheet.setColumnWidth(4, 220);
    sheet.setColumnWidth(5, 110); sheet.setColumnWidth(6, 220); sheet.setColumnWidth(7, 60);
  }
  return sheet;
}

function _ensureFilesSheet(ss) {
  var sheet = ss.getSheetByName(FILES_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(FILES_SHEET);
    var hdr = [["Company / Topic", "File Name", "File Type", "Drive File URL", "Date Generated", "Notes"]];
    sheet.getRange(1, 1, 1, 6).setValues(hdr).setFontWeight("bold").setBackground("#1a1f2e").setFontColor("#e2e8f0");
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 200); sheet.setColumnWidth(2, 280);
    sheet.setColumnWidth(3, 160); sheet.setColumnWidth(4, 280); sheet.setColumnWidth(5, 160);
  }
  return sheet;
}

// ── Research session management ──

function createResearchFolder(companyName, notes) {
  if (!companyName) return { success: false, error: "Company name required" };
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = _ensureSessionsSheet(ss);

  var rootFolder = getRootResearchFolder();
  var dateStr = Utilities.formatDate(new Date(), "America/New_York", "yyyy-MM-dd");
  var folderName = companyName + " — " + dateStr;

  var folder;
  var existing = rootFolder.getFoldersByName(folderName);
  if (existing.hasNext()) {
    folder = existing.next();
  } else {
    folder = rootFolder.createFolder(folderName);
  }

  var folderId = folder.getId();
  var folderUrl = "https://drive.google.com/drive/folders/" + folderId;

  var nextRow = sheet.getLastRow() + 1;
  sheet.getRange(nextRow, 1, 1, 7).setValues([[
    companyName, dateStr, folderUrl, folderId, "In Progress", notes || "", 0
  ]]);
  sheet.getRange(nextRow, 3).setFormula('=HYPERLINK("' + folderUrl + '","Open Folder")');

  return { success: true, companyName: companyName, folderId: folderId, folderUrl: folderUrl, sessionDate: dateStr };
}

function getResearchIndex() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = _ensureSessionsSheet(ss);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { sessions: [] };

  var data = sheet.getRange(2, 1, lastRow - 1, 7).getValues();
  var sessions = [];
  for (var i = 0; i < data.length; i++) {
    if (!data[i][0]) continue;
    sessions.push({
      company:   String(data[i][0]),
      date:      String(data[i][1]),
      folderUrl: String(data[i][2]).replace(/^=HYPERLINK\("([^"]+)".+$/, "$1"),
      folderId:  String(data[i][3]),
      status:    String(data[i][4]),
      notes:     String(data[i][5]),
      fileCount: parseInt(data[i][6]) || 0,
      rowIndex:  i + 2
    });
  }
  sessions.reverse();
  return { sessions: sessions };
}

function getResearchFiles(companyName) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = _ensureFilesSheet(ss);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { files: [] };

  var data = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
  var files = [];
  for (var i = 0; i < data.length; i++) {
    if (!data[i][0]) continue;
    if (companyName && String(data[i][0]) !== companyName) continue;
    files.push({
      company:       String(data[i][0]),
      fileName:      String(data[i][1]),
      fileType:      String(data[i][2]),
      fileUrl:       String(data[i][3]).replace(/^=HYPERLINK\("([^"]+)".+$/, "$1"),
      dateGenerated: String(data[i][4]),
      notes:         String(data[i][5])
    });
  }
  return { files: files };
}

function logResearchFile(companyName, fileName, fileType, fileUrl, notes) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var filesSheet = _ensureFilesSheet(ss);
  var dateStr = Utilities.formatDate(new Date(), "America/New_York", "yyyy-MM-dd HH:mm");
  var nextRow = filesSheet.getLastRow() + 1;
  filesSheet.getRange(nextRow, 1, 1, 6).setValues([[
    companyName, fileName, fileType, fileUrl, dateStr, notes || ""
  ]]);
  if (fileUrl) {
    filesSheet.getRange(nextRow, 4).setFormula('=HYPERLINK("' + fileUrl + '","Open File")');
  }

  // Increment file count in Sessions sheet
  var sessSheet = _ensureSessionsSheet(ss);
  var sessLast = sessSheet.getLastRow();
  if (sessLast > 1) {
    var sessData = sessSheet.getRange(2, 1, sessLast - 1, 7).getValues();
    for (var i = sessData.length - 1; i >= 0; i--) {
      if (sessData[i][0] === companyName) {
        sessSheet.getRange(i + 2, 7).setValue((parseInt(sessData[i][6]) || 0) + 1);
        break;
      }
    }
  }
  return { success: true, fileName: fileName, fileUrl: fileUrl };
}

function saveFileToDrive(companyName, fileName, content, fileType) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = _ensureSessionsSheet(ss);
  var lastRow = sheet.getLastRow();
  var folderId = null;

  if (lastRow > 1) {
    var data = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
    for (var i = data.length - 1; i >= 0; i--) {
      if (data[i][0] === companyName) { folderId = String(data[i][3]); break; }
    }
  }

  var folder;
  if (folderId) {
    try { folder = DriveApp.getFolderById(folderId); } catch(e) { folder = getRootResearchFolder(); }
  } else {
    folder = getRootResearchFolder();
  }

  var safeName = (fileName || "research_file").replace(/[\/\\:*?"<>|]/g, "_");
  if (safeName.slice(-3) !== ".md") safeName += ".md";
  var blob = Utilities.newBlob(content || "", "text/plain", safeName);
  var file = folder.createFile(blob);
  var fileUrl = file.getUrl();

  logResearchFile(companyName, fileName || safeName, fileType || "Research", fileUrl, "");
  return { success: true, fileUrl: fileUrl, fileName: safeName, driveFileId: file.getId() };
}

function updateSessionStatus(companyName, status) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = _ensureSessionsSheet(ss);
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { success: false };
  var data = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = data.length - 1; i >= 0; i--) {
    if (data[i][0] === companyName) {
      sheet.getRange(i + 2, 5).setValue(status);
      return { success: true };
    }
  }
  return { success: false };
}

// ══════════════
// PROJECT END
// ══════════════

// ══════════════
// TEMPLATE START
// ══════════════

function doGet() {
  var endpointUrl = "";
  try { endpointUrl = ScriptApp.getService().getUrl(); } catch(e) {}

  // System prompt template — injected as JSON into the dashboard JS
  var promptLines = [
    "# Sinexcel Market Intelligence — Research Brief",
    "## Company: [COMPANY_NAME]  |  Session: [SESSION_DATE]",
    "",
    "---",
    "",
    "## YOUR ROLE",
    "You are a specialized market intelligence analyst supporting **Jon Yang**, Director of Business Development at **Sinexcel Electric Co., Ltd.** (Shenzhen Stock Exchange: 300693). Your mission is to build a comprehensive, actionable intelligence profile on [COMPANY_NAME] to support Sinexcel's US AI data center market entry.",
    "",
    "This is an active research session. You will produce structured intelligence files and automatically save each one to the designated Google Drive folder and log them in the Sinexcel research database.",
    "",
    "---",
    "",
    "## SINEXCEL CONTEXT",
    "",
    "**Company:** Shenzhen Sinexcel Electric Co., Ltd. (SZ: 300693) — publicly listed Chinese power electronics manufacturer, ~3,000 employees, 31.5% 5-year CAGR, products in 60+ countries.",
    "",
    "**AIDC Portfolio (launching April 2026):**",
    "",
    "| Product | Key Specs | Lead Time | UL Cert |",
    "|---------|-----------|-----------|---------|",
    "| MV-UPS | 4.16kV–34.5kV, 98% efficiency, 25MW modular, BESS integration, 5–7MW savings at 100MW scale | 2 months | Aug 2026 |",
    "| CBU (Supercapacitor Backup Unit) | <1ms response, 10+ yr lifespan, handles 10→180% GPU load surges, 40–60% CAPEX vs. battery | 1 month | Aug 2026 |",
    "| HVDC (future) | 800VDC architecture, 5% end-to-end efficiency gain, 45% copper reduction | TBD | TBD |",
    "",
    "**Sinexcel's competitive advantages:** Fastest delivery (2 mo MV-UPS vs. ABB 6 mo, EPC Power 4 mo), cost-competitive, 700+ global DC PQ projects (AWS, Google, NTT, Equinix), deep cross-BU power electronics DNA.",
    "",
    "**Key objections to handle:** No US AIDC reference projects yet (first units April 2026), UL cert pending until Aug 2026, Chinese manufacturer perception.",
    "",
    "**Primary competitive watch list:** ABB (HiPerGuard MV-UPS), Eaton, Vertiv, Schneider Electric, GE Vernova, Delta Electronics, EPC Power, ON.energy.",
    "",
    "**OEM targets:** Eaton, Schneider Electric, Vertiv, GE Vernova — key goal is to become their OEM/white-label supplier for AIDC power.",
    "",
    "---",
    "",
    "## RESEARCH SESSION",
    "",
    "**Target Company:** [COMPANY_NAME]",
    "**Session Date:** [SESSION_DATE]",
    "**Drive Folder:** [FOLDER_URL]",
    "**File Log API:** [GAS_ENDPOINT]",
    "",
    "---",
    "",
    "## RESEARCH METHODOLOGY",
    "",
    "Complete these phases in order:",
    "",
    "### Phase 1 — Intelligence Gathering",
    "1. Web search: \"[COMPANY_NAME]\" + \"AI data center\" + current year",
    "2. Web search: \"[COMPANY_NAME]\" + \"UPS\" OR \"critical power\" OR \"power distribution\" OR \"data center infrastructure\"",
    "3. Web search: \"[COMPANY_NAME]\" + \"US market\" OR \"United States\" — identify US footprint and projects",
    "4. Check investor relations page and recent press releases (last 12 months)",
    "5. Search for M&A activity, partnerships, major contract wins, and new product launches",
    "6. Search LinkedIn for key AIDC/critical power decision-makers at [COMPANY_NAME]",
    "7. Cross-reference: does [COMPANY_NAME] appear on any hyperscaler (Meta, Microsoft, OpenAI, Google, AWS) or colo (Equinix, NTT, Digital Realty) supplier lists?",
    "",
    "### Phase 2 — Analysis",
    "Using gathered intelligence, analyze:",
    "- How [COMPANY_NAME]'s products/services overlap with OR complement Sinexcel's MV-UPS and CBU",
    "- Where Sinexcel competes directly vs. where partnership/OEM is possible",
    "- Specific, ranked business opportunities for Jon to pursue",
    "- Key personnel and optimal engagement approach",
    "",
    "### Phase 3 — Output Files",
    "Generate the five files below in order. Upload each file to Drive immediately after writing it.",
    "",
    "---",
    "",
    "## OUTPUT FILES",
    "",
    "Create a working directory: `./[COMPANY_NAME]_Research/`",
    "",
    "### File 1: Company Profile",
    "**Filename:** `[COMPANY_NAME]_Company_Profile.md` | **Type:** Company Profile",
    "",
    "Cover:",
    "- Company overview (founded, HQ, ownership, size, revenue, key divisions, stock ticker if public)",
    "- Core products and services relevant to AI data centers",
    "- US market presence (revenue %, key US projects, major US clients, US facilities/offices)",
    "- AI/AIDC strategy — public statements, roadmap, investment signals",
    "- Recent news (last 12 months): M&A, partnerships, major contracts, product launches",
    "- Financial health signals (growth trajectory, profitability, VC funding if private)",
    "- Geographic focus and international vs. US revenue split",
    "",
    "### File 2: Competitive Analysis",
    "**Filename:** `[COMPANY_NAME]_Competitive_Analysis.md` | **Type:** Competitive Analysis",
    "",
    "Cover:",
    "- Product-by-product comparison vs. Sinexcel MV-UPS and CBU (use a table)",
    "- Where [COMPANY_NAME] competes directly with Sinexcel (head-to-head)",
    "- Where [COMPANY_NAME] is complementary (potential partner/integration/OEM)",
    "- Pricing signals (public or estimated)",
    "- Lead time and delivery comparison (if known)",
    "- Certification and compliance status vs. Sinexcel's Aug 2026 UL timeline",
    "- Sinexcel's specific differentiation vs. [COMPANY_NAME]",
    "- How [COMPANY_NAME] would respond to Sinexcel entering their market",
    "",
    "### File 3: Opportunities Assessment",
    "**Filename:** `[COMPANY_NAME]_Opportunities.md` | **Type:** Opportunities Assessment",
    "",
    "Rate each opportunity High / Medium / Low. Cover:",
    "- **As a Customer** — does [COMPANY_NAME] buy power equipment? Are they a potential Sinexcel buyer for MV-UPS/CBU?",
    "- **As a Channel Partner** — can [COMPANY_NAME] sell or integrate Sinexcel products into their AIDC solutions?",
    "- **As an OEM Target** — can [COMPANY_NAME] white-label or resell Sinexcel's products to their customers?",
    "- **As a Technology Partner** — BESS integration, software/controls, or joint solution development?",
    "- **Competitive Risk** — how aggressively should Sinexcel defend against [COMPANY_NAME]?",
    "- Recommended engagement model ranked by priority and probability of success",
    "",
    "### File 4: Key Contacts",
    "**Filename:** `[COMPANY_NAME]_Key_Contacts.md` | **Type:** Key Contacts",
    "",
    "Cover:",
    "- Decision-makers in AIDC critical power / infrastructure procurement (VP Engineering, VP Operations, Head of Data Center Infra)",
    "- Business development and partnership contacts",
    "- C-suite relevant to BD engagement (CTO, CPO, VP of Strategic Alliances)",
    "- LinkedIn profile URLs where findable",
    "- Recommended outreach sequence (who to contact first and why)",
    "- Any mutual connections or warm introduction paths (via CATL, existing Sinexcel clients, trade show contacts)",
    "",
    "### File 5: Action Plan",
    "**Filename:** `[COMPANY_NAME]_Action_Plan.md` | **Type:** Action Plan",
    "",
    "Cover:",
    "- **Immediate (Next 2 Weeks):** 3 specific actions Jon should take now",
    "- **Short-Term (30–60 Days):** Engagement milestones and relationship-building steps",
    "- **Medium-Term (90 Days):** Path to a meaningful commercial conversation",
    "- Trade shows or events where [COMPANY_NAME] will be present (check Data Center World DC, DCD>Connect, NVIDIA GTC, etc.)",
    "- Draft cold outreach message (2–3 sentences, business-casual, rapport-first, technical advisor tone)",
    "- Risk flags: what to avoid, objections to anticipate, competitive sensitivities",
    "",
    "---",
    "",
    "## FILE UPLOAD PROTOCOL",
    "",
    "After writing each `.md` file, run this command to save it to Google Drive and log it in the Sinexcel research database. Confirm each upload succeeded before moving to the next file.",
    "",
    "```bash",
    "# Upload a research file to Google Drive via the Sinexcel Research GAS API",
    "python3 -c \"",
    "import json, subprocess",
    "file_path = './[COMPANY_NAME]_Research/[COMPANY_NAME]_Company_Profile.md'",
    "with open(file_path) as f:",
    "    content = f.read()",
    "payload = json.dumps({",
    "    'action': 'saveFile',",
    "    'companyName': '[COMPANY_NAME]',",
    "    'fileName': '[COMPANY_NAME]_Company_Profile',",
    "    'fileType': 'Company Profile',",
    "    'content': content",
    "})",
    "r = subprocess.run(['curl', '-L', '-s', '-X', 'POST', '[GAS_ENDPOINT]',",
    "    '-H', 'Content-Type: application/json', '-d', payload],",
    "    capture_output=True, text=True)",
    "print(r.stdout or r.stderr)",
    "\"",
    "```",
    "",
    "Repeat for each file, changing `file_path`, `fileName`, and `fileType`:",
    "- `[COMPANY_NAME]_Company_Profile` → fileType: `Company Profile`",
    "- `[COMPANY_NAME]_Competitive_Analysis` → fileType: `Competitive Analysis`",
    "- `[COMPANY_NAME]_Opportunities` → fileType: `Opportunities Assessment`",
    "- `[COMPANY_NAME]_Key_Contacts` → fileType: `Key Contacts`",
    "- `[COMPANY_NAME]_Action_Plan` → fileType: `Action Plan`",
    "",
    "---",
    "",
    "## QUALITY STANDARDS",
    "",
    "- **Data-driven:** Cite all claims with sources. Flag assumptions with confidence levels (High / Medium / Low).",
    "- **Visual-first:** Prefer tables and comparison matrices over paragraphs for data and competitive analysis.",
    "- **US-focused:** Scope is the US AI data center market. International context only if it directly informs US strategy.",
    "- **Actionable:** Every section ends with a 'So what for Sinexcel/Jon?' callout.",
    "- **Current:** Prioritize information from the last 12 months. Flag if information is older.",
    "- **Strategic framing:** Always frame analysis through the lens of Sinexcel's April 2026 market entry — what does this mean for selling MV-UPS and CBU into US AIDC?",
    "",
    "---",
    "",
    "## BEGIN",
    "",
    "Create the working directory `./[COMPANY_NAME]_Research/`, then begin Phase 1 intelligence gathering on [COMPANY_NAME]. Work through all five files sequentially, uploading each to Drive after writing it. Confirm each upload result before proceeding to the next file."
  ];
  var promptTemplate = promptLines.join("\n");

  var html = "<!DOCTYPE html>\n" +
    "<html lang='en'><head>\n" +
    "<meta charset='UTF-8'>\n" +
    "<meta name='viewport' content='width=device-width, initial-scale=1.0'>\n" +
    "<title>Sinexcel Research Database</title>\n" +
    "<style>\n" +
    ":root{--bg:#0d1117;--card:#161b27;--card2:#1a2035;--border:#2d3748;--text:#e2e8f0;--muted:#8892a4;--blue:#0070f3;--green:#00a651;--orange:#f59e0b;--red:#ef4444;--radius:8px;}\n" +
    "*{box-sizing:border-box;margin:0;padding:0;}\n" +
    "body{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;min-height:100vh;}\n" +
    "#app{display:flex;flex-direction:column;min-height:100vh;}\n" +
    "header{background:var(--card);border-bottom:1px solid var(--border);padding:14px 20px;display:flex;align-items:center;justify-content:space-between;}\n" +
    ".header-left{display:flex;align-items:center;gap:12px;}\n" +
    ".logo{width:28px;height:28px;background:var(--green);border-radius:6px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:13px;color:#fff;flex-shrink:0;}\n" +
    ".app-title{font-size:15px;font-weight:700;letter-spacing:.3px;}\n" +
    ".app-sub{font-size:11px;color:var(--muted);margin-top:1px;}\n" +
    ".badge{background:var(--card2);border:1px solid var(--border);border-radius:20px;padding:2px 10px;font-size:11px;color:var(--muted);}\n" +
    ".tabs{background:var(--card);border-bottom:1px solid var(--border);padding:0 20px;display:flex;gap:4px;}\n" +
    ".tab{padding:10px 16px;font-size:13px;cursor:pointer;border:none;background:none;color:var(--muted);border-bottom:2px solid transparent;transition:all .15s;}\n" +
    ".tab.active{color:var(--text);border-bottom-color:var(--blue);}\n" +
    ".main{flex:1;padding:20px;}\n" +
    ".toolbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;}\n" +
    ".toolbar-title{font-size:15px;font-weight:600;}\n" +
    ".btn{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:var(--radius);border:none;cursor:pointer;font-size:13px;font-weight:500;transition:opacity .15s;}\n" +
    ".btn:hover{opacity:.85;}\n" +
    ".btn-primary{background:var(--blue);color:#fff;}\n" +
    ".btn-ghost{background:var(--card2);color:var(--text);border:1px solid var(--border);}\n" +
    ".btn-green{background:var(--green);color:#fff;}\n" +
    ".btn-sm{padding:4px 10px;font-size:12px;}\n" +
    "table{width:100%;border-collapse:collapse;background:var(--card);border-radius:var(--radius);overflow:hidden;border:1px solid var(--border);}\n" +
    "thead th{background:var(--card2);padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;white-space:nowrap;}\n" +
    "tbody tr{border-top:1px solid var(--border);transition:background .1s;}\n" +
    "tbody tr:hover{background:var(--card2);}\n" +
    "td{padding:10px 14px;vertical-align:middle;}\n" +
    ".status-badge{display:inline-block;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:600;}\n" +
    ".status-inprogress{background:rgba(0,112,243,.2);color:#60a5fa;border:1px solid rgba(0,112,243,.3);}\n" +
    ".status-complete{background:rgba(0,166,81,.2);color:#4ade80;border:1px solid rgba(0,166,81,.3);}\n" +
    ".actions{display:flex;gap:6px;flex-wrap:wrap;}\n" +
    ".empty{text-align:center;padding:48px 20px;color:var(--muted);}\n" +
    ".empty-icon{font-size:36px;margin-bottom:12px;}\n" +
    ".empty-title{font-size:15px;font-weight:600;color:var(--text);margin-bottom:6px;}\n" +
    ".loading{text-align:center;padding:40px;color:var(--muted);}\n" +
    ".modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;z-index:100;padding:20px;}\n" +
    ".modal{background:var(--card);border:1px solid var(--border);border-radius:12px;width:100%;max-width:520px;box-shadow:0 20px 60px rgba(0,0,0,.5);}\n" +
    ".modal-wide{max-width:760px;}\n" +
    ".modal-header{padding:18px 20px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;}\n" +
    ".modal-header h2{font-size:15px;font-weight:700;}\n" +
    ".modal-close{background:none;border:none;color:var(--muted);cursor:pointer;font-size:18px;line-height:1;padding:2px 6px;border-radius:4px;}\n" +
    ".modal-close:hover{color:var(--text);background:var(--card2);}\n" +
    ".modal-body{padding:20px;}\n" +
    ".modal-footer{padding:14px 20px;border-top:1px solid var(--border);display:flex;gap:8px;justify-content:flex-end;}\n" +
    "label{display:block;font-size:12px;font-weight:600;color:var(--muted);margin-bottom:6px;text-transform:uppercase;letter-spacing:.4px;}\n" +
    "input[type=text],textarea,select{width:100%;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);padding:9px 12px;color:var(--text);font-size:14px;font-family:inherit;outline:none;transition:border-color .15s;margin-bottom:14px;}\n" +
    "input[type=text]:focus,textarea:focus,select:focus{border-color:var(--blue);}\n" +
    "textarea{resize:vertical;min-height:80px;}\n" +
    "textarea.prompt-area{min-height:380px;font-family:'SF Mono',Monaco,Consolas,monospace;font-size:12px;line-height:1.6;}\n" +
    ".info-box{background:rgba(0,112,243,.1);border:1px solid rgba(0,112,243,.25);border-radius:var(--radius);padding:10px 14px;margin-bottom:14px;font-size:12px;color:#93c5fd;line-height:1.5;}\n" +
    ".file-badge{display:inline-block;padding:1px 8px;border-radius:4px;font-size:11px;background:var(--card2);border:1px solid var(--border);color:var(--muted);}\n" +
    ".company-name{font-weight:600;}\n" +
    ".file-link{color:var(--blue);text-decoration:none;}\n" +
    ".file-link:hover{text-decoration:underline;}\n" +
    ".toast{position:fixed;bottom:20px;right:20px;background:var(--green);color:#fff;padding:10px 18px;border-radius:var(--radius);font-size:13px;font-weight:500;z-index:200;opacity:0;transform:translateY(8px);transition:all .2s;pointer-events:none;}\n" +
    ".toast.show{opacity:1;transform:translateY(0);}\n" +
    "</style>\n" +
    "</head><body>\n" +
    "<div id='app'>\n" +
    "<header>\n" +
    "  <div class='header-left'>\n" +
    "    <div class='logo'>SR</div>\n" +
    "    <div><div class='app-title'>SINEXCEL RESEARCH DATABASE</div><div class='app-sub'>AI Data Center Market Intelligence</div></div>\n" +
    "  </div>\n" +
    "  <div id='version-badge' class='badge'>Loading...</div>\n" +
    "</header>\n" +
    "<div class='tabs'>\n" +
    "  <button class='tab active' onclick='showTab(\"sessions\")' id='tab-sessions'>Research Sessions</button>\n" +
    "  <button class='tab' onclick='showTab(\"files\")' id='tab-files'>File Index</button>\n" +
    "</div>\n" +
    "<div class='main'>\n" +
    "  <!-- Sessions Tab -->\n" +
    "  <div id='sessions-pane'>\n" +
    "    <div class='toolbar'>\n" +
    "      <div class='toolbar-title' id='sessions-count'>Research Sessions</div>\n" +
    "      <button class='btn btn-primary' onclick='openNewSession()'>+ New Research Session</button>\n" +
    "    </div>\n" +
    "    <div id='sessions-content'><div class='loading'>Loading sessions...</div></div>\n" +
    "  </div>\n" +
    "  <!-- Files Tab -->\n" +
    "  <div id='files-pane' style='display:none'>\n" +
    "    <div class='toolbar'>\n" +
    "      <div class='toolbar-title'>File Index</div>\n" +
    "      <select id='company-filter' onchange='filterFiles()' style='width:220px;margin-bottom:0;'><option value=''>All Companies</option></select>\n" +
    "    </div>\n" +
    "    <div id='files-content'><div class='loading'>Loading files...</div></div>\n" +
    "  </div>\n" +
    "</div>\n" +
    "</div>\n" +
    "\n" +
    "<!-- New Session Modal -->\n" +
    "<div id='new-session-overlay' class='modal-overlay' style='display:none'>\n" +
    "  <div class='modal'>\n" +
    "    <div class='modal-header'><h2>New Research Session</h2><button class='modal-close' onclick='closeNewSession()'>&#x2715;</button></div>\n" +
    "    <div class='modal-body'>\n" +
    "      <div class='info-box'>A Google Drive folder will be created inside <strong>Sinexcel Research/</strong> and logged to the Sessions sheet. Then copy the system prompt to begin research with Claude Code.</div>\n" +
    "      <label>Company / Topic</label>\n" +
    "      <input type='text' id='ns-company' placeholder='e.g., Eaton, Vertiv, NVIDIA GTC 2026...' />\n" +
    "      <label>Research Focus (optional)</label>\n" +
    "      <textarea id='ns-notes' placeholder='What are you researching? Key questions, focus areas, context...'></textarea>\n" +
    "    </div>\n" +
    "    <div class='modal-footer'>\n" +
    "      <button class='btn btn-ghost' onclick='closeNewSession()'>Cancel</button>\n" +
    "      <button class='btn btn-primary' id='ns-create-btn' onclick='createSession()'>Create Research Folder</button>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</div>\n" +
    "\n" +
    "<!-- System Prompt Modal -->\n" +
    "<div id='prompt-overlay' class='modal-overlay' style='display:none'>\n" +
    "  <div class='modal modal-wide'>\n" +
    "    <div class='modal-header'><h2 id='prompt-title'>Claude Code System Prompt</h2><button class='modal-close' onclick='closePrompt()'>&#x2715;</button></div>\n" +
    "    <div class='modal-body'>\n" +
    "      <div class='info-box'>Paste this prompt into a new Claude Code session. Claude will conduct the research and automatically upload files to the Drive folder and log them here.</div>\n" +
    "      <textarea class='prompt-area' id='prompt-text' readonly></textarea>\n" +
    "    </div>\n" +
    "    <div class='modal-footer'>\n" +
    "      <button class='btn btn-ghost' onclick='closePrompt()'>Close</button>\n" +
    "      <button class='btn btn-primary' onclick='copyPrompt()'>Copy to Clipboard</button>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</div>\n" +
    "\n" +
    "<!-- Files Modal -->\n" +
    "<div id='files-modal-overlay' class='modal-overlay' style='display:none'>\n" +
    "  <div class='modal modal-wide'>\n" +
    "    <div class='modal-header'><h2 id='files-modal-title'>Research Files</h2><button class='modal-close' onclick='closeFilesModal()'>&#x2715;</button></div>\n" +
    "    <div class='modal-body' id='files-modal-body'><div class='loading'>Loading...</div></div>\n" +
    "    <div class='modal-footer'><button class='btn btn-ghost' onclick='closeFilesModal()'>Close</button></div>\n" +
    "  </div>\n" +
    "</div>\n" +
    "\n" +
    "<div class='toast' id='toast'></div>\n" +
    "\n" +
    "<script>\n" +
    "  // GAS-injected constants\n" +
    "  var GAS_ENDPOINT = " + JSON.stringify(endpointUrl) + ";\n" +
    "  var PROMPT_TEMPLATE = " + JSON.stringify(promptTemplate) + ";\n" +
    "\n" +
    "  // ── State ──\n" +
    "  var allSessions = [];\n" +
    "  var allFiles = [];\n" +
    "  var currentTab = 'sessions';\n" +
    "\n" +
    "  // ── Version check (postMessage bridge for embedding page) ──\n" +
    "  window.addEventListener('message', function(e) {\n" +
    "    if (e.data && e.data.type === 'gas-version-check') {\n" +
    "      google.script.run\n" +
    "        .withSuccessHandler(function(data) { parent.postMessage({type:'gas-version',version:data.version},'*'); })\n" +
    "        .withFailureHandler(function() { parent.postMessage({type:'gas-version',version:null},'*'); })\n" +
    "        .getAppData();\n" +
    "    }\n" +
    "  });\n" +
    "\n" +
    "  // ── Init ──\n" +
    "  window.onload = function() {\n" +
    "    loadVersion();\n" +
    "    loadSessions();\n" +
    "  };\n" +
    "\n" +
    "  function loadVersion() {\n" +
    "    google.script.run\n" +
    "      .withSuccessHandler(function(d) {\n" +
    "        document.getElementById('version-badge').textContent = d.version || '';\n" +
    "      })\n" +
    "      .withFailureHandler(function() {})\n" +
    "      .getAppData();\n" +
    "  }\n" +
    "\n" +
    "  function loadSessions() {\n" +
    "    document.getElementById('sessions-content').innerHTML = \"<div class='loading'>Loading sessions...</div>\";\n" +
    "    google.script.run\n" +
    "      .withSuccessHandler(function(result) {\n" +
    "        allSessions = result.sessions || [];\n" +
    "        renderSessions();\n" +
    "        populateCompanyFilter();\n" +
    "      })\n" +
    "      .withFailureHandler(function(err) {\n" +
    "        document.getElementById('sessions-content').innerHTML = \"<div class='loading'>Error loading sessions. Check spreadsheet access.</div>\";\n" +
    "      })\n" +
    "      .getResearchIndex();\n" +
    "  }\n" +
    "\n" +
    "  function loadFiles() {\n" +
    "    document.getElementById('files-content').innerHTML = \"<div class='loading'>Loading files...</div>\";\n" +
    "    google.script.run\n" +
    "      .withSuccessHandler(function(result) {\n" +
    "        allFiles = result.files || [];\n" +
    "        renderFilesTab();\n" +
    "      })\n" +
    "      .withFailureHandler(function() {\n" +
    "        document.getElementById('files-content').innerHTML = \"<div class='loading'>Error loading files.</div>\";\n" +
    "      })\n" +
    "      .getResearchFiles('');\n" +
    "  }\n" +
    "\n" +
    "  // ── Tab switching ──\n" +
    "  function showTab(tab) {\n" +
    "    currentTab = tab;\n" +
    "    document.getElementById('sessions-pane').style.display = tab === 'sessions' ? '' : 'none';\n" +
    "    document.getElementById('files-pane').style.display   = tab === 'files'    ? '' : 'none';\n" +
    "    document.getElementById('tab-sessions').className = 'tab' + (tab === 'sessions' ? ' active' : '');\n" +
    "    document.getElementById('tab-files').className    = 'tab' + (tab === 'files'    ? ' active' : '');\n" +
    "    if (tab === 'files' && allFiles.length === 0) loadFiles();\n" +
    "  }\n" +
    "\n" +
    "  // ── Sessions render ──\n" +
    "  function renderSessions() {\n" +
    "    var el = document.getElementById('sessions-content');\n" +
    "    var countEl = document.getElementById('sessions-count');\n" +
    "    if (allSessions.length === 0) {\n" +
    "      countEl.textContent = 'Research Sessions';\n" +
    "      el.innerHTML = \"<div class='empty'><div class='empty-icon'>&#128193;</div><div class='empty-title'>No research sessions yet</div><div>Click <strong>+ New Research Session</strong> to create your first session</div></div>\";\n" +
    "      return;\n" +
    "    }\n" +
    "    countEl.textContent = 'Research Sessions (' + allSessions.length + ')';\n" +
    "    var rows = allSessions.map(function(s) {\n" +
    "      var statusCls = s.status === 'Complete' ? 'status-complete' : 'status-inprogress';\n" +
    "      return \"<tr>\" +\n" +
    "        \"<td><span class='company-name'>\" + esc(s.company) + \"</span>\" + (s.notes ? \"<br><span style='color:var(--muted);font-size:11px;'>\" + esc(s.notes.substring(0,60)) + (s.notes.length > 60 ? '...' : '') + \"</span>\" : \"\") + \"</td>\" +\n" +
    "        \"<td style='color:var(--muted);font-size:12px;'>\" + esc(s.date) + \"</td>\" +\n" +
    "        \"<td><span class='status-badge \" + statusCls + \"'>\" + esc(s.status) + \"</span></td>\" +\n" +
    "        \"<td style='text-align:center;font-weight:600;'>\" + s.fileCount + \"</td>\" +\n" +
    "        \"<td><div class='actions'>\" +\n" +
    "          (s.folderUrl ? \"<a href='\" + s.folderUrl + \"' target='_blank'><button class='btn btn-ghost btn-sm'>&#128193; Folder</button></a>\" : \"\") +\n" +
    "          \"<button class='btn btn-primary btn-sm' onclick='openPrompt(\" + JSON.stringify(s.company) + \",\" + JSON.stringify(s.folderId) + \",\" + JSON.stringify(s.folderUrl) + \",\" + JSON.stringify(s.date) + \")'>&#128203; Prompt</button>\" +\n" +
    "          \"<button class='btn btn-ghost btn-sm' onclick='openFilesModal(\" + JSON.stringify(s.company) + \")'>&#128196; Files</button>\" +\n" +
    "          (s.status !== 'Complete' ? \"<button class='btn btn-green btn-sm' onclick='markComplete(\" + JSON.stringify(s.company) + \",this)'>&#10003; Done</button>\" : \"\") +\n" +
    "        \"</div></td>\" +\n" +
    "      \"</tr>\";\n" +
    "    }).join('');\n" +
    "    el.innerHTML = \"<table><thead><tr><th>Company / Topic</th><th>Date</th><th>Status</th><th>Files</th><th>Actions</th></tr></thead><tbody>\" + rows + \"</tbody></table>\";\n" +
    "  }\n" +
    "\n" +
    "  // ── Files tab render ──\n" +
    "  function populateCompanyFilter() {\n" +
    "    var sel = document.getElementById('company-filter');\n" +
    "    var companies = [];\n" +
    "    allSessions.forEach(function(s) { if (companies.indexOf(s.company) === -1) companies.push(s.company); });\n" +
    "    sel.innerHTML = '<option value=\"\">All Companies</option>' + companies.map(function(c) { return '<option>' + esc(c) + '</option>'; }).join('');\n" +
    "  }\n" +
    "\n" +
    "  function filterFiles() {\n" +
    "    renderFilesTab();\n" +
    "  }\n" +
    "\n" +
    "  function renderFilesTab() {\n" +
    "    var filter = document.getElementById('company-filter').value;\n" +
    "    var files = filter ? allFiles.filter(function(f) { return f.company === filter; }) : allFiles;\n" +
    "    var el = document.getElementById('files-content');\n" +
    "    if (files.length === 0) {\n" +
    "      el.innerHTML = \"<div class='empty'><div class='empty-icon'>&#128196;</div><div class='empty-title'>No files yet</div><div>Files appear here after Claude Code uploads them via the research protocol.</div></div>\";\n" +
    "      return;\n" +
    "    }\n" +
    "    var rows = files.map(function(f) {\n" +
    "      return \"<tr>\" +\n" +
    "        \"<td><span class='company-name'>\" + esc(f.company) + \"</span></td>\" +\n" +
    "        \"<td>\" + (f.fileUrl ? \"<a class='file-link' href='\" + f.fileUrl + \"' target='_blank'>\" + esc(f.fileName) + \"</a>\" : esc(f.fileName)) + \"</td>\" +\n" +
    "        \"<td><span class='file-badge'>\" + esc(f.fileType) + \"</span></td>\" +\n" +
    "        \"<td style='color:var(--muted);font-size:12px;'>\" + esc(f.dateGenerated) + \"</td>\" +\n" +
    "      \"</tr>\";\n" +
    "    }).join('');\n" +
    "    el.innerHTML = \"<table><thead><tr><th>Company</th><th>File</th><th>Type</th><th>Date</th></tr></thead><tbody>\" + rows + \"</tbody></table>\";\n" +
    "  }\n" +
    "\n" +
    "  // ── New session ──\n" +
    "  function openNewSession() {\n" +
    "    document.getElementById('ns-company').value = '';\n" +
    "    document.getElementById('ns-notes').value = '';\n" +
    "    document.getElementById('ns-create-btn').disabled = false;\n" +
    "    document.getElementById('ns-create-btn').textContent = 'Create Research Folder';\n" +
    "    document.getElementById('new-session-overlay').style.display = 'flex';\n" +
    "    setTimeout(function() { document.getElementById('ns-company').focus(); }, 100);\n" +
    "  }\n" +
    "\n" +
    "  function closeNewSession() {\n" +
    "    document.getElementById('new-session-overlay').style.display = 'none';\n" +
    "  }\n" +
    "\n" +
    "  function createSession() {\n" +
    "    var company = document.getElementById('ns-company').value.trim();\n" +
    "    var notes   = document.getElementById('ns-notes').value.trim();\n" +
    "    if (!company) { document.getElementById('ns-company').focus(); return; }\n" +
    "    var btn = document.getElementById('ns-create-btn');\n" +
    "    btn.disabled = true;\n" +
    "    btn.textContent = 'Creating...';\n" +
    "    google.script.run\n" +
    "      .withSuccessHandler(function(result) {\n" +
    "        closeNewSession();\n" +
    "        showToast('Folder created for ' + company);\n" +
    "        loadSessions();\n" +
    "        // Auto-open system prompt for the new session\n" +
    "        setTimeout(function() {\n" +
    "          openPrompt(result.companyName, result.folderId, result.folderUrl, result.sessionDate);\n" +
    "        }, 600);\n" +
    "      })\n" +
    "      .withFailureHandler(function(err) {\n" +
    "        btn.disabled = false;\n" +
    "        btn.textContent = 'Create Research Folder';\n" +
    "        showToast('Error: ' + (err.message || 'Failed to create folder'), true);\n" +
    "      })\n" +
    "      .createResearchFolder(company, notes);\n" +
    "  }\n" +
    "\n" +
    "  // ── System prompt ──\n" +
    "  function openPrompt(company, folderId, folderUrl, sessionDate) {\n" +
    "    var prompt = PROMPT_TEMPLATE\n" +
    "      .replace(/\\[COMPANY_NAME\\]/g, company)\n" +
    "      .replace(/\\[SESSION_DATE\\]/g, sessionDate)\n" +
    "      .replace(/\\[FOLDER_URL\\]/g, folderUrl)\n" +
    "      .replace(/\\[GAS_ENDPOINT\\]/g, GAS_ENDPOINT);\n" +
    "    document.getElementById('prompt-title').textContent = 'Claude Code Prompt — ' + company;\n" +
    "    document.getElementById('prompt-text').value = prompt;\n" +
    "    document.getElementById('prompt-overlay').style.display = 'flex';\n" +
    "  }\n" +
    "\n" +
    "  function closePrompt() { document.getElementById('prompt-overlay').style.display = 'none'; }\n" +
    "\n" +
    "  function copyPrompt() {\n" +
    "    var ta = document.getElementById('prompt-text');\n" +
    "    ta.select();\n" +
    "    try { document.execCommand('copy'); } catch(e) { navigator.clipboard.writeText(ta.value); }\n" +
    "    showToast('Prompt copied to clipboard!');\n" +
    "  }\n" +
    "\n" +
    "  // ── Files modal ──\n" +
    "  function openFilesModal(company) {\n" +
    "    document.getElementById('files-modal-title').textContent = 'Research Files — ' + company;\n" +
    "    document.getElementById('files-modal-body').innerHTML = \"<div class='loading'>Loading...</div>\";\n" +
    "    document.getElementById('files-modal-overlay').style.display = 'flex';\n" +
    "    google.script.run\n" +
    "      .withSuccessHandler(function(result) {\n" +
    "        var files = result.files || [];\n" +
    "        if (files.length === 0) {\n" +
    "          document.getElementById('files-modal-body').innerHTML = \"<div class='empty' style='padding:24px'><div class='empty-icon'>&#128196;</div><div class='empty-title'>No files yet</div><div>Files will appear here after Claude Code uploads them.</div></div>\";\n" +
    "          return;\n" +
    "        }\n" +
    "        var rows = files.map(function(f) {\n" +
    "          return \"<tr>\" +\n" +
    "            \"<td>\" + (f.fileUrl ? \"<a class='file-link' href='\" + f.fileUrl + \"' target='_blank'>\" + esc(f.fileName) + \"</a>\" : esc(f.fileName)) + \"</td>\" +\n" +
    "            \"<td><span class='file-badge'>\" + esc(f.fileType) + \"</span></td>\" +\n" +
    "            \"<td style='color:var(--muted);font-size:12px;'>\" + esc(f.dateGenerated) + \"</td>\" +\n" +
    "          \"</tr>\";\n" +
    "        }).join('');\n" +
    "        document.getElementById('files-modal-body').innerHTML = \"<table><thead><tr><th>File</th><th>Type</th><th>Date</th></tr></thead><tbody>\" + rows + \"</tbody></table>\";\n" +
    "      })\n" +
    "      .withFailureHandler(function() {\n" +
    "        document.getElementById('files-modal-body').innerHTML = \"<div class='loading'>Error loading files.</div>\";\n" +
    "      })\n" +
    "      .getResearchFiles(company);\n" +
    "  }\n" +
    "\n" +
    "  function closeFilesModal() { document.getElementById('files-modal-overlay').style.display = 'none'; }\n" +
    "\n" +
    "  // ── Mark complete ──\n" +
    "  function markComplete(company, btn) {\n" +
    "    btn.disabled = true;\n" +
    "    google.script.run\n" +
    "      .withSuccessHandler(function() {\n" +
    "        showToast(company + ' marked complete');\n" +
    "        loadSessions();\n" +
    "      })\n" +
    "      .withFailureHandler(function() { btn.disabled = false; })\n" +
    "      .updateSessionStatus(company, 'Complete');\n" +
    "  }\n" +
    "\n" +
    "  // ── Utilities ──\n" +
    "  function esc(s) {\n" +
    "    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;');\n" +
    "  }\n" +
    "\n" +
    "  function showToast(msg, isError) {\n" +
    "    var t = document.getElementById('toast');\n" +
    "    t.textContent = msg;\n" +
    "    t.style.background = isError ? 'var(--red)' : 'var(--green)';\n" +
    "    t.className = 'toast show';\n" +
    "    setTimeout(function() { t.className = 'toast'; }, 3000);\n" +
    "  }\n" +
    "\n" +
    "  // Close modals on overlay click\n" +
    "  document.getElementById('new-session-overlay').addEventListener('click', function(e) { if(e.target===this) closeNewSession(); });\n" +
    "  document.getElementById('prompt-overlay').addEventListener('click', function(e) { if(e.target===this) closePrompt(); });\n" +
    "  document.getElementById('files-modal-overlay').addEventListener('click', function(e) { if(e.target===this) closeFilesModal(); });\n" +
    "\n" +
    "  // Enter key on company input\n" +
    "  document.getElementById('ns-company').addEventListener('keydown', function(e) { if(e.key==='Enter') createSession(); });\n" +
    "<\/script>\n" +
    "</body></html>";

  return HtmlService.createHtmlOutput(html)
    .setTitle(TITLE)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  // Support both form-encoded params and JSON body
  var action = (e && e.parameter && e.parameter.action) || "";
  var jsonBody = null;

  if (!action && e && e.postData && e.postData.type === "application/json") {
    try { jsonBody = JSON.parse(e.postData.contents); action = jsonBody.action || ""; } catch(err) {}
  } else if (e && e.postData && e.postData.type === "application/json") {
    try { jsonBody = JSON.parse(e.postData.contents); } catch(err) {}
  }

  function getParam(key) {
    if (jsonBody && jsonBody[key] !== undefined) return String(jsonBody[key]);
    return (e.parameter && e.parameter[key]) || "";
  }

  // Existing template actions
  if (action === "deploy") {
    var result = pullAndDeployFromGitHub();
    return ContentService.createTextOutput(result);
  }

  if (action === "writeC1") {
    var value = getParam("value");
    if (SPREADSHEET_ID && SPREADSHEET_ID !== "YOUR_SPREADSHEET_ID") {
      try {
        var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
        var sheet = ss.getSheetByName(SHEET_NAME);
        if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
        sheet.getRange("C1").setValue(value + " — " + new Date().toLocaleString());
      } catch(e) {}
    }
    return ContentService.createTextOutput("OK");
  }

  // Research dashboard actions
  if (action === "createFolder") {
    var result = createResearchFolder(getParam("companyName"), getParam("notes"));
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "saveFile") {
    var company  = getParam("companyName");
    var fileName = getParam("fileName");
    var content  = getParam("content");
    var fileType = getParam("fileType") || "Research";
    var result = saveFileToDrive(company, fileName, content, fileType);
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "logFile") {
    var result = logResearchFile(getParam("companyName"), getParam("fileName"), getParam("fileType") || "Research", getParam("fileUrl"), getParam("notes"));
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "updateStatus") {
    var result = updateSessionStatus(getParam("companyName"), getParam("status"));
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "getIndex") {
    var result = getResearchIndex();
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "getFiles") {
    var result = getResearchFiles(getParam("companyName"));
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput("Unknown action");
}

function getAppData() {
  var data = { version: "v" + VERSION, title: TITLE };

  try { data.endpointUrl = ScriptApp.getService().getUrl(); } catch(e) { data.endpointUrl = ""; }

  var cache = CacheService.getScriptCache();
  var vStatus = cache.get("version_count_status");
  if (!vStatus) {
    try {
      var scriptId = ScriptApp.getScriptId();
      var totalVersions = 0;
      var vPageToken = null;
      do {
        var vListUrl = "https://script.googleapis.com/v1/projects/" + scriptId + "/versions"
          + (vPageToken ? "?pageToken=" + vPageToken : "");
        var vListResp = UrlFetchApp.fetch(vListUrl, {
          headers: { "Authorization": "Bearer " + ScriptApp.getOAuthToken() }
        });
        var vListData = JSON.parse(vListResp.getContentText());
        if (vListData.versions) totalVersions += vListData.versions.length;
        vPageToken = vListData.nextPageToken || null;
      } while (vPageToken);
      vStatus = totalVersions + "/200";
      if (totalVersions >= 180) vStatus += " — APPROACHING LIMIT!";
      cache.put("version_count_status", vStatus, 21600);
    } catch(e) {
      vStatus = "...";
    }
  }
  data.versionCount = vStatus;
  return data;
}

function getSoundBase64() {
  if (!SOUND_FILE_ID || SOUND_FILE_ID === "") return null;
  var url = "https://drive.google.com/uc?export=download&id=" + SOUND_FILE_ID;
  var response = UrlFetchApp.fetch(url, { followRedirects: true });
  var blob = response.getBlob();
  var base64 = Utilities.base64Encode(blob.getBytes());
  var contentType = blob.getContentType() || "audio/mpeg";
  return "data:" + contentType + ";base64," + base64;
}


function writeVersionToSheet() {
  if (!SPREADSHEET_ID || SPREADSHEET_ID === "YOUR_SPREADSHEET_ID") return;
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
    sheet.getRange("A1").setValue("v" + VERSION + " — " + new Date().toLocaleString());
  } catch(e) {}
}

function readB1FromCacheOrSheet() {
  if (!SPREADSHEET_ID || SPREADSHEET_ID === "YOUR_SPREADSHEET_ID") return "";
  var cache = CacheService.getScriptCache();
  var cached = cache.get("live_b1");
  if (cached !== null) return cached;

  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return "";
  var val = sheet.getRange("B1").getValue();
  var result = val !== null && val !== undefined ? String(val) : "";
  cache.put("live_b1", result, 21600);
  return result;
}

function onEditWriteB1ToCache(e) {
  if (!e || !e.range) return;
  var sheet = e.range.getSheet();
  if (sheet.getName() !== SHEET_NAME) return;
  if (e.range.getRow() !== 1 || e.range.getColumn() !== 2) return;
  var val = e.range.getValue();
  var result = val !== null && val !== undefined ? String(val) : "";
  CacheService.getScriptCache().put("live_b1", result, 21600);
}

function fetchGitHubQuotaAndLimits() {
  var result = {};

  var GITHUB_TOKEN = PropertiesService.getScriptProperties().getProperty("GITHUB_TOKEN");
  var headers = {};
  if (GITHUB_TOKEN) {
    headers["Authorization"] = "token " + GITHUB_TOKEN;
  }
  try {
    var resp = UrlFetchApp.fetch("https://api.github.com/rate_limit", { headers: headers });
    var data = JSON.parse(resp.getContentText());
    var core = data.resources.core;
    result.github = core.remaining + "/" + core.limit + "/hr";
  } catch(e) {
    result.github = "error";
  }

  result.urlFetch = "20,000/day";
  result.spreadsheet = "~20,000/day";
  result.execTime = "90 min/day";

  try {
    var mailRemaining = MailApp.getRemainingDailyQuota();
    result.mail = mailRemaining + " remaining/day";
  } catch(e) {
    result.mail = "scope error: " + e.message;
  }

  return result;
}

function pullAndDeployFromGitHub() {
  var GITHUB_TOKEN = PropertiesService.getScriptProperties().getProperty("GITHUB_TOKEN");

  var apiUrl = "https://api.github.com/repos/"
    + GITHUB_OWNER + "/" + GITHUB_REPO + "/contents/" + FILE_PATH
    + "?ref=" + GITHUB_BRANCH + "&t=" + new Date().getTime();

  var fetchHeaders = { "Accept": "application/vnd.github.v3.raw" };
  if (GITHUB_TOKEN) {
    fetchHeaders["Authorization"] = "token " + GITHUB_TOKEN;
  }

  var response = UrlFetchApp.fetch(apiUrl, { headers: fetchHeaders });
  var newCode = response.getContentText();

  var versionMatch = newCode.match(/var VERSION\s*=\s*"([^"]+)"/);
  var pulledVersion = versionMatch ? versionMatch[1] : null;

  if (pulledVersion && pulledVersion === VERSION) {
    return "Already up to date (v" + VERSION + ")";
  }

  var scriptId = ScriptApp.getScriptId();
  var url = "https://script.googleapis.com/v1/projects/" + scriptId + "/content";
  var current = UrlFetchApp.fetch(url, {
    headers: { "Authorization": "Bearer " + ScriptApp.getOAuthToken() }
  });
  var currentFiles = JSON.parse(current.getContentText()).files;
  var manifest = currentFiles.find(function(f) { return f.name === "appsscript"; });

  var payload = {
    files: [
      { name: "Code", type: "SERVER_JS", source: newCode },
      manifest
    ]
  };

  UrlFetchApp.fetch(url, {
    method: "put",
    contentType: "application/json",
    headers: { "Authorization": "Bearer " + ScriptApp.getOAuthToken() },
    payload: JSON.stringify(payload)
  });

  var versionUrl = "https://script.googleapis.com/v1/projects/" + scriptId + "/versions";
  var versionResponse = UrlFetchApp.fetch(versionUrl, {
    method: "post",
    contentType: "application/json",
    headers: { "Authorization": "Bearer " + ScriptApp.getOAuthToken() },
    payload: JSON.stringify({ description: "v" + pulledVersion + " — from GitHub " + new Date().toLocaleString() })
  });
  var newVersion = JSON.parse(versionResponse.getContentText()).versionNumber;

  var deployUrl = "https://script.googleapis.com/v1/projects/" + scriptId
    + "/deployments/" + DEPLOYMENT_ID;
  UrlFetchApp.fetch(deployUrl, {
    method: "put",
    contentType: "application/json",
    headers: { "Authorization": "Bearer " + ScriptApp.getOAuthToken() },
    payload: JSON.stringify({
      deploymentConfig: {
        scriptId: scriptId,
        versionNumber: newVersion,
        description: "v" + pulledVersion + " (deployment " + newVersion + ")"
      }
    })
  });

  var cleanupInfo = "";
  try {
    var totalVersions = 0;
    var vPageToken = null;
    do {
      var vListUrl = "https://script.googleapis.com/v1/projects/" + scriptId + "/versions"
        + (vPageToken ? "?pageToken=" + vPageToken : "");
      var vListResp = UrlFetchApp.fetch(vListUrl, {
        headers: { "Authorization": "Bearer " + ScriptApp.getOAuthToken() }
      });
      var vListData = JSON.parse(vListResp.getContentText());
      if (vListData.versions) totalVersions += vListData.versions.length;
      vPageToken = vListData.nextPageToken || null;
    } while (vPageToken);
    cleanupInfo = " | " + totalVersions + "/200";
    var versionStatus = totalVersions + "/200";
    if (totalVersions >= 180) versionStatus += " — APPROACHING LIMIT!";
    CacheService.getScriptCache().put("version_count_status", versionStatus, 21600);
  } catch(cleanupErr) {
    cleanupInfo = " | Version count error: " + cleanupErr.message;
  }

  return "Updated to v" + pulledVersion + " (deployment " + newVersion + ")" + cleanupInfo;
}

// ══════════════
// TEMPLATE END
// ══════════════
// Developed by: LightAISolutions
