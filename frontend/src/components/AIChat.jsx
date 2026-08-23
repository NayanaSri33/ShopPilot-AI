import { useState, useContext } from "react";
import { products } from "../data/products";
import { CartContext } from "../context/CartContext";
import { chatWithAI } from "../api";

function AIChat() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const { addToCart } = useContext(CartContext);

  const [memory, setMemory] = useState({
    category: "",
    budget: "",
    concern: "",
    brand: "",
    purpose: "",
    color: "",
  });

  const [chat, setChat] = useState([
    {
      type: "ai",
      text: "👋 Hello Nayana! I'm ShopPilot AI Copilot. Tell me what you're looking for today.",
    },
  ]);

  // ================= SEND MESSAGE =================
  const handleSend = async () => {
    if (!message.trim()) return;

    const userMessage = message;

    // Show user message immediately
    setChat((prev) => [...prev, { type: "user", text: userMessage }]);
    setLoading(true);
    setMessage("");

    try {
      const ai = await chatWithAI(userMessage);

      // ---------------- SIMPLE GEMINI / FALLBACK RESPONSE ----------------
      if (ai.reply && !ai.intent) {
        setChat((prev) => [
          ...prev,
          {
            type: "ai",
            text: ai.reply,
          },
        ]);

        setLoading(false);
        return;
      }

      // ---------------- ORCHESTRATOR RESPONSE ----------------
      const intent = ai.intent || {};
      const recommendation = ai.recommendation || {};
      const retrievedProducts = ai.retrievedProducts || [];

      // Save memory
      setMemory((prev) => ({
        ...prev,
        category: intent.category || prev.category,
        budget: intent.budget || prev.budget,
        concern: intent.concern || prev.concern,
        brand: intent.brand || prev.brand,
        purpose: intent.purpose || prev.purpose,
        color: intent.color || prev.color,
      }));

      let reply =
        recommendation.reply || "✨ I found some products for you.";

      if (intent.concern) {
        reply =
          `🧠 I understood you're looking for ${intent.concern}.\n\n` +
          reply;
      }

      if (intent.budget) {
        reply += `\n\n💰 Budget considered: ₹${intent.budget}`;
      }

      setChat((prev) => [...prev, { type: "ai", text: reply }]);

      // ---------------- PRODUCT CARDS ----------------
      const rankedProducts =
        recommendation.rankedProducts
          ?.map((ranked) => {
            const backendProduct = retrievedProducts.find(
              (p) => p.id === ranked.id
            );

            const frontendProduct = products.find(
              (p) =>
                p.name.toLowerCase() ===
                backendProduct?.name.toLowerCase()
            );

            if (frontendProduct) {
              return {
                ...frontendProduct,
                reason: ranked.reason,
                store: backendProduct.store,
              };
            }

            if (backendProduct) {
              return {
                ...backendProduct,
                image:
                  backendProduct.image ||
                  "https://placehold.co/300x300?text=ShopPilot",
                badge: backendProduct.store,
                reason: ranked.reason,
              };
            }

            return null;
          })
          .filter(Boolean) || [];

      if (rankedProducts.length > 0) {
        setChat((prev) => [
          ...prev,
          {
            type: "products",
            products: rankedProducts,
          },
          {
            type: "ai",
            text:
              "💸 Coupon Agent: You're eligible for SHOP150 today. Apply it during Razorpay checkout and save ₹150.",
          },
        ]);
      } else {
        setChat((prev) => [
          ...prev,
          {
            type: "ai",
            text:
              "😔 Sorry, I couldn't find products matching your request.",
          },
        ]);
      }
    } catch (error) {
      console.error("AI Error:", error);

      setChat((prev) => [
        ...prev,
        {
          type: "ai",
          text:
            "⚠️ ShopPilot AI is temporarily unavailable because the Gemini free API quota has been exhausted. Please try again later or use a new Gemini API key.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ================= UI =================
  return (
    <section className="chat-container">
      <h2 className="chat-title">🤖 Chat with ShopPilot AI Copilot</h2>

      <div className="chat-window">
        {chat.map((item, index) => {
          if (item.type === "user") {
            return (
              <div key={index} className="user-message">
                🙋‍♀️ {item.text}
              </div>
            );
          }

          if (item.type === "ai") {
            return (
              <div key={index} className="ai-message">
                {item.text}
              </div>
            );
          }

          if (item.type === "products") {
            return (
              <div key={index} className="products-response">
                {item.products.map((product) => (
                  <div key={product.id} className="product-card">
                    <img
                      src={product.image}
                      alt={product.name}
                      onError={(e) => {
                        e.target.src =
                          "https://placehold.co/300x300?text=ShopPilot";
                      }}
                    />

                    <div className="product-info">
                      <span className="badge">
                        {product.badge || product.store || "ShopPilot"}
                      </span>

                      <h3>{product.name}</h3>

                      <p className="price">
                        ₹{product.price}
                        {product.rating && ` ⭐ ${product.rating}`}
                      </p>

                      {product.reason && (
                        <p className="reason">{product.reason}</p>
                      )}

                      <button onClick={() => addToCart(product)}>
                        Add to Cart 🛒
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          }

          return null;
        })}

        {loading && (
          <div className="ai-message thinking">
            🤖 ShopPilot AI Agents are thinking...
          </div>
        )}
      </div>

      <div className="chat-input-box">
        <input
          type="text"
          placeholder="Example: I have pimples under ₹600 or Need white sneakers for college under ₹2000"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />

        <button onClick={handleSend} disabled={loading}>
          {loading ? "Thinking..." : "Ask AI ✨"}
        </button>
      </div>
    </section>
  );
}

export default AIChat;