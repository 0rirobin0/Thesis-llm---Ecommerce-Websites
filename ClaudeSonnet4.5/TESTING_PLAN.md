# Testing Plan - ShopHub eCommerce Platform

**Role:** QA Engineer  
**Date:** November 16, 2025  
**Project:** ShopHub Static eCommerce Site  
**Test Approach:** Manual E2E + Browser-based Unit Tests

---

## 1. Unit Test Plan (Jest-style)

### Test Suite: Cart Management Functions

```javascript
// test/cart.test.js

import { products } from './products.js';

describe('Cart Management', () => {
  
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('getCart()', () => {
    test('should return empty array when cart is empty', () => {
      const cart = getCart();
      expect(cart).toEqual([]);
      expect(Array.isArray(cart)).toBe(true);
    });

    test('should return valid cart items from localStorage', () => {
      const mockCart = [
        { id: 1, name: 'Product 1', price: 10.99, quantity: 2, image: 'img1.jpg', imageAlt: 'Alt 1' }
      ];
      localStorage.setItem('shophub_cart', JSON.stringify(mockCart));
      
      const cart = getCart();
      expect(cart).toEqual(mockCart);
      expect(cart.length).toBe(1);
      expect(cart[0].quantity).toBe(2);
    });

    test('should handle corrupted JSON gracefully', () => {
      localStorage.setItem('shophub_cart', 'invalid{json');
      
      const cart = getCart();
      expect(cart).toEqual([]);
      expect(localStorage.getItem('shophub_cart')).toBeNull(); // Should be removed
    });

    test('should filter out invalid cart items', () => {
      const mockCart = [
        { id: 1, name: 'Valid', price: 10, quantity: 2, image: 'img.jpg', imageAlt: 'Alt' },
        { id: -1, name: 'Invalid ID', price: 10, quantity: 1 }, // Invalid ID
        { id: 2, name: 'XSS <script>', price: -5, quantity: 1 }, // Negative price
        { id: 3, name: 'Valid', price: 20, quantity: 0, image: 'img.jpg', imageAlt: 'Alt' }, // Zero quantity
        { id: 4, name: 'Valid', price: 15, quantity: 5000, image: 'img.jpg', imageAlt: 'Alt' } // Excessive quantity
      ];
      localStorage.setItem('shophub_cart', JSON.stringify(mockCart));
      
      const cart = getCart();
      expect(cart.length).toBe(1);
      expect(cart[0].id).toBe(1);
    });
  });

  describe('addToCart()', () => {
    test('should add new product to empty cart', () => {
      addToCart(1, 2);
      
      const cart = getCart();
      expect(cart.length).toBe(1);
      expect(cart[0].id).toBe(1);
      expect(cart[0].quantity).toBe(2);
      expect(cart[0].name).toBe('Classic Running Shoes');
      expect(cart[0].price).toBe(89.99);
    });

    test('should increase quantity for existing product', () => {
      addToCart(1, 2);
      addToCart(1, 3);
      
      const cart = getCart();
      expect(cart.length).toBe(1);
      expect(cart[0].quantity).toBe(5);
    });

    test('should add multiple different products', () => {
      addToCart(1, 1);
      addToCart(2, 2);
      addToCart(3, 1);
      
      const cart = getCart();
      expect(cart.length).toBe(3);
    });

    test('should sanitize quantity to valid range (1-99)', () => {
      addToCart(1, -5); // Negative
      let cart = getCart();
      expect(cart[0].quantity).toBe(1); // Clamped to min
      
      localStorage.clear();
      addToCart(1, 150); // Exceeds max
      cart = getCart();
      expect(cart[0].quantity).toBe(99); // Clamped to max
    });

    test('should prevent quantity overflow beyond 999', () => {
      addToCart(1, 99);
      addToCart(1, 99);
      addToCart(1, 99);
      
      const cart = getCart();
      expect(cart[0].quantity).toBeLessThanOrEqual(999);
    });

    test('should handle invalid product ID gracefully', () => {
      addToCart(9999, 1); // Non-existent product
      
      const cart = getCart();
      expect(cart.length).toBe(0);
    });
  });

  describe('updateCartQuantity()', () => {
    beforeEach(() => {
      addToCart(1, 5);
    });

    test('should update quantity to valid value', () => {
      updateCartQuantity(1, 10);
      
      const cart = getCart();
      expect(cart[0].quantity).toBe(10);
    });

    test('should remove item when quantity is 0', () => {
      updateCartQuantity(1, 0);
      
      const cart = getCart();
      expect(cart.length).toBe(0);
    });

    test('should remove item when quantity is negative', () => {
      updateCartQuantity(1, -5);
      
      const cart = getCart();
      expect(cart.length).toBe(0);
    });

    test('should clamp quantity to max 999', () => {
      updateCartQuantity(1, 5000);
      
      const cart = getCart();
      expect(cart[0].quantity).toBe(999);
    });

    test('should handle non-existent product ID', () => {
      updateCartQuantity(9999, 10);
      
      const cart = getCart();
      expect(cart.length).toBe(1); // Original item unchanged
      expect(cart[0].id).toBe(1);
    });
  });

  describe('removeFromCart()', () => {
    beforeEach(() => {
      addToCart(1, 2);
      addToCart(2, 3);
      addToCart(3, 1);
    });

    test('should remove specific item from cart', () => {
      removeFromCart(2);
      
      const cart = getCart();
      expect(cart.length).toBe(2);
      expect(cart.find(item => item.id === 2)).toBeUndefined();
    });

    test('should handle removing non-existent item', () => {
      removeFromCart(9999);
      
      const cart = getCart();
      expect(cart.length).toBe(3); // No change
    });

    test('should remove last item in cart', () => {
      removeFromCart(1);
      removeFromCart(2);
      removeFromCart(3);
      
      const cart = getCart();
      expect(cart.length).toBe(0);
    });
  });

  describe('clearCart()', () => {
    test('should remove all items from cart', () => {
      addToCart(1, 5);
      addToCart(2, 3);
      
      clearCart();
      
      const cart = getCart();
      expect(cart.length).toBe(0);
      expect(localStorage.getItem('shophub_cart')).toBeNull();
    });

    test('should handle clearing empty cart', () => {
      clearCart();
      
      const cart = getCart();
      expect(cart).toEqual([]);
    });
  });

  describe('calculateCartTotals()', () => {
    test('should return zeros for empty cart', () => {
      const totals = calculateCartTotals();
      
      expect(totals.subtotal).toBe(0);
      expect(totals.shipping).toBe(0);
      expect(totals.tax).toBe(0);
      expect(totals.total).toBe(0);
    });

    test('should calculate correct subtotal', () => {
      addToCart(1, 2); // $89.99 × 2 = $179.98
      addToCart(2, 1); // $129.99 × 1 = $129.99
      
      const totals = calculateCartTotals();
      expect(totals.subtotal).toBeCloseTo(309.97, 2);
    });

    test('should apply free shipping for orders over $100', () => {
      addToCart(1, 2); // $179.98
      
      const totals = calculateCartTotals();
      expect(totals.shipping).toBe(0);
    });

    test('should charge $10 shipping for orders under $100', () => {
      addToCart(4, 2); // $24.99 × 2 = $49.98
      
      const totals = calculateCartTotals();
      expect(totals.shipping).toBe(10);
    });

    test('should calculate 10% tax correctly', () => {
      addToCart(1, 1); // $89.99
      
      const totals = calculateCartTotals();
      expect(totals.tax).toBeCloseTo(8.999, 2);
    });

    test('should calculate correct total', () => {
      addToCart(4, 2); // Subtotal: $49.98
      // Shipping: $10 (under $100)
      // Tax: $4.998 (10% of subtotal)
      // Total: $64.978
      
      const totals = calculateCartTotals();
      expect(totals.total).toBeCloseTo(64.98, 2);
    });
  });
});

describe('Input Sanitization', () => {
  describe('sanitizeHTML()', () => {
    test('should escape HTML special characters', () => {
      const input = '<script>alert("XSS")</script>';
      const output = sanitizeHTML(input);
      
      expect(output).toBe('&lt;script&gt;alert("XSS")&lt;/script&gt;');
      expect(output).not.toContain('<script>');
    });

    test('should handle quotes and ampersands', () => {
      const input = 'Product & "Special" <Offer>';
      const output = sanitizeHTML(input);
      
      expect(output).toContain('&amp;');
      expect(output).toContain('&lt;');
      expect(output).toContain('&gt;');
    });

    test('should return empty string for non-string input', () => {
      expect(sanitizeHTML(null)).toBe('');
      expect(sanitizeHTML(undefined)).toBe('');
      expect(sanitizeHTML(123)).toBe('');
      expect(sanitizeHTML({})).toBe('');
    });
  });

  describe('sanitizeNumber()', () => {
    test('should clamp number to min/max range', () => {
      expect(sanitizeNumber(5, 1, 10)).toBe(5);
      expect(sanitizeNumber(-5, 1, 10)).toBe(1);
      expect(sanitizeNumber(50, 1, 10)).toBe(10);
    });

    test('should handle invalid input', () => {
      expect(sanitizeNumber('abc', 1, 10)).toBe(1);
      expect(sanitizeNumber(null, 1, 10)).toBe(1);
      expect(sanitizeNumber(undefined, 5, 10)).toBe(5);
    });
  });
});

describe('Cart Badge Updates', () => {
  test('should update badge count correctly', () => {
    document.body.innerHTML = '<span id="cartBadge">0</span>';
    
    addToCart(1, 1);
    expect(document.getElementById('cartBadge').textContent).toBe('1');
    
    addToCart(2, 2);
    expect(document.getElementById('cartBadge').textContent).toBe('3');
    
    updateCartQuantity(1, 5);
    expect(document.getElementById('cartBadge').textContent).toBe('7');
    
    removeFromCart(1);
    expect(document.getElementById('cartBadge').textContent).toBe('2');
  });

  test('should hide badge when cart is empty', () => {
    document.body.innerHTML = '<span id="cartBadge" style="display: flex;">0</span>';
    
    clearCart();
    
    const badge = document.getElementById('cartBadge');
    expect(badge.style.display).toBe('none');
  });
});
```

