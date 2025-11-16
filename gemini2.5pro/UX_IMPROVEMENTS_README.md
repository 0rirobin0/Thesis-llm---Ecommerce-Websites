### UX/HCI Evaluation Report & README

This report outlines key usability issues based on Nielsen's Heuristics and Human-Computer Interaction (HCI) principles.

---

### **Top 6 Prioritized Usability Issues**

1.  **Issue: Disruptive System Feedback.**
    *   **Heuristic Violated:** #1 Visibility of system status.
    *   **Problem:** The use of `alert()` for actions like "Add to cart" or "Remove from cart" is modal and disruptive. It hijacks the user's screen, forcing an interaction and interrupting their browsing flow (e.g., they might want to add several items to the cart in quick succession).
    *   **Proposed Fix:** Replace the `alert()` calls with non-modal, transient "toast" notifications that appear briefly on the screen to provide feedback without interrupting the user.

2.  **Issue: Lack of Persistent Cart Status.**
    *   **Heuristic Violated:** #1 Visibility of system status; #6 Recognition rather than recall.
    *   **Problem:** The navigation bar does not show the number of items currently in the cart. The user must remember what they've added or navigate to the cart page to check, which increases cognitive load.
    *   **Proposed Fix:** Add a badge to the "Cart" link in the navigation that dynamically updates with the total number of items in the cart. This provides immediate, persistent feedback.

3.  **Issue: No "Undo" for Accidental Deletion.**
    *   **Heuristic Violated:** #3 User control and freedom.
    *   **Problem:** If a user accidentally removes an item from the cart, the action is irreversible. A good system should provide an "emergency exit" to leave an unwanted state.
    *   **Proposed Fix:** When an item is removed, the toast notification for that action should include an "Undo" button. Clicking it would immediately restore the item to the cart.

4.  **Issue: Abrupt Checkout Completion.**
    *   **Heuristic Violated:** #1 Visibility of system status; #4 Consistency and standards.
    *   **Problem:** After placing an order, the user sees a generic `alert` and is immediately redirected to the homepage. This is an anti-pattern. Users expect a dedicated confirmation page that summarizes the order and provides a sense of finality and security.
    *   **Proposed Fix:** Create a new `order-confirmation.html` page. After placing an order, redirect the user to this page, which will display the order details (retrieved from `localStorage`).

5.  **Issue: Ambiguous Clickable Areas on Product Cards.**
    *   **HCI Principle:** Affordances.
    *   **Problem:** On the product grid, the entire card is not clickable; only the image and title area within the `<a>` tag are. The "Add to Cart" button is a separate action. This can lead to mis-clicks and violates the expectation that the entire card is a single interactive element leading to the product page.
    *   **Proposed Fix:** Make the entire product card a single link to the product detail page. Move the "Add to Cart" button to the product detail page only, simplifying the product listing UI and clarifying user actions.

6.  **Issue: Unhelpful "No Results" Message.**
    *   **Heuristic Violated:** #9 Help users recognize, diagnose, and recover from errors.
    *   **Problem:** When filters result in no matching products, the page simply says "No products found." This is a dead end.
    *   **Proposed Fix:** Improve the empty state message to be more helpful, e.g., "No products match your criteria. Try clearing some filters to see more." and provide a button to reset all filters.