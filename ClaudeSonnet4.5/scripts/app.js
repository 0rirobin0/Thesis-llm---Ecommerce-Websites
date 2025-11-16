/**
 * ShopHub - Main Application JavaScript
 * Handles all client-side logic including cart management, product filtering, and checkout
 * Uses localStorage for data persistence
 */

import { products } from './products.js';

// ===========================
// UTILITY FUNCTIONS
// ===========================

/**
 * Format price to USD currency
 */
const formatPrice = (price) => {
    return `$${price.toFixed(2)}`;
};

/**
 * Get URL parameters
 */
const getUrlParams = () => {
    const params = new URLSearchParams(window.location.search);
    return {
        id: params.get('id'),
        category: params.get('category')
    };
};

/**
 * Generate unique order ID
 */
const generateOrderId = () => {
    return 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
};

// ===========================
// CART MANAGEMENT
// ===========================

/**
 * Get cart from localStorage
 */
const getCart = () => {
    const cart = localStorage.getItem('shophub_cart');
    return cart ? JSON.parse(cart) : [];
};

/**
 * Save cart to localStorage
 */
const saveCart = (cart) => {
    localStorage.setItem('shophub_cart', JSON.stringify(cart));
    updateCartBadge();
};

/**
 * Add product to cart
 */
const addToCart = (productId, quantity = 1) => {
    const cart = getCart();
    const product = products.find(p => p.id === productId);
    
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            imageAlt: product.imageAlt,
            quantity: quantity
        });
    }
    
    saveCart(cart);
    showNotification('Product added to cart!');
};

/**
 * Update cart item quantity
 */
const updateCartQuantity = (productId, quantity) => {
    const cart = getCart();
    const item = cart.find(item => item.id === productId);
    
    if (item) {
        if (quantity <= 0) {
            removeFromCart(productId);
        } else {
            item.quantity = quantity;
            saveCart(cart);
        }
    }
};

/**
 * Remove item from cart
 */
const removeFromCart = (productId) => {
    let cart = getCart();
    cart = cart.filter(item => item.id !== productId);
    saveCart(cart);
};

/**
 * Clear entire cart
 */
const clearCart = () => {
    localStorage.removeItem('shophub_cart');
    updateCartBadge();
};

/**
 * Calculate cart totals
 */
const calculateCartTotals = () => {
    const cart = getCart();
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 0 ? (subtotal > 100 ? 0 : 10) : 0;
    const tax = subtotal * 0.10;
    const total = subtotal + shipping + tax;
    
    return { subtotal, shipping, tax, total };
};

/**
 * Update cart badge count with accessibility support
 */
const updateCartBadge = () => {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const badge = document.getElementById('cartBadge');
    if (badge) {
        const srText = badge.querySelector('.sr-only');
        const countText = totalItems.toString();
        
        if (srText) {
            // Update visible count (not including sr-only text)
            const textNode = Array.from(badge.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
            if (textNode) {
                textNode.textContent = countText;
            } else {
                badge.appendChild(document.createTextNode(countText));
            }
        } else {
            badge.textContent = countText;
        }
        
        badge.style.display = totalItems > 0 ? 'flex' : 'none';
        
        // Update aria-hidden on modal when present
        if (totalItems === 0) {
            badge.setAttribute('aria-hidden', 'true');
        } else {
            badge.removeAttribute('aria-hidden');
        }
    }
};

// ===========================
// NOTIFICATION SYSTEM
// ===========================

/**
 * Show temporary notification message with improved UX
 */
const showNotification = (message, duration = 3000, type = 'success') => {
    // Remove existing notification if any
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.setAttribute('role', 'status');
    notification.setAttribute('aria-live', 'polite');
    
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Remove after duration
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, duration);
};

/**
 * Show confirmation dialog
 */
