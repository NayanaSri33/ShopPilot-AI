import { Router } from "express";
import { products } from "../../frontend/src/data/products.js";

const router = Router();

// GET /api/products
router.get("/", (req, res) => {
  res.json({ products });
});

// GET /api/products/agent-catalog
// A machine-readable feed meant for an AI *buyer* agent, not a human
// browser — schema.org/Product shape plus the fields an agent needs to
// transact without scraping the storefront: a stable id to send back to
// POST /api/orders, and a currency-explicit price so nothing has to be
// inferred. This is the "agent-readable catalog" direction for Track 01:
// it's what makes this merchant transactable by an AI buyer end to end,
// not just by a human clicking around the React app.
// NOTE: declared before "/:id" so it isn't swallowed by the id route.
router.get("/agent-catalog", (req, res) => {
  res.json({
    merchant: "ShopPilot AI Demo Store",
    currency: "INR",
    updated_at: new Date().toISOString(),
    checkout: {
      create_order: "POST /api/orders",
      create_order_body: { cart: [{ id: "number, required" }], couponCode: "string, optional" },
      pay: "POST /api/payments/razorpay-order",
      verify: "POST /api/payments/verify",
      note: "All prices are re-verified server-side from this same catalog before any charge — an agent buyer cannot pay a stale or hallucinated price.",
    },
    items: products.map((p) => ({
      "@type": "Product",
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.price,
      currency: "INR",
      rating: p.rating,
      availability: "InStock",
      image: p.image,
      description: p.reason,
    })),
  });
});

// GET /api/products/:id
router.get("/:id", (req, res) => {
  const product = products.find((p) => p.id === Number(req.params.id));
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json({ product });
});

export default router;