### Test Execution Summary

| Test Suite | Tests | Expected Pass | Critical |
|------------|-------|---------------|----------|
| getCart() | 4 | 4 | ✅ Yes |
| addToCart() | 6 | 6 | ✅ Yes |
| updateCartQuantity() | 5 | 5 | ✅ Yes |
| removeFromCart() | 3 | 3 | ✅ Yes |
| clearCart() | 2 | 2 | ✅ Yes |
| calculateCartTotals() | 6 | 6 | ✅ Yes |
| sanitizeHTML() | 3 | 3 | ✅ Yes |
| sanitizeNumber() | 2 | 2 | ✅ Yes |
| Cart Badge | 2 | 2 | ⚠️ Medium |
| **TOTAL** | **33** | **33** | **100%** |

---

## 2. Manual E2E Test Checklist

### 2.1 Homepage Tests

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 1 | Page loads correctly | Navigate to `/index.html` | Page displays with header, hero, 3 featured products, footer | ☐ |
| 2 | Featured products display | Check product cards | Each card shows image, name, category, price, "Add to Cart" button | ☐ |
| 3 | Navigation links work | Click "Products" in nav | Redirects to products page | ☐ |
| 4 | Add to cart from home | Click "Add to Cart" on featured product | Badge shows "1", success notification appears | ☐ |
| 5 | Cart badge updates | Add multiple products | Badge shows correct total quantity | ☐ |
| 6 | Cart icon click | Click cart icon in header | Redirects to cart page | ☐ |
| 7 | Accessibility - keyboard nav | Tab through page | Can access all interactive elements | ☐ |
| 8 | Accessibility - screen reader | Use NVDA/JAWS | All content announced correctly | ☐ |

