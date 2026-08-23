import { useState } from "react";
import { products } from "../data/products";

function Products() {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { name: "all", emoji: "✨", label: "All" },
    { name: "shoes", emoji: "👟", label: "Shoes" },
    { name: "skincare", emoji: "💄", label: "Skincare" },
    { name: "electronics", emoji: "🎧", label: "Electronics" },
    { name: "fashion", emoji: "👗", label: "Fashion" },
    { name: "accessories", emoji: "🎒", label: "Accessories" },
  ];

  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((item) => item.category === selectedCategory);

  return (
    <section className="products-section">
      <div className="section-header">
        <p className="section-tag">AI Product Catalog</p>

        <h2>Featured Products</h2>

        <p>
          ShopPilot AI understands products by category, budget, brand and
          customer intent.
        </p>
      </div>

      {/* CATEGORY BUTTONS */}

      <div className="categories">
        {categories.map((cat) => (
          <button
            key={cat.name}
            className={`category-card ${
              selectedCategory === cat.name ? "active-category" : ""
            }`}
            onClick={() => setSelectedCategory(cat.name)}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {/* PRODUCTS */}

      <div className="products-grid">
        {filteredProducts.map((item) => (
          <div key={item.id} className="product-item">
            <span className="badge">✨ {item.badge}</span>

            <img src={item.image} alt={item.name} />

            <h3>{item.name}</h3>

            <p className="category">{item.category}</p>

            <h4>₹{item.price}</h4>

            <p className="rating">⭐ {item.rating}</p>

            <button>Add to Cart 🛒</button>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Products;