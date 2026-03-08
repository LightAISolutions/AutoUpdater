var VERSION = "01.05g";
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

function scrapeKeyword(keyword) {
  var BASE = "https://www.datacenterdynamics.com";
  var KEYWORD_RE = new RegExp('\\b' + keyword + '\\b', 'i');
  var articles = [];
  var pagesChecked = 0;

  var pagesToFetch = [
    BASE + "/en/news/",
    BASE + "/en/news/?page=2",
    BASE + "/en/news/?page=3"
  ];

  for (var pi = 0; pi < pagesToFetch.length; pi++) {
    try {
      var resp = UrlFetchApp.fetch(pagesToFetch[pi], {
        muteHttpExceptions: true,
        followRedirects: true,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml"
        }
      });
      pagesChecked++;
      if (resp.getResponseCode() !== 200) continue;

      var html = resp.getContentText();
      var seen = {};

      // Find every /en/news/ (or /en/analysis/ /en/opinion/) href
      var hrefRe = /href="(\/en\/(?:news|analysis|opinion|features)\/([^"#?\/][^"#?]*))"[^>]*>/gi;
      var m;

      while ((m = hrefRe.exec(html)) !== null) {
        var path = m[1];
        var slug = m[2];
        if (seen[path]) continue;
        seen[path] = true;

        // Grab ~600 chars of surrounding HTML and strip tags for plain text
        var ctxStart = Math.max(0, m.index - 80);
        var ctxEnd   = Math.min(html.length, m.index + 700);
        var context  = html.substring(ctxStart, ctxEnd);
        var plain    = context.replace(/<[^>]+>/g, " ").replace(/&amp;/g,"&").replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g, " ").trim();

        // Keyword match: slug or plain text contains keyword as a whole word
        var slugMatch = new RegExp('\\b' + keyword + '\\b', 'i').test(slug.replace(/-/g, " "));
        var textMatch = KEYWORD_RE.test(plain);

        if (!slugMatch && !textMatch) continue;

        // Extract best title — prefer a sentence containing the keyword
        var title = "";
        var kwSentence = plain.match(new RegExp('([A-Z][^.!?\\n]{10,180}(?:' + keyword + ')[^.!?\\n]{0,120})', 'i'));
        if (kwSentence) {
          title = kwSentence[1].trim();
        } else {
          // Fallback: humanise slug
          title = slug.replace(/-/g, " ").replace(/\b\w/g, function(c) { return c.toUpperCase(); });
        }
        if (title.length > 200) title = title.substring(0, 197) + "...";

        articles.push({ title: title, url: BASE + path });
      }

    } catch (e) {
      Logger.log("scrapeKeyword(" + keyword + ") page " + pi + " error: " + e.message);
    }
  }

  return {
    articles: articles,
    keyword: keyword,
    source: BASE + "/en/news/",
    pagesChecked: pagesChecked,
    timestamp: Utilities.formatDate(new Date(), "America/New_York", "yyyy-MM-dd HH:mm z")
  };
}

// ══════════════
// PROJECT END
// ══════════════

// ══════════════
// TEMPLATE START
// ══════════════

