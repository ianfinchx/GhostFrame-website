/**
 * GhostFrame — pitch pack form → Google Sheet.
 *
 * Paste this whole file into the Apps Script editor of the Google Sheet that
 * should collect the requests (Extensions → Apps Script), then deploy it as a
 * web app. The deploy steps are in the README at the bottom of this file.
 */

var SHEET_NAME = 'Pitch packs';
var HEADERS = ['Submitted at', 'Name', 'Agency', 'Agency website', 'Agency Instagram',
               'Work email', 'Realtors today', 'Prospect Instagram', 'Page'];
var REQUIRED = ['name', 'agency', 'website', 'agencyInstagram', 'email', 'realtors', 'prospectInstagram'];
var BLOCKED_DOMAINS = /^(gmail|googlemail|yahoo|hotmail|outlook)\.[a-z.]+$/i;

// Reel styles offered in the form. Must match the visible names in Video-Editor/styles/registry.json.
// The value goes to the "Reel style" column, found by its header (never by position, because the
// watcher adds its own columns to the right of these). An unknown or empty value is left blank and
// the engine falls back to Isometric.
var STYLE_HEADER = 'Reel style';
var STYLES = ['Isometric', 'Data Dashboard', 'Minimal Lines', 'Whiteboard', 'Editorial Collage', 'Product Reveal'];

// Optional: an address to notify on every new request. Leave empty to skip.
var NOTIFY_EMAIL = '';

function doPost(e) {
  var p = (e && e.parameter) || {};

  // Spam trap: real visitors never fill this field.
  if (p.company_url) return json({ ok: true });

  for (var i = 0; i < REQUIRED.length; i++) {
    if (!String(p[REQUIRED[i]] || '').trim()) return json({ ok: false, error: 'Missing ' + REQUIRED[i] });
  }

  var email = String(p.email).trim().toLowerCase();
  var domain = email.split('@')[1] || '';
  if (!domain || BLOCKED_DOMAINS.test(domain)) return json({ ok: false, error: 'Please use your agency email' });

  var row = [
    new Date(),
    clean(p.name),
    clean(p.agency),
    clean(p.website),
    clean(p.agencyInstagram),
    clean(email),
    Number(p.realtors) || 0,
    clean(p.prospectInstagram),
    clean(p.page)
  ];

  var style = String(p.reel_style || '').trim();
  if (STYLES.indexOf(style) < 0) style = '';

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = getSheet();
    sheet.appendRow(row);
    writeStyle(sheet, sheet.getLastRow(), style);
  } finally {
    lock.releaseLock();
  }

  if (NOTIFY_EMAIL) {
    MailApp.sendEmail(NOTIFY_EMAIL, 'New pitch pack request: ' + row[2],
      HEADERS.map(function (h, i) { return h + ': ' + row[i]; }).join('\n'));
  }

  return json({ ok: true });
}

// Opening the web app URL in a browser shows this, which is a quick way to confirm it is live.
function doGet() {
  return json({ ok: true, message: 'Pitch pack endpoint is live. Submit with POST.' });
}

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }
  return sheet;
}

// Writes the chosen style into the "Reel style" column. The column is found by its header
// (case-insensitive); if it does not exist yet, it is added after the last column.
function writeStyle(sheet, rowNumber, style) {
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var col = -1;
  for (var i = 0; i < headers.length; i++) {
    if (String(headers[i]).trim().toLowerCase() === STYLE_HEADER.toLowerCase()) { col = i + 1; break; }
  }
  if (col < 0) {
    col = lastCol + 1;
    sheet.getRange(1, col).setValue(STYLE_HEADER).setFontWeight('bold');
  }
  if (style) sheet.getRange(rowNumber, col).setValue(style);
}

// Trims, caps the length, and stops values like "=HYPERLINK(...)" or "@handle"
// from being read as formulas by Sheets.
function clean(v) {
  var s = String(v || '').trim().slice(0, 500);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/*
README — deploy in 5 minutes
1. Create a Google Sheet (any name).
2. In the sheet: Extensions → Apps Script. Delete the sample code and paste this file. Save.
3. Deploy → New deployment → gear icon → Web app.
     Description: Pitch pack form
     Execute as: Me
     Who has access: Anyone
   Click Deploy and authorize with your Google account
   ("Google hasn't verified this app" → Advanced → Go to project → Allow).
4. Copy the Web app URL (it ends in /exec).
5. In index.html, find  var SITE = {  near the bottom and paste it:
     pitchFormEndpoint: 'https://script.google.com/macros/s/XXXX/exec',
6. Test: open the site, click "Get a free pitch pack", submit. A "Pitch packs" tab
   appears in the sheet with the row.
If you edit this code later: Deploy → Manage deployments → pencil → Version: New version → Deploy.
The URL stays the same.
*/
