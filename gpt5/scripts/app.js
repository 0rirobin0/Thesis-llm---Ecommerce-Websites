// Shared utilities and page initializers for Acme Shop
// Uses localStorage to persist cart and orders. No backend.

(function () {
  const CURRENCY = 'USD';
  const TAX_RATE = 0.07; // 7% example

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Storage namespace and sanitizers
  const NS = 'acme.shop';
  const LS_CART = `${NS}.cart`;
  const LS_ORDERS = `${NS}.orders`;

  function escapeHTML(input) {
    const s = String(input == null ? '' : input);
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/\//g, '&#x2F;');
  }

  function sanitizeUrl(u) {
    try {
      const url = new URL(u, location.origin);
      if (url.protocol === 'https:' || url.protocol === 'http:') return url.toString();
    } catch {}
    return '#';
  }

  function withSize(url, w, h) {
    try {
      const u = new URL(sanitizeUrl(url));
      if (w) u.searchParams.set('w', String(w));
      if (h) u.searchParams.set('h', String(h));
      u.searchParams.set('fit', 'crop');
      u.searchParams.set('auto', 'compress');
      u.searchParams.set('cs', 'tinysrgb');
      return u.toString();
    } catch {
      return url;
    }
  }

  function fmt(n) {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: CURRENCY }).format(n);
  }

  function readJSON(key, fallback, legacyKey) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
      if (legacyKey) {
        const legacyRaw = localStorage.getItem(legacyKey);
        if (legacyRaw) {
          const val = JSON.parse(legacyRaw);
          localStorage.setItem(key, JSON.stringify(val));
          localStorage.removeItem(legacyKey);
          return val;
        }
      }
    } catch {}
    return fallback;
  }

  function getCart() {
    return readJSON(LS_CART, [], 'cart');
  }

  function saveCart(cart) {
    localStorage.setItem(LS_CART, JSON.stringify(cart));
    updateCartCount();
  }

  function getOrders() {
    return readJSON(LS_ORDERS, [], 'orders');
  }

  function saveOrders(orders) {
    localStorage.setItem(LS_ORDERS, JSON.stringify(orders));
  }

  function findProduct(id) {
    const pid = Number(id);
    return window.products.find((p) => p.id === pid);
  }

  function addToCart(productId, qty = 1) {
    const cart = getCart();
    const idx = cart.findIndex((i) => i.id === productId);
    if (idx >= 0) {
      cart[idx].qty = Math.min(999, cart[idx].qty + qty);
    } else {
      cart.push({ id: productId, qty });
    }
    saveCart(cart);
    toast('Added to cart');
  }

  function updateQty(productId, qty) {
    const cart = getCart();
    const idx = cart.findIndex((i) => i.id === productId);
    if (idx >= 0) {
      if (qty <= 0) cart.splice(idx, 1);
      else cart[idx].qty = Math.min(999, qty);
      saveCart(cart);
    }
  }

  function removeFromCart(productId) {
    updateQty(productId, 0);
    toast('Removed from cart');
  }

  function getCartCount() {
    return getCart().reduce((sum, i) => sum + i.qty, 0);
  }

  function getCartDetailed() {
    const cart = getCart();
    return cart
      .map((i) => {
        const p = findProduct(i.id);
        return p ? { ...p, qty: i.qty, lineTotal: i.qty * p.price } : null;
      })
      .filter(Boolean);
  }

  function sumCart() {
    const items = getCartDetailed();
    const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;
    return { items, subtotal, tax, total };
  }

  function updateCartCount() {
    $$('.cart-count').forEach((el) => (el.textContent = getCartCount()));
  }

  function toast(msg) {
    const el = $('#toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 1600);
  }

  function ratingStars(r) {
    const full = Math.floor(r);
    const half = r - full >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);
    return '★'.repeat(full) + (half ? '☆' : '') + '✩'.repeat(empty);
  }

  function productCard(p) {
    const url = `./product.html?id=${encodeURIComponent(p.id)}`;
    const name = escapeHTML(p.name);
    const category = escapeHTML(p.category);
    const alt = escapeHTML(p.imageAlt);
    const src400 = withSize(p.image, 400, 267);
    const src600 = withSize(p.image, 600, 400);
    const src800 = withSize(p.image, 800, 533);
    const src1000 = withSize(p.image, 1000, 667);
    return `
      <article class="card product-card">
        <a class="img-wrap" href="${url}">
          <img loading="lazy" decoding="async" referrerpolicy="no-referrer"
               src="${src600}"
               srcset="${src400} 400w, ${src600} 600w, ${src800} 800w, ${src1000} 1000w"
               sizes="(min-width: 900px) 33vw, (min-width: 560px) 50vw, 100vw"
               alt="${alt}" width="600" height="400" />
        </a>
        <div class="product-body">
          <a class="product-title" href="${url}">${name}</a>
          <div class="muted">${category}</div>
          <div class="price-row">
            <span class="price">${fmt(p.price)}</span>
            <span class="rating" aria-label="Rating ${p.rating} out of 5">${ratingStars(p.rating)}</span>
          </div>
          <button class="btn btn-small add" data-id="${p.id}" aria-label="Add ${name} to cart">Add to cart</button>
        </div>
      </article>
    `;
  }

  function attachGlobalHandlers() {
    document.addEventListener('click', (e) => {
      const t = e.target;
      if (t.matches && t.matches('button.add[data-id]')) {
        const id = Number(t.getAttribute('data-id'));
        addToCart(id, 1);
        // Inline feedback on the button to increase status visibility
        const original = t.textContent;
        t.textContent = 'Added ✓';
        t.setAttribute('aria-live', 'polite');
        t.disabled = true;
        setTimeout(() => {
          t.textContent = original;
          t.removeAttribute('aria-live');
          t.disabled = false;
        }, 1200);
      }
      if (t.matches && t.matches('[data-action="remove"][data-id]')) {
        const id = Number(t.getAttribute('data-id'));
        removeFromCart(id);
        // re-render cart if present
        if ($('#cart-items')) renderCart();
      }
    });

    document.addEventListener('input', (e) => {
      const t = e.target;
      if (t.matches && t.matches('input.qty[data-id]')) {
        const id = Number(t.getAttribute('data-id'));
        const val = Number(t.value);
        updateQty(id, isNaN(val) ? 1 : val);
        if ($('#cart-items')) renderCart();
      }
    });
  }

  function initHome() {
    updateCartCount();
    attachGlobalHandlers();
    const featured = (window.products || []).slice(0, 6);
    const grid = $('#featured-grid');
    if (grid) {
      grid.innerHTML = featured.map(productCard).join('');
      // Boost LCP: eager-load the very first featured image
      const firstImg = grid.querySelector('.product-card img');
      if (firstImg) {
        firstImg.setAttribute('loading', 'eager');
        firstImg.setAttribute('fetchpriority', 'high');
      }
    }
  }

  function initProducts() {
    updateCartCount();
    attachGlobalHandlers();
    const grid = $('#products-grid');
    const searchInput = $('#search');
    const category = $('#category');
    const sort = $('#sort');
    const resultsCount = $('#results-count');
    const clearBtn = $('#clear-filters');

    // prefill from URL
    const params = new URLSearchParams(location.search);
    const term = params.get('search') || '';
    if (term) searchInput.value = term;

    function apply() {
      let list = [...window.products];
      if (grid) grid.setAttribute('aria-busy', 'true');
      const q = searchInput.value.trim().toLowerCase();
      if (q) {
        list = list.filter((p) =>
          [p.name, p.description, p.category].some((f) => f.toLowerCase().includes(q))
        );
      }
      const catVal = category.value;
      if (catVal !== 'all') {
        list = list.filter((p) => p.category === catVal);
      }
      const sortVal = sort.value;
      switch (sortVal) {
        case 'price-asc':
          list.sort((a, b) => a.price - b.price);
          break;
        case 'price-desc':
          list.sort((a, b) => b.price - a.price);
          break;
        case 'rating-desc':
          list.sort((a, b) => b.rating - a.rating);
          break;
        default:
          // stable by id
          list.sort((a, b) => a.id - b.id);
      }
      if (grid) grid.innerHTML = list.map(productCard).join('') || `<p class="muted">No products found.</p>`;
      if (resultsCount) {
        const parts = [`${list.length} result${list.length === 1 ? '' : 's'}`];
        if (catVal !== 'all') parts.push(catVal.charAt(0).toUpperCase() + catVal.slice(1));
        if (sortVal !== 'default') {
          const sortLabel = sortVal === 'price-asc' ? 'Price: Low→High' : sortVal === 'price-desc' ? 'Price: High→Low' : 'Rating: High→Low';
          parts.push(sortLabel);
        }
        if (q) parts.push(`“${q}”`);
        resultsCount.textContent = parts.join(' • ');
      }
      if (grid) grid.removeAttribute('aria-busy');
    }

    searchInput.addEventListener('input', apply);
    category.addEventListener('change', apply);
    sort.addEventListener('change', apply);
    apply();

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (category) category.value = 'all';
        if (sort) sort.value = 'default';
        if (searchInput) searchInput.value = '';
        apply();
      });
    }
  }

  function renderCart() {
    const { items, subtotal, tax, total } = sumCart();
    const container = $('#cart-items');
    const subtotalEl = $('#subtotal');
    const taxEl = $('#tax');
    const totalEl = $('#total');
    const checkoutBtn = $('#checkout-btn');
    if (container) {
      if (!items.length) {
        container.innerHTML = `<p class="muted">Your cart is empty. <a href="./products.html">Browse products</a>.</p>`;
        if (checkoutBtn) {
          checkoutBtn.setAttribute('aria-disabled', 'true');
          checkoutBtn.classList.add('is-disabled');
          checkoutBtn.setAttribute('tabindex', '-1');
          checkoutBtn.removeAttribute('href');
        }
      } else {
        container.innerHTML = items
          .map(
            (i) => `
            <div class="cart-row">
              <a class="thumb" href="./product.html?id=${i.id}">
                <img src="${withSize(i.image, 160, 160)}" alt="${escapeHTML(i.imageAlt)}" loading="lazy" decoding="async" width="160" height="160" referrerpolicy="no-referrer"/>
              </a>
              <div class="cart-info">
                <a class="title" href="./product.html?id=${i.id}">${escapeHTML(i.name)}</a>
                <div class="muted">${escapeHTML(i.category)}</div>
                <div class="price">${fmt(i.price)}</div>
                <div class="actions">
                  <label for="qty-${i.id}">Qty</label>
                  <input id="qty-${i.id}" class="qty" data-id="${i.id}" type="number" min="1" max="999" step="1" value="${i.qty}" />
                  <button class="btn btn-small danger" data-action="remove" data-id="${i.id}">Remove</button>
                </div>
              </div>
              <div class="line-total">${fmt(i.lineTotal)}</div>
            </div>`
          )
          .join('');
        if (checkoutBtn) {
          checkoutBtn.removeAttribute('aria-disabled');
          checkoutBtn.classList.remove('is-disabled');
          checkoutBtn.removeAttribute('tabindex');
          checkoutBtn.setAttribute('href', './checkout.html');
        }
      }
    }
    if (subtotalEl) subtotalEl.textContent = fmt(subtotal);
    if (taxEl) taxEl.textContent = fmt(tax);
    if (totalEl) totalEl.textContent = fmt(total);
  }

  function initCart() {
    updateCartCount();
    attachGlobalHandlers();
    renderCart();
  }

  function initProduct() {
    updateCartCount();
    attachGlobalHandlers();
    const params = new URLSearchParams(location.search);
    const id = Number(params.get('id'));
    const p = findProduct(id);
    const container = $('#product-detail');
    const crumb = $('#crumb-current');
    if (!p) {
      if (container) container.innerHTML = '<p class="muted">Product not found.</p>';
      return;
    }
    if (crumb) crumb.textContent = p.name;
    if (container) {
      container.innerHTML = `
        <div class="product-detail-grid card">
          <div class="media">
            <img src="${withSize(p.image, 800, 600)}" alt="${escapeHTML(p.imageAlt)}" loading="lazy" decoding="async" referrerpolicy="no-referrer"
                 srcset="${withSize(p.image, 600, 450)} 600w, ${withSize(p.image, 800, 600)} 800w, ${withSize(p.image, 1200, 900)} 1200w"
                 sizes="(min-width: 800px) 55vw, 100vw" width="800" height="600" />
          </div>
          <div class="info">
            <h1>${escapeHTML(p.name)}</h1>
            <div class="muted">${escapeHTML(p.category)}</div>
            <div class="price-large">${fmt(p.price)}</div>
            <div class="rating" aria-label="Rating ${p.rating} out of 5">${ratingStars(p.rating)}</div>
            <p>${escapeHTML(p.description)}</p>
            <div class="buy-row">
              <label for="pd-qty">Quantity</label>
              <input id="pd-qty" type="number" min="1" max="999" step="1" value="1" />
              <button id="pd-add" class="btn btn-primary">Add to cart</button>
            </div>
          </div>
        </div>`;
      const qtyEl = $('#pd-qty');
      const addBtn = $('#pd-add');
      addBtn.addEventListener('click', () => {
        const qty = Math.max(1, Number(qtyEl.value) || 1);
        addToCart(p.id, qty);
      });
    }

    // SEO: update title/meta and JSON-LD for the product
    try {
      document.title = `${p.name} • Acme Shop`;
      const desc = p.description || 'Product details';
      let md = document.querySelector('meta[name="description"]');
      if (!md) {
        md = document.createElement('meta');
        md.setAttribute('name', 'description');
        document.head.appendChild(md);
      }
      md.setAttribute('content', desc);

      const ensure = (selector, attrs) => {
        let el = document.querySelector(selector);
        if (!el) {
          el = document.createElement('meta');
          Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));
          document.head.appendChild(el);
        }
        return el;
      };

      const ogTitle = ensure('meta[property="og:title"]', { property: 'og:title' });
      ogTitle.setAttribute('content', `${p.name} • Acme Shop`);
      const ogDesc = ensure('meta[property="og:description"]', { property: 'og:description' });
      ogDesc.setAttribute('content', desc);
      const ogType = ensure('meta[property="og:type"]', { property: 'og:type' });
      ogType.setAttribute('content', 'product');
      const ogUrl = ensure('meta[property="og:url"]', { property: 'og:url' });
      ogUrl.setAttribute('content', location.href);
      const ogImg = ensure('meta[property="og:image"]', { property: 'og:image' });
      ogImg.setAttribute('content', withSize(p.image, 1200, 630));

      const twTitle = ensure('meta[name="twitter:title"]', { name: 'twitter:title' });
      twTitle.setAttribute('content', `${p.name} • Acme Shop`);
      const twDesc = ensure('meta[name="twitter:description"]', { name: 'twitter:description' });
      twDesc.setAttribute('content', desc);
      const twImg = ensure('meta[name="twitter:image"]', { name: 'twitter:image' });
      twImg.setAttribute('content', withSize(p.image, 1200, 630));

      let canon = document.querySelector('link[rel="canonical"]');
      if (!canon) {
        canon = document.createElement('link');
        canon.setAttribute('rel', 'canonical');
        document.head.appendChild(canon);
      }
      canon.setAttribute('href', location.href);

      // JSON-LD Product
      const price = Number(p.price);
      const ld = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: p.name,
        image: [ withSize(p.image, 800, 600) ],
        sku: `SKU-${p.id}`,
        offers: {
          '@type': 'Offer',
          priceCurrency: 'USD',
          price: price.toFixed(2),
          availability: p.stock && p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          url: location.href
        }
      };
      let ldEl = document.getElementById('ld-product');
      if (!ldEl) {
        ldEl = document.createElement('script');
        ldEl.type = 'application/ld+json';
        ldEl.id = 'ld-product';
        document.head.appendChild(ldEl);
      }
      ldEl.textContent = JSON.stringify(ld);
    } catch {}
  }

  function renderOrderSummary(listEl, totalsEls) {
    const { items, subtotal, tax, total } = sumCart();
    if (listEl) {
      listEl.innerHTML = items
        .map(
          (i) => `
          <div class="summary-row">
            <div>
              <div class="title">${escapeHTML(i.name)}</div>
              <div class="muted">Qty ${i.qty} • ${fmt(i.price)}</div>
            </div>
            <div class="line-total">${fmt(i.lineTotal)}</div>
          </div>`
        )
        .join('') || '<p class="muted">Your cart is empty.</p>';
    }
    if (totalsEls) {
      const { subtotalEl, taxEl, totalEl } = totalsEls;
      if (subtotalEl) subtotalEl.textContent = fmt(subtotal);
      if (taxEl) taxEl.textContent = fmt(tax);
      if (totalEl) totalEl.textContent = fmt(total);
    }
    return { items, subtotal, tax, total };
  }

  function validate(form) {
    const fields = ['name', 'email', 'phone', 'address', 'city', 'state', 'zip', 'country'];
    let ok = true;
    let firstInvalid = null;
    fields.forEach((f) => {
      const input = form.elements[f];
      const err = $(`#err-${f}`);
      if (err) err.textContent = '';
      if (!input || !input.value.trim()) {
        ok = false;
        if (err) err.textContent = 'Required';
        if (input) input.setAttribute('aria-invalid', 'true');
        if (!firstInvalid) firstInvalid = input;
      } else if (f === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
        ok = false;
        if (err) err.textContent = 'Enter a valid email';
        if (input) input.setAttribute('aria-invalid', 'true');
        if (!firstInvalid) firstInvalid = input;
      } else {
        if (input) input.removeAttribute('aria-invalid');
      }
    });
    if (!ok && firstInvalid) firstInvalid.focus();
    return ok;
  }

  function initCheckout() {
    updateCartCount();
    attachGlobalHandlers();
    const listEl = $('#summary-items');
    const subtotalEl = $('#subtotal');
    const taxEl = $('#tax');
    const totalEl = $('#total');
    const totals = renderOrderSummary(listEl, { subtotalEl, taxEl, totalEl });

    const form = $('#checkout-form');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!getCart().length) {
        toast('Your cart is empty');
        return;
      }
      if (!validate(form)) return;

      const rawEntries = Object.fromEntries(new FormData(form).entries());
      const data = Object.fromEntries(Object.entries(rawEntries).map(([k, v]) => [k, String(v)]));
      const orders = getOrders();
      const id = 'ORD-' + Math.random().toString(36).slice(2, 8).toUpperCase();
      const order = {
        id,
        createdAt: new Date().toISOString(),
        items: sumCart().items,
        totals: sumCart(),
        customer: data,
        currency: CURRENCY,
      };
      orders.push(order);
      saveOrders(orders);
      saveCart([]);

      // Simple confirmation inline
      toast('Order placed successfully');
      form.outerHTML = `
        <div class="card success">
          <h2>Thank you!</h2>
          <p>Your order <strong>${escapeHTML(id)}</strong> has been placed.</p>
          <p>We emailed a confirmation to <strong>${escapeHTML(data.email)}</strong>.</p>
          <div class="actions-row">
            <a class="btn btn-primary" href="./products.html">Continue shopping</a>
            <a class="btn" href="./index.html">Back to home</a>
          </div>
        </div>`;

      renderOrderSummary(listEl, { subtotalEl, taxEl, totalEl });
      updateCartCount();
    });
  }

  // expose initializers
  window.initHome = initHome;
  window.initProducts = initProducts;
  window.initProduct = initProduct;
  window.initCart = initCart;
  window.initCheckout = initCheckout;
})();
