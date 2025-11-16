document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENT SELECTORS ---
    const productList = document.getElementById('product-list');
    const featuredProductList = document.getElementById('featured-product-list');
    const searchInput = document.getElementById('search');
    const categoryFilter = document.getElementById('category');
    const sortFilter = document.getElementById('sort');
    const productDetail = document.getElementById('product-detail');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalContainer = document.getElementById('cart-total');
    const checkoutForm = document.getElementById('checkout-form');
    const orderSummaryContainer = document.getElementById('order-summary');
    const cartCountSpans = document.querySelectorAll('.cart-count');
    const toastContainer = document.getElementById('toast-container');
    const checkoutBtn = document.querySelector('a.btn[href="checkout.html"]');

    // --- STATE MANAGEMENT ---
    let cart = [];
    let lastRemovedItem = null;

    // --- INITIALIZATION ---
    function initialize() {
        loadCart();
        updateCartCount();
        setupEventListeners();
        renderPageSpecificContent();
    }

    function setupEventListeners() {
        if (searchInput) searchInput.addEventListener('input', filterAndSortProducts);
        if (categoryFilter) categoryFilter.addEventListener('change', filterAndSortProducts);
        if (sortFilter) sortFilter.addEventListener('change', filterAndSortProducts);
        if (checkoutForm) checkoutForm.addEventListener('submit', handleCheckout);
    }

    function renderPageSpecificContent() {
        if (productList) displayProducts(products);
        if (featuredProductList) displayFeaturedProducts();
        if (productDetail) displayProductDetailPage();
        if (cartItemsContainer) displayCartPage();
        if (orderSummaryContainer) displayOrderSummary();
    }

    // --- PAGE-SPECIFIC RENDER FUNCTIONS ---

    function displayFeaturedProducts() {
        const featured = products.slice(0, 4); // Display first 4 products as featured
        displayProducts(featured, featuredProductList);
    }

    function displayProducts(productsToDisplay, container = productList) {
        container.innerHTML = '';
        if (productsToDisplay.length === 0) {
            container.innerHTML = '<p>No products found.</p>';
            return;
        }
        productsToDisplay.forEach(product => {
            const productCard = document.createElement('div');
            productCard.classList.add('product-card');
            
            const productLink = document.createElement('a');
            productLink.href = `product.html?id=${product.id}`;

            const image = document.createElement('img');
            const imageSrc = `${product.image}?auto=compress&cs=tinysrgb`;
            image.src = `${imageSrc}&w=400`;
            image.srcset = `${imageSrc}&w=400 400w, ${imageSrc}&w=800 800w`;
            image.sizes = "(max-width: 600px) 400px, 800px";
            image.alt = product.name;
            image.loading = 'lazy';

            const name = document.createElement('h3');
            name.textContent = product.name;

            const price = document.createElement('p');
            price.textContent = `$${product.price.toFixed(2)}`;
            
            const shortDesc = document.createElement('p');
            shortDesc.textContent = product.shortDescription;

            productLink.append(image, name, price, shortDesc);

            const addButton = document.createElement('button');
            addButton.textContent = 'Add to Cart';
            addButton.onclick = (e) => {
                e.stopPropagation();
                addToCart(product.id, addButton);
            };

            productCard.append(productLink, addButton);
            container.appendChild(productCard);
        });
    }

    function displayProductDetailPage() {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = parseInt(urlParams.get('id'));
        const product = products.find(p => p.id === productId);
        displayProductDetail(product);
    }

    function displayCartPage() {
        displayCartItems();
        updateCartTotal();
        toggleCheckoutButton();
    }

    // --- COMPONENT RENDER FUNCTIONS ---

    function filterAndSortProducts() {
        let filteredProducts = [...products];
        const searchTerm = searchInput.value.toLowerCase();
        const category = categoryFilter.value;
        const sortBy = sortFilter.value;

        if (searchTerm) {
            filteredProducts = filteredProducts.filter(p => 
                p.name.toLowerCase().includes(searchTerm) || 
                p.shortDescription.toLowerCase().includes(searchTerm)
            );
        }

        if (category !== 'all') {
            filteredProducts = filteredProducts.filter(p => p.category === category);
        }

        if (sortBy === 'price-asc') {
            filteredProducts.sort((a, b) => a.price - b.price);
        } else if (sortBy === 'price-desc') {
            filteredProducts.sort((a, b) => b.price - a.price);
        }

        displayProducts(filteredProducts);
    }

    function displayProductDetail(product) {
        if (product) {
            updateMetaForProduct(product);

            const imageSrc = `${product.image}?auto=compress&cs=tinysrgb`;
            productDetail.innerHTML = `
                <a href="products.html" class="back-link">&larr; Back to Products</a>
                <img src="${imageSrc}&w=800" 
                     srcset="${imageSrc}&w=400 400w, ${imageSrc}&w=800 800w, ${imageSrc}&w=1200 1200w"
                     sizes="(max-width: 768px) 100vw, 50vw"
                     alt="${product.name}">
                <div>
                    <h1>${product.name}</h1>
                    <p class="price">$${product.price.toFixed(2)}</p>
                    <p>${product.longDescription}</p>
                    <button id="add-to-cart-btn">Add to Cart</button>
                </div>
            `;
            
            const addButton = productDetail.querySelector('#add-to-cart-btn');
            addButton.onclick = () => addToCart(product.id, addButton);

        } else {
            productDetail.innerHTML = '<h1>Product not found.</h1><a href="products.html" class="back-link">&larr; Back to Products</a>';
        }
    }

    function displayCartItems() {
        cartItemsContainer.innerHTML = '';
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p>Your cart is empty.</p>';
            return;
        }
        
        cart.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.classList.add('cart-item');
            const uniqueId = `quantity-${item.id}`;
            
            cartItem.innerHTML = `
                <span>${item.name}</span>
                <div>
                    <label for="${uniqueId}" class="sr-only">Quantity for ${item.name}</label>
                    <input type="number" id="${uniqueId}" class="form-control" value="${item.quantity}" min="1" data-product-id="${item.id}">
                </div>
                <span>$${(item.price * item.quantity).toFixed(2)}</span>
                <button class="btn-danger" data-product-id="${item.id}" aria-label="Remove ${item.name} from cart">Remove</button>
            `;
            cartItemsContainer.appendChild(cartItem);
        });

        // Add event listeners after creating the items
        cartItemsContainer.querySelectorAll('input[type="number"]').forEach(input => {
            input.addEventListener('change', (e) => updateQuantity(e.target.dataset.productId, e.target.value));
        });
        cartItemsContainer.querySelectorAll('.btn-danger').forEach(button => {
            button.addEventListener('click', (e) => removeFromCart(e.target.dataset.productId));
        });
    }

    function updateCartTotal() {
        if (cart.length > 0) {
            cartTotalContainer.innerHTML = `<h3>Total: $${getCartTotal().toFixed(2)}</h3>`;
        } else {
            cartTotalContainer.innerHTML = '';
        }
    }

    function displayOrderSummary() {
        if (cart.length === 0) {
            orderSummaryContainer.innerHTML = '<h3>Your cart is empty. Cannot proceed to checkout.</h3>';
            checkoutForm.style.display = 'none';
            return;
        }
        orderSummaryContainer.innerHTML = '<h3>Order Summary</h3>';
        cart.forEach(item => {
            const summaryItem = document.createElement('p');
            summaryItem.textContent = `${item.name} x ${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`;
            orderSummaryContainer.appendChild(summaryItem);
        });
        const total = document.createElement('h4');
        total.textContent = `Total: $${getCartTotal().toFixed(2)}`;
        orderSummaryContainer.appendChild(total);
    }

    // --- CART LOGIC ---

    window.addToCart = (productId, buttonElement) => {
        const product = products.find(p => p.id === parseInt(productId));
        if (!product) return;

        const cartItem = cart.find(item => item.id === product.id);
        if (cartItem) {
            cartItem.quantity++;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        
        saveCart();
        showToast(`${product.name} added to cart!`);
        
        // HCI: Immediate feedback on the button
        if (buttonElement) {
            const originalText = buttonElement.textContent;
            buttonElement.innerHTML = '&#10003; Added!';
            buttonElement.disabled = true;
            setTimeout(() => {
                buttonElement.textContent = originalText;
                buttonElement.disabled = false;
            }, 1500);
        }
    };

    window.updateQuantity = (productId, quantity) => {
        const id = parseInt(productId);
        const quant = parseInt(quantity);
        const cartItem = cart.find(item => item.id === id);
        
        if (cartItem) {
            if (quant <= 0) {
                removeFromCart(id, true);
            } else {
                cartItem.quantity = quant;
                saveCart();
                displayCartPage();
            }
        }
    };

    window.removeFromCart = (productId, fromUpdate = false) => {
        const id = parseInt(productId);
        const itemIndex = cart.findIndex(item => item.id === id);
        
        if (itemIndex > -1) {
            lastRemovedItem = { ...cart[itemIndex], index: itemIndex };
            const removedItemName = cart[itemIndex].name;
            cart.splice(itemIndex, 1);
            
            saveCart();
            
            if (cartItemsContainer) {
                displayCartPage();
            }
            
            if (!fromUpdate) {
                showToast(`${removedItemName} removed from cart.`, true);
            }
        }
    };

    window.undoRemove = () => {
        if (lastRemovedItem) {
            cart.splice(lastRemovedItem.index, 0, lastRemovedItem);
            saveCart();
            
            if (cartItemsContainer) {
                displayCartPage();
            }
            
            showToast(`${lastRemovedItem.name} restored to cart.`);
            lastRemovedItem = null;

            const toasts = toastContainer.querySelectorAll('.toast');
            toasts.forEach(toast => {
                if (toast.querySelector('.undo-button')) {
                    toast.remove();
                }
            });
        }
    };

    // --- UTILITY & HELPER FUNCTIONS ---

    function getCartTotal() {
        return cart.reduce((total, item) => total + item.price * item.quantity, 0);
    }

    function updateCartCount() {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCountSpans.forEach(span => {
            span.textContent = totalItems;
        });
    }

    function toggleCheckoutButton() {
        if (checkoutBtn) {
            const isEmpty = cart.length === 0;
            checkoutBtn.classList.toggle('disabled', isEmpty);
            checkoutBtn.setAttribute('aria-disabled', isEmpty);
            if (isEmpty) {
                checkoutBtn.onclick = (e) => e.preventDefault();
            } else {
                checkoutBtn.onclick = null;
            }
        }
    }

    function saveCart() {
        try {
            localStorage.setItem('ecommerce_cart', JSON.stringify(cart));
            updateCartCount();
        } catch (e) {
            console.error("Failed to save cart to localStorage:", e);
        }
    }

    function loadCart() {
        try {
            const storedCart = localStorage.getItem('ecommerce_cart');
            cart = storedCart ? JSON.parse(storedCart) : [];
        } catch (e) {
            console.error("Failed to load cart from localStorage:", e);
            cart = [];
        }
    }

    function showToast(message, showUndo = false) {
        const toast = document.createElement('div');
        toast.classList.add('toast');
        
        const messageSpan = document.createElement('span');
        messageSpan.textContent = message;
        toast.appendChild(messageSpan);

        if (showUndo) {
            const undoButton = document.createElement('button');
            undoButton.className = 'undo-button';
            undoButton.textContent = 'Undo';
            undoButton.onclick = undoRemove;
            toast.appendChild(undoButton);
        }

        toastContainer.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove());
        }, 3000);
    }

    function handleCheckout(e) {
        e.preventDefault();
        if (checkoutForm.checkValidity()) {
            const formData = new FormData(checkoutForm);
            const order = {
                customer: Object.fromEntries(formData.entries()),
                items: cart,
                total: getCartTotal()
            };
            
            try {
                localStorage.setItem('ecommerce_order', JSON.stringify(order));
                cart = [];
                saveCart();
                showToast('Order placed successfully!');
                setTimeout(() => window.location.href = 'index.html', 2000);
            } catch (e) {
                console.error("Failed to save order:", e);
                showToast('Error placing order. Please try again.');
            }

        } else {
            const firstInvalid = checkoutForm.querySelector(':invalid');
            if (firstInvalid) firstInvalid.focus();
        }
    }

    function updateMetaForProduct(product) {
        document.title = `${product.name} - ShopSphere`;
        document.querySelector('meta[name="description"]').setAttribute("content", product.longDescription);
        
        const productUrl = `${window.location.origin}/product.html?id=${product.id}`;
        
        document.querySelector('meta[property="og:title"]').setAttribute("content", product.name);
        document.querySelector('meta[property="og:description"]').setAttribute("content", product.longDescription);
        document.querySelector('meta[property="og:url"]').setAttribute("content", productUrl);
        document.querySelector('meta[property="og:image"]').setAttribute("content", product.image);
        // ... and so on for other meta tags
        
        const jsonLdScript = document.getElementById('product-json-ld');
        if (jsonLdScript) {
            const productJsonLd = {
                "@context": "https://schema.org/",
                "@type": "Product",
                "name": product.name,
                "image": [product.image],
                "description": product.longDescription,
                "sku": product.sku,
                "offers": {
                    "@type": "Offer",
                    "url": productUrl,
                    "priceCurrency": "USD",
                    "price": product.price.toFixed(2),
                    "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                    "itemCondition": "https://schema.org/NewCondition"
                }
            };
            jsonLdScript.textContent = JSON.stringify(productJsonLd);
        }
    }

    // --- START THE APP ---
    initialize();
});