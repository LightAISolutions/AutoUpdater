var VERSION = "01.01g";
var TITLE = "Database";
var GITHUB_OWNER  = "LightAISolutions";
var GITHUB_REPO   = "AutoUpdater";
var GITHUB_BRANCH = "main";
var FILE_PATH     = "googleAppsScripts/Research/Research.gs";
var DEPLOYMENT_ID = "AKfycbzla54SKYVqPZLUlymdW8vsmGpe46jO7eACnWEU86BLlav_gMHQVnzkhotsSIVbyp-p";
var SPREADSHEET_ID = "1dE9Lwui0IBJMApl-O9O7VI6mY3S6a5C1CpUFyReaURk";
var SHEET_NAME     = "Summary";
var SOUND_FILE_ID = "1bzVp6wpTHdJ4BRX8gbtDN73soWpmq1kN";
var EMBED_PAGE_URL = "https://LightAISolutions.github.io/AutoUpdater/Research.html";

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
        body { font-family: Arial; display: flex; flex-direction: column; align-items: center; padding: 20px 0; box-sizing: border-box; }
        button { background: #2e7d32; color: white; border: none; padding: 8px 20px;
                 border-radius: 6px; cursor: pointer; font-size: 14px; margin-top: 10px; }
        button:hover { background: #1b5e20; }
        #versionCount { margin-top: 6px; font-size: 12px; color: #888; }
        #main-content { position: relative; width: 90%; max-width: 600px; text-align: center; }
        #sheet-container { margin-top: 10px; }
        #sheet-container h3 { text-align: center; color: #333; margin: 0 0 4px 0; }
        #token-info { font-size: 11px; color: #666; text-align: left; line-height: 1.6; white-space: nowrap; flex-shrink: 0; padding-top: 6px; }
        #token-info div { margin-bottom: 2px; }
        #live-b1 { font-size: 20px; font-weight: bold; color: #333; margin-bottom: 4px; text-align: center; }
        #sheet-iframe { width: 100%; height: 300px; border: 1px solid #ddd; border-radius: 6px; }
        #version { position: fixed; bottom: 8px; left: 8px; z-index: 9999; color: #1565c0; font-size: 12px; margin: 0; font-family: monospace; opacity: 0.8; }
        #data-table-container { width:90%;max-width:800px;margin:12px auto 0;text-align:center; }
        #data-table-container h3 { color:#333;margin:0 0 6px 0; }
        .data-table { width:100%;border-collapse:collapse;font-size:13px;text-align:left; }
        .data-table th { background:#2e7d32;color:#fff;padding:7px 10px;font-weight:600; }
        .data-table td { padding:6px 10px;border-bottom:1px solid #e0e0e0; }
        .data-table tr:last-child td { border-bottom:none; }
        .data-table tr:nth-child(even) td { background:#f5f5f5; }
        .data-table .no-data { color:#888;font-style:italic;text-align:center;padding:12px; }
        #table-loading { color:#888;font-size:13px;margin-top:8px; }
      </style>
    </head>
    <body>
      <h2 id="version">v${VERSION}</h2>
      <div style="display:flex; align-items:flex-start; justify-content:center; width:100%; gap:20px; padding:0 20px; box-sizing:border-box;">
      <div style="text-align:center; flex:0 1 auto;">
      <h1 id="title" style="font-size: 28px; margin: 0 0 4px 0;">${TITLE}</h1>
      <div id="main-content">
        <form id="redirect-form" method="GET" action="${EMBED_PAGE_URL}" target="_top" style="display:inline;">
          <button id="reload-btn" type="submit" style="background:#2e7d32;color:white;border:none;padding:8px 20px;border-radius:6px;cursor:pointer;font-size:14px;white-space:nowrap;">🔄 Reload Page</button>
        </form>
        ${SPREADSHEET_ID && SPREADSHEET_ID !== "YOUR_SPREADSHEET_ID" ? `<h3 style="color:#333; margin:6px 0 2px 0;">${SHEET_NAME}</h3>` : ''}
        <div id="versionCount" style="margin-top:6px; font-size:12px; color:#888;"><span style="color:#666;">Versions:</span> <span id="versionCountValue">...</span></div>
        ${SPREADSHEET_ID && SPREADSHEET_ID !== "YOUR_SPREADSHEET_ID" ? `<div style="margin-top:4px;"><span style="font-size:14px; color:#666;">B1 Content:</span> <span id="live-b1" style="font-size:20px; font-weight:bold; color:#333;">...</span></div>` : ''}
      </div>
      </div>
      <div id="token-info">
        <div style="font-weight:bold;color:#1b5e20;margin-bottom:3px;">Live Quotas</div>
        <div>GitHub: <span id="qi-github">...</span></div>
        <div>Mail: <span id="qi-mail">...</span></div>
        <div style="border-top:1px solid #ccc;margin:4px 0;"></div>
        <div style="font-weight:bold;color:#666;margin-bottom:3px;">Estimates</div>
        <div>UrlFetch: <span id="qi-urlfetch">...</span></div>
        <div>Sheets: <span id="qi-sheets">...</span></div>
        <div>Exec: <span id="qi-exec">...</span></div>
      </div>
      </div>

      ${SPREADSHEET_ID && SPREADSHEET_ID !== "YOUR_SPREADSHEET_ID" ? `
      <div id="sheet-container" style="width:90%;max-width:600px;text-align:center;">
        <iframe id="sheet-iframe" src="https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit?rm=minimal" style="width:100%;height:300px;border:1px solid #ddd;border-radius:6px;"></iframe>
      </div>
      ` : ''}

      <div id="data-table-container">
        <h3>${SHEET_NAME} Data</h3>
        <p id="table-loading">Loading table data...</p>
      </div>

      <div style="margin-top:10px;">
        <button onclick="playReadySound()" style="background:#1565c0;color:white;border:none;padding:6px 16px;border-radius:6px;cursor:pointer;font-size:13px;">🔊 Test Sound (Drive)</button>
        <button onclick="playBeep()" style="background:#6a1b9a;color:white;border:none;padding:6px 16px;border-radius:6px;cursor:pointer;font-size:13px;margin-left:6px;">🔔 Test Beep (Old)</button>
        <button onclick="testVibrate()" style="background:#2e7d32;color:white;border:none;padding:6px 16px;border-radius:6px;cursor:pointer;font-size:13px;margin-left:6px;">📳 Test Vibrate</button>
      </div>

      <script>
        var _soundDataUrl = null;
        google.script.run
          .withSuccessHandler(function(dataUrl) { _soundDataUrl = dataUrl; })
          .withFailureHandler(function() {})
          .getSoundBase64();

        function playBeep() {
          try {
            var ctx = new (window.AudioContext || window.webkitAudioContext)();
            var osc = ctx.createOscillator();
            var gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 880;
            gain.gain.value = 0.3;
            osc.start();
            osc.stop(ctx.currentTime + 0.15);
          } catch(e) {}
        }

        function playReadySound() {
          if (!_soundDataUrl) return;
          try {
            var audio = new Audio(_soundDataUrl);
            audio.play().catch(function() {});
          } catch(e) {}
        }

        function testVibrate() {
          if (navigator.vibrate) {
            navigator.vibrate(200);
          }
        }

        function applyData(data) {
          for (var key in data) {
            if (key === 'versionCount') {
              var vcEl = document.getElementById('versionCountValue');
              if (vcEl) {
                var vcText = data[key].replace(/ versions$/i, '');
                vcEl.textContent = vcText;
                if (data[key].indexOf('LIMIT') !== -1) {
                  vcEl.style.color = '#d32f2f';
                  vcEl.style.fontWeight = 'bold';
                }
              }
              continue;
            }
            var el = document.getElementById(key);
            if (el) el.textContent = data[key];
          }
        }

        google.script.run
          .withSuccessHandler(function(data) {
            applyData(data);
          })
          .getAppData();

        function pollB1FromCache() {
          google.script.run
            .withSuccessHandler(function(val) {
              var el = document.getElementById('live-b1');
              if (el) el.textContent = val;
            })
            .readB1FromCacheOrSheet();
        }
        if (document.getElementById('live-b1')) {
          pollB1FromCache();
          setInterval(pollB1FromCache, 15000);
        }

        function pollQuotaAndLimits() {
          google.script.run
            .withSuccessHandler(function(t) {
              var ids = {github:'qi-github', mail:'qi-mail', urlFetch:'qi-urlfetch', spreadsheet:'qi-sheets', execTime:'qi-exec'};
              for (var k in ids) {
                var span = document.getElementById(ids[k]);
                if (span && t[k]) span.textContent = t[k];
              }
            })
            .fetchGitHubQuotaAndLimits();
        }
        if (document.getElementById('token-info')) {
          pollQuotaAndLimits();
          setInterval(pollQuotaAndLimits, 60000);
        }

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

        google.script.run
          .withSuccessHandler(function(data) {
            var container = document.getElementById('data-table-container');
            var loading = document.getElementById('table-loading');
            if (!container) return;
            if (!data || !data.headers || data.headers.length === 0) {
              if (loading) loading.textContent = 'No data found.';
              return;
            }
            function escHtml(s) {
              return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
            }
            var h = '<table class="data-table"><thead><tr>';
            data.headers.forEach(function(col) { h += '<th>' + escHtml(col) + '</th>'; });
            h += '</tr></thead><tbody>';
            if (data.rows.length === 0) {
              h += '<tr><td colspan="' + data.headers.length + '" class="no-data">No rows found.</td></tr>';
            } else {
              data.rows.forEach(function(row) {
                h += '<tr>';
                data.headers.forEach(function(_, i) { h += '<td>' + escHtml(row[i] !== undefined ? row[i] : '') + '</td>'; });
                h += '</tr>';
              });
            }
            h += '</tbody></table>';
            if (loading) loading.remove();
            container.insertAdjacentHTML('beforeend', h);
          })
          .withFailureHandler(function() {
            var loading = document.getElementById('table-loading');
            if (loading) loading.textContent = 'Could not load table data.';
          })
          .getSheetTableData();

        // ══════════════
        // PROJECT END
        // ══════════════

      </script>
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
