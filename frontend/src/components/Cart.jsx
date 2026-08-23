import { useContext } from "react";
import { CartContext } from "../context/CartContext";
import { products } from "../data/products";

// Real catalog items (ids 13-15) — same items the backend will re-price
// and verify against the catalog at checkout, so this "upsell" is an
// actual working agent action, not a decorative button.
const BUNDLE_IDS = [13, 14, 15];

function Cart({ openCheckout }) {
  const { cart, total, addToCart, removeFromCart, showCart, setShowCart } =
    useContext(CartContext);

  if (!showCart) return null;

  const hasShoes = cart.some((item) => item.category === "shoes");
  const bundleInCart = BUNDLE_IDS.every((id) =>
    cart.some((item) => item.id === id)
  );

  const handleAddBundle = () => {
    BUNDLE_IDS.forEach((id) => {
      const item = products.find((p) => p.id === id);
      if (item) addToCart(item);
    });
  };

  return (
    <div className="cart-overlay">
      <div className="cart-panel">
        {/* Header */}
        <div className="cart-header">
          <h2>🛒 Your Cart</h2>

          <button onClick={() => setShowCart(false)}>✕</button>
        </div>

        {/* Empty Cart */}
        {cart.length === 0 ? (
          <p>Your cart is empty.</p>
        ) : (
          <>
            {/* Cart Items */}
            {cart.map((item, index) => (
              <div className="cart-item" key={index}>
                <img src={item.image} alt={item.name} />

                <div className="cart-info">
                  <h4>{item.name}</h4>
                  <p>{item.category}</p>
                  <span>₹{item.price}</span>
                </div>

                <button
                  className="remove-btn"
                  onClick={() => removeFromCart(index)}
                >
                  Remove
                </button>
              </div>
            ))}

            {/* AI Upsell */}
            {hasShoes && (
              <div className="upsell-box">
                <h3>✨ ShopPilot AI Recommendation</h3>

                <p>Customers who bought these sneakers also bought:</p>

                <ul>
                  <li>🧦 White Socks — ₹199</li>
                  <li>🧴 Shoe Cleaner — ₹149</li>
                  <li>🎒 Shoe Bag — ₹299</li>
                </ul>

                {bundleInCart ? (
                  <p className="bundle-added-note">
                    ✅ Bundle added — apply code <code>SHOP150</code> at
                    checkout to save ₹150.
                  </p>
                ) : (
                  <button onClick={handleAddBundle}>
                    Add Bundle & Save ₹150
                  </button>
                )}
              </div>
            )}

            {/* Total */}
            <div className="cart-total">
              <h3>Total: ₹{total}</h3>
            <button
  className="checkout-btn"
  onClick={() => {
    setShowCart(false);   // Close cart
    openCheckout();       // Open checkout page
  }}
>
  Proceed to Checkout 💳
</button>


            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Cart;