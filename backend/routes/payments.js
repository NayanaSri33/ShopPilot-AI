import crypto from "node:crypto";
import { Router } from "express";
import Razorpay from "razorpay";
import db from "../db/index.js";
import { logAction } from "../db/audit.js";

const router = Router();

const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

const razorpay =
  KEY_ID && KEY_SECRET
    ? new Razorpay({
        key_id: KEY_ID,
        key_secret: KEY_SECRET,
      })
    : null;

// ================= DATABASE =================

const getOrder = db.prepare(`SELECT * FROM orders WHERE id = ?`);

const attachRazorpayOrder = db.prepare(`
  UPDATE orders
  SET razorpay_order_id = ?
  WHERE id = ?
`);

const markPaid = db.prepare(`
  UPDATE orders
  SET status = 'paid',
      razorpay_payment_id = ?
  WHERE id = ?
`);

const markFailed = db.prepare(`
  UPDATE orders
  SET status = 'failed'
  WHERE id = ?
`);

const markRecovered = db.prepare(`
  UPDATE orders
  SET status = 'created'
  WHERE id = ?
`);

// ======================================================
// CREATE RAZORPAY ORDER
// POST /api/payments/razorpay-order
// ======================================================

router.post("/razorpay-order", async (req, res) => {
  if (!razorpay) {
    return res.status(503).json({
      error:
        "Razorpay keys aren't configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env",
    });
  }

  const { orderId } = req.body || {};
  console.log("🟢 Creating Razorpay order for:", orderId);
console.log("🟢 Using Key ID:", KEY_ID);

  if (!orderId) {
    return res.status(400).json({
      error: "Order ID is required.",
    });
  }

  const order = getOrder.get(orderId);

  if (!order) {
    return res.status(404).json({
      error: "Order not found.",
    });
  }

  // ⭐ IMPORTANT FIX FOR TEST MODE
  // Remove previous Razorpay order so every checkout creates a fresh order.
  attachRazorpayOrder.run(null, order.id);

  // Reset failed orders.
  if (order.status === "failed") {
    markRecovered.run(order.id);
  }

  // Don't allow paying an already-paid order.
  if (order.status === "paid") {
    return res.status(400).json({
      error: "This order has already been paid.",
    });
  }

  try {
    const razorpayOrder = await razorpay.orders.create({
      amount: Number(order.total_paise), // Amount in paise
      currency: "INR",
      receipt: order.id,
      notes: {
        shoppilot_order_id: order.id,
      },
    });

    attachRazorpayOrder.run(razorpayOrder.id, order.id);

    logAction({
      actor: "agent",
      action: "razorpay_order_created",
      tag: "gated",
      reason: `Created Razorpay order for ${order.id}`,
      amountPaise: order.total_paise,
      orderId: order.id,
    });

    return res.json({
      key_id: KEY_ID,
      razorpay_order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      order_id: order.id,
    });
  } catch (error) {
    console.error("RAZORPAY ORDER ERROR:", error);

    return res.status(500).json({
      error: "Unable to create Razorpay order.",
    });
  }
});

// ======================================================
// VERIFY PAYMENT
// POST /api/payments/verify
// ======================================================

router.post("/verify", (req, res) => {
  const {
    orderId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = req.body || {};

  const order = getOrder.get(orderId);

  if (!order) {
    return res.status(404).json({
      error: "Order not found.",
    });
  }

  const generatedSignature = crypto
    .createHmac("sha256", KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (generatedSignature !== razorpay_signature) {
    markFailed.run(order.id);

    logAction({
      actor: "agent",
      action: "payment_signature_failed",
      tag: "gated",
      reason: `Signature verification failed for ${order.id}`,
      orderId: order.id,
    });

    return res.status(400).json({
      error: "Invalid payment signature.",
    });
  }

  markPaid.run(razorpay_payment_id, order.id);

  logAction({
    actor: "agent",
    action: "payment_verified",
    tag: "gated",
    reason: `Payment verified for ${order.id}`,
    amountPaise: order.total_paise,
    orderId: order.id,
  });

  return res.json({
    success: true,
    status: "paid",
    orderId: order.id,
  });
});

// ======================================================
// PAYMENT FAILED
// POST /api/payments/failed
// ======================================================

router.post("/failed", (req, res) => {
  const { orderId, reason } = req.body || {};

  const order = getOrder.get(orderId);

  if (!order) {
    return res.status(404).json({
      error: "Order not found.",
    });
  }

  markFailed.run(order.id);

  logAction({
    actor: "agent",
    action: "payment_failed",
    tag: "gated",
    reason: reason || "Payment declined.",
    orderId: order.id,
  });

  return res.json({
    success: true,
    status: "failed",
    retryable: true,
    orderId: order.id,
  });
});

// ======================================================
// RETRY PAYMENT
// POST /api/payments/retry
// ======================================================

router.post("/retry", (req, res) => {
  const { orderId } = req.body || {};

  const order = getOrder.get(orderId);

  if (!order) {
    return res.status(404).json({
      error: "Order not found.",
    });
  }

  // Reset status and remove previous Razorpay order.
  markRecovered.run(order.id);
  attachRazorpayOrder.run(null, order.id);

  logAction({
    actor: "agent",
    action: "payment_retry_started",
    tag: "gated",
    reason: `Retry started for ${order.id}`,
    orderId: order.id,
  });

  return res.json({
    success: true,
    status: "created",
    orderId: order.id,
  });
});

export default router;