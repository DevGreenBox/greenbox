/* ЗелёнаяКоробка · «Стандарт категории»: фоны первого экрана, собранные в коде.
   ?bg=11 «Код витрины» — исходник витрины набирается за макетами и медленно уходит вверх лентой.
   ?bg=12 «Сетка макета» — 12 колонок, контуры блоков страницы, выделение как в инспекторе.
   Фото-фоны (остальные номера) грузит app.js. Движение целиком в bg-code.css, здесь разметка и замеры. */
(() => {
  const bg = new URLSearchParams(location.search).get('bg');
  if (bg !== '11' && bg !== '12') return;

  const hero = document.querySelector('.hero');
  const devices = hero.querySelector('.devices');
  const laptop = hero.querySelector('.laptop');

  const layer = document.createElement('div');
  layer.className = bg === '11' ? 'hero__code' : 'hero__plan';
  layer.setAttribute('aria-hidden', 'true');
  layer.innerHTML = bg === '11' ? codeHTML() : planHTML();
  hero.prepend(layer);

  // Макеты в координатах первого экрана (offsetTop — без их анимации появления):
  // от них строятся полоса кода на мобильном и блоки сетки.
  const measure = () => {
    const h = hero.getBoundingClientRect();
    const d = devices.getBoundingClientRect();
    const lt = d.top - h.top + laptop.offsetTop;
    layer.style.setProperty('--dt', `${d.top - h.top}px`);
    layer.style.setProperty('--db', `${d.bottom - h.top}px`);
    layer.style.setProperty('--lt', `${lt}px`);
    if (bg === '12') annotate(lt);
  };
  new ResizeObserver(measure).observe(hero);

  if (bg === '11') {
    // ждём шрифты: от них зависит раскладка героя, а значит и какие строки видны над ноутбуком
    Promise.race([
      Promise.all([document.fonts.load('14px "JetBrains Mono"', 'aЯ'), document.fonts.ready]),
      new Promise((done) => setTimeout(done, 1500)),
    ]).catch(() => {}).then(start);
  }

  function start() {
    measure();
    const feed = layer.firstElementChild;
    const copy = feed.firstElementChild;
    // лента из копий: после сдвига на одну копию снизу не должно открываться пустое место
    const copies = 1 + Math.ceil((layer.clientHeight - feed.offsetTop) / copy.offsetHeight);
    for (let i = 1; i < copies; i++) feed.append(copy.cloneNode(true));
    feed.style.setProperty('--k', copies);
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) type(feed, copy);
    layer.classList.add('is-on');
  }

  // Строки над ноутбуком набираются спокойно, с кареткой. Пока она мигает на последней, строки за ноутбуком
  // (видны только краем) дописываются быстро и без каретки. Ниже ноутбука файл уже «написан». Потом лента.
  function type(feed, copy) {
    const top = parseFloat(layer.style.getPropertyValue('--lt'));
    const bottom = top + laptop.offsetHeight;
    let t = 0.6;
    let last;
    let idle;
    for (const line of copy.children) {
      const y = feed.offsetTop + line.offsetTop;
      const behind = y >= top;
      if (behind && y + line.offsetHeight > bottom) break;
      if (behind && idle === undefined) idle = t;
      const code = line.querySelector('.w');
      if (!code) { t += behind ? 0.1 : 0.5; continue; } // пустая строка — пауза
      const d = code.textContent.length * (behind ? 0.005 : 0.032);
      line.classList.add('is-typed');
      line.classList.toggle('is-behind', behind);
      line.style.cssText = `--t:${t.toFixed(2)}s;--d:${d.toFixed(2)}s`;
      t += d + (behind ? 0.06 : 0.22);
      if (!behind) last = line;
    }
    last?.classList.add('is-last');
    feed.style.setProperty('--start', `${Math.max((idle ?? t) + 3.4, t + 0.4).toFixed(2)}s`);
    feed.style.setProperty('--loop', `${Math.round(copy.offsetHeight / 7)}s`); // ~7 px/с
    feed.classList.add('is-running');
  }

  function codeHTML() {
    const source = `export function Header({ cartCount }) {
  return (
    <header className="header">
      <a className="header__logo" href="/">Магазин</a>
      <nav className="header__nav" aria-label="Каталог">
        <a href="/catalog">Каталог</a>
        <a href="/new">Новинки</a>
        <a href="/delivery">Доставка</a>
      </nav>
      <button className="header__cart" type="button" aria-label="Корзина">
        <Icon name="bag" />
        {cartCount > 0 && <span className="badge">{cartCount}</span>}
      </button>
    </header>
  );
}

export function ProductCard({ product, onAdd }) {
  return (
    <article className="product-card" data-sku={product.sku}>
      <img className="product-card__image" src={product.image} alt={product.title} loading="lazy" />
      <h3 className="product-card__title">{product.title}</h3>
      <p className="product-card__price">{formatPrice(product.price)}</p>
      <button className="button button--primary" type="button" onClick={() => onAdd(product)}>
        В корзину
      </button>
    </article>
  );
}

export function Cart({ items, total }) {
  return (
    <aside className="cart" aria-label="Корзина">
      <h2 className="cart__title">Корзина</h2>
      <ul className="cart__list">
        {items.map((item) => (
          <li className="cart__item" key={item.id}>
            <span className="cart__name">{item.title}</span>
            <span className="cart__sum">{item.qty} × {formatPrice(item.price)}</span>
          </li>
        ))}
      </ul>
      <p className="cart__total">Итого: {formatPrice(total)}</p>
      <a className="button button--primary" href="/checkout">Оформить заказ</a>
    </aside>
  );
}
`;
    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    // теги — .g, атрибуты — .c, служебное — .s; строки и текст остаются цветом строки
    const token = /(<\/?)([A-Za-z][\w.]*)|([A-Za-z][\w-]*)(?==)|("[^"]*")|\b(export|function|return)\b|([{}()[\];,.:=>/&|?!+-]+|<)/g;
    const paint = (s) => s.replace(token, (m, open, tag, attr, str) =>
      tag ? `<span class="s">${esc(open)}</span><span class="g">${tag}</span>`
        : attr ? `<span class="c">${attr}</span>`
          : str ? esc(m)
            : `<span class="s">${esc(m)}</span>`);
    const lines = source.split('\n').map((s) => {
      const code = s.trimStart();
      return code
        ? `<div class="cl">${s.slice(0, s.length - code.length)}<span class="w" style="--n:${code.length}"><span>${paint(code)}</span></span></div>`
        : '<div class="cl"></div>';
    });
    return `<div class="hero__code-feed"><div>${lines.join('')}</div></div>`;
  }

  function planHTML() {
    const pick = (name) => `<div class="pl-sel"><i></i><i></i><i></i><i></i><b>${name}<span></span></b></div>`;
    const card = (n, name) => `<div class="pl-blk pl-card pl-c${n}">${name ? `<span class="pl-lbl">${name}</span>` : ''}`
      + `<i class="pl-img"></i><i class="pl-bar"></i><i class="pl-bar pl-bar--s"></i>${name ? pick(name) : ''}</div>`;
    const header = '&lt;header&gt;';
    const section = '&lt;section class="hero"&gt;';
    return `<div class="pl-page">
  <div class="pl-grid">${Array.from({ length: 12 }, (_, i) => `<i style="--i:${i}"></i>`).join('')}</div>
  <span class="pl-note"></span>
  <div class="pl-blk pl-hdr"><span class="pl-lbl">${header}</span><i class="pl-logo"></i><i class="pl-nav"></i><i class="pl-cart"></i>${pick(header)}</div>
  <div class="pl-blk pl-hero"><span class="pl-lbl">${section}</span>${pick(section)}</div>
  ${card(1)}${card(2, '.product-card')}${card(3)}
  <span class="pl-dim pl-dim--v pl-dim--gap"><b>24</b></span>
  <span class="pl-dim pl-dim--v pl-dim--pad"><b></b></span>
  <span class="pl-dim pl-dim--h pl-dim--cards"><b></b></span>
  <span class="pl-dim pl-dim--h pl-dim--gutter"><b></b></span>
</div>`;
  }

  // Подписи с настоящими px: сетка, размеры выделенных блоков, отступы
  function annotate(lt) {
    const $ = (s) => layer.querySelector(s);
    const cs = getComputedStyle(layer);
    const gap = parseFloat(cs.getPropertyValue('--gap'));
    $('.pl-note').textContent = `grid: ${cs.getPropertyValue('--cols').trim()} col · gap ${gap}`;
    for (const size of layer.querySelectorAll('.pl-sel span')) {
      const block = size.closest('.pl-blk');
      size.textContent = `${block.offsetWidth} × ${block.offsetHeight}`;
    }
    $('.pl-dim--pad b').textContent = Math.round(lt - $('.pl-hero').offsetTop);
    $('.pl-dim--cards b').textContent = gap;
    $('.pl-dim--gutter b').textContent = parseFloat(cs.getPropertyValue('--gutter'));
  }
})();
