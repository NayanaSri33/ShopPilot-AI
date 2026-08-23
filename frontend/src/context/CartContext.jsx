import { createContext, useState } from "react";

// Create Context
export const CartContext = createContext();

// Provider
export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);

  const addToCart = (product) => {
    setCart((prev) => [...prev, product]);
    setShowCart(true);
  };

  const removeFromCart = (index) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => setCart([]);

  const total = cart.reduce((sum, item) => sum + item.price, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        setCart,
        total,
        showCart,
        setShowCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}