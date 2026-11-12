// 커뮤니티 시안: 글을 이 기기(localStorage)에만 저장. 서버를 붙일 때 load/save만 바꾸면 됨
(function () {
  var Y = window.Yegreen, esc = Y.esc;
  var KEY = 'yegreen-community-v1';
  var CATS = { thanks: '감사 나눔', pray: '기도제목', group: '목장 이야기' };
  var SAMPLE = function () {
    return {
      me: null,
      posts: [
        { id: 'p3', notice: true, cat: 'thanks', author: '교회 공지', text: '11월 9일부터 21일까지 감사주간이에요. 감사노트 챌린지에 함께해 주세요. 이곳에 오늘의 감사를 나눠도 좋아요.', when: '공지', reacted: false, count: 0, comments: [] },
        { id: 'p2', cat: 'pray', author: '예시 성도', text: '(예시 글) 이번 주 수술을 앞둔 가족을 위해 함께 기도해 주세요.', when: '어제', reacted: false, count: 4, comments: [{ author: '예시 성도', text: '함께 기도할게요.' }] },
        { id: 'p1', cat: 'thanks', author: '예시 성도', text: '(예시 글) 오랜만에 온 가족이 함께 예배드릴 수 있어서 감사했어요.', when: '2일 전', reacted: false, count: 7, comments: [] },
      ],
    };
  };
  var memory = null;
  function load() {
    if (memory) return memory;
    try { memory = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
    return memory = memory || SAMPLE();
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(memory)); } catch (e) {}
  }

  var state = load(), filter = 'all';
  var el = function (id) { return document.getElementById(id); };

  function show() {
    el('gate').hidden = !!state.me;
    el('board').hidden = !state.me;
    if (state.me) {
      el('meName').textContent = state.me.name + (state.me.group ? ' · ' + state.me.group : '');
      render();
    }
  }

  function renderPost(p) {
    if (p.reported) {
      return '<article class="card post hidden-post">신고되어 관리자 확인을 기다리는 글이에요. <button class="link-btn" data-act="restore" data-id="' + p.id + '">시안: 되돌리기</button></article>';
    }
    return '<article class="card post' + (p.notice ? ' notice' : '') + '">' +
      '<div class="post-head"><b>' + esc(p.author) + '</b><span class="tag">' + (p.notice ? '공지' : CATS[p.cat]) + '</span>' +
      (p.scope === 'pastor' ? '<span class="tag lock">목사님께만</span>' : '') +
      '<time>' + esc(p.when) + '</time></div>' +
      '<p class="post-text">' + esc(p.text) + '</p>' +
      '<div class="post-actions">' +
        '<button class="react' + (p.reacted ? ' on' : '') + '" data-act="react" data-id="' + p.id + '">' + (p.cat === 'pray' ? '🙏 기도했어요' : '🙌 아멘') + ' <b>' + p.count + '</b></button>' +
        (p.notice ? '' : p.mine ? '<button class="link-btn" data-act="delete" data-id="' + p.id + '">삭제</button>' : '<button class="link-btn" data-act="report" data-id="' + p.id + '">신고</button>') +
      '</div>' +
      '<div class="comments">' + p.comments.map(function (c) { return '<p><b>' + esc(c.author) + '</b> ' + esc(c.text) + '</p>'; }).join('') +
        '<form class="comment-form" data-id="' + p.id + '"><input maxlength="300" required placeholder="따뜻한 한마디를 남겨 주세요" aria-label="댓글"><button class="btn small">등록</button></form>' +
      '</div></article>';
  }

  function render() {
    var tabs = [['all', '전체']].concat(Object.keys(CATS).map(function (k) { return [k, CATS[k]]; }));
    el('catTabs').innerHTML = tabs.map(function (t) {
      return '<button type="button" data-cat="' + t[0] + '"' + (filter === t[0] ? ' class="on"' : '') + '>' + t[1] + '</button>';
    }).join('');
    var list = state.posts.filter(function (p) { return filter === 'all' || p.cat === filter; });
    list.sort(function (a, b) { return (b.notice ? 1 : 0) - (a.notice ? 1 : 0); });
    el('posts').innerHTML = list.map(renderPost).join('') || '<p class="empty">아직 글이 없어요. 첫 나눔을 남겨 주세요.</p>';
  }
  function find(id) { return state.posts.filter(function (p) { return p.id === id; })[0]; }

  el('gateForm').addEventListener('submit', function (e) {
    e.preventDefault();
    state.me = { name: el('gateName').value.trim(), group: el('gateGroup').value.trim() };
    save();
    show();
  });
  el('composer').addEventListener('submit', function (e) {
    e.preventDefault();
    var text = el('postText').value.trim();
    if (!text) return;
    state.posts.unshift({ id: 'p' + Date.now(), cat: el('postCat').value, scope: el('postScope').value, author: state.me.name, text: text, when: '방금', mine: true, reacted: false, count: 0, comments: [] });
    el('postText').value = '';
    filter = 'all';
    save();
    render();
  });
  el('catTabs').addEventListener('click', function (e) {
    if (e.target.dataset.cat) { filter = e.target.dataset.cat; render(); }
  });
  el('posts').addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]');
    if (!b) return;
    var p = find(b.dataset.id), act = b.dataset.act;
    if (act === 'react') { p.reacted = !p.reacted; p.count += p.reacted ? 1 : -1; }
    if (act === 'report') { p.reported = true; }
    if (act === 'restore') { p.reported = false; }
    if (act === 'delete') { state.posts = state.posts.filter(function (x) { return x !== p; }); }
    save();
    render();
  });
  el('posts').addEventListener('submit', function (e) {
    e.preventDefault();
    var input = e.target.querySelector('input'), text = input.value.trim();
    if (!text) return;
    find(e.target.dataset.id).comments.push({ author: state.me.name, text: text });
    save();
    render();
  });
  el('resetDemo').addEventListener('click', function () {
    memory = SAMPLE();
    state = memory;
    filter = 'all';
    save();
    show();
  });
  show();
})();
