/**
 * Product Data
 * This file contains the product catalog with real image URLs from Unsplash
 * Each product includes: id, name, category, price, description, image URL, and srcset for responsive images
 */

export const products = [
    // SHOES CATEGORY
    {
        id: 1,
        name: "Classic Running Shoes",
        category: "shoes",
        price: 89.99,
        description: "Lightweight and breathable running shoes designed for maximum comfort and performance. Features cushioned sole and arch support for long-distance runs.",
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80",
        srcset: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&q=80 300w, https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80 500w, https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80 800w",
        sizes: "(max-width: 768px) 300px, (max-width: 1200px) 500px, 800px",
        imageAlt: "White and red classic running shoes on white background"
    },
    {
        id: 2,
        name: "Premium Leather Sneakers",
        category: "shoes",
        price: 129.99,
        description: "Handcrafted leather sneakers with modern design. Premium quality leather upper with comfortable rubber sole. Perfect for casual wear and smart-casual occasions.",
        image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&q=80",
        srcset: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300&q=80 300w, https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&q=80 500w, https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80 800w",
        sizes: "(max-width: 768px) 300px, (max-width: 1200px) 500px, 800px",
        imageAlt: "Brown leather sneakers on white background"
    },
    {
        id: 3,
        name: "Athletic Training Shoes",
        category: "shoes",
        price: 109.99,
        description: "High-performance training shoes with excellent grip and stability. Ideal for gym workouts, cross-training, and athletic activities.",
        image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=500&q=80",
        srcset: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=300&q=80 300w, https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=500&q=80 500w, https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&q=80 800w",
        sizes: "(max-width: 768px) 300px, (max-width: 1200px) 500px, 800px",
        imageAlt: "Black athletic training shoes with orange accents"
    },

    // APPAREL CATEGORY
    {
        id: 4,
        name: "Cotton Casual T-Shirt",
        category: "apparel",
        price: 24.99,
        description: "100% premium cotton t-shirt with a relaxed fit. Soft, breathable fabric perfect for everyday wear. Available in multiple colors.",
        image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80",
        srcset: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&q=80 300w, https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80 500w, https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80 800w",
        sizes: "(max-width: 768px) 300px, (max-width: 1200px) 500px, 800px",
        imageAlt: "White cotton t-shirt laid flat"
    },
    {
        id: 5,
        name: "Denim Jacket",
        category: "apparel",
        price: 79.99,
        description: "Classic blue denim jacket with button closure. Durable construction with a timeless style that never goes out of fashion. Perfect layering piece.",
        image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&q=80",
        srcset: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&q=80 300w, https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&q=80 500w, https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80 800w",
        sizes: "(max-width: 768px) 300px, (max-width: 1200px) 500px, 800px",
        imageAlt: "Blue denim jacket on wooden hanger"
    },
    {
        id: 6,
        name: "Performance Hoodie",
        category: "apparel",
        price: 54.99,
        description: "Moisture-wicking performance hoodie perfect for workouts or casual wear. Features kangaroo pocket and adjustable drawstring hood.",
        image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&q=80",
        srcset: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=300&q=80 300w, https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&q=80 500w, https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80 800w",
        sizes: "(max-width: 768px) 300px, (max-width: 1200px) 500px, 800px",
        imageAlt: "Gray performance hoodie"
    },
    {
        id: 7,
        name: "Slim Fit Chino Pants",
        category: "apparel",
        price: 59.99,
        description: "Modern slim-fit chino pants crafted from stretch cotton. Versatile design suitable for both casual and business casual settings.",
        image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=500&q=80",
        srcset: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=300&q=80 300w, https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=500&q=80 500w, https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&q=80 800w",
        sizes: "(max-width: 768px) 300px, (max-width: 1200px) 500px, 800px",
        imageAlt: "Beige chino pants folded neatly"
    },

    // ELECTRONICS CATEGORY
    {
        id: 8,
        name: "Wireless Bluetooth Headphones",
        category: "electronics",
        price: 149.99,
        description: "Premium over-ear wireless headphones with active noise cancellation. 30-hour battery life, exceptional sound quality, and comfortable fit for all-day wear.",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80",
        srcset: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80 300w, https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80 500w, https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80 800w",
        sizes: "(max-width: 768px) 300px, (max-width: 1200px) 500px, 800px",
        imageAlt: "Black wireless headphones on white background"
    },
    {
        id: 9,
        name: "Smart Watch Fitness Tracker",
        category: "electronics",
        price: 199.99,
        description: "Advanced fitness tracking smartwatch with heart rate monitor, GPS, sleep tracking, and smartphone notifications. Water-resistant design with 7-day battery life.",
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80",
        srcset: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&q=80 300w, https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80 500w, https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80 800w",
        sizes: "(max-width: 768px) 300px, (max-width: 1200px) 500px, 800px",
        imageAlt: "Black smart watch showing fitness display"
    },
    {
        id: 10,
        name: "Portable Bluetooth Speaker",
        category: "electronics",
        price: 79.99,
        description: "Compact wireless speaker with powerful 360-degree sound. Waterproof design perfect for outdoor adventures. 12-hour battery life and built-in microphone.",
        image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&q=80",
        srcset: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=300&q=80 300w, https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&q=80 500w, https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=80 800w",
        sizes: "(max-width: 768px) 300px, (max-width: 1200px) 500px, 800px",
        imageAlt: "Cylindrical portable bluetooth speaker"
    },
    {
        id: 11,
        name: "USB-C Fast Charging Cable",
        category: "electronics",
        price: 19.99,
        description: "Durable braided USB-C charging cable with fast charging support. 6-foot length provides flexibility. Compatible with most modern devices.",
        image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=500&q=80",
        srcset: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=300&q=80 300w, https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=500&q=80 500w, https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&q=80 800w",
        sizes: "(max-width: 768px) 300px, (max-width: 1200px) 500px, 800px",
        imageAlt: "Black braided USB-C charging cable coiled"
    },
    {
        id: 12,
        name: "Wireless Phone Charger",
        category: "electronics",
        price: 34.99,
        description: "Fast wireless charging pad with non-slip surface. Compatible with all Qi-enabled devices. LED indicator shows charging status. Includes wall adapter.",
        image: "https://images.unsplash.com/photo-1591290619762-d4b48f838958?w=500&q=80",
        srcset: "https://images.unsplash.com/photo-1591290619762-d4b48f838958?w=300&q=80 300w, https://images.unsplash.com/photo-1591290619762-d4b48f838958?w=500&q=80 500w, https://images.unsplash.com/photo-1591290619762-d4b48f838958?w=800&q=80 800w",
        sizes: "(max-width: 768px) 300px, (max-width: 1200px) 500px, 800px",
        imageAlt: "Round black wireless charging pad with phone"
    }
];

/**
 * Image Search Keywords (if manual download is needed):
 * - Product 1: running shoes white red nike
 * - Product 2: brown leather sneakers luxury
 * - Product 3: black athletic training shoes
 * - Product 4: white cotton t-shirt minimal
 * - Product 5: blue denim jacket classic
 * - Product 6: gray hoodie athletic
 * - Product 7: beige khaki chino pants
 * - Product 8: black wireless headphones premium
 * - Product 9: smart watch fitness tracker
 * - Product 10: bluetooth speaker portable
 * - Product 11: usb-c cable braided
 * - Product 12: wireless phone charger pad
 */