### 2.2 Products Page Tests

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 9 | All products display | Navigate to products page | Shows all 12 products in grid | ☐ |
| 10 | Search functionality | Type "shoes" in search | Only shoe products displayed | ☐ |
| 11 | Search - no results | Type "xyz123" | "No products found" message appears | ☐ |
| 12 | Category filter - shoes | Select "Shoes" category | Only 3 shoe products shown | ☐ |
| 13 | Category filter - apparel | Select "Apparel" category | Only 6 apparel products shown | ☐ |
| 14 | Category filter - electronics | Select "Electronics" category | Only 3 electronics products shown | ☐ |
| 15 | Sort by price (low) | Select "Price: Low to High" | Products sorted ascending | ☐ |
| 16 | Sort by price (high) | Select "Price: High to Low" | Products sorted descending | ☐ |
| 17 | Sort by name | Select "Name: A-Z" | Products alphabetically sorted | ☐ |
| 18 | Combined filters | Search "smart" + Electronics | Only smart electronics shown | ☐ |
| 19 | Clear filters | Click "Clear Filters" | All 12 products shown again | ☐ |
| 20 | Product count display | Filter products | Count updates: "Showing X products" | ☐ |
| 21 | Loading states | Apply filter | Loading spinner appears briefly | ☐ |
| 22 | Product link click | Click product image/name | Navigate to product detail page | ☐ |

