// 알림 보내기 시안: 이 기기로만 시험 발송. 서버를 붙이면 성도 전체 발송으로 바뀜
(function () {
  var Y = window.Yegreen, esc = Y.esc;
  var KEY = 'yegreen-notify-v1';
  var TEMPLATES = [
    ['추수감사주일', '이번 주일은 추수감사주일이에요', '11월 22일, 감사의 마음으로 함께 예배드려요.', 'news.html'],
    ['새 설교', '이번 주 말씀이 올라왔어요', '지난 주일 설교를 다시 들어 보세요.', 'sermons.html'],
    ['예배 변경', '예배 시간 변경 안내', '변경된 시간을 확인해 주세요.', 'worship.html'],
  ];
  var el = function (id) { return document.getElementById(id); };
  var history = [];
  try { history = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) {}

  function preview() {
    el('pTitle').textContent = el('nTitle').value || '제목';
    el('pBody').textContent = el('nBody').value || '내용이 여기에 보여요.';
  }
  function fill(t) {
    el('nTitle').value = t[1];
    el('nBody').value = t[2];
    el('nUrl').value = t[3];
    preview();
  }
  function renderHistory() {
    el('history').innerHTML = history.map(function (h) {
      return '<div class="card"><b>' + esc(h.title) + '</b><p>' + esc(h.body) + '</p><small>' + esc(h.when) + ' · 이 기기로 시험 발송</small></div>';
    }).join('') || '<p class="empty">아직 보낸 알림이 없어요.</p>';
  }

  el('templates').innerHTML = TEMPLATES.map(function (t, i) { return '<button type="button" data-i="' + i + '">' + t[0] + '</button>'; }).join('');
  el('templates').addEventListener('click', function (e) {
    if (e.target.dataset.i) fill(TEMPLATES[e.target.dataset.i]);
  });
  ['nTitle', 'nBody'].forEach(function (id) { el(id).addEventListener('input', preview); });
  el('notifyForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var msg = { title: el('nTitle').value.trim(), body: el('nBody').value.trim(), url: el('nUrl').value };
    Y.notify(msg).then(function (system) {
      Y.toast(system ? '시스템 알림으로 표시했어요.' : '시스템 알림이 꺼져 있어 화면 안에 표시했어요.');
    });
    var d = new Date();
    history.unshift({ title: msg.title, body: msg.body, when: (d.getMonth() + 1) + '월 ' + d.getDate() + '일 ' + d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0') });
    history = history.slice(0, 20);
    try { localStorage.setItem(KEY, JSON.stringify(history)); } catch (err) {}
    renderHistory();
  });
  fill(TEMPLATES[0]);
  renderHistory();
})();
