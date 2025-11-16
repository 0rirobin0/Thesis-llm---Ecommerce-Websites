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
 * Sanitize HTML to prevent XSS attacks
 * Escapes all HTML entities in user-provided strings
 */
const sanitizeHTML = (str) => {
    if (typeof str !== 'string') return '';
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
};

/**
 * Validate and sanitize numeric input
 */
const sanitizeNumber = (value, min = 0, max = Number.MAX_SAFE_INTEGER) => {
    const num = parseInt(value, 10);
    if (isNaN(num)) return min;
    return Math.max(min, Math.min(max, num));
};

/**
 * Validate cart item structure
 */
const isValidCartItem = (item) => {
    return item &&
        typeof item.id === 'number' &&
        typeof item.name === 'string' &&
        typeof item.price === 'number' &&
        typeof item.quantity === 'number' &&
        item.id > 0 &&
        item.price >= 0 &&
        item.quantity > 0 &&
        item.quantity <= 999 &&
        item.name.length <= 200 &&
        typeof item.image === 'string' &&
        typeof item.imageAlt === 'string';
};

/**
 * Format price to USD currency
 */
const formatPrice = (price) => {
    return `$${price.toFixed(2)}`;
};

/**
 * Show loading state on button with spinner
 */
const setButtonLoading = (button, isLoading) => {
    if (isLoading) {
        button.disabled = true;
        button.dataset.originalText = button.textContent;
        button.innerHTML = '<span class="spinner" aria-hidden="true"></span> Processing...';
        button.setAttribute('aria-busy', 'true');
    } else {
        button.disabled = false;
        button.textContent = button.dataset.originalText || button.textContent;
        button.removeAttribute('aria-busy');
    }
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
 * Get cart from localStorage with error handling and validation
 */
const getCart = () => {
    try {
        const cart = localStorage.getItem('shophub_cart');
        if (!cart) return [];
        
        const parsed = JSON.parse(cart);
        if (!Array.isArray(parsed)) {
            console.warn('Invalid cart format, resetting');
            return [];
        }
        
        // Validate and sanitize each item
        return parsed.filter(isValidCartItem);
    } catch (e) {
        console.error('Cart parsing error:', e);
        localStorage.removeItem('shophub_cart');
        return [];
    }
};

/**
 * Save cart to localStorage
 */
const saveCart = (cart) => {
    localStorage.setItem('shophub_cart', JSON.stringify(cart));
    updateCartBadge();
};

/**
 * Add product to cart with input validation and loading feedback
 */
const addToCart = (productId, quantity = 1, buttonElement = null) => {
    // Show loading state if button provided
    if (buttonElement) {
        buttonElement.disabled = true;
        buttonElement.dataset.originalText = buttonElement.textContent;
        buttonElement.innerHTML = '<span class="spinner" aria-hidden="true"></span> Adding...';
        buttonElement.setAttribute('aria-busy', 'true');
    }
    
    // Simulate async operation for perceived responsiveness
    setTimeout(() => {
        const cart = getCart();
        const product = products.find(p => p.id === productId);
        
        if (!product) {
            showNotification('Product not found', 3000, 'error');
            if (buttonElement) {
                buttonElement.disabled = false;
                buttonElement.textContent = buttonElement.dataset.originalText;
                buttonElement.removeAttribute('aria-busy');
            }
            return;
        }

        // Sanitize quantity input
        const safeQuantity = sanitizeNumber(quantity, 1, 99);

        const existingItem = cart.find(item => item.id === productId);
        
        if (existingItem) {
            existingItem.quantity = sanitizeNumber(existingItem.quantity + safeQuantity, 1, 999);
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                imageAlt: product.imageAlt,
                quantity: safeQuantity
            });
        }
        
        saveCart(cart);
        showNotification(`${product.name} added to cart!`, 3000, 'success');
        
        // Reset button state with success animation
        if (buttonElement) {
            buttonElement.disabled = false;
            buttonElement.textContent = buttonElement.dataset.originalText;
            buttonElement.removeAttribute('aria-busy');
            buttonElement.classList.add('success');
            setTimeout(() => buttonElement.classList.remove('success'), 600);
        }
    }, 200); // Small delay for loading feedback
};

/**
 * Update cart item quantity with validation
 */