const showConfirmation = (title, message, onConfirm, onCancel) => {
    // Remove existing dialog if any
    const existing = document.querySelector('.confirmation-dialog');
    if (existing) existing.remove();

    const dialog = document.createElement('div');
    dialog.className = 'confirmation-dialog';
    dialog.setAttribute('role', 'alertdialog');
    dialog.setAttribute('aria-labelledby', 'confirm-title');
    dialog.setAttribute('aria-describedby', 'confirm-message');
    dialog.innerHTML = `
        <div class="confirmation-backdrop" aria-hidden="true"></div>
        <div class="confirmation-content">
            <div class="confirmation-icon" aria-hidden="true">⚠</div>
            <h3 id="confirm-title" class="confirmation-title">${title}</h3>
            <p id="confirm-message" class="confirmation-message">${message}</p>
            <div class="confirmation-actions">
                <button class="btn btn-secondary" id="confirmCancel">Cancel</button>
                <button class="btn btn-danger" id="confirmOk">Remove</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(dialog);
    
    // Focus on primary action
    setTimeout(() => document.getElementById('confirmOk').focus(), 100);
    
    // Event handlers
    document.getElementById('confirmOk').addEventListener('click', () => {
        dialog.remove();
        if (onConfirm) onConfirm();
    });
    
    document.getElementById('confirmCancel').addEventListener('click', () => {
        dialog.remove();
        if (onCancel) onCancel();
    });
    
    // Escape key handler
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            dialog.remove();
            if (onCancel) onCancel();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
    
    // Click backdrop to close
    dialog.querySelector('.confirmation-backdrop').addEventListener('click', () => {
        dialog.remove();
        if (onCancel) onCancel();
    });
};

/**
 * Show loading state on container
 */
const showLoading = (container) => {
    if (!container) return;
    
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = '<div class="loading-spinner" role="status" aria-label="Loading"></div>';
    
    container.style.position = 'relative';
    container.appendChild(overlay);
};

/**
 * Hide loading state
 */
const hideLoading = (container) => {
    if (!container) return;
    const overlay = container.querySelector('.loading-overlay');
    if (overlay) overlay.remove();
};

/**
 * Add success state to button
 */
const buttonSuccess = (button, duration = 1500) => {
    if (!button) return;
    
    const originalText = button.textContent;
    button.classList.add('success');
    button.disabled = true;
    
    setTimeout(() => {
        button.classList.remove('success');
        button.disabled = false;
        button.textContent = originalText;
    }, duration);
};

// ===========================
// PAGE-SPECIFIC LOGIC
// ===========================

/**
 * Initialize Home Page
 */
const initHomePage = () => {
    const featuredContainer = document.getElementById('featuredProducts');
    if (!featuredContainer) return;

    // Set loading state
    featuredContainer.setAttribute('aria-busy', 'true');
    showLoading(featuredContainer);

    // Simulate brief loading for better UX (in real app, this would be actual data fetch)
    setTimeout(() => {
        // Show first 3 products as featured
        const featuredProducts = products.slice(0, 3);
        
        featuredContainer.innerHTML = featuredProducts.map(product => `
            <article class="product-card" role="listitem">
                <a href="./product.html?id=${product.id}" class="product-link">
                    <div class="product-image">
                        <img 
                            src="${product.image}" 
                            srcset="${product.srcset || product.image}" 
                            sizes="${product.sizes || '300px'}"
                            alt="${product.imageAlt}" 
                            loading="lazy"
                            width="300"
                            height="300">
                    </div>
                    <div class="product-info">
                        <h3 class="product-name">${product.name}</h3>
                        <p class="product-category">${product.category}</p>
                        <p class="product-price">${formatPrice(product.price)}</p>
                    </div>
                </a>
                <button 
                    class="btn btn-primary btn-add-to-cart" 
                    data-product-id="${product.id}"
                    aria-label="Add ${product.name} to cart"
                >
                    Add to Cart
                </button>
            </article>
        `).join('');

        // Add event listeners to all add-to-cart buttons
        featuredContainer.querySelectorAll('.btn-add-to-cart').forEach(button => {
            button.addEventListener('click', () => {
                const productId = parseInt(button.getAttribute('data-product-id'));
                addToCart(productId);
                buttonSuccess(button);
            });
        });

        // Remove loading state
        hideLoading(featuredContainer);
        featuredContainer.setAttribute('aria-busy', 'false');
    }, 300);
};

/**
 * Initialize Products Page
 */
const initProductsPage = () => {
    const container = document.getElementById('productsContainer');
    if (!container) return;

    let filteredProducts = [...products];
    const urlParams = getUrlParams();

    // Apply initial category filter from URL
    if (urlParams.category && urlParams.category !== 'all') {
        document.getElementById('categoryFilter').value = urlParams.category;
    }

    /**
     * Filter and display products
     */
    const displayProducts = () => {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const category = document.getElementById('categoryFilter').value;
        const sortBy = document.getElementById('sortFilter').value;

        // Set loading state
        container.setAttribute('aria-busy', 'true');
        showLoading(container.parentElement);

        // Simulate processing time for better UX feedback
        setTimeout(() => {
            // Filter products
            filteredProducts = products.filter(product => {
                const matchesSearch = product.name.toLowerCase().includes(searchTerm) || 
                                     product.description.toLowerCase().includes(searchTerm);
                const matchesCategory = category === 'all' || product.category === category;
                return matchesSearch && matchesCategory;
            });

            // Sort products
            switch (sortBy) {
                case 'price-low':
                    filteredProducts.sort((a, b) => a.price - b.price);
                    break;
                case 'price-high':
                    filteredProducts.sort((a, b) => b.price - a.price);
                    break;
                case 'name':
                    filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
                    break;
                default:
                    // Keep default order (featured)
                    break;
            }

            // Update results count
            document.getElementById('productCount').textContent = filteredProducts.length;

            // Display products or show no results
            if (filteredProducts.length === 0) {
                container.innerHTML = '';
                document.getElementById('noResults').style.display = 'block';
            } else {
                document.getElementById('noResults').style.display = 'none';
                container.innerHTML = filteredProducts.map(product => `
                    <article class="product-card" role="listitem">
                        <a href="./product.html?id=${product.id}" class="product-link">
                            <div class="product-image">
                                <img 
                                    src="${product.image}" 
                                    srcset="${product.srcset || product.image}" 
                                    sizes="${product.sizes || '300px'}"
                                    alt="${product.imageAlt}" 
                                    loading="lazy"
                                    width="300"
                                    height="300">
                            </div>
                            <div class="product-info">
                                <h3 class="product-name">${product.name}</h3>
                                <p class="product-category">${product.category}</p>
                                <p class="product-price">${formatPrice(product.price)}</p>
                            </div>
                        </a>
                        <button 
                            class="btn btn-primary btn-add-to-cart" 
                            data-product-id="${product.id}"
                            aria-label="Add ${product.name} to cart"
                        >
                            Add to Cart
                        </button>
                    </article>
                `).join('');

                // Add event listeners to all add-to-cart buttons
                container.querySelectorAll('.btn-add-to-cart').forEach(button => {
                    button.addEventListener('click', () => {
                        const productId = parseInt(button.getAttribute('data-product-id'));
                        addToCart(productId);
                        buttonSuccess(button);
                    });
                });
            }

            // Remove loading state
            hideLoading(container.parentElement);
            container.setAttribute('aria-busy', 'false');
        }, 200);
    };

    // Event listeners
    document.getElementById('searchInput').addEventListener('input', displayProducts);
    document.getElementById('categoryFilter').addEventListener('change', displayProducts);
    document.getElementById('sortFilter').addEventListener('change', displayProducts);
    
    document.getElementById('clearFilters').addEventListener('click', () => {
        document.getElementById('searchInput').value = '';
        document.getElementById('categoryFilter').value = 'all';
        document.getElementById('sortFilter').value = 'default';
        displayProducts();
    });

    document.getElementById('resetFilters').addEventListener('click', () => {
        document.getElementById('searchInput').value = '';
        document.getElementById('categoryFilter').value = 'all';
        document.getElementById('sortFilter').value = 'default';
        displayProducts();
    });

    // Initial display
    displayProducts();
};

/**
 * Initialize Product Detail Page
 */
const initProductPage = () => {
    const container = document.getElementById('productDetailContainer');
    const notFound = document.getElementById('productNotFound');
    if (!container) return;

    const urlParams = getUrlParams();
    const productId = parseInt(urlParams.id);
    const product = products.find(p => p.id === productId);

    if (!product) {
        container.style.display = 'none';
        notFound.style.display = 'block';
        return;
    }

    // Update breadcrumb
    document.getElementById('breadcrumbProduct').textContent = product.name;

    // Display product details
    container.innerHTML = `
        <div class="product-detail-grid">
            <div class="product-detail-image">
                <img 
                    src="${product.image}" 
                    srcset="${product.srcset || product.image}" 
                    sizes="${product.sizes || '500px'}"
                    alt="${product.imageAlt}" 
                    loading="lazy" 
                    width="500" 
                    height="500">
            </div>
            <div class="product-detail-info">
                <span class="product-detail-category">${product.category}</span>
                <h1 class="product-detail-title">${product.name}</h1>
                <p class="product-detail-price">${formatPrice(product.price)}</p>
                <p class="product-detail-description">${product.description}</p>
                
                <div class="product-detail-actions">
                    <div class="quantity-selector">
                        <label for="quantity" class="quantity-label">Quantity:</label>
                        <div class="quantity-controls" role="group" aria-labelledby="quantity">
                            <button 
                                id="decreaseQty" 
                                class="quantity-btn" 
                                aria-label="Decrease quantity"
                                type="button"
                            >−</button>
                            <input 
                                type="number" 
                                id="quantity" 
                                class="quantity-input" 
                                value="1" 
                                min="1" 
                                max="99"
                                aria-label="Product quantity"
                                role="spinbutton"
                                aria-valuenow="1"
                                aria-valuemin="1"
                                aria-valuemax="99"
                            >
                            <button 
                                id="increaseQty" 
                                class="quantity-btn" 
                                aria-label="Increase quantity"
                                type="button"
                            >+</button>
                        </div>
                    </div>
                    
                    <button id="addToCartBtn" class="btn btn-primary btn-large" type="button">
                        Add to Cart
                    </button>
                    
                    <a href="./products.html" class="btn btn-secondary btn-large">
                        Back to Products
                    </a>
                </div>
            </div>
        </div>
    `;

    // Quantity controls
    const qtyInput = document.getElementById('quantity');
    const updateAriaValue = () => {
        qtyInput.setAttribute('aria-valuenow', qtyInput.value);
    };
    
    document.getElementById('decreaseQty').addEventListener('click', () => {
        if (qtyInput.value > 1) {
            qtyInput.value = parseInt(qtyInput.value) - 1;
            updateAriaValue();
        }
    });
    document.getElementById('increaseQty').addEventListener('click', () => {
        if (qtyInput.value < 99) {
            qtyInput.value = parseInt(qtyInput.value) + 1;
            updateAriaValue();
        }
    });
    
    qtyInput.addEventListener('change', updateAriaValue);

    // Add to cart
    document.getElementById('addToCartBtn').addEventListener('click', () => {
        const quantity = parseInt(qtyInput.value);
        const button = document.getElementById('addToCartBtn');
        addToCart(product.id, quantity);
        buttonSuccess(button);
    });
};

/**
 * Initialize Cart Page
 */
const initCartPage = () => {
    const container = document.getElementById('cartItemsContainer');
    const emptyCart = document.getElementById('emptyCart');
    const summary = document.getElementById('cartSummary');
    if (!container) return;

    const renderCart = () => {
        const cart = getCart();

        if (cart.length === 0) {
            container.style.display = 'none';
            summary.style.display = 'none';
            emptyCart.style.display = 'flex';
            return;
        }

        container.style.display = 'block';
        summary.style.display = 'block';
        emptyCart.style.display = 'none';

        container.innerHTML = cart.map(item => `
            <article class="cart-item" role="listitem">
                <img src="${item.image}" alt="${item.imageAlt}" class="cart-item-image" loading="lazy" width="100" height="100">
                <div class="cart-item-details">
                    <h3 class="cart-item-name">${item.name}</h3>
                    <p class="cart-item-price">${formatPrice(item.price)}</p>
                </div>
                <div class="cart-item-actions">
                    <div class="quantity-controls" role="group" aria-label="Quantity controls for ${item.name}">
                        <button 
                            class="quantity-btn" 
                            data-product-id="${item.id}"
                            data-action="decrease"
                            aria-label="Decrease quantity of ${item.name}"
                            type="button"
                        >−</button>
                        <input 
                            type="number" 
                            class="quantity-input" 
                            value="${item.quantity}" 
                            min="1"
                            data-product-id="${item.id}"
                            aria-label="Quantity of ${item.name}"
                            role="spinbutton"
                            aria-valuenow="${item.quantity}"
                            aria-valuemin="1"
                            aria-valuemax="99"
                        >
                        <button 
                            class="quantity-btn" 
                            data-product-id="${item.id}"
                            data-action="increase"
                            aria-label="Increase quantity of ${item.name}"
                            type="button"
                        >+</button>
                    </div>
                    <p class="cart-item-subtotal">${formatPrice(item.price * item.quantity)}</p>
                    <button 
                        class="btn-remove" 
                        data-product-id="${item.id}"
                        aria-label="Remove ${item.name} from cart"
                        type="button"
                    >×</button>
                </div>
            </article>
        `).join('');

        // Add event listeners to quantity buttons
        container.querySelectorAll('.quantity-btn').forEach(button => {
            button.addEventListener('click', () => {
                const productId = parseInt(button.getAttribute('data-product-id'));
                const action = button.getAttribute('data-action');
                const item = cart.find(i => i.id === productId);
                
                if (action === 'decrease') {
                    window.updateCartQuantity(productId, item.quantity - 1);
                } else if (action === 'increase') {
                    window.updateCartQuantity(productId, item.quantity + 1);
                }
            });
        });

        // Add event listeners to quantity inputs
        container.querySelectorAll('.quantity-input').forEach(input => {
            input.addEventListener('change', () => {
                const productId = parseInt(input.getAttribute('data-product-id'));
                window.updateCartQuantity(productId, parseInt(input.value));
            });
        });

        // Add event listeners to remove buttons
        container.querySelectorAll('.btn-remove').forEach(button => {
            button.addEventListener('click', () => {
                const productId = parseInt(button.getAttribute('data-product-id'));
                window.removeFromCart(productId);
            });
        });

        // Update totals
        const totals = calculateCartTotals();
        document.getElementById('subtotal').textContent = formatPrice(totals.subtotal);
        document.getElementById('shipping').textContent = formatPrice(totals.shipping);
        document.getElementById('tax').textContent = formatPrice(totals.tax);
        document.getElementById('total').textContent = formatPrice(totals.total);
    };

    // Expose functions globally for inline handlers (kept for backward compatibility)
    window.updateCartQuantity = (productId, quantity) => {
        updateCartQuantity(productId, quantity);
        renderCart();
    };

    window.removeFromCart = (productId) => {
        const item = getCart().find(i => i.id === productId);
        if (!item) return;
        
        // Show confirmation dialog
        showConfirmation(
            'Remove Item?',
            `Are you sure you want to remove "${item.name}" from your cart?`,
            () => {
                removeFromCart(productId);
                renderCart();
                showNotification('Item removed from cart');
            }
        );
    };

    renderCart();
};

/**
 * Initialize Checkout Page
 */
const initCheckoutPage = () => {
    const form = document.getElementById('checkoutForm');
    const orderItemsList = document.getElementById('orderItemsList');
    const emptyCheckout = document.getElementById('emptyCheckout');
    if (!form) return;

    const cart = getCart();

    // Check if cart is empty
    if (cart.length === 0) {
        document.querySelector('.checkout-content').style.display = 'none';
        emptyCheckout.style.display = 'flex';
        return;
    }

    // Display order items
    orderItemsList.innerHTML = cart.map(item => `
        <div class="order-item" role="listitem">
            <img src="${item.image}" alt="${item.imageAlt}" class="order-item-image" loading="lazy" width="60" height="60">
            <div class="order-item-info">
                <p class="order-item-name">${item.name}</p>
                <p class="order-item-qty">Qty: ${item.quantity}</p>
            </div>
            <p class="order-item-price">${formatPrice(item.price * item.quantity)}</p>
        </div>
    `).join('');

    // Update totals
    const totals = calculateCartTotals();
    document.getElementById('summarySubtotal').textContent = formatPrice(totals.subtotal);
    document.getElementById('summaryShipping').textContent = formatPrice(totals.shipping);
    document.getElementById('summaryTax').textContent = formatPrice(totals.tax);
    document.getElementById('summaryTotal').textContent = formatPrice(totals.total);

    // Form validation
    const validateField = (field) => {
        const errorSpan = document.getElementById(`${field.id}Error`);
        let isValid = true;
        let errorMessage = '';

        if (!field.value.trim()) {
            isValid = false;
            errorMessage = 'This field is required';
        } else if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address';
        } else if (field.id === 'phone' && !/^\d{3}-?\d{3}-?\d{4}$/.test(field.value)) {
            isValid = false;
            errorMessage = 'Please enter a valid phone number (e.g., 123-456-7890)';
        } else if (field.id === 'zip' && !/^\d{5}$/.test(field.value)) {
            isValid = false;
            errorMessage = 'Please enter a valid 5-digit ZIP code';
        }

        if (!isValid) {
            field.classList.add('error');
            field.setAttribute('aria-invalid', 'true');
            errorSpan.textContent = errorMessage;
        } else {
            field.classList.remove('error');
            field.setAttribute('aria-invalid', 'false');
            errorSpan.textContent = '';
        }

        return isValid;
    };

    // Add blur validation to all inputs
    const inputs = form.querySelectorAll('input[required]');
    inputs.forEach(input => {
        input.addEventListener('blur', () => validateField(input));
        input.addEventListener('input', () => {
            if (input.classList.contains('error')) {
                validateField(input);
            }
        });
    });

    // Form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Validate all fields
        let isFormValid = true;
        inputs.forEach(input => {
            if (!validateField(input)) {
                isFormValid = false;
            }
        });

        if (!isFormValid) {
            const firstError = form.querySelector('.error');
            if (firstError) firstError.focus();
            return;
        }

        // Create order object
        const order = {
            orderId: generateOrderId(),
            date: new Date().toISOString(),
            customer: {
                fullName: document.getElementById('fullName').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                address: {
                    street: document.getElementById('address').value,
                    city: document.getElementById('city').value,
                    state: document.getElementById('state').value,
                    zip: document.getElementById('zip').value
                }
            },
            items: cart,
            totals: totals
        };

        // Save order to localStorage
        const orders = JSON.parse(localStorage.getItem('shophub_orders') || '[]');
        orders.push(order);
        localStorage.setItem('shophub_orders', JSON.stringify(orders));

        // Clear cart
        clearCart();

        // Show confirmation modal
        document.getElementById('orderNumber').textContent = order.orderId;
        document.getElementById('confirmEmail').textContent = order.customer.email;
        const modal = document.getElementById('orderConfirmationModal');
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
        
        // Focus on primary button for accessibility
        setTimeout(() => {
            document.getElementById('modalPrimaryBtn').focus();
        }, 100);
        
        // Add escape key handler
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                window.location.href = './index.html';
            }
        };
        document.addEventListener('keydown', handleEscape);
        
        // Focus trap within modal
        const focusableElements = modal.querySelectorAll('a[href], button:not([disabled])');
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];
        
        const trapFocus = (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstFocusable) {
                        e.preventDefault();
                        lastFocusable.focus();
                    }
                } else {
                    if (document.activeElement === lastFocusable) {
                        e.preventDefault();
                        firstFocusable.focus();
                    }
                }
            }
        };
        modal.addEventListener('keydown', trapFocus);
    });
};

// ===========================
// INITIALIZATION
// ===========================

/**
 * Initialize application based on current page
 */
const init = () => {
    // Update cart badge on all pages
    updateCartBadge();

    // Expose addToCart globally for inline handlers
    window.addToCart = addToCart;

    // Determine current page and initialize accordingly
    const path = window.location.pathname;
    const page = path.substring(path.lastIndexOf('/') + 1);

    switch (page) {
        case 'index.html':
        case '':
            initHomePage();
            break;
        case 'products.html':
            initProductsPage();
            break;
        case 'product.html':
            initProductPage();
            break;
        case 'cart.html':
            initCartPage();
            break;
        case 'checkout.html':
            initCheckoutPage();
            break;
    }
};

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