### 2.3 Product Detail Page Tests

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 23 | Product details load | Navigate via product ID | Correct product info displayed | ☐ |
| 24 | Breadcrumb navigation | Check breadcrumb | Shows: Home > Products > Product Name | ☐ |
| 25 | Breadcrumb links work | Click "Products" in breadcrumb | Returns to products page | ☐ |
| 26 | Image displays | Check product image | Large image (500x500) loads with srcset | ☐ |
| 27 | Quantity increase | Click "+" button | Quantity increments to 2, 3, etc. | ☐ |
| 28 | Quantity decrease | Click "−" button | Quantity decrements, stops at 1 | ☐ |
| 29 | Quantity manual input | Type "5" in input | Accepts value, updates aria-valuenow | ☐ |
| 30 | Quantity min/max validation | Try 0, 100, -5 | Clamped to 1-99 range | ☐ |
| 31 | Add to cart (qty 1) | Quantity=1, click "Add to Cart" | Cart badge shows +1, button success state | ☐ |
| 32 | Add to cart (qty 5) | Quantity=5, click "Add to Cart" | Cart badge shows +5 | ☐ |
| 33 | Back to products | Click "Back to Products" | Returns to products page | ☐ |
| 34 | Invalid product ID | Navigate to `?id=9999` | "Product not found" message shown | ☐ |

### 2.4 Cart Page Tests

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 35 | Empty cart display | Clear cart, visit cart page | Shows "Your cart is empty" message | ☐ |
| 36 | Cart items display | Add 3 products, visit cart | All 3 items shown with details | ☐ |
| 37 | Item image/name | Check cart item | Shows thumbnail (100x100), name, price | ☐ |
| 38 | Quantity controls | Use +/− buttons | Updates quantity, subtotal recalculates | ☐ |
| 39 | Quantity input | Type "10" in quantity | Updates on blur/enter, totals update | ☐ |
| 40 | Remove item | Click "×" button | Confirmation dialog appears | ☐ |
| 41 | Remove confirmation | Click "Remove" in dialog | Item removed, totals update | ☐ |
| 42 | Remove cancellation | Click "Cancel" in dialog | Dialog closes, item remains | ☐ |
| 43 | Subtotal calculation | Add items: $89.99 + $24.99 | Subtotal = $114.98 | ☐ |
| 44 | Shipping (free) | Subtotal > $100 | Shipping = $0.00 | ☐ |
| 45 | Shipping (charged) | Subtotal < $100 | Shipping = $10.00 | ☐ |
| 46 | Tax calculation | Subtotal $50 | Tax = $5.00 (10%) | ☐ |
| 47 | Total calculation | Subtotal + Shipping + Tax | Total = correct sum | ☐ |
| 48 | Edit cart link | Check summary section | "Edit Cart" link present and working | ☐ |
| 49 | Continue shopping | Click "Continue Shopping" | Returns to products page | ☐ |
| 50 | Proceed to checkout | Click "Proceed to Checkout" | Navigates to checkout page | ☐ |

### 2.5 Checkout Page Tests

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 51 | Empty cart redirect | Clear cart, visit checkout | Shows "Cart is empty" message | ☐ |
| 52 | Order summary display | Visit with items in cart | Shows all cart items with quantities | ☐ |
| 53 | Order totals | Check summary | Displays subtotal, shipping, tax, total | ☐ |
| 54 | Form validation - empty | Submit empty form | All required fields show errors | ☐ |
| 55 | Email validation | Enter "invalid-email" | Error: "valid email address" | ☐ |
| 56 | Email validation (valid) | Enter "user@example.com" | No error, accepted | ☐ |
| 57 | Phone validation | Enter "555-1234" | Error: "valid phone number" | ☐ |
| 58 | Phone validation (valid) | Enter "555-555-5555" | No error, accepted | ☐ |
| 59 | ZIP validation | Enter "1234" or "123456" | Error: "valid 5-digit ZIP" | ☐ |
| 60 | ZIP validation (valid) | Enter "12345" | No error, accepted | ☐ |
| 61 | Blur validation | Tab through fields | Errors appear on blur | ☐ |
| 62 | Real-time validation | Fix error, type valid value | Error clears immediately | ☐ |
| 63 | Autocomplete attributes | Check form inputs | Email has autocomplete="email", etc. | ☐ |
| 64 | Form submission | Fill valid data, submit | Order confirmation modal appears | ☐ |
| 65 | Order ID generation | Check modal | Shows unique order ID (ORD-...) | ☐ |
| 66 | Order email display | Check modal | Shows customer email entered | ☐ |
| 67 | Cart cleared after order | Check localStorage | shophub_cart removed | ☐ |
| 68 | Order saved | Check localStorage | shophub_orders contains order | ☐ |
| 69 | Modal focus trap | Tab in modal | Focus stays within modal | ☐ |
| 70 | Modal keyboard close | Press Escape in modal | Redirects to homepage | ☐ |
| 71 | Modal button click | Click "Continue Shopping" | Redirects to homepage | ☐ |