const updateCartQuantity = (productId, quantity) => {
    const cart = getCart();
    const item = cart.find(item => item.id === productId);
    
    if (item) {
        const safeQuantity = sanitizeNumber(quantity, 0, 999);
        if (safeQuantity <= 0) {
            removeFromCart(productId);
        } else {
            item.quantity = safeQuantity;
            saveCart(cart);
        }
    }
};

/**
 * Remove item from cart with undo functionality
 */
let lastRemovedItem = null;
let undoTimeout = null;

const removeFromCart = (productId, showUndo = true) => {
    let cart = getCart();
    const removedItem = cart.find(item => item.id === productId);
    cart = cart.filter(item => item.id !== productId);
    saveCart(cart);
    
    // Show undo notification
    if (showUndo && removedItem) {
        lastRemovedItem = removedItem;
        showUndoNotification(removedItem.name);
    }
};

/**
 * Show undo notification for cart removal
 */
const showUndoNotification = (productName) => {
    const undoNotification = document.getElementById('undoNotification');
    if (!undoNotification) return;
    
    const message = undoNotification.querySelector('.undo-message');
    message.textContent = `${productName} removed from cart`;
    
    undoNotification.style.display = 'flex';
    
    // Clear existing timeout
    if (undoTimeout) clearTimeout(undoTimeout);
    
    // Auto-hide after 5 seconds
    undoTimeout = setTimeout(() => {
        undoNotification.style.display = 'none';
        lastRemovedItem = null;
    }, 5000);
};

/**
 * Undo cart item removal
 */
