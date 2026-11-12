// 모든 페이지 공통: 상단 메뉴, 바닥글, 말씀 영상, 알림, 앱 설치
(function () {
  var MENU = [
    ['about.html', '교회 소개'],
    ['worship.html', '예배·모임'],
    ['sermons.html', '말씀 영상'],
    ['news.html', '교회 소식'],
    ['community.html', '커뮤니티'],
    ['newcomer.html', '처음 오셨나요'],
    ['visit.html', '오시는 길'],
  ];
  var here = location.pathname.split('/').pop() || 'index.html';

  var header = document.createElement('header');
  header.className = 'site';
  header.innerHTML =
    '<div class="wrap nav">' +
      '<a href="index.html" class="logo"><img src="logo-mark.svg" alt=""><span>예그린교회<small>예수님을 그리워하는 교회</small></span></a>' +
      '<nav class="menu" id="menu">' +
        MENU.map(function (m) { return '<a href="' + m[0] + '"' + (m[0] === here ? ' class="on"' : '') + '>' + m[1] + '</a>'; }).join('') +
      '</nav>' +
      '<div class="nav-tools"><button class="bell" id="bell" aria-label="알림 받기" title="알림 받기">🔔</button>' +
      '<button class="burger" aria-label="메뉴 열기"><span></span><span></span><span></span></button></div>' +
    '</div>';
  document.body.prepend(header);
  header.querySelector('.burger').addEventListener('click', function () {
    document.getElementById('menu').classList.toggle('open');
  });

  var footer = document.createElement('footer');
  footer.className = 'site';
  footer.innerHTML =
    '<div class="wrap">' +
      '<div><b>예그린교회</b><br>기독교대한감리회 · 담임목사 고용진<br>인천 서구 연희동 683-4 3층 · <a href="tel:032-561-0623">032-561-0623</a></div>' +
      '<div class="links">' + MENU.map(function (m) { return '<a href="' + m[0] + '">' + m[1] + '</a>'; }).join('') +
      '<a href="https://www.youtube.com/@yegrin" target="_blank" rel="noopener">유튜브</a><a href="notify.html">알림 보내기(담당자)</a></div>' +
    '</div>';
  document.body.append(footer);

  // 말씀 영상 (media.js가 매일 자동 갱신)
  var LISTS = (window.MEDIA && window.MEDIA.lists) || {};
  var KIND_NAME = { sunday: '주일설교', dawn: '새벽예배', reading: '성경통독', study: '성경공부' };

  function koDate(s) {
    var d = s.split('-');
    return d[0] + '년 ' + Number(d[1]) + '월 ' + Number(d[2]) + '일';
  }
  function shortDate(s) {
    var d = s.split('-');
    return Number(d[1]) + '.' + Number(d[2]);
  }
  function thumb(id) { return 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg'; }
  function esc(s) { return String(s || '').replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  window.Yegreen = {
    lists: LISTS,
    kindName: KIND_NAME,
    koDate: koDate,
    shortDate: shortDate,
    esc: esc,
    // 큰 화면에 설교 하나 보여 주기
    showSermon: function (item, kind) {
      if (!item) return;
      var v = document.getElementById('sermonVideo');
      if (v && location.protocol === 'file:') {
        // 파일로 열면 유튜브가 영상 재생을 막으므로(오류 153) 썸네일을 눌러 유튜브로 이동
        var a = document.createElement('a');
        a.id = 'sermonVideo';
        a.className = 'poster';
        a.target = '_blank';
        a.rel = 'noopener';
        v.replaceWith(a);
        v = null;
      }
      var poster = document.querySelector('a#sermonVideo');
      if (poster) {
        poster.href = 'https://www.youtube.com/watch?v=' + item.videoId;
        poster.style.backgroundImage = 'url(https://i.ytimg.com/vi/' + item.videoId + '/maxresdefault.jpg), url(' + thumb(item.videoId) + ')';
      }
      if (v) { v.src = 'https://www.youtube.com/embed/' + item.videoId; v.title = item.title; }
      var set = function (id, text) { var el = document.getElementById(id); if (el) el.textContent = text; };
      set('sermonSeries', item.series || (kind && kind !== 'sunday' ? KIND_NAME[kind] : ''));
      set('sermonTitle', item.title);
      set('sermonMeta', [koDate(item.date), item.passage, item.preacher].filter(Boolean).join(' · '));
      var yt = document.getElementById('sermonYoutube');
      if (yt) yt.href = 'https://www.youtube.com/watch?v=' + item.videoId;
    },
    card: function (item, kind) {
      return '<button class="vcard" data-id="' + item.videoId + '">' +
        '<div class="thumb" style="background-image:url(' + thumb(item.videoId) + ')"></div>' +
        '<div class="txt"><span class="tag">' + KIND_NAME[kind] + '</span>' +
        '<h3>' + esc(item.title) + '</h3>' +
        '<p>' + [shortDate(item.date), item.passage].filter(Boolean).map(esc).join(' · ') + '</p></div></button>';
    },
  };

  // 주보 (주보 만들기 프로그램의 "홈페이지로 보내기"가 bulletin/bulletins.js를 씀)
  var BULLETINS = window.BULLETINS || [];
  function inl(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>'); }
  window.Yegreen.bulletins = BULLETINS;
  window.Yegreen.newsLines = function (body) {
    return String(body || '').split('\n').map(function (l) { return l.trim().replace(/^[-•*·]\s*/, ''); }).filter(Boolean);
  };
  window.Yegreen.inl = inl;
  // 소식 제목·내용에서 첫 날짜("11월 22일")를 찾아 꼬리표로
  window.Yegreen.newsTag = function (n) {
    var m = (n.t + ' ' + n.b).match(/\d{1,2}월\s?\d{1,2}일(\s?\([^)]*\))?/);
    return m ? m[0] : '';
  };

  // 알림: 지금은 이 기기에서만 동작. 성도 전체 발송은 https 주소와 발송 서버를 연결한 뒤 가능
  var canPush = window.isSecureContext && 'Notification' in window && 'serviceWorker' in navigator;
  var isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  var isInstalled = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  var bell = header.querySelector('#bell');

  function toast(text) {
    var old = document.querySelector('.toast');
    if (old) old.remove();
    var t = document.createElement('div');
    t.className = 'toast';
    t.setAttribute('role', 'status');
    t.textContent = text;
    document.body.append(t);
    setTimeout(function () { t.remove(); }, 4500);
  }
  function banner(msg) {
    var old = document.querySelector('.push-banner');
    if (old) old.remove();
    var b = document.createElement('div');
    b.className = 'push-banner';
    b.innerHTML = '<button class="push-card"><img src="icon-192.png" alt=""><div><b>' + esc(msg.title) + '</b><p>' + esc(msg.body) + '</p></div></button>';
    b.querySelector('button').addEventListener('click', function () { location.href = msg.url || 'index.html'; });
    document.body.append(b);
    setTimeout(function () { b.remove(); }, 7000);
  }
  // 시스템 알림을 띄우면 true, 화면 안 배너로 대신하면 false
  function notify(msg) {
    if (!canPush || Notification.permission !== 'granted') { banner(msg); return Promise.resolve(false); }
    return navigator.serviceWorker.ready.then(function (reg) {
      return reg.showNotification(msg.title, { body: msg.body, icon: 'icon-192.png', badge: 'icon-192.png', data: { url: msg.url } });
    }).then(function () { return true; }).catch(function () { banner(msg); return false; });
  }
  window.Yegreen.toast = toast;
  window.Yegreen.notify = notify;

  if (canPush && Notification.permission === 'granted') bell.classList.add('on');
  bell.addEventListener('click', function () {
    if (isIOS && !isInstalled) { toast('아이폰은 공유 버튼 → "홈 화면에 추가"로 앱을 설치한 뒤 알림을 켤 수 있어요.'); return; }
    if (!canPush) { toast('알림은 교회 앱 주소(https)가 생긴 뒤에 켤 수 있어요.'); return; }
    if (Notification.permission === 'denied') { toast('알림이 차단되어 있어요. 브라우저 설정에서 허용해 주세요.'); return; }
    Notification.requestPermission().then(function (result) {
      if (result !== 'granted') { toast('알림을 켜지 않았어요. 언제든 종 모양을 눌러 켤 수 있어요.'); return; }
      bell.classList.add('on');
      notify({ title: '예그린교회 알림이 켜졌어요', body: '예배와 교회 소식을 알려 드릴게요.', url: 'news.html' });
    });
  });

  // 앱 설치 안내 (안드로이드 크롬)
  var bar = document.createElement('div');
  bar.className = 'install';
  bar.innerHTML = '<img src="logo-mark.svg" alt="" style="height:36px"><p><b>예그린교회 앱</b><br>홈 화면에 추가하면 앱처럼 쓸 수 있어요</p>' +
    '<button class="btn" id="installBtn">설치</button><button class="x" aria-label="닫기">✕</button>';
  document.body.append(bar);
  var deferred;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferred = e;
    bar.classList.add('show');
  });
  bar.querySelector('#installBtn').addEventListener('click', function () {
    if (deferred) { deferred.prompt(); deferred = null; }
    bar.classList.remove('show');
  });
  bar.querySelector('.x').addEventListener('click', function () { bar.classList.remove('show'); });
  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
    navigator.serviceWorker.register('sw.js');
  }
})();
