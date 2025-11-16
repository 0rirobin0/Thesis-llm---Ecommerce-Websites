// /scripts/app.js

document.addEventListener('DOMContentLoaded', () => {
    const cart = getCart();
    updateCartCount();
    initModal();

    // Router logic
    const path = window.location.pathname;
    if (path.endsWith('/') || path.endsWith('/index.html')) {
        initHomePage();
    } else if (path.endsWith('/products.html')) {
        initProductsPage();
    } else if (path.endsWith('/product.html')) {
        initProductDetailPage();
    } else if (path.endsWith('/cart.html')) {
        initCartPage();
    } else if (path.endsWith('/checkout.html')) {
        initCheckoutPage();
    }
});

/**
 * ----- TOAST NOTIFICATION -----
 */
function showToast(message) {
    const toast = document.getElementById('toast-notification');
    if (toast) {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

/**
 * ----- MODAL MANAGEMENT -----
 */
function initModal() {
    const modal = document.getElementById('quick-view-modal');
    const closeButton = document.querySelector('.close-button');

    if (modal && closeButton) {
        closeButton.onclick = () => modal.style.display = "none";
        window.onclick = (event) => {
            if (event.target == modal) {
                modal.style.display = "none";
            }
        };
    }
}

function openQuickView(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const modal = document.getElementById('quick-view-modal');
    const content = document.getElementById('quick-view-content');

    if (modal && content) {
        content.innerHTML = `
            <article class="product-detail">
                <div class="product-detail-image">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="product-detail-info">
                    <h1>${product.name}</h1>
                    <p class="price">$${product.price.toFixed(2)}</p>
                    <p>${product.description}</p>
                    <button class="btn" id="modal-add-to-cart-${product.id}" onclick="addToCart(${product.id}, 'modal-add-to-cart-${product.id}')">Add to Cart</button>
                </div>
            </article>
        `;
        modal.style.display = 'block';
    }
}


/**
 * ----- CART MANAGEMENT -----
 */

// Retrieves the cart from localStorage
function getCart() {
    return JSON.parse(localStorage.getItem('cart')) || [];
}

// Saves the cart to localStorage
function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

// Adds a product to the cart
function addToCart(productId, buttonId) {
    const cart = getCart();
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({ id: productId, quantity: 1, price: product.price, name: product.name, image: product.image });
    }
    saveCart(cart);
    showToast(`${product.name} has been added to your cart.`);

    // Update button state
    const button = document.getElementById(buttonId);
    if (button) {
        button.textContent = 'Added!';
        button.disabled = true;
        setTimeout(() => {
            button.textContent = 'Add to Cart';
            button.disabled = false;
        }, 2000);
    }
}

// Updates the quantity of a cart item
function updateCartItem(productId, quantity) {
    let cart = getCart();
    if (quantity <= 0) {
        removeCartItem(productId);
        return;
    }
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity = quantity;
        saveCart(cart);
        initCartPage(); // Re-render the cart page
    }
}

// Removes an item from the cart
function removeCartItem(productId) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== productId);
    saveCart(cart);
    initCartPage(); // Re-render the cart page
}

// Updates the cart count in the header
function updateCartCount() {
    const cart = getCart();
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        cartCountElement.textContent = cartCount;
    }
}

/**
 * ----- PAGE INITIALIZATION -----
 */

// Initializes the Home Page
function initHomePage() {
    const featuredProductsContainer = document.getElementById('featured-products');
    if (featuredProductsContainer) {
        // Show first 4 products as featured
        const featured = products.slice(0, 4);
        renderProductGrid(featured, featuredProductsContainer);
    }
}