const undoRemoval = () => {
    if (lastRemovedItem) {
        const cart = getCart();
        cart.push(lastRemovedItem);
        saveCart(cart);
        
        // Hide notification
        const undoNotification = document.getElementById('undoNotification');
        if (undoNotification) undoNotification.style.display = 'none';
        
        // Refresh cart display
        if (typeof renderCartItems === 'function') {
            renderCartItems();
        }
        
        showNotification(`${lastRemovedItem.name} restored to cart`, 2000, 'success');
        lastRemovedItem = null;
        
        if (undoTimeout) clearTimeout(undoTimeout);
    }
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
        
        if (srText) {
            // Remove all text nodes (keep only sr-only element)
            Array.from(badge.childNodes).forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    node.remove();
                }
            });
            // Add new text node with count
            badge.insertBefore(document.createTextNode(totalItems.toString()), srText);
        } else {
            // No sr-only element, just replace all content
            badge.textContent = totalItems.toString();
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
 * Show confirmation dialog with XSS protection
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
    
    // Create backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'confirmation-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');
    
    // Create content container
    const content = document.createElement('div');
    content.className = 'confirmation-content';
    
    // Create icon
    const icon = document.createElement('div');
    icon.className = 'confirmation-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = '⚠';
    
    // Create title (sanitized)
    const titleEl = document.createElement('h3');
    titleEl.id = 'confirm-title';
    titleEl.className = 'confirmation-title';
    titleEl.textContent = title;
    
    // Create message (sanitized)
    const messageEl = document.createElement('p');
    messageEl.id = 'confirm-message';
    messageEl.className = 'confirmation-message';
    messageEl.textContent = message;
    
    // Create actions container
    const actions = document.createElement('div');
    actions.className = 'confirmation-actions';
    
    // Create cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.id = 'confirmCancel';
    cancelBtn.textContent = 'Cancel';
    
    // Create confirm button
    const okBtn = document.createElement('button');
    okBtn.className = 'btn btn-danger';
    okBtn.id = 'confirmOk';
    okBtn.textContent = 'Remove';
    
    // Assemble dialog
    actions.appendChild(cancelBtn);
    actions.appendChild(okBtn);
    content.appendChild(icon);
    content.appendChild(titleEl);
    content.appendChild(messageEl);
    content.appendChild(actions);
    dialog.appendChild(backdrop);
    dialog.appendChild(content);
    
    document.body.appendChild(dialog);
    
    // Focus on primary action
    setTimeout(() => okBtn.focus(), 100);
    
    // Event handlers
    okBtn.addEventListener('click', () => {
        dialog.remove();
        if (onConfirm) onConfirm();
    });
    
    cancelBtn.addEventListener('click', () => {
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
    backdrop.addEventListener('click', () => {
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
 * Create a safe product card element (XSS-protected)
 */
const createProductCard = (product) => {
    const article = document.createElement('article');
    article.className = 'product-card';
    article.setAttribute('role', 'listitem');
    
    // Create link
    const link = document.createElement('a');
    link.href = `./product.html?id=${product.id}`;
    link.className = 'product-link';
    
    // Create image container
    const imageDiv = document.createElement('div');
    imageDiv.className = 'product-image';
    
    // Create image with optimization
    const img = document.createElement('img');
    img.src = product.image;
    if (product.srcset) img.srcset = product.srcset;
    if (product.sizes) img.sizes = product.sizes;
    img.alt = product.imageAlt;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.fetchPriority = 'low';
    img.width = 300;
    img.height = 300;
    
    // Create info container
    const infoDiv = document.createElement('div');
    infoDiv.className = 'product-info';
    
    // Create name
    const name = document.createElement('h3');
    name.className = 'product-name';
    name.textContent = product.name; // Automatically escaped
    
    // Create category
    const category = document.createElement('p');
    category.className = 'product-category';
    category.textContent = product.category;
    
    // Create price
    const price = document.createElement('p');
    price.className = 'product-price';
    price.textContent = formatPrice(product.price);
    
    // Create button
    const button = document.createElement('button');
    button.className = 'btn btn-primary btn-add-to-cart';
    button.setAttribute('data-product-id', product.id);
    button.setAttribute('aria-label', `Add ${product.name} to cart`);
    button.textContent = 'Add to Cart';
    
    // Assemble elements
    imageDiv.appendChild(img);
    infoDiv.appendChild(name);
    infoDiv.appendChild(category);
    infoDiv.appendChild(price);
    link.appendChild(imageDiv);
    link.appendChild(infoDiv);
    article.appendChild(link);
    article.appendChild(button);
    
    // Add event listener
    button.addEventListener('click', () => {
        addToCart(product.id);
        buttonSuccess(button);
    });
    
    return article;
};

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
        
        // Clear container
        featuredContainer.innerHTML = '';
        
        // Create and append product cards safely
        featuredProducts.forEach(product => {
            const card = createProductCard(product);
            featuredContainer.appendChild(card);
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
     * Update search status message
     */
    const updateSearchStatus = (count, isSearching) => {
        const searchStatus = document.getElementById('searchStatus');
        if (searchStatus) {
            if (isSearching) {
                searchStatus.textContent = 'Searching...';
                searchStatus.className = 'search-status loading';
            } else {
                searchStatus.textContent = `${count} ${count === 1 ? 'product' : 'products'} found`;
                searchStatus.className = 'search-status';
            }
        }
    };

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
        updateSearchStatus(0, true);

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

            // Update results count and status
            document.getElementById('productCount').textContent = filteredProducts.length;
            updateSearchStatus(filteredProducts.length, false);

            // Display products or show no results
            if (filteredProducts.length === 0) {
                container.innerHTML = '';
                document.getElementById('noResults').style.display = 'block';
            } else {
                document.getElementById('noResults').style.display = 'none';
                
                // Clear container
                container.innerHTML = '';
                
                // Create and append product cards safely
                filteredProducts.forEach(product => {
                    const card = createProductCard(product);
                    container.appendChild(card);
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

    // Update breadcrumb safely
    const breadcrumb = document.getElementById('breadcrumbProduct');
    if (breadcrumb) breadcrumb.textContent = product.name;

    // Clear container
    container.innerHTML = '';
    
    // Create product detail grid
    const grid = document.createElement('div');
    grid.className = 'product-detail-grid';
    
    // Create image container
    const imageDiv = document.createElement('div');
    imageDiv.className = 'product-detail-image';
    
    const img = document.createElement('img');
    img.src = product.image;
    if (product.srcset) img.srcset = product.srcset;
    if (product.sizes) img.sizes = product.sizes;
    img.alt = product.imageAlt;
    img.loading = 'lazy';
    img.width = 500;
    img.height = 500;
    imageDiv.appendChild(img);
    
    // Create info container
    const infoDiv = document.createElement('div');
    infoDiv.className = 'product-detail-info';
    
    // Category
    const categorySpan = document.createElement('span');
    categorySpan.className = 'product-detail-category';
    categorySpan.textContent = product.category;
    
    // Title
    const title = document.createElement('h1');
    title.className = 'product-detail-title';
    title.textContent = product.name;
    
    // Price
    const priceP = document.createElement('p');
    priceP.className = 'product-detail-price';
    priceP.textContent = formatPrice(product.price);
    
    // Description
    const descP = document.createElement('p');
    descP.className = 'product-detail-description';
    descP.textContent = product.description;
    
    // Actions container
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'product-detail-actions';
    
    // Quantity selector
    const qtySelector = document.createElement('div');
    qtySelector.className = 'quantity-selector';
    
    const qtyLabel = document.createElement('label');
    qtyLabel.htmlFor = 'quantity';
    qtyLabel.className = 'quantity-label';
    qtyLabel.textContent = 'Quantity:';
    
    const qtyControls = document.createElement('div');
    qtyControls.className = 'quantity-controls';
    qtyControls.setAttribute('role', 'group');
    qtyControls.setAttribute('aria-labelledby', 'quantity');
    
    const decreaseBtn = document.createElement('button');
    decreaseBtn.id = 'decreaseQty';
    decreaseBtn.className = 'quantity-btn';
    decreaseBtn.setAttribute('aria-label', 'Decrease quantity');
    decreaseBtn.type = 'button';
    decreaseBtn.textContent = '−';
    
    const qtyInput = document.createElement('input');
    qtyInput.type = 'number';
    qtyInput.id = 'quantity';
    qtyInput.className = 'quantity-input';
    qtyInput.value = '1';
    qtyInput.min = '1';
    qtyInput.max = '99';
    qtyInput.setAttribute('aria-label', 'Product quantity');
    qtyInput.setAttribute('role', 'spinbutton');
    qtyInput.setAttribute('aria-valuenow', '1');
    qtyInput.setAttribute('aria-valuemin', '1');
    qtyInput.setAttribute('aria-valuemax', '99');
    
    const increaseBtn = document.createElement('button');
    increaseBtn.id = 'increaseQty';
    increaseBtn.className = 'quantity-btn';
    increaseBtn.setAttribute('aria-label', 'Increase quantity');
    increaseBtn.type = 'button';
    increaseBtn.textContent = '+';
    
    qtyControls.appendChild(decreaseBtn);
    qtyControls.appendChild(qtyInput);
    qtyControls.appendChild(increaseBtn);
    qtySelector.appendChild(qtyLabel);
    qtySelector.appendChild(qtyControls);
    
    // Add to cart button
    const addBtn = document.createElement('button');
    addBtn.id = 'addToCartBtn';
    addBtn.className = 'btn btn-primary btn-large';
    addBtn.type = 'button';
    addBtn.textContent = 'Add to Cart';
    
    // Back button
    const backLink = document.createElement('a');
    backLink.href = './products.html';
    backLink.className = 'btn btn-secondary btn-large';
    backLink.textContent = 'Back to Products';
    
    // Assemble actions
    actionsDiv.appendChild(qtySelector);
    actionsDiv.appendChild(addBtn);
    actionsDiv.appendChild(backLink);
    
    // Assemble info
    infoDiv.appendChild(categorySpan);
    infoDiv.appendChild(title);
    infoDiv.appendChild(priceP);
    infoDiv.appendChild(descP);
    infoDiv.appendChild(actionsDiv);
    
    // Assemble grid
    grid.appendChild(imageDiv);
    grid.appendChild(infoDiv);
    
    // Add to container
    container.appendChild(grid);

    // Quantity controls
    const updateAriaValue = () => {
        qtyInput.setAttribute('aria-valuenow', qtyInput.value);
    };
    
    decreaseBtn.addEventListener('click', () => {
        const currentValue = sanitizeNumber(qtyInput.value, 1, 99);
        if (currentValue > 1) {
            qtyInput.value = currentValue - 1;
            updateAriaValue();
        }
    });
    
    increaseBtn.addEventListener('click', () => {
        const currentValue = sanitizeNumber(qtyInput.value, 1, 99);
        if (currentValue < 99) {
            qtyInput.value = currentValue + 1;
            updateAriaValue();
        }
    });
    
    qtyInput.addEventListener('change', () => {
        qtyInput.value = sanitizeNumber(qtyInput.value, 1, 99);
        updateAriaValue();
    });

    // Add to cart
    addBtn.addEventListener('click', () => {
        const quantity = sanitizeNumber(qtyInput.value, 1, 99);
        addToCart(product.id, quantity);
        buttonSuccess(addBtn);
    });

    // Add JSON-LD structured data for SEO
    addProductStructuredData(product);
};

/**
 * Add JSON-LD structured data for product SEO
 */
const addProductStructuredData = (product) => {
    // Remove any existing product structured data
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    if (existingScript) {
        existingScript.remove();
    }

    // Create JSON-LD structured data
    const structuredData = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": product.name,
        "image": product.image,
        "description": product.description,
        "sku": `SHOP-${product.id.toString().padStart(6, '0')}`,
        "brand": {
            "@type": "Brand",
            "name": "ShopHub"
        },
        "offers": {
            "@type": "Offer",
            "url": `https://www.shophub.com/product.html?id=${product.id}`,
            "priceCurrency": "USD",
            "price": product.price.toFixed(2),
            "availability": "https://schema.org/InStock",
            "seller": {
                "@type": "Organization",
                "name": "ShopHub"
            }
        },
        "category": product.category
    };

    // Add aggregate rating if available (placeholder for future enhancement)
    if (product.rating) {
        structuredData.aggregateRating = {
            "@type": "AggregateRating",
            "ratingValue": product.rating,
            "reviewCount": product.reviewCount || 0
        };
    }

    // Create script element and inject into head
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);

    // Update page title and meta description dynamically
    document.title = `${product.name} - ShopHub`;
    
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
        metaDescription.setAttribute('content', `${product.description} Price: $${product.price.toFixed(2)}. Shop now at ShopHub with fast shipping.`);
    }

    // Update Open Graph tags dynamically
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', `${product.name} - ShopHub`);

    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) ogDescription.setAttribute('content', product.description);

    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) ogImage.setAttribute('content', product.image);

    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', `https://www.shophub.com/product.html?id=${product.id}`);

    // Update Twitter Card tags dynamically
    const twitterTitle = document.querySelector('meta[property="twitter:title"]');
    if (twitterTitle) twitterTitle.setAttribute('content', `${product.name} - ShopHub`);

    const twitterDescription = document.querySelector('meta[property="twitter:description"]');
    if (twitterDescription) twitterDescription.setAttribute('content', product.description);

    const twitterImage = document.querySelector('meta[property="twitter:image"]');
    if (twitterImage) twitterImage.setAttribute('content', product.image);
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

        // Setup undo button listener
        const undoBtn = document.getElementById('undoBtn');
        if (undoBtn) {
            undoBtn.addEventListener('click', undoRemoval);
        }

        // Clear container
        container.innerHTML = '';

        // Create cart items safely
        cart.forEach(item => {
            const article = document.createElement('article');
            article.className = 'cart-item';
            article.setAttribute('role', 'listitem');
            
            // Image
            const img = document.createElement('img');
            img.src = item.image;
            img.alt = item.imageAlt;
            img.className = 'cart-item-image';
            img.loading = 'lazy';
            img.width = 100;
            img.height = 100;
            
            // Details container
            const detailsDiv = document.createElement('div');
            detailsDiv.className = 'cart-item-details';
            
            const name = document.createElement('h3');
            name.className = 'cart-item-name';
            name.textContent = item.name;
            
            const price = document.createElement('p');
            price.className = 'cart-item-price';
            price.textContent = formatPrice(item.price);
            
            detailsDiv.appendChild(name);
            detailsDiv.appendChild(price);
            
            // Actions container
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'cart-item-actions';
            
            // Quantity controls
            const qtyControls = document.createElement('div');
            qtyControls.className = 'quantity-controls';
            qtyControls.setAttribute('role', 'group');
            qtyControls.setAttribute('aria-label', `Quantity controls for ${item.name}`);
            
            const decreaseBtn = document.createElement('button');
            decreaseBtn.className = 'quantity-btn';
            decreaseBtn.setAttribute('data-product-id', item.id);
            decreaseBtn.setAttribute('data-action', 'decrease');
            decreaseBtn.setAttribute('aria-label', `Decrease quantity of ${item.name}`);
            decreaseBtn.type = 'button';
            decreaseBtn.textContent = '−';
            
            const qtyInput = document.createElement('input');
            qtyInput.type = 'number';
            qtyInput.className = 'quantity-input';
            qtyInput.value = item.quantity;
            qtyInput.min = '1';
            qtyInput.setAttribute('data-product-id', item.id);
            qtyInput.setAttribute('aria-label', `Quantity of ${item.name}`);
            qtyInput.setAttribute('role', 'spinbutton');
            qtyInput.setAttribute('aria-valuenow', item.quantity);
            qtyInput.setAttribute('aria-valuemin', '1');
            qtyInput.setAttribute('aria-valuemax', '99');
            
            const increaseBtn = document.createElement('button');
            increaseBtn.className = 'quantity-btn';
            increaseBtn.setAttribute('data-product-id', item.id);
            increaseBtn.setAttribute('data-action', 'increase');
            increaseBtn.setAttribute('aria-label', `Increase quantity of ${item.name}`);
            increaseBtn.type = 'button';
            increaseBtn.textContent = '+';
            
            qtyControls.appendChild(decreaseBtn);
            qtyControls.appendChild(qtyInput);
            qtyControls.appendChild(increaseBtn);
            
            // Subtotal
            const subtotal = document.createElement('p');
            subtotal.className = 'cart-item-subtotal';
            subtotal.textContent = formatPrice(item.price * item.quantity);
            
            // Remove button
            const removeBtn = document.createElement('button');
            removeBtn.className = 'btn-remove';
            removeBtn.setAttribute('data-product-id', item.id);
            removeBtn.setAttribute('aria-label', `Remove ${item.name} from cart`);
            removeBtn.type = 'button';
            removeBtn.textContent = '×';
            
            actionsDiv.appendChild(qtyControls);
            actionsDiv.appendChild(subtotal);
            actionsDiv.appendChild(removeBtn);
            
            // Assemble article
            article.appendChild(img);
            article.appendChild(detailsDiv);
            article.appendChild(actionsDiv);
            
            container.appendChild(article);
        });

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

    // Real-time email validation
    const emailInput = document.getElementById('email');
    const emailSuccess = document.getElementById('emailSuccess');
    if (emailInput && emailSuccess) {
        emailInput.addEventListener('input', () => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (emailRegex.test(emailInput.value)) {
                emailSuccess.style.display = 'inline';
                emailInput.classList.remove('error');
                emailInput.classList.add('success');
            } else {
                emailSuccess.style.display = 'none';
                emailInput.classList.remove('success');
            }
        });
    }

    // Check if cart is empty
    if (cart.length === 0) {
        document.querySelector('.checkout-content').style.display = 'none';
        emptyCheckout.style.display = 'flex';
        return;
    }

    // Display order items safely
    orderItemsList.innerHTML = '';
    cart.forEach(item => {
        const orderItem = document.createElement('div');
        orderItem.className = 'order-item';
        orderItem.setAttribute('role', 'listitem');
        
        const img = document.createElement('img');
        img.src = item.image;
        img.alt = item.imageAlt;
        img.className = 'order-item-image';
        img.loading = 'lazy';
        img.width = 60;
        img.height = 60;
        
        const infoDiv = document.createElement('div');
        infoDiv.className = 'order-item-info';
        
        const name = document.createElement('p');
        name.className = 'order-item-name';
        name.textContent = item.name;
        
        const qty = document.createElement('p');
        qty.className = 'order-item-qty';
        qty.textContent = `Qty: ${item.quantity}`;
        
        infoDiv.appendChild(name);
        infoDiv.appendChild(qty);
        
        const price = document.createElement('p');
        price.className = 'order-item-price';
        price.textContent = formatPrice(item.price * item.quantity);
        
        orderItem.appendChild(img);
        orderItem.appendChild(infoDiv);
        orderItem.appendChild(price);
        
        orderItemsList.appendChild(orderItem);
    });

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

        // Save order to localStorage with error handling
        try {
            const orders = JSON.parse(localStorage.getItem('shophub_orders') || '[]');
            if (Array.isArray(orders)) {
                orders.push(order);
                localStorage.setItem('shophub_orders', JSON.stringify(orders));
            }
        } catch (e) {
            console.error('Failed to save order:', e);
        }

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
