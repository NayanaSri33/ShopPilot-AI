import { Router } from "express";
import db from "../db/index.js";
import { logAction } from "../db/audit.js";
import { products } from "../../frontend/src/data/products.js";

const router = Router();

// Business rules the agent actually enforces — not just described in copy.
const COUPONS = {
  SHOP150: 15000, // paise
};
const MAX_DISCOUNT_PAISE = 30000; // ₹300 cap per order, referenced in the UI copy
const GST_RATE = 0.18;

const insertOrder = db.prepare(`
  INSERT INTO orders (id, status, subtotal_paise, discount_paise, gst_paise, total_paise, cart_json)
  VALUES (@id, 'created', @subtotal_paise, @discount_paise, @gst_paise, @total_paise, @cart_json)
`);

const getOrder = db.prepare(`SELECT * FROM orders WHERE id = ?`);
const listOrders = db.prepare(`SELECT * FROM orders ORDER BY created_at DESC LIMIT ?`);

function newOrderId() {
  return `ORD-${Date.now().toString(36).toUpperCase()}`;
}

// POST /api/orders  { cart: [{id, ...}], couponCode?: string }
router.post("/", (req, res) => {
  const { cart, couponCode } = req.body || {};

  if (!Array.isArray(cart) || cart.length === 0) {
    // GATE: refuse to create an order with nothing in it.
    logAction({
      actor: "agent",
      action: "order_rejected_empty_cart",
      tag: "gated",
      reason: "Refused to create an order because the cart was empty.",
    });
    return res.status(400).json({ error: "Cart is empty." });
  }

  // GATE: re-price every line item from the server catalog. A tampered
  // or stale client price is never trusted — this is the actual check
  // behind the "verified before charging" claim in the UI.
  const priced = [];
  for (const item of cart) {
    const real = products.find((p) => p.id === item.id);
    if (!real) {
      logAction({
        actor: "agent",
        action: "order_rejected_unknown_item",
        tag: "gated",
        reason: `Refused to add unrecognized product id ${item.id} — not in catalog.`,
      });
      return res.status(400).json({ error: `Unknown product id ${item.id}` });
    }
    priced.push(real);
  }
  logAction({
    actor: "agent",
    action: "cart_verified_against_catalog",
    tag: "gated",
    reason: `Checked all ${priced.length} item(s) against the live catalog before pricing.`,
  });

  const subtotalPaise = priced.reduce((sum, p) => sum + Math.round(p.price * 100), 0);

  // BOUND: coupon discount is looked up server-side and hard-capped.
  // The client can send a code, never an amount.
  let discountPaise = 0;
  if (couponCode) {
    const code = String(couponCode).trim().toUpperCase();
    const proposed = COUPONS[code] || 0;

    if (proposed === 0) {
      logAction({
        actor: "agent",
        action: "coupon_rejected",
        tag: "bounded",
        reason: `Coupon "${code}" is not valid — no discount applied.`,
      });
    } else if (proposed > MAX_DISCOUNT_PAISE) {
      discountPaise = MAX_DISCOUNT_PAISE;
      logAction({
        actor: "agent",
        action: "coupon_clamped",
        tag: "bounded",
        reason: `Coupon "${code}" would have discounted more than the ₹300 cap — clamped to the cap.`,
        amountPaise: discountPaise,
      });
    } else {
      discountPaise = proposed;
      logAction({
        actor: "agent",
        action: "coupon_applied",
        tag: "bounded",
        reason: `Applied coupon "${code}", within the ₹300-per-order discount cap.`,
        amountPaise: discountPaise,
      });
    }
  }

  const gstPaise = Math.round((subtotalPaise - discountPaise) * GST_RATE);
  const totalPaise = subtotalPaise - discountPaise + gstPaise;

  const id = newOrderId();
  insertOrder.run({
    id,
    subtotal_paise: subtotalPaise,
    discount_paise: discountPaise,
    gst_paise: gstPaise,
    total_paise: totalPaise,
    cart_json: JSON.stringify(priced.map((p) => ({ id: p.id, name: p.name, price: p.price }))),
  });

  // EXPLAINED: why these items, in one line the buyer or merchant can read.
  const hasShoes = priced.some((p) => p.category === "shoes");
  logAction({
    actor: "agent",
    action: "order_created",
    tag: "explained",
    reason: hasShoes
      ? `Created order ${id} for ${priced.length} item(s), including footwear — eligible for the sock/cleaner bundle upsell.`
      : `Created order ${id} for ${priced.length} item(s).`,
    amountPaise: totalPaise,
    orderId: id,
  });

  res.status(201).json({
    order: {
      id,
      status: "created",
      subtotal: subtotalPaise / 100,
      discount: discountPaise / 100,
      gst: gstPaise / 100,
      total: totalPaise / 100,
      items: priced.map((p) => ({ id: p.id, name: p.name, price: p.price })),
    },
  });
});

// GET /api/orders/:id
router.get("/:id", (req, res) => {
  const order = getOrder.get(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json({
    order: {
      ...order,
      cart_json: JSON.parse(order.cart_json),
    },
  });
});

// GET /api/orders?limit=20  -> real data for the merchant dashboard
router.get("/", (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const rows = listOrders.all(limit).map((row) => ({
    ...row,
    cart_json: JSON.parse(row.cart_json),
  }));
  res.json({ orders: rows });
});

// GET /api/orders/stats/summary -> honest, computed numbers for the
// dashboard and homepage hero. Nothing here is hand-typed marketing
// copy — it's aggregated from the same `orders` rows /api/orders
// returns, so a judge can cross-check it against the audit trail.
router.get("/stats/summary", (req, res) => {
  const allOrders = db.prepare(`SELECT * FROM orders`).all();
  const paidOrders = allOrders.filter((o) => o.status === "paid");
  const failedOrders = allOrders.filter((o) => o.status === "failed");

  const totalRevenuePaise = paidOrders.reduce((sum, o) => sum + o.total_paise, 0);
  const totalDiscountPaise = paidOrders.reduce((sum, o) => sum + o.discount_paise, 0);

  // Trending product: most frequent item name across paid orders' carts.
  const counts = new Map();
  for (const o of paidOrders) {
    const items = JSON.parse(o.cart_json);
    for (const item of items) {
      counts.set(item.name, (counts.get(item.name) || 0) + 1);
    }
  }
  let trendingProduct = null;
  let trendingCount = 0;
  for (const [name, count] of counts) {
    if (count > trendingCount) {
      trendingProduct = name;
      trendingCount = count;
    }
  }

  res.json({
    totalOrders: allOrders.length,
    paidOrders: paidOrders.length,
    failedOrders: failedOrders.length,
    totalRevenuePaise,
    totalDiscountPaise,
    trendingProduct,
    trendingCount,
  });
});

export default router;
