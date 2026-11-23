// 모든 페이지 공통: 상단 메뉴, 바닥글, 말씀 영상, 알림, 앱 설치
(function () {
  var MENU = [
    ['about.html', '교회 소개'],
    ['worship.html', '예배·모임'],
    ['sermons.html', '말씀 영상'],
    ['gallery.html', '사진첩'],
    ['newcomer.html', '처음 오셨나요'],
    ['visit.html', '오시는 길'],
  ];
  var here = location.pathname.split('/').pop() || 'index.html';

  var header = document.createElement('header');
  header.className = 'site';
  header.innerHTML =
    '<div class="wrap nav">' +
      '<a href="index.html" class="logo"><img src="logo-mark.svg" alt=""><span>예그린교회<small>YEGRIN CHURCH</small></span></a>' +
      '<nav class="menu" id="menu">' +
        MENU.map(function (m) { return '<a href="' + m[0] + '"' + (m[0] === here ? ' class="on"' : '') + '>' + m[1] + '</a>'; }).join('') +
      '</nav>' +
      '<div class="nav-tools">' +
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
      '<a href="https://www.youtube.com/@yegrin" target="_blank" rel="noopener">유튜브</a><a href="https://elenglish123-ux.github.io/yegreen-app/" target="_blank" rel="noopener">교인 앱</a></div>' +
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

  // 알림·교회 소식·주보·나눔은 등록 교인 앱에서만 (목사님 결정 2026-11-18)
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
  window.Yegreen.toast = toast;

  // 사진첩 (assets/gallery.js) — limit: 보여 줄 묶음 수
  window.Yegreen.renderGallery = function (el, limit) {
    if (!el) return;
    var G = (window.GALLERY || []).slice(0, limit || 99);
    if (!G.length) {
      el.innerHTML = '<div class="gallery-empty"><b>한 달에 한 번, 예배와 행사 사진을 골라 올립니다</b>첫 사진을 준비하고 있어요.</div>';
      return;
    }
    el.innerHTML = G.map(function (al) {
      var m = al.month.split('-');
      var ph = limit === 1 ? al.photos.slice(0, 6) : al.photos;
      return '<div class="album"><div class="album-head"><span>' + m[0] + '년 ' + Number(m[1]) + '월</span><b>' + esc(al.title || '') + '</b></div>' +
        '<div class="photos' + (limit === 1 ? ' cols3' : '') + '">' + ph.map(function (u) {
          return '<a href="' + esc(u) + '" target="_blank" rel="noopener" style="background-image:url(&quot;' + esc(u) + '&quot;)" aria-label="사진 크게 보기"></a>';
        }).join('') + '</div></div>';
    }).join('');
  };

  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
    navigator.serviceWorker.register('sw.js');
  }
})();
