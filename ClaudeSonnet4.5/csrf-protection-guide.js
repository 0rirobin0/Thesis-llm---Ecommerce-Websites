/**
 * CSRF Protection Implementation Guide
 * For future backend integration with ShopHub eCommerce Platform
 * 
 * This file provides code templates and patterns for implementing
 * CSRF (Cross-Site Request Forgery) protection when adding a backend API.
 */

// ============================================
// BACKEND IMPLEMENTATION (Node.js/Express)
// ============================================

/**
 * 1. Install CSRF middleware
 * npm install csurf cookie-parser express-session
 */

// server.js or app.js
const express = require('express');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
const session = require('express-session');

const app = express();

// Parse cookies
app.use(cookieParser());

// Session middleware (required for CSRF)
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secure-random-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        httpOnly: true, // Prevents XSS access to cookies
        sameSite: 'strict', // CSRF protection
        maxAge: 3600000 // 1 hour
    }
}));

// CSRF protection middleware
const csrfProtection = csrf({ 
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    }
});

// Apply CSRF protection to all routes that modify data
app.use('/api', csrfProtection);

/**
 * 2. Generate CSRF token endpoint
 */
app.get('/api/csrf-token', csrfProtection, (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

/**
 * 3. Protected checkout endpoint example
 */
app.post('/api/checkout', csrfProtection, (req, res) => {
    try {
        // Token is automatically validated by csurf middleware
        const { customer, items, totals } = req.body;
        
        // Validate request data
        if (!customer || !items || !totals) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Process checkout
        const orderId = generateOrderId();
        const order = {
            orderId,
            customer,
            items,
            totals,
            date: new Date().toISOString(),
            status: 'pending'
        };
        
        // Save to database
        // await Order.create(order);
        
        res.json({ 
            success: true, 
            orderId,
            message: 'Order placed successfully' 
        });
    } catch (error) {
        if (error.code === 'EBADCSRFTOKEN') {
            return res.status(403).json({ error: 'Invalid CSRF token' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * 4. Protected cart update endpoint
 */
app.post('/api/cart/update', csrfProtection, (req, res) => {
    try {
        const { productId, quantity } = req.body;
        
        // Validate inputs
        if (!productId || typeof quantity !== 'number') {
            return res.status(400).json({ error: 'Invalid input' });
        }
        
        if (quantity < 0 || quantity > 999) {
            return res.status(400).json({ error: 'Invalid quantity' });
        }
        
        // Update cart in session or database
        req.session.cart = req.session.cart || [];
        const item = req.session.cart.find(i => i.id === productId);
        
        if (item) {
            item.quantity = quantity;
        } else {
            req.session.cart.push({ id: productId, quantity });
        }
        
        res.json({ success: true, cart: req.session.cart });
    } catch (error) {
        if (error.code === 'EBADCSRFTOKEN') {
            return res.status(403).json({ error: 'Invalid CSRF token' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * 5. Error handler for CSRF token errors
 */
app.use((err, req, res, next) => {
    if (err.code === 'EBADCSRFTOKEN') {
        res.status(403).json({ 
            error: 'Invalid or missing CSRF token',
            message: 'Please refresh the page and try again'
        });
    } else {
        next(err);
    }
});

// ============================================
// FRONTEND IMPLEMENTATION (JavaScript)
// ============================================

/**
 * 6. Fetch CSRF token on page load
 */
let csrfToken = null;

async function initCSRF() {
    try {
        const response = await fetch('/api/csrf-token', {
            credentials: 'include' // Include cookies
        });
        const data = await response.json();
        csrfToken = data.csrfToken;
        console.log('CSRF token initialized');
    } catch (error) {
        console.error('Failed to fetch CSRF token:', error);
    }
}

// Call on page load
document.addEventListener('DOMContentLoaded', initCSRF);

/**
 * 7. Include CSRF token in all POST/PUT/DELETE requests
 */
async function checkoutWithCSRF(orderData) {
    if (!csrfToken) {
        throw new Error('CSRF token not initialized');
    }
    
    try {
        const response = await fetch('/api/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'CSRF-Token': csrfToken // Include token in header
            },
            credentials: 'include', // Include cookies
            body: JSON.stringify(orderData)
        });
        
        if (!response.ok) {
            if (response.status === 403) {
                // CSRF token invalid, refresh and retry
                await initCSRF();
                throw new Error('CSRF token expired, please try again');
            }
            throw new Error('Checkout failed');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Checkout error:', error);
        throw error;
    }
}

/**
 * 8. Alternative: Include CSRF token in form hidden field
 */
function addCSRFTokenToForm(formElement) {
    if (!csrfToken) {
        console.error('CSRF token not available');
        return;
    }
    
    // Remove existing token input if any
    const existingToken = formElement.querySelector('input[name="_csrf"]');
    if (existingToken) {
        existingToken.remove();
    }
    
    // Create hidden input
    const tokenInput = document.createElement('input');
    tokenInput.type = 'hidden';
    tokenInput.name = '_csrf';
    tokenInput.value = csrfToken;
    
    formElement.appendChild(tokenInput);
}

/**
 * 9. Enhanced checkout form submission with CSRF
 */
async function handleCheckoutSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    // Convert to object
    const orderData = {
        customer: {
            fullName: formData.get('fullName'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            address: {
                street: formData.get('address'),
                city: formData.get('city'),
                state: formData.get('state'),
                zip: formData.get('zip')
            }
        },
        items: getCart(),
        totals: calculateCartTotals()
    };
    
    try {
        const result = await checkoutWithCSRF(orderData);
        
        if (result.success) {
            // Clear cart
            clearCart();
            
            // Show confirmation
            showOrderConfirmation(result.orderId);
        }
    } catch (error) {
        showNotification(error.message, 5000, 'error');
    }
}

/**
 * 10. Add to cart with CSRF protection
 */
async function addToCartWithAPI(productId, quantity) {
    if (!csrfToken) {
        throw new Error('CSRF token not initialized');
    }
    
    try {
        const response = await fetch('/api/cart/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'CSRF-Token': csrfToken
            },
            credentials: 'include',
            body: JSON.stringify({ productId, quantity })
        });
        
        if (!response.ok) {
            if (response.status === 403) {
                await initCSRF();
                throw new Error('Session expired, please try again');
            }
            throw new Error('Failed to add to cart');
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Add to cart error:', error);
        throw error;
    }
}

// ============================================
// SECURITY BEST PRACTICES
// ============================================

/**
 * Additional recommendations:
 * 
 * 1. RATE LIMITING
 * Prevent brute force attacks on CSRF tokens
 */
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/api/', apiLimiter);

/**
 * 2. DOUBLE SUBMIT COOKIE PATTERN (Alternative to synchronized tokens)
 */
function generateCSRFCookie(req, res) {
    const token = crypto.randomBytes(32).toString('hex');
    
    res.cookie('XSRF-TOKEN', token, {
        httpOnly: false, // JavaScript needs to read this
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600000
    });
    
    return token;
}

function validateDoubleSubmitToken(req, res, next) {
    const cookieToken = req.cookies['XSRF-TOKEN'];
    const headerToken = req.headers['x-csrf-token'];
    
    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        return res.status(403).json({ error: 'Invalid CSRF token' });
    }
    
    next();
}

/**
 * 3. ORIGIN AND REFERER VALIDATION
 */
function validateOrigin(req, res, next) {
    const allowedOrigins = [
        'https://shophub.com',
        'https://www.shophub.com'
    ];
    
    const origin = req.headers.origin || req.headers.referer;
    
    if (!origin || !allowedOrigins.some(allowed => origin.startsWith(allowed))) {
        return res.status(403).json({ error: 'Invalid origin' });
    }
    
    next();
}

app.use('/api', validateOrigin);

/**
 * 4. CORS CONFIGURATION
 */
const cors = require('cors');

app.use(cors({
    origin: ['https://shophub.com', 'https://www.shophub.com'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'CSRF-Token', 'Authorization']
}));

/**
 * 5. HTTPS REDIRECT MIDDLEWARE
 */
function requireHTTPS(req, res, next) {
    if (process.env.NODE_ENV === 'production' && !req.secure) {
        return res.redirect('https://' + req.get('host') + req.url);
    }
    next();
}

app.use(requireHTTPS);

// ============================================
// TESTING CSRF PROTECTION
// ============================================

/**
 * Test scenarios:
 * 
 * 1. Valid request with token
 * curl -X POST http://localhost:3000/api/checkout \
 *   -H "Content-Type: application/json" \
 *   -H "CSRF-Token: valid-token-here" \
 *   -H "Cookie: connect.sid=session-id" \
 *   -d '{"customer": {...}, "items": [...]}'
 * 
 * Expected: 200 OK
 * 
 * 2. Request without token
 * curl -X POST http://localhost:3000/api/checkout \
 *   -H "Content-Type: application/json" \
 *   -d '{"customer": {...}, "items": [...]}'
 * 
 * Expected: 403 Forbidden
 * 
 * 3. Request with invalid token
 * curl -X POST http://localhost:3000/api/checkout \
 *   -H "CSRF-Token: invalid-token" \
 *   -d '{...}'
 * 
 * Expected: 403 Forbidden
 * 
 * 4. Cross-origin request (simulated CSRF attack)
 * curl -X POST http://localhost:3000/api/checkout \
 *   -H "Origin: https://evil-site.com" \
 *   -H "CSRF-Token: stolen-token" \
 *   -d '{...}'
 * 
 * Expected: 403 Forbidden (blocked by Origin validation)
 */

module.exports = {
    initCSRF,
    checkoutWithCSRF,
    addToCartWithAPI,
    addCSRFTokenToForm,
    handleCheckoutSubmit
};
