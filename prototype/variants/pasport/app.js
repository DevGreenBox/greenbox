// «Паспорт изделия»: документ собирается при прокрутке. Без JS страница полная и статичная.
(() => {
  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  // 1. Разделы и строки появляются, когда до них дошли
  const parts = $$('[data-reveal]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }, { rootMargin: '0px 0px -10% 0px' });
    parts.forEach((el) => io.observe(el));
  } else {
    parts.forEach((el) => el.classList.add('in'));
  }

  // 2. Схема устройства: выноски и связи строятся по реальным координатам панелей
  const stage = $('.scheme__stage');
  const svg = $('.wires', stage);
  const px = (n) => Math.floor(n) + 0.5; // волосяная линия ровно по пикселю

  function draw() {
    const o = stage.getBoundingClientRect();
    if (!o.width) return;
    const box = (sel) => {
      const r = $(sel, stage).getBoundingClientRect();
      return { l: r.left - o.left, r: r.right - o.left, t: r.top - o.top, b: r.bottom - o.top, y: (r.top + r.bottom) / 2 - o.top };
    };
    const out = [];
    const path = (d, cls, delay, key) => out.push(`<path class="${cls}" d="${d}" pathLength="1" style="--wd:${delay}s"${key ? ` data-for="${key}"` : ''}/>`);
    const dot = (x, y, cls, delay, key) => out.push(`<circle class="${cls}" cx="${x}" cy="${y}" r="${cls === 'ring' ? 3 : 2.75}" style="--wd:${delay}s"${key ? ` data-for="${key}"` : ''}/>`);

    // выноски «Витрина», «Админка», «СДЭК · 1С · amoCRM»: от подписи внутрь детали
    $$('.callout', stage).forEach((c, i) => {
      const r = c.getBoundingClientRect();
      const lb = { l: r.left - o.left, t: r.top - o.top, b: r.bottom - o.top };
      const t = box(c.dataset.to);
      const below = lb.t > t.b - 1;
      const x = px(lb.l + 8);
      const y1 = px(below ? lb.t - 7 : lb.b + 7);
      const y2 = px(below ? t.b - 14 : t.t + 14);
      path(`M${x} ${y1}V${y2}`, 'lead', 0.3 + i * 0.12);
      dot(x, y2, 'ring', 0.95 + i * 0.12);
    });

    // зелёные связи: тумблер админки → блок витрины, которым он управляет
    const shop = box('.shop'), adm = box('.adm');
    const side = adm.l > shop.r;
    [['promo', '.shop__banner', 0.62], ['new', '.shop__grid', 0.36]].forEach(([key, sel, frac], i) => {
      const row = box(`.adm__row[data-block="${key}"]`), blk = box(sel);
      const x1 = Math.round(row.l + 9), y1 = Math.round(row.y), y2 = Math.round(blk.y);
      let d, x2;
      if (side) {
        const cx = Math.round(shop.r + (adm.l - shop.r) * frac);
        x2 = Math.round(blk.r);
        d = `M${x1} ${y1}H${cx}V${y2}H${x2}`;
      } else {
        const rx = Math.round(shop.l - (i ? 10 : 19));
        x2 = Math.round(blk.l);
        d = `M${x1} ${y1}H${rx}V${y2}H${x2}`;
      }
      path(d, 'link', 0.7 + i * 0.16, key);
      dot(x1, y1, 'knot', 0.7 + i * 0.16, key);
      dot(x2, y2, 'knot', 1.45 + i * 0.16, key);
    });

    svg.setAttribute('viewBox', `0 0 ${o.width} ${o.height}`);
    svg.innerHTML = out.join('');
  }

  let raf = 0;
  const redraw = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); };
  if ('ResizeObserver' in window) new ResizeObserver(redraw).observe(stage);
  else addEventListener('resize', redraw);

  // титульный лист собирается, когда шрифты на месте (или через 0,9 с — не ждём дольше)
  const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
  Promise.race([fonts, new Promise((r) => setTimeout(r, 900))]).then(() => {
    draw();
    stage.getBoundingClientRect();
    requestAnimationFrame(() => root.classList.add('go'));
  });
  fonts.then(redraw);

  // 3. Тумблеры админки включают и выключают блоки витрины
  $$('.adm__row').forEach((b) => b.addEventListener('click', () => {
    b.setAttribute('aria-checked', String(b.getAttribute('aria-checked') !== 'true'));
  }));

  // 4. Колонтитул: номер и название текущего раздела
  const run = $('.run'), toc = $('#toc');
  const nowN = $('.run__n', run), nowT = $('.run__t', run);
  const links = $$('a', toc);
  const setCurrent = (sec) => {
    nowN.textContent = sec.dataset.n;
    nowT.textContent = sec.dataset.name;
    links.forEach((a) => (a.hash === '#' + sec.id ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
    run.classList.toggle('dark', sec.classList.contains('dark'));
  };
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) setCurrent(e.target);
    }, { rootMargin: '-40% 0px -59% 0px' });
    $$('.sec').forEach((s) => spy.observe(s));
  }

  if (toc.showPopover) {
    toc.addEventListener('click', (e) => {
      if (e.target.closest('a') && toc.matches(':popover-open')) toc.hidePopover();
    });
    // оглавление открывается под прилипшим колонтитулом
    toc.addEventListener('beforetoggle', (e) => {
      if (e.newState !== 'open') return;
      const t = run.getBoundingClientRect().top;
      if (t > 1) scrollBy({ top: t, behavior: 'instant' });
    });
  }
})();