function doGet() {
  var html = `
    <html>
    <head>
      <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
      <meta http-equiv="Pragma" content="no-cache">
      <meta http-equiv="Expires" content="0">
      <style>
        html, body { height: 100%; margin: 0; overflow: auto; }
      </style>
    </head>
    <body>
      <script>
        window.addEventListener('message', function(e) {
          if (e.data && e.data.type === 'gas-version-check') {
            google.script.run
              .withSuccessHandler(function(data) {
                parent.postMessage({type: 'gas-version', version: data.version}, '*');
              })
              .withFailureHandler(function() {
                parent.postMessage({type: 'gas-version', version: null}, '*');
              })
              .getAppData();
          }
        });

        // ══════════════
        // PROJECT START
        // ══════════════

        (function() {
          var body = document.body;
          body.style.cssText = 'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#f1f5f9;margin:0;padding:20px;';

          body.innerHTML =
            '<div style="max-width:720px;margin:0 auto;">' +
              '<div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">' +
                '<div style="width:34px;height:34px;background:#0070f3;border-radius:7px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:12px;flex-shrink:0;">SR</div>' +
                '<div>' +
                  '<div style="font-weight:700;font-size:15px;color:#0f172a;">Sinexcel Research</div>' +
                  '<div style="font-size:12px;color:#64748b;">DCD News Monitor</div>' +
                '</div>' +
              '</div>' +
              '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
                '<button id="btn-ABB" onclick="runScrape(\'ABB\')" style="display:inline-flex;align-items:center;gap:8px;background:#0070f3;color:#fff;border:none;border-radius:7px;padding:10px 20px;font-size:13px;font-weight:600;cursor:pointer;letter-spacing:.2px;">' +
                  '&#128240; Scrape ABB News — DatacenterDynamics.com' +
                '</button>' +
                '<button id="btn-Oracle" onclick="runScrape(\'Oracle\')" style="display:inline-flex;align-items:center;gap:8px;background:#e65c00;color:#fff;border:none;border-radius:7px;padding:10px 20px;font-size:13px;font-weight:600;cursor:pointer;letter-spacing:.2px;">' +
                  '&#128240; Scrape Oracle News — DatacenterDynamics.com' +
                '</button>' +
              '</div>' +
              '<div id="status" style="margin-top:14px;font-size:13px;color:#64748b;min-height:18px;"></div>' +
              '<div id="results" style="margin-top:12px;"></div>' +
            '</div>';

          window.runScrape = function(keyword) {
            var btn    = document.getElementById('btn-' + keyword);
            var status = document.getElementById('status');
            var results = document.getElementById('results');
            btn.disabled = true;
            btn.innerHTML = '&#9203; Scraping datacenter dynamics...';
            btn.style.opacity = '0.7';
            status.style.color = '#64748b';
            status.textContent = 'Fetching pages from datacenter dynamics — this may take 15–30 seconds...';
            results.innerHTML = '';

            google.script.run
              .withSuccessHandler(function(data) {
                btn.disabled = false;
                btn.innerHTML = '&#128240; Scrape ' + keyword + ' News — DatacenterDynamics.com';
                btn.style.opacity = '1';
                showResults(data);
              })
              .withFailureHandler(function(err) {
                btn.disabled = false;
                btn.innerHTML = '&#128240; Scrape ' + keyword + ' News — DatacenterDynamics.com';
                btn.style.opacity = '1';
                status.style.color = '#ef4444';
                status.textContent = 'Error: ' + (err.message || 'Scrape failed. Check GAS logs.');
              })
              .scrapeKeyword(keyword);
          };

          window.showResults = function(data) {
            var status  = document.getElementById('status');
            var results = document.getElementById('results');
            var articles = data.articles || [];
            var keyword = data.keyword || '';

            if (articles.length === 0) {
              status.style.color = '#f59e0b';
              status.textContent = 'No ' + keyword + ' articles found across ' + data.pagesChecked + ' page(s) — ' + data.timestamp;
              results.innerHTML =
                '<div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:20px;text-align:center;color:#94a3b8;font-size:13px;">' +
                  'No results. DCD may be blocking automated requests, or there are no recent ' + keyword + ' articles.' +
                '</div>';
              return;
            }

            status.style.color = '#10b981';
            status.textContent = articles.length + ' ' + keyword + ' article(s) found across ' + data.pagesChecked + ' page(s) — ' + data.timestamp;

            var rows = articles.map(function(a, i) {
              return '<div style="padding:12px 16px;' + (i > 0 ? 'border-top:1px solid #e2e8f0;' : '') + '">' +
                '<a href="' + escHtml(a.url) + '" target="_blank" ' +
                   'style="color:#0070f3;font-weight:600;font-size:13px;text-decoration:none;line-height:1.4;display:block;">' +
                  escHtml(a.title) +
                '</a>' +
                '<div style="font-size:11px;color:#94a3b8;margin-top:3px;word-break:break-all;">' + escHtml(a.url) + '</div>' +
              '</div>';
            }).join('');

            results.innerHTML =
              '<div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">' +
                rows +
              '</div>';
          };

          window.escHtml = function(s) {
            return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
          };
        })();

        // ══════════════
        // PROJECT END
        // ══════════════

      <\/script>
    </body>
    </html>
  `;
  return HtmlService.createHtmlOutput(html)
    .setTitle(TITLE)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  var action = (e && e.parameter && e.parameter.action) || "";

  if (action === "deploy") {
    var result = pullAndDeployFromGitHub();
    return ContentService.createTextOutput(result);
  }

  if (action === "writeC1") {
    var value = (e.parameter.value) || "";
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

  return ContentService.createTextOutput("Unknown action");
}

function getAppData() {
  var data = { version: "v" + VERSION, title: TITLE };

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
