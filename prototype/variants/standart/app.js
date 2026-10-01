(() => {
  const root = document.documentElement;
  const header = document.getElementById('header');
  const burger = header.querySelector('.burger');
  const menu = document.getElementById('menu');

  // Фон первого экрана: ?bg=<n> → media/hero/bg-<n>.jpg. Без параметра (или без файла) фона нет.
  const bg = new URLSearchParams(location.search).get('bg');
  if (/^\d{1,2}$/.test(bg ?? '') && bg !== '11' && bg !== '12') { // 11 и 12 — фоны из кода, их строит bg-code.js
    const layer = document.createElement('div');
    layer.className = 'hero__bg';
    layer.dataset.bg = bg; // номер для настройки вуали под конкретное фото
    layer.setAttribute('aria-hidden', 'true');
    const img = new Image();
    img.alt = '';
    img.onload = () => layer.classList.add('is-loaded');
    img.onerror = () => layer.remove();
    img.src = `../../media/hero/bg-${bg}.jpg`;
    layer.append(img);
    document.querySelector('.hero').prepend(layer);
  }

  // Шапка: плотный фон, как только страница ушла с самого верха
  new IntersectionObserver(([e]) => header.classList.toggle('is-scrolled', !e.isIntersecting))
    .observe(document.getElementById('top-sentinel'));

  // Бургер-меню (до 1100px)
  const setMenu = (open) => {
    menu.hidden = !open;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    header.classList.toggle('menu-open', open);
  };
  burger.addEventListener('click', () => setMenu(menu.hidden));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.hidden) { setMenu(false); burger.focus(); }
  });
  matchMedia('(min-width: 1101px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

  // Появления при скролле. Без JS и при reduced motion всё видно сразу.
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll('[data-stagger]').forEach((group) =>
    [...group.children].forEach((el, i) => el.style.setProperty('--i', i)));
  root.classList.add('reveal');
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));
})();
