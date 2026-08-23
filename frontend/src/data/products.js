export const products = [
  // ================= SHOES =================
  {
    id: 1,
    name: "Campus White Sneakers",
    category: "shoes",
    color: "white",
    price: 1899,
    rating: 4.8,
    badge: "Best Match",
    purpose: ["college", "casual"],
    reason: "Perfect for college students. Matches your budget and white color preference.",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600",
  },
  {
    id: 2,
    name: "Sparx Everyday Sneakers",
    category: "shoes",
    color: "white",
    price: 1499,
    rating: 4.5,
    badge: "Budget Pick",
    purpose: ["college", "walking"],
    reason: "Affordable everyday sneakers with great comfort.",
    image:
      "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=600",
  },
  {
    id: 3,
    name: "Puma White Sneakers",
    category: "shoes",
    color: "white",
    price: 2199,
    rating: 4.9,
    badge: "Trending",
    purpose: ["college", "fashion"],
    reason: "Most popular among college students this month.",
    image:
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600",
  },

  // ================= SKINCARE =================
  {
    id: 4,
    name: "Minimalist Vitamin C Serum",
    category: "skincare",
    color: "white",
    price: 699,
    rating: 4.7,
    badge: "Glow Pick",
    purpose: ["skincare", "brightening"],
    reason: "Best beginner Vitamin C serum for glowing skin.",
    image:
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600",
  },
  {
    id: 5,
    name: "Plum Green Tea Moisturizer",
    category: "skincare",
    color: "green",
    price: 499,
    rating: 4.6,
    badge: "Budget Pick",
    purpose: ["acne", "oily skin"],
    reason: "Lightweight moisturizer for oily skin.",
    image:
      "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600",
  },
  {
    id: 6,
    name: "Dot & Key Sunscreen SPF50",
    category: "skincare",
    color: "yellow",
    price: 599,
    rating: 4.8,
    badge: "Trending",
    purpose: ["sun protection"],
    reason: "Dermatologist-favorite sunscreen for everyday use.",
    image:
      "https://images.unsplash.com/photo-1619451334792-150fd785ee74?w=600",
  },

  // ================= ELECTRONICS =================
  {
    id: 7,
    name: "Noise Wireless Headphones",
    category: "electronics",
    color: "black",
    price: 2499,
    rating: 4.8,
    badge: "Best Match",
    purpose: ["music", "study"],
    reason: "Perfect headphones for studying and music.",
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600",
  },
  {
    id: 8,
    name: "boAt Rockerz 450",
    category: "electronics",
    color: "black",
    price: 1699,
    rating: 4.5,
    badge: "Budget Pick",
    purpose: ["music", "gym"],
    reason: "Affordable headphones with long battery life.",
    image:
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600",
  },
  {
    id: 9,
    name: "JBL Tune Earbuds",
    category: "electronics",
    color: "blue",
    price: 2999,
    rating: 4.8,
    badge: "Premium Pick",
    purpose: ["music", "travel"],
    reason: "Premium audio quality with noise cancellation.",
    image:
      "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f37?w=600",
  },

  // ================= FASHION =================
  {
    id: 10,
    name: "Lavender College Kurti",
    category: "fashion",
    color: "lavender",
    price: 899,
    rating: 4.6,
    badge: "Trending",
    purpose: ["college", "casual"],
    reason: "Elegant kurti perfect for daily college wear.",
    image:
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600",
  },
  {
    id: 11,
    name: "Oversized Purple Hoodie",
    category: "fashion",
    color: "purple",
    price: 1199,
    rating: 4.8,
    badge: "Best Match",
    purpose: ["college", "winter"],
    reason: "Stylish oversized hoodie trending among students.",
    image:
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600",
  },
  {
    id: 12,
    name: "Blue Straight Fit Jeans",
    category: "fashion",
    color: "blue",
    price: 1399,
    rating: 4.7,
    badge: "Everyday Pick",
    purpose: ["college", "casual"],
    reason: "Comfortable jeans that match almost every outfit.",
    image:
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600",
  },

  // ================= ACCESSORIES (upsell bundle) =================
  // Real catalog items backing the "Add Bundle & Save" upsell in the
  // cart — the agent only ever offers items that actually exist and
  // can be re-priced server-side, same as everything else.
  {
    id: 13,
    name: "White Ankle Socks (Pack of 3)",
    category: "accessories",
    color: "white",
    price: 199,
    rating: 4.6,
    badge: "Bundle Pick",
    purpose: ["college", "casual"],
    reason: "Pairs with any sneaker — the most-added bundle item.",
    image:
      "https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=600",
  },
  {
    id: 14,
    name: "Sneaker Cleaner Kit",
    category: "accessories",
    color: "white",
    price: 149,
    rating: 4.5,
    badge: "Bundle Pick",
    purpose: ["college", "casual"],
    reason: "Keeps white sneakers looking new for longer.",
    image:
      "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600",
  },
  {
    id: 15,
    name: "Drawstring Shoe Bag",
    category: "accessories",
    color: "grey",
    price: 299,
    rating: 4.4,
    badge: "Bundle Pick",
    purpose: ["college", "travel"],
    reason: "Protects shoes in a backpack between classes or trips.",
    image:
      "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=600",
  },
];