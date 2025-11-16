document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENT SELECTORS ---
    const productList = document.getElementById('product-list');
    const featuredProductList = document.getElementById('featured-products');
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

    function handleCheckout(e) {
        e.preventDefault();
        let isValid = true;

        // Clear previous errors
        document.querySelectorAll('.error-message').forEach(el => el.remove());
        document.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));

        const name = document.getElementById('name');
        const email = document.getElementById('email');
        const phone = document.getElementById('phone');
        const address = document.getElementById('address');

        if (!name.value.trim()) {
            isValid = false;
            showValidationError(name, 'Full Name is required.');
        }

        if (!email.value.trim() || !/^\S+@\S+\.\S+$/.test(email.value)) {
            isValid = false;
            showValidationError(email, 'Please enter a valid email address.');
        }
        
        if (!phone.value.trim() || !/^\+?[0-9\s-()]{7,}$/.test(phone.value)) {
            isValid = false;
            showValidationError(phone, 'Please enter a valid phone number.');
        }

        if (!address.value.trim()) {
            isValid = false;
            showValidationError(address, 'Address is required.');
        }

        if (isValid) {
            // Simulate order placement
            showToast('Order placed successfully!', 'success');
            cart = [];
            saveCart();
            updateCartCount();
            
            // Redirect to a confirmation page or home after a delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } else {
            showToast('Please correct the errors in the form.', 'error');
        }
    }

    function showValidationError(inputElement, message) {
        inputElement.classList.add('invalid');
        const error = document.createElement('p');
        error.className = 'error-message';
        error.textContent = message;
        inputElement.parentElement.appendChild(error);
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
                addToCart(product.id);
                showToast(`${product.name} added to cart!`);
            };

            productCard.append(productLink, addButton);
            container.appendChild(productCard);
        });
    }

    function displayProductDetailPage() {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = parseInt(urlParams.get('id'));
        const product = products.find(p => p.id === productId);
        
        if (product) {
            displayProductDetail(product);

            // Update breadcrumb
            const breadcrumbContainer = document.getElementById('breadcrumb');
            if (breadcrumbContainer) {
                const productBreadcrumb = document.createElement('li');
                productBreadcrumb.classList.add('breadcrumb-item', 'active');
                productBreadcrumb.setAttribute('aria-current', 'page');
                productBreadcrumb.textContent = product.name;

                // Clear existing breadcrumbs except for Home and Products
                while (breadcrumbContainer.children.length > 2) {
                    breadcrumbContainer.removeChild(breadcrumbContainer.lastChild);
                }
                breadcrumbContainer.appendChild(productBreadcrumb);
            }
        } else {
            // Handle product not found
            const productDetailContainer = document.getElementById('product-detail');
            if (productDetailContainer) {
                productDetailContainer.innerHTML = '<p>Product not found.</p>';
            }
        }
    }

    function displayCartPage() {
        if (!cartItemsContainer) return;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p>Your cart is empty.</p>';
            const shopButton = document.createElement('a');
            shopButton.href = 'products.html';
            shopButton.className = 'btn';
            shopButton.textContent = 'Shop All Products';
            cartItemsContainer.appendChild(shopButton);
            if (cartTotalContainer) cartTotalContainer.innerHTML = '';
            if (checkoutBtn) checkoutBtn.classList.add('disabled');
            return;
        }

        if (checkoutBtn) checkoutBtn.classList.remove('disabled');
        cartItemsContainer.innerHTML = '';
        let total = 0;

        cart.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.classList.add('cart-item');
            cartItem.innerHTML = `
                <div class="cart-item-info">
                    <img src="${item.image}?auto=compress&cs=tinysrgb&w=100" alt="${item.name}" class="cart-item-image">
                    <div>
                        <h3>${item.name}</h3>
                        <p>$${item.price.toFixed(2)}</p>
                        <div class="quantity-selector">
                            <label for="quantity-${item.id}">Quantity:</label>
                            <input type="number" id="quantity-${item.id}" value="${item.quantity}" min="1" data-id="${item.id}" class="item-quantity">
                        </div>
                    </div>
                </div>
                <button class="btn-remove" data-id="${item.id}">&times; Remove</button>
            `;
            cartItemsContainer.appendChild(cartItem);
            total += item.price * item.quantity;
        });

        if (cartTotalContainer) {
            cartTotalContainer.innerHTML = `<h3>Total: $${total.toFixed(2)}</h3>`;
        }

        // Event listeners for remove buttons and quantity inputs
        document.querySelectorAll('.btn-remove').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                removeFromCart(id);
            });
        });

        document.querySelectorAll('.item-quantity').forEach(input => {
            input.addEventListener('change', (e) => {
                const id = parseInt(e.target.dataset.id);
                const quantity = parseInt(e.target.value);
                updateCartQuantity(id, quantity);
            });
        });
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

    function updateCartTotal() {
        if (cart.length > 0) {
            cartTotalContainer.innerHTML = `<h3>Total: $${getCartTotal().toFixed(2)}</h3>`;
        } else {
            cartTotalContainer.innerHTML = '';
        }
    }

    function showValidationError(inputElement, message) {
        inputElement.classList.add('invalid');
        const error = document.createElement('p');
        error.className = 'error-message';
        error.textContent = message;
        inputElement.parentElement.appendChild(error);
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

    window.removeFromCart = (productId) => {
        const itemIndex = cart.findIndex(item => item.id === productId);
        if (itemIndex > -1) {
            lastRemovedItem = { ...cart[itemIndex], index: itemIndex };
            const productName = cart[itemIndex].name;
            cart.splice(itemIndex, 1);
            saveCart();
            updateCartCount();
            displayCartPage();
            displayOrderSummary();
            showToast(`${productName} removed from cart.`, 'error', 5000, true);
        }
    };

    window.undoRemove = () => {
        if (lastRemovedItem) {
            cart.splice(lastRemovedItem.index, 0, lastRemovedItem);
            lastRemovedItem = null;
            saveCart();
            updateCartCount();
            displayCartPage();
            displayOrderSummary();
            showToast('Item restored to cart.');
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

    function showToast(message, type = 'success', duration = 3000, showUndo = false) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const messageSpan = document.createElement('span');
        messageSpan.textContent = message;
        toast.appendChild(messageSpan);

        if (showUndo) {
            const undoButton = document.createElement('button');
            undoButton.textContent = 'Undo';
            undoButton.className = 'btn-undo';
            undoButton.onclick = () => {
                undoRemoveFromCart();
                toast.remove();
            };
            toast.appendChild(undoButton);
        }

        toastContainer.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        // Animate out and remove
        const timeoutId = setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => {
                toast.remove();
            });
        }, duration);

        if (showUndo) {
            toast.querySelector('.btn-undo').addEventListener('click', () => {
                clearTimeout(timeoutId);
            });
        }
    }

    // Initialize the app
    initialize();
});