// Initializes the Products Page
function initProductsPage() {
    const productListContainer = document.getElementById('product-list');
    const categoryFilter = document.getElementById('category-filter');
    const sortFilter = document.getElementById('sort-filter');
    const searchInput = document.getElementById('search');

    if (!productListContainer) return;

    let filteredProducts = [...products];

    // Populate categories
    const categories = ['All Categories', ...new Set(products.map(p => p.category))];
    categoryFilter.innerHTML = categories.map(c => `<option value="${c.toLowerCase()}">${c}</option>`).join('');

    // Render function
    const render = () => {
        let productsToRender = [...filteredProducts];

        // Sort
        const sortValue = sortFilter.value;
        if (sortValue === 'price-asc') {
            productsToRender.sort((a, b) => a.price - b.price);
        } else if (sortValue === 'price-desc') {
            productsToRender.sort((a, b) => b.price - a.price);
        }

        renderProductGrid(productsToRender, productListContainer);
    };

    // Filter function
    const filterAndSearch = () => {
        const category = categoryFilter.value;
        const searchTerm = searchInput.value.toLowerCase();

        filteredProducts = products.filter(p => {
            const matchesCategory = category === 'all categories' || p.category.toLowerCase() === category;
            const matchesSearch = p.name.toLowerCase().includes(searchTerm) || p.description.toLowerCase().includes(searchTerm);
            return matchesCategory && matchesSearch;
        });
        render();
    };

    categoryFilter.addEventListener('change', filterAndSearch);
    sortFilter.addEventListener('change', render);
    searchInput.addEventListener('input', filterAndSearch);

    // Initial render
    filterAndSearch();
}

// Initializes the Product Detail Page
function initProductDetailPage() {
    const container = document.getElementById('product-detail-container');
    if (!container) return;

    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id'));
    const product = products.find(p => p.id === productId);

    if (product) {
        // Update meta tags
        document.title = `${product.name} - E-Commerce`;
        document.querySelector('meta[name="description"]').setAttribute("content", product.description);
        
        // Open Graph
        document.querySelector('meta[property="og:title"]').setAttribute("content", product.name);
        document.querySelector('meta[property="og:description"]').setAttribute("content", product.description);
        document.querySelector('meta[property="og:image"]').setAttribute("content", product.image);
        document.querySelector('meta[property="og:url"]').setAttribute("content", window.location.href);
        document.querySelector('meta[property="og:type"]').setAttribute("content", "product");

        // Twitter Card
        document.querySelector('meta[property="twitter:title"]').setAttribute("content", product.name);
        document.querySelector('meta[property="twitter:description"]').setAttribute("content", product.description);
        document.querySelector('meta[property="twitter:image"]').setAttribute("content", product.image);
        document.querySelector('meta[property="twitter:url"]').setAttribute("content", window.location.href);

        // JSON-LD
        const jsonLdScript = document.getElementById('product-json-ld');
        const productJsonLd = {
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": product.name,
            "image": product.image,
            "description": product.description,
            "sku": `PROD-${product.id}`,
            "offers": {
                "@type": "Offer",
                "url": window.location.href,
                "priceCurrency": "USD",
                "price": product.price,
                "availability": "https://schema.org/InStock",
                "itemCondition": "https://schema.org/NewCondition"
            }
        };
        jsonLdScript.textContent = JSON.stringify(productJsonLd);

        const buttonId = `add-to-cart-${product.id}`;
        container.innerHTML = `
            <article class="product-detail">
                <div class="product-detail-image">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="product-detail-info">
                    <h1>${product.name}</h1>
                    <p class="price">$${product.price.toFixed(2)}</p>
                    <p>${product.description}</p>
                    <button class="btn" id="${buttonId}" onclick="addToCart(${product.id}, '${buttonId}')">Add to Cart</button>
                </div>
            </article>
        `;
    } else {
        container.innerHTML = '<p>Product not found.</p>';
    }
}

// Initializes the Cart Page
function initCartPage() {
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartSummary = document.getElementById('cart-summary');
    const emptyCartMessage = document.getElementById('empty-cart-message');
    const cartTotalElement = document.getElementById('cart-total');
    const cart = getCart();

    if (!cartItemsContainer) return;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '';
        cartSummary.style.display = 'none';
        emptyCartMessage.style.display = 'block';
    } else {
        cartItemsContainer.innerHTML = cart.map(item => `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-item-info">
                    <h3><a href="product.html?id=${item.id}">${item.name}</a></h3>
                    <p>$${item.price.toFixed(2)}</p>
                </div>
                <input type="number" value="${item.quantity}" min="0" onchange="updateCartItem(${item.id}, this.valueAsNumber)" aria-label="Quantity for ${item.name}">
                <p>$${(item.price * item.quantity).toFixed(2)}</p>
                <button class="btn btn-danger" onclick="removeCartItem(${item.id})">Remove</button>
            </div>
        `).join('');
        
        const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        cartTotalElement.textContent = `$${total.toFixed(2)}`;
        cartSummary.style.display = 'block';
        emptyCartMessage.style.display = 'none';
    }
}

// Initializes the Checkout Page
function initCheckoutPage() {
    const orderItemsList = document.getElementById('order-items-list');
    const orderTotalElement = document.getElementById('order-total');
    const checkoutForm = document.getElementById('checkout-form');
    const checkoutView = document.getElementById('checkout-view');
    const orderConfirmationView = document.getElementById('order-confirmation');
    const cart = getCart();

    if (!checkoutView) return;

    if (cart.length === 0) {
        checkoutView.innerHTML = '<h1>Checkout</h1><p>Your cart is empty. <a href="products.html">Go shopping!</a></p>';
        return;
    }

    // Populate order summary
    orderItemsList.innerHTML = cart.map(item => `
        <li>
            <span>${item.name} (x${item.quantity})</span>
            <span>$${(item.price * item.quantity).toFixed(2)}</span>
        </li>
    `).join('');

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    orderTotalElement.textContent = `Total: $${total.toFixed(2)}`;

    // Handle form submission
    checkoutForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!validateCheckoutForm()) {
            return;
        }

        const formData = new FormData(checkoutForm);
        const orderDetails = {
            customer: {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                address: formData.get('address'),
            },
            items: cart,
            total: total,
            orderDate: new Date().toISOString()
        };

        // Save order to localStorage
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        orders.push(orderDetails);
        localStorage.setItem('orders', JSON.stringify(orders));

        // Clear cart
        saveCart([]);

        // Show confirmation
        checkoutView.style.display = 'none';
        orderConfirmationView.style.display = 'block';
        orderConfirmationView.innerHTML = `
            <h2>Thank you for your order!</h2>
            <p>Your order has been placed successfully.</p>
            <p>Order Number: ${Date.now()}</p>
            <a href="index.html" class="btn">Back to Home</a>
        `;
    });
}

function validateCheckoutForm() {
    let isValid = true;
    const fields = ['name', 'email', 'phone', 'address'];
    
    fields.forEach(field => {
        const input = document.getElementById(field);
        const errorDiv = document.getElementById(`${field}-error`);
        errorDiv.textContent = '';
        if (input.value.trim() === '') {
            errorDiv.textContent = `Please enter your ${field}.`;
            isValid = false;
        }
    });

    return isValid;
}


/**
 * ----- HELPER FUNCTIONS -----
 */

// Renders a grid of products
function renderProductGrid(products, container) {
    if (!container) return;
    if (products.length === 0) {
        container.innerHTML = '<p>No products found.</p>';
        return;
    }
    container.innerHTML = products.map(product => {
        const buttonId = `add-to-cart-${product.id}`;
        return `
        <div class="product-card">
            <a href="product.html?id=${product.id}" aria-label="View details for ${product.name}">
                <img src="${product.image}" alt="${product.name}">
            </a>
            <div class="product-card-content">
                <h3><a href="product.html?id=${product.id}">${product.name}</a></h3>
                <p class="price">$${product.price.toFixed(2)}</p>
                <div class="btn-group">
                    <button class="btn btn-secondary" onclick="openQuickView(${product.id})">Quick View</button>
                    <button class="btn" id="${buttonId}" onclick="addToCart(${product.id}, '${buttonId}')">Add to Cart</button>
                </div>
            </div>
        </div>
    `}).join('');
}
