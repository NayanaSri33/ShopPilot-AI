const API_URL = "http://localhost:4000/api";

// Products
export async function getProducts() {
  const res = await fetch(`${API_URL}/products`);
  return res.json();
}

// Orders
export async function createOrder(data) {
  const res = await fetch(`${API_URL}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return res.json();
}

// Real orders (merchant dashboard)
export async function getOrders(limit = 20) {
  const res = await fetch(`${API_URL}/orders?limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch orders.");
  return res.json();
}

// Honest, computed dashboard/hero stats — aggregated server-side from
// the same orders table /api/orders reads from. Nothing here is typed
// marketing copy.
export async function getOrderStats() {
  const res = await fetch(`${API_URL}/orders/stats/summary`);
  if (!res.ok) throw new Error("Failed to fetch order stats.");
  return res.json();
}

// Razorpay Order
export async function createRazorpayOrder(orderId) {
  const res = await fetch(`${API_URL}/payments/razorpay-order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ orderId }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to create Razorpay order");
  }

  return data;
}

// Verify Payment
export async function verifyPayment(data) {
  const res = await fetch(`${API_URL}/payments/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return res.json();
}

// Failed Payment
export async function reportPaymentFailure(orderId, reason) {
  const res = await fetch(`${API_URL}/payments/failed`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ orderId, reason }),
  });

  return res.json();
}

// Retry Payment
export async function retryPayment(orderId) {
  const res = await fetch(`${API_URL}/payments/retry`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ orderId }),
  });

  return res.json();
}

// Load Razorpay SDK
export async function loadRazorpayCheckout() {
  if (window.Razorpay) return true;

  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// ⭐ GEMINI AI CHAT AGENT
export async function chatWithAI(message) {
  const res = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  });

  if (!res.ok) {
    throw new Error("AI Agent request failed.");
  }

  return res.json();
}
// Fetch Audit Trail
export async function fetchAuditLog() {
  const res = await fetch("http://localhost:4000/api/audit");

  if (!res.ok) {
    throw new Error("Failed to fetch audit log.");
  }

  return res.json();
}