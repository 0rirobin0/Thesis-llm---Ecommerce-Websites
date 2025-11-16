# Acme Shop (gpt5) — HTML/CSS/JS eCommerce

A modern, minimal, and accessible eCommerce demo built with only HTML, CSS, and vanilla JavaScript. No frameworks, no backend. Cart and orders persist in `localStorage`.

## Project Overview
- Pages: `index.html`, `products.html`, `product.html`, `cart.html`, `checkout.html`
- Styles: `styles/style.css`
- Scripts: `scripts/app.js`, `scripts/products.js` (exports `window.products`)
- Data persistence: `localStorage` keys `cart` and `orders`
- Currency: USD; Example tax rate 7%

## Features
- Product listing with category filter, sort (price/rating), and search
- Product detail with quantity add-to-cart
- Cart: update qty, remove, computed subtotal/tax/total
- Checkout form (name, email, phone, address) with client-side validation
- Orders saved to `localStorage` (no payment collected)
- Responsive, mobile‑first UI; semantic HTML; keyboard-focus friendly

## Folder Structure
```
/gpt5
  index.html
  products.html
  product.html
  cart.html
  checkout.html
  /scripts
    app.js
    products.js
  /styles
    style.css
```

## Accessibility Report (WCAG 2.1/2.2)
Status: Pass for essential AA criteria in typical flows. Key items audited:
- Landmarks: `header[role="banner"]`, `main`, `footer[role="contentinfo"]`
- Headings/structure: Logical `h1` per page; sections labelled
- Images: Informative images include meaningful `alt`; set explicit `width`/`height` to reduce CLS; `decoding="async"` and `referrerpolicy="no-referrer"`
- Forms: Each input associated with `<label>`; inline error messages with `role="alert"`; invalid fields flagged via `aria-invalid`; focus moves to first invalid field
- Keyboard: No duplicate tab stops; active nav indicated via `aria-current="page"`; skip link present
- ARIA live regions: Cart count is live-updated; toasts use `role="status"`
- Color contrast (AA): Primary text (#e5e7eb) on background (#0b0d10) > 7:1; muted text (#9ca3af) on #0b0d10 ~6:1; interactive controls meet AA

Recent fixes applied:
- Removed redundant `tabindex` from product cards; inner links remain focusable
- Added `width`/`height` + `decoding="async"` + `referrerpolicy` to images
- Checkout button becomes truly disabled when cart empty: `aria-disabled`, remove `href`, `tabindex="-1"`, and `.is-disabled` class
- Form validation adds/removes `aria-invalid` and focuses first invalid control
- Added `role="banner"` to headers and `aria-current="page"` on active nav links

## Performance Notes
- Images lazy-loaded; explicit dimensions reduce layout shift
- Minimal CSS/JS, no frameworks; simple DOM updates
- Static hosting friendly; works well on low-power devices

## Images & Assets
- Product images use direct Pexels CDN URLs (normalized to `800x600`) for reliable loading
- You can pin different photos by updating `scripts/products.js` image URLs
- Optional: Download assets locally to `/img/` and reference them for fully offline use

Example filenames (see assets.txt if provided):
```
product-01.jpg, product-02.jpg, ... product-12.jpg
```

## How To Run Locally (Windows PowerShell)
- Open `gpt5/index.html` with a static server to avoid CORS/referrer issues

Using Python (if installed):
```powershell
cd "D:\Thesis llm , Ecommerce Websites"
python -m http.server 8080
# Then open http://localhost:8080/gpt5/index.html
```

Using VS Code Live Server: Right‑click `index.html` > Open with Live Server

## Data Model
- `cart`: Array of `{ id: number, qty: number }`
- `orders`: Array of order snapshots: `{ id, createdAt, items, totals, customer, currency }`

## Known Limitations
- No backend or payments; orders are stored only in the browser
- Fixed example tax; shipping and promo codes not implemented
- No pagination; suitable for small catalogs
- Validation is basic and locale‑agnostic

## Changelog (Accessibility)
- Added banner landmarks and `aria-current` to active nav
- Disabled checkout link correctly when cart empty
- Improved image semantics: size attributes, decoding, and referrer policy
- Enhanced form validation with `aria-invalid` and focus on first error

---
Built with care for semantics, performance, and usability. Enjoy!