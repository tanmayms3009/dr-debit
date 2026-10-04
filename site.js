// Dr. Debit: shared page behaviour for every lesson.
// (Progress tracking was removed; it returns later with user accounts.)
// Each lesson page defines window.LESSON = { id, video: { youtubeId }, quiz: [...] }
// and loads lessons.js before this file.
(function () {
  const LESSON = window.LESSON || {};
  const GROUPS = window.DRDEBIT_LESSONS || [];
  const ALL = GROUPS.flatMap(g => g.lessons);
  const here = ALL.findIndex(l => l.id === LESSON.id);

  // ---------- Sidebar ----------
  function renderNav() {
    const nav = document.getElementById('nav');
    if (!nav) return;
    nav.innerHTML = '';
    GROUPS.forEach(g => {
      const box = document.createElement('div'); box.className = 'nav-group';
      const h = document.createElement('h4'); h.textContent = g.topic; box.appendChild(h);
      const ul = document.createElement('ul');
      g.lessons.forEach(l => {
        const li = document.createElement('li');
        const cur = l.id === LESSON.id;
        const el = document.createElement(cur ? 'div' : 'a');
        if (!cur) { el.href = l.file; el.style.textDecoration = 'none'; }
        else { el.setAttribute('aria-current', 'page'); }
        el.className = 'nav-item' + (cur ? ' current' : '');
        el.textContent = l.title;
        li.appendChild(el); ul.appendChild(li);
      });
      box.appendChild(ul); nav.appendChild(box);
    });
  }
  renderNav();
  // ---------- Previous / Next (only lessons that exist) ----------
  const pager = document.getElementById('pager');
  if (pager && here >= 0) {
    const prev = ALL[here - 1], next = ALL[here + 1];
    function link(l, label, right) {
      const a = document.createElement('a');
      a.className = 'pager-link'; a.href = l.file;
      if (right) a.style.textAlign = 'right';
      a.innerHTML = '<small></small><b></b>';
      a.children[0].textContent = label; a.children[1].textContent = l.title;
      return a;
    }
    if (prev) pager.appendChild(link(prev, '← Previous', false));
    if (next) { if (!prev) pager.appendChild(document.createElement('span')); pager.appendChild(link(next, 'Next →', true)); }
    pager.hidden = !(prev || next);
  }

  // ---------- Mobile drawer ----------
  const rail = document.getElementById('rail'), menuBtn = document.getElementById('menuBtn');
  if (rail && menuBtn) {
    menuBtn.addEventListener('click', e => { e.stopPropagation(); const o = rail.classList.toggle('open'); menuBtn.setAttribute('aria-expanded', o); });
    document.addEventListener('click', e => { if (rail.classList.contains('open') && !rail.contains(e.target)) { rail.classList.remove('open'); menuBtn.setAttribute('aria-expanded', false); } });
  }

  // ---------- Video (only when a YouTube ID is set) ----------
  const vid = LESSON.video && LESSON.video.youtubeId;
  const deckSection = document.getElementById('slides');
  if (vid && deckSection) {
    const sec = document.createElement('section'); sec.className = 'block'; sec.id = 'watch';
    sec.innerHTML = '<div class="block-title"><h2>Watch</h2><small>Video lesson</small></div><div class="video-frame"></div>';
    const f = document.createElement('iframe');
    f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(vid);
    f.title = 'Video lesson';
    f.allow = 'accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen';
    f.allowFullscreen = true;
    sec.querySelector('.video-frame').appendChild(f);
    deckSection.parentNode.insertBefore(sec, deckSection);
    const chips = document.querySelector('.meta');
    if (chips) { const c = document.createElement('a'); c.className = 'chip'; c.href = '#watch'; c.textContent = '▶ Watch video'; chips.insertBefore(c, chips.firstChild); }
  }

  // ---------- Slides ----------
  const slides = [...document.querySelectorAll('.slide')];
  const dots = document.getElementById('dots');
  if (slides.length && dots) {
    let cur = 0, timer = null;
    const count = document.getElementById('slideCount');
    const autoBtn = document.getElementById('autoBtn');
    function go(i) {
      cur = (i + slides.length) % slides.length;
      slides.forEach((s, k) => s.classList.toggle('active', k === cur));
      [...dots.children].forEach((d, k) => d.classList.toggle('on', k === cur));
      if (count) count.textContent = (cur + 1) + ' / ' + slides.length;
    }
    function stop() { clearInterval(timer); timer = null; if (autoBtn) autoBtn.textContent = '▶ Auto-play'; }
    slides.forEach((s, i) => {
      const b = document.createElement('button'); b.setAttribute('aria-label', 'Go to slide ' + (i + 1));
      b.addEventListener('click', () => { stop(); go(i); }); dots.appendChild(b);
    });
    document.getElementById('prevSlide').addEventListener('click', () => { stop(); go(cur - 1); });
    document.getElementById('nextSlide').addEventListener('click', () => { stop(); go(cur + 1); });
    if (autoBtn) autoBtn.addEventListener('click', () => {
      if (timer) return stop();
      timer = setInterval(() => go(cur + 1), 6000); autoBtn.textContent = '❚❚ Pause';
    });
    document.addEventListener('keydown', e => {
      if (e.target.closest('input, textarea, select')) return;
      if (e.key === 'ArrowRight') { stop(); go(cur + 1); }
      if (e.key === 'ArrowLeft') { stop(); go(cur - 1); }
    });
    go(0);
  }

  // ---------- Quiz ----------
  const levels = LESSON.quiz || [];
  const quiz = document.getElementById('quiz'), tabs = document.getElementById('levels');
  if (levels.length && quiz && tabs) {
    const colors = { Medium: 'var(--real)', High: 'var(--nominal)', Expert: 'var(--bad)' };
    const state = levels.map(() => ({ qi: 0, score: 0 }));
    let lv = 0;
    levels.forEach((L, i) => {
      const t = document.createElement('button');
      t.className = 'level'; t.setAttribute('role', 'tab'); t.id = 'level-' + i;
      t.innerHTML = '<span class="lv-dot"></span><span></span><small></small>';
      t.querySelector('.lv-dot').style.background = colors[L.name] || 'var(--personal)';
      t.children[1].textContent = L.name;
      t.querySelector('small').textContent = L.note || '';
      t.addEventListener('click', () => { lv = i; renderTabs(); renderQ(); });
      tabs.appendChild(t);
    });
    function renderTabs() { [...tabs.children].forEach((t, i) => t.setAttribute('aria-selected', i === lv)); }
    function renderQ() {
      const L = levels[lv], S = state[lv], qs = L.qs;
      quiz.innerHTML = '';
      if (S.qi >= qs.length) {
        const title = document.createElement('p'); title.className = 'q-text';
        title.textContent = L.name + ' level: ' + S.score + ' / ' + qs.length;
        const msg = document.createElement('p'); msg.style.color = 'var(--muted)';
        msg.textContent = S.score === qs.length ? (lv < levels.length - 1 ? 'Full marks. Move up to the next level.' : 'Full marks at the top level. Excellent.') : 'Review the explanations and the common mistakes, then try again.';
        const act = document.createElement('div'); act.className = 'q-actions'; act.style.gap = '10px';
        const retry = document.createElement('button'); retry.className = 'btn'; retry.textContent = 'Try again';
        retry.addEventListener('click', () => { S.qi = 0; S.score = 0; renderQ(); });
        act.appendChild(retry);
        if (lv < levels.length - 1) {
          const nx = document.createElement('button'); nx.className = 'btn primary'; nx.textContent = 'Next level: ' + levels[lv + 1].name;
          nx.addEventListener('click', () => { lv++; renderTabs(); renderQ(); });
          act.appendChild(nx);
        }
        quiz.append(title, msg, act);
        return;
      }
      const d = qs[S.qi];
      const top = document.createElement('div'); top.className = 'q-top';
      top.innerHTML = '<span></span><span></span>';
      top.children[0].textContent = L.name + ' · Question ' + (S.qi + 1) + ' of ' + qs.length;
      top.children[1].textContent = 'Score ' + S.score;
      const qt = document.createElement('p'); qt.className = 'q-text'; qt.textContent = d.q;
      const opts = document.createElement('div'); opts.className = 'opts';
      const fb = document.createElement('div'); fb.className = 'feedback'; fb.hidden = true;
      const act = document.createElement('div'); act.className = 'q-actions'; act.hidden = true;
      const nb = document.createElement('button'); nb.className = 'btn primary'; nb.textContent = S.qi === qs.length - 1 ? 'See score' : 'Next question';
      nb.addEventListener('click', () => { S.qi++; renderQ(); }); act.appendChild(nb);
      d.o.forEach((t, k) => {
        const b = document.createElement('button'); b.className = 'opt'; b.textContent = t;
        b.addEventListener('click', () => {
          [...opts.children].forEach(x => x.disabled = true);
          const ok = k === d.a; if (ok) S.score++;
          b.classList.add(ok ? 'correct' : 'incorrect');
          opts.children[d.a].classList.add('correct');
          fb.innerHTML = '<b></b> <span></span>';
          fb.querySelector('b').textContent = ok ? 'Correct.' : 'Not quite.';
          fb.querySelector('b').style.color = ok ? 'var(--good)' : 'var(--bad)';
          fb.querySelector('span').textContent = d.why;
          fb.hidden = false; act.hidden = false;
          top.children[1].textContent = 'Score ' + S.score;
        });
        opts.appendChild(b);
      });
      quiz.append(top, qt, opts, fb, act);
    }
    renderTabs();
    renderQ();
  }
})();
