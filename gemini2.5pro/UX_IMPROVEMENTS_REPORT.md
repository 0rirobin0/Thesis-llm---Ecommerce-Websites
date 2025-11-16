# UX/HCI Evaluation and Improvements Report

This report details the usability evaluation of the ShopSphere website based on Nielsen's 10 heuristics and common HCI principles. It identifies the top 6 usability issues, proposes solutions, and documents the implementation of these fixes.

## Top 6 Usability Issues and Fixes

### 1. Missing "Add to Cart" Feedback
- **Heuristic Violated:** #1 - Visibility of system status.
- **Issue:** When a user adds an item to the cart, the only feedback is the button text changing to "Added!". This is not prominent enough and can be easily missed.
- **Fix:** Implemented a toast notification that appears at the top of the page whenever an item is successfully added to the cart. This provides clear and immediate feedback.

### 2. No Way to Easily Remove Items from Cart
- **Heuristic Violated:** #3 - User control and freedom.
- **Issue:** The cart page lists the items but provides no functionality to remove them. Users cannot correct mistakes or change their minds easily.
- **Fix:** Added a "Remove" button next to each item in the shopping cart. This allows users to remove items individually without having to start over. An "Undo" option was also added to the toast notification when an item is removed.

### 3. Lack of Breadcrumbs for Navigation
- **Heuristic Violated:** #4 - Consistency and standards; #7 - Flexibility and efficiency of use.
- **Issue:** The site lacks a breadcrumb navigation system, making it difficult for users to understand their location within the site's hierarchy and navigate back to previous pages.
- **Fix:** Implemented breadcrumbs on all pages except the homepage. This shows the user their current location and provides quick links to parent pages.

### 4. No Empty Cart Message
- **Heuristic Violated:** #9 - Help users recognize, diagnose, and recover from errors.
- **Issue:** When the shopping cart is empty, the page is blank, which can be confusing.
- **Fix:** When the cart is empty, a message is displayed ("Your cart is empty.") along with a "Shop All Products" button to guide the user back to the product listings.

### 5. User-Unfriendly Checkout Form Validation
- **Heuristic Violated:** #5 - Error prevention.
- **Issue:** The checkout form relies on default browser validation, which is inconsistent and not very helpful. It also clears valid data on submission failure.
- **Fix:** Implemented custom form validation with clear, inline error messages. The form no longer clears valid fields upon a failed submission attempt, reducing user frustration and cognitive load.

### 6. Inconsistent Logo on Checkout Page
- **Heuristic Violated:** #4 - Consistency and standards.
- **Issue:** The logo on the checkout page says "Shop" while it is "ShopSphere" on all other pages.
- **Fix:** Changed the logo text on the checkout page to "ShopSphere" to maintain consistency across the entire site.
