// 예그린교회 로고 하트 투표 — 구글 앱스 스크립트 (구글 시트에 붙은 스크립트)
// 배포: 배포 › 새 배포 › 웹 앱 · 실행: 나 · 액세스: 모든 사용자
// 한 기기(device)당 한 줄. 다시 투표하면 그 줄을 덮어씀. 이름 등 개인정보는 받지 않음.
var N = 21;

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('votes') || ss.insertSheet('votes');
  if (sh.getLastRow() === 0) sh.appendRow(['시간', '기기', '고른 번호']);
  return sh;
}

function counts_() {
  var sh = sheet_(), rows = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 3).getValues() : [];
  var c = {}; for (var i = 1; i <= N; i++) c[i] = 0;
  var voters = 0;
  rows.forEach(function (r) {
    var picks = String(r[2] || '').split('|').filter(String);
    if (picks.length) voters++;
    picks.forEach(function (p) { if (c[p] !== undefined) c[p]++; });
  });
  return { counts: c, voters: voters };
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() { return out_(counts_()); }

function doPost(e) {
  var lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    var body = JSON.parse(e.postData.contents || '{}');
    var device = String(body.device || '').replace(/[^a-z0-9]/gi, '').slice(0, 40);
    if (!device) return out_({ error: 'no device' });
    var picks = (body.picks || []).map(Number).filter(function (n) { return n >= 1 && n <= N; });
    picks = picks.filter(function (n, i) { return picks.indexOf(n) === i; }).sort(function (a, b) { return a - b; });
    var sh = sheet_(), last = sh.getLastRow(), row = 0;
    if (last > 1) {
      var ids = sh.getRange(2, 2, last - 1, 1).getValues();
      for (var i = 0; i < ids.length; i++) if (ids[i][0] === device) { row = i + 2; break; }
    }
    var vals = [[new Date(), device, picks.join('|')]];
    if (row) sh.getRange(row, 1, 1, 3).setValues(vals); else sh.appendRow(vals[0]);
    return out_(counts_());
  } finally { lock.releaseLock(); }
}
