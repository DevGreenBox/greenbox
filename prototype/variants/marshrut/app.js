/* «Маршрут»: линия строится из положений станций в вёрстке (только 90° и 45°, скругления одного радиуса),
   прорисовывается по скроллу, поезд едет по ней на пружине и останавливается на станциях. */
(() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const doc = document.documentElement;
  const main = document.getElementById('main');
  const svg = main.querySelector('.route');
  const clip = svg.querySelector('#darkclip');
  const ghost = svg.querySelector('.route__ghost');
  const lines = [...svg.querySelectorAll('.route__line')];
  const branchLayer = svg.querySelector('.route__branches');
  const train = main.querySelector('.train');
  const header = document.getElementById('top');
  const bar = header.querySelector('.top__progress');
  const navItems = [...header.querySelectorAll('.scheme__st[data-nav]')];
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const READ = 0.7;       // линия чтения: доля высоты экрана
  const DWELL = 200;      // стоянка на станции, мс

  let L = 0, R = 28, mainTop = 0, samples = [], stops = [], navTops = [], darkSpans = [];

  /* ---------- геометрия ---------- */
  const fx = (n) => Math.round(n * 10) / 10;
  const visible = (el) => el.getClientRects().length > 0;
  const anchorOf = (n) => n.querySelector(':scope > .stop:not(.stop--partner)') || n.querySelector(':scope > i') || n;
  const centerOf = (el, o) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2 - o.left, y: r.top + r.height / 2 - o.top }; };

  // Октилинейный перегон a→b: прямые участки и одна диагональ 45°; vh/hv — поворот с фаской ch.
  function leg(a, b, mode, at, ch) {
    const dx = b.x - a.x, dy = b.y - a.y, ax = Math.abs(dx), ay = Math.abs(dy), sx = Math.sign(dx), sy = Math.sign(dy);
    if (ax < 0.5 || ay < 0.5) return [b];
    if (mode === 'vh') { const c = Math.min(ch, ax, ay); return [{ x: a.x, y: b.y - sy * c }, { x: a.x + sx * c, y: b.y }, b]; }
    if (mode === 'hv') { const c = Math.min(ch, ax, ay); return [{ x: b.x - sx * c, y: a.y }, { x: b.x, y: a.y + sy * c }, b]; }
    if (ay >= ax) { const s = (ay - ax) * at; return [{ x: a.x, y: a.y + sy * s }, { x: b.x, y: a.y + sy * (s + ax) }, b]; }
    const s = (ax - ay) * at; return [{ x: a.x + sx * s, y: a.y }, { x: a.x + sx * (s + ay), y: b.y }, b];
  }

  function polyline(nodes, pointOf) {
    const pts = []; let prev = null;
    for (const n of nodes) {
      const c = pointOf(n);
      if (prev) pts.push(...leg(prev, c, n.dataset.route || 'v', +(n.dataset.at ?? 0.5), +(n.dataset.ch || 0)));
      else pts.push(c);
      prev = c;
    }
    return pts;
  }

  // Ломаная → path со скруглениями одного радиуса (радиус уменьшается, только если перегон короче).
  function toPath(raw, r0) {
    const q = [raw[0]];
    for (const p of raw.slice(1)) { const l = q[q.length - 1]; if (Math.hypot(p.x - l.x, p.y - l.y) > 0.5) q.push(p); }
    const p = [q[0]];
    for (let i = 1; i < q.length - 1; i++) {
      const a = p[p.length - 1], b = q[i], c = q[i + 1];
      const l1 = Math.hypot(b.x - a.x, b.y - a.y), l2 = Math.hypot(c.x - b.x, c.y - b.y);
      if (Math.abs(((b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x)) / (l1 * l2)) > 1e-3) p.push(b);
    }
    p.push(q[q.length - 1]);
    let d = `M${fx(p[0].x)} ${fx(p[0].y)}`;
    for (let i = 1; i < p.length - 1; i++) {
      const a = p[i - 1], b = p[i], c = p[i + 1];
      const l1 = Math.hypot(b.x - a.x, b.y - a.y), l2 = Math.hypot(c.x - b.x, c.y - b.y);
      const u1x = (b.x - a.x) / l1, u1y = (b.y - a.y) / l1, u2x = (c.x - b.x) / l2, u2y = (c.y - b.y) / l2;
      const tan = Math.tan(Math.acos(Math.max(-1, Math.min(1, u1x * u2x + u1y * u2y))) / 2);
      const t = Math.min(r0 * tan, i === 1 ? l1 : l1 / 2, i === p.length - 2 ? l2 : l2 / 2), r = t / tan;
      d += ` L${fx(b.x - u1x * t)} ${fx(b.y - u1y * t)} A${fx(r)} ${fx(r)} 0 0 ${u1x * u2y - u1y * u2x > 0 ? 1 : 0} ${fx(b.x + u2x * t)} ${fx(b.y + u2y * t)}`;
    }
    const e = p[p.length - 1];
    return d + ` L${fx(e.x)} ${fx(e.y)}`;
  }

  function build() {
    const o = main.getBoundingClientRect();
    const W = main.clientWidth, H = main.offsetHeight;
    mainTop = o.top + scrollY;
    R = innerWidth < 1024 ? 20 : 28;
    svg.setAttribute('width', W); svg.setAttribute('height', H); svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    const nodes = [...main.querySelectorAll('[data-node]')].filter(visible);
    const d = toPath(polyline(nodes, (n) => centerOf(anchorOf(n), o)), R);
    ghost.setAttribute('d', d);
    for (const l of lines) l.setAttribute('d', d);
    L = lines[0].getTotalLength();
    for (const l of lines) l.style.strokeDasharray = `${L} ${L}`;

    samples = []; let ym = -Infinity;
    const N = Math.ceil(L / 6);
    for (let i = 0; i <= N; i++) { const s = (L * i) / N, pt = lines[0].getPointAtLength(s); ym = Math.max(ym, pt.y); samples.push({ s, x: pt.x, y: pt.y, ym }); }

    stops = nodes.filter((n) => n.hasAttribute('data-stop')).map((el) => {
      const c = centerOf(anchorOf(el), o); let best = 0, bd = Infinity;
      for (const sm of samples) { const dd = (sm.x - c.x) ** 2 + (sm.y - c.y) ** 2; if (dd < bd) { bd = dd; best = sm.s; } }
      return { el, s: best, passed: false, lit: el.classList.contains('is-lit') };
    }).sort((a, b) => a.s - b.s);

    clip.replaceChildren(...[...main.querySelectorAll('.scene--dark')].map((sec) => {
      const r = sec.getBoundingClientRect(), rect = document.createElementNS(NS, 'rect');
      rect.setAttribute('x', 0); rect.setAttribute('y', fx(r.top - o.top)); rect.setAttribute('width', W); rect.setAttribute('height', fx(r.height));
      return rect;
    }));

    branchLayer.replaceChildren(...[...main.querySelectorAll('[data-branch]')].filter(visible).map((br) => {
      const pointOf = (n) => {
        const from = n.dataset.from, st = br.closest('.station');
        const el = from === 'self' ? anchorOf(st) : from ? (st || document).querySelector(from) || document.querySelector(from) : n.querySelector('i') || n;
        return centerOf(el, o);
      };
      const path = document.createElementNS(NS, 'path');
      path.setAttribute('d', toPath(polyline([...br.querySelectorAll('[data-bnode]')], pointOf), R * 0.75));
      path.setAttribute('class', 'b-' + br.dataset.branch);
      return path;
    }));

    navTops = navItems.map((li) => document.getElementById(li.dataset.nav).getBoundingClientRect().top + scrollY);
    darkSpans = [...document.querySelectorAll('.scene--dark, .foot')].map((s) => { const r = s.getBoundingClientRect(); return [r.top + scrollY, r.bottom + scrollY]; });
  }

  /* ---------- скролл → цель ---------- */
  function headTarget() {
    if (scrollY >= doc.scrollHeight - innerHeight - 2) return L;
    const Y = scrollY + innerHeight * READ - mainTop;
    if (!samples.length || Y <= samples[0].ym) return 0;
    let lo = 0, hi = samples.length - 1;
    if (Y >= samples[hi].ym) return L;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (samples[mid].ym < Y) lo = mid + 1; else hi = mid; }
    return samples[lo].s;
  }
  const reachedBy = (len) => { let i = -1; for (let k = 0; k < stops.length && stops[k].s <= len + 1; k++) i = k; return i; };

  /* ---------- шапка: табло и тон ---------- */
  function ui() {
    const y = scrollY + innerHeight * 0.4;
    let idx = -1; navTops.forEach((t, i) => { if (t <= y) idx = i; });
    navItems.forEach((li, i) => {
      li.classList.toggle('is-current', i === idx);
      li.classList.toggle('is-passed', i < idx);
      const a = li.querySelector('a'); if (i === idx) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
    });
    const hy = scrollY + header.offsetHeight - 1;
    header.dataset.tone = darkSpans.some(([t, b]) => t <= hy && b > hy) ? 'dark' : 'light';
    const max = doc.scrollHeight - innerHeight;
    bar.style.setProperty('--p', max > 0 ? Math.min(1, scrollY / max).toFixed(4) : 0);
  }

  /* ---------- состояние станций и поезда ---------- */
  function mark(len) {
    for (const st of stops) {
      const passed = st.s <= len + 2;
      if (passed !== st.passed) { st.passed = passed; st.el.classList.toggle('is-passed', passed); }
      if (passed && !st.lit) { st.lit = true; st.el.classList.add('is-lit'); }
    }
  }
  function placeTrain(len) {
    const s = Math.max(0, Math.min(L, len));
    const p = lines[0].getPointAtLength(s);
    const a = lines[0].getPointAtLength(Math.max(0, s - 2)), b = lines[0].getPointAtLength(Math.min(L, s + 2));
    const ang = Math.atan2(b.y - a.y, b.x - a.x) * 57.29578;
    train.style.transform = `translate(${fx(p.x)}px, ${fx(p.y)}px) rotate(${fx(ang)}deg)`;
  }

  /* ---------- пружины (масса 1, критическое затухание) ---------- */
  function spring(o, target, dt, k, vmax) {
    o.v += (k * (target - o.x) - 2 * Math.sqrt(k) * o.v) * dt;
    if (vmax) o.v = Math.max(-vmax, Math.min(vmax, o.v));
    o.x += o.v * dt;
  }
  const head = { x: 0, v: 0 }, lead = { x: 0, v: 0 }, car = { x: 0, v: 0 };
  let cur = -1, dwellUntil = 0, arrivedAt = -1, raf = 0, last = 0;

  function frame(now) {
    raf = 0;
    const dt = Math.min(0.034, (now - (last || now)) / 1000) || 0.016; last = now;
    const ht = headTarget();
    // перо линии: быстро, но с инерцией; длинные горизонтальные перегоны прочерчиваются с ограничением скорости
    for (let i = 0; i < 2; i++) spring(head, ht, dt / 2, 150, 2600);
    for (const l of lines) l.style.strokeDashoffset = fx(L - head.x);

    // поезд: едет от станции к станции и стоит DWELL мс; отстал на 2+ станции — сразу экспрессом, без остановок
    const r = reachedBy(head.x);
    const target = cur >= 0 ? stops[cur].s : 0;
    const settled = Math.abs(car.x - target) < 1.2 && Math.abs(car.v) < 25;
    if (settled && cur >= 0 && arrivedAt !== cur) { arrivedAt = cur; dwellUntil = now + DWELL; }
    if (r < cur) { cur = r; arrivedAt = -2; }
    else if (cur >= 0 && r - cur >= 2) { cur = r; arrivedAt = -2; }
    else if (r > cur && (settled || cur < 0) && now >= dwellUntil) { cur += 1; arrivedAt = -2; }
    const goal = cur >= 0 ? stops[cur].s : 0;
    for (let i = 0; i < 2; i++) { spring(lead, goal, dt / 2, 120, 4200); spring(car, lead.x, dt / 2, 200, 4200); }
    placeTrain(car.x);
    mark(car.x);

    const busy = Math.abs(head.x - ht) > 0.3 || Math.abs(head.v) > 1 || Math.abs(car.x - goal) > 0.3 || Math.abs(car.v) > 1
      || Math.abs(lead.v) > 1 || r !== cur || now < dwellUntil;
    if (busy) raf = requestAnimationFrame(frame); else last = 0;
  }
  const wake = () => { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } };

  // Без анимации: линия нарисована целиком, поезд стоит у текущей станции.
  function still() {
    for (const l of lines) l.style.strokeDashoffset = 0;
    cur = reachedBy(headTarget());
    car.x = lead.x = cur >= 0 ? stops[cur].s : 0;
    placeTrain(car.x); mark(car.x);
  }

  let uiQueued = false;
  function onScroll() {
    if (!uiQueued) { uiQueued = true; requestAnimationFrame(() => { uiQueued = false; ui(); if (motion.matches) still(); }); }
    if (!motion.matches) wake();
  }

  function sync(first) {
    build(); ui();
    if (motion.matches) return still();
    if (first && scrollY > 40) {       // перезагрузка в середине страницы — без пролёта через всю линию
      head.x = headTarget(); cur = reachedBy(head.x);
      car.x = lead.x = cur >= 0 ? stops[cur].s : 0; arrivedAt = cur;
    }
    head.x = Math.min(head.x, L); car.x = Math.min(car.x, L); lead.x = Math.min(lead.x, L);
    wake();
  }

  let t = 0;
  const rebuild = () => { clearTimeout(t); t = setTimeout(() => sync(false), 120); };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', rebuild);
  new ResizeObserver(rebuild).observe(main);
  motion.addEventListener('change', () => sync(false));
  if (document.fonts) document.fonts.ready.then(() => sync(false));
  sync(true);
})();