### 2.6 Cross-Browser Tests

| # | Browser | Version | Test Scope | Status |
|---|---------|---------|------------|--------|
| 72 | Chrome | Latest | Full E2E flow | ☐ |
| 73 | Firefox | Latest | Full E2E flow | ☐ |
| 74 | Safari | Latest | Full E2E flow | ☐ |
| 75 | Edge | Latest | Full E2E flow | ☐ |
| 76 | Mobile Safari | iOS 16+ | Responsive, touch | ☐ |
| 77 | Chrome Mobile | Android | Responsive, touch | ☐ |

### 2.7 Responsive Design Tests

| # | Viewport | Test | Expected Result | Status |
|---|----------|------|-----------------|--------|
| 78 | 320px | Mobile portrait | Single column, hamburger menu | ☐ |
| 79 | 768px | Tablet | 2-column grid, full nav | ☐ |
| 80 | 1024px | Desktop | 3-column grid, optimal spacing | ☐ |
| 81 | 1920px | Large desktop | Max-width container, centered | ☐ |

### 2.8 Security Tests

| # | Test Case | Steps | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| 82 | XSS - product name | Inject `<script>alert(1)</script>` in localStorage | Text displayed as-is, no script execution | ☐ |
| 83 | XSS - cart quantity | Set quantity to `<img src=x onerror=alert(1)>` | Sanitized to number or removed | ☐ |
| 84 | localStorage corruption | Set cart to invalid JSON | Gracefully handled, cart reset | ☐ |
| 85 | Negative prices | Manually set negative price | Filtered out by validation | ☐ |
| 86 | Quantity overflow | Set quantity to 999999 | Clamped to 999 max | ☐ |
| 87 | CSP header | Check DevTools Console | No CSP violations | ☐ |

### 2.9 Performance Tests

| # | Test Case | Tool | Target | Status |
|---|-----------|------|--------|--------|
| 88 | Lighthouse Performance | Chrome DevTools | Score ≥ 90 | ☐ |
| 89 | Lighthouse Accessibility | Chrome DevTools | Score = 100 | ☐ |
| 90 | Page load time | Network tab | < 3 seconds | ☐ |
| 91 | Image lazy loading | Network tab | Images load on scroll | ☐ |
| 92 | Total page weight | Network tab | < 500 KB uncompressed | ☐ |

---

## 3. Bug Tracking Template

| Bug ID | Severity | Page | Description | Steps to Reproduce | Expected | Actual | Status |
|--------|----------|------|-------------|-------------------|----------|--------|--------|
| BUG-001 | Critical | Cart | Badge shows "10" for 1 item | Add 1 item, check badge | Shows "1" | Shows "10" | ✅ Fixed |
| BUG-002 | | | | | | | ☐ |

### Severity Levels
- **Critical:** Blocks core functionality (checkout, add to cart)
- **High:** Major usability issue (navigation broken, wrong totals)
- **Medium:** Minor usability issue (cosmetic, edge case)
- **Low:** Enhancement or suggestion

---

## 4. Test Execution Summary

### Pass/Fail Criteria
- **Pass:** 90%+ of tests passing
- **Conditional Pass:** 80-89% passing, no critical failures
- **Fail:** < 80% passing OR any critical failures

### Test Metrics
- **Total Test Cases:** 92
- **Executed:** 0 / 92
- **Passed:** 0
- **Failed:** 0
- **Blocked:** 0
- **Pass Rate:** 0%

### Sign-off
- **Tested By:** _________________
- **Date:** _________________
- **Release Approved:** ☐ Yes  ☐ No  ☐ Conditional

---

## 5. Regression Test Suite (Quick Smoke Test)

Run before each release (5-10 minutes):

1. ✅ Homepage loads
2. ✅ Add product to cart from homepage
3. ✅ Cart badge updates correctly
4. ✅ Navigate to products page
5. ✅ Search for "smart" - finds electronics
6. ✅ Filter by category - shows correct items
7. ✅ Click product - detail page loads
8. ✅ Add to cart with quantity 3
9. ✅ Navigate to cart
10. ✅ Update quantity, remove item
11. ✅ Proceed to checkout
12. ✅ Fill form and submit
13. ✅ Order confirmation appears
14. ✅ Cart cleared after checkout
15. ✅ No console errors

**All pass? Ship it! 🚀**
