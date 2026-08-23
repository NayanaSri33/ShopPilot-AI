# ShopPilot AI — backend

## What's here

- **`db/index.js`** — SQLite schema: `audit_log`, `orders`, `merchants`.
- **`db/audit.js`** — `logAction()`, the single function every route uses
  to write an agent decision to the audit trail. Every row is tagged
  `explained` / `bounded` / `gated`.
- **`routes/products.js`** — serves the catalog from
  `frontend/src/data/products.js` (single source of truth).
- **`routes/orders.js`** — `POST /api/orders` re-prices every cart item
  server-side, verifies each id against the catalog, applies the coupon
  cap (₹300/order, hard-clamped, not just described in copy), and writes
  an audit row for each decision.
- **`routes/payments.js`** — the Razorpay integration:
  - `POST /api/payments/razorpay-order` — creates a Razorpay Order for
    an amount taken from our own DB row (never from the client).
  - `POST /api/payments/verify` — recomputes the HMAC-SHA256 signature
    server-side with the Razorpay key secret and only marks an order
    `paid` if it matches. This is the actual gate against a forged
    "success" sent from a tampered browser.
  - `POST /api/payments/failed` / `POST /api/payments/retry` — handles a
    declined/dismissed checkout gracefully: no charge, order stays
    `failed`, buyer can retry the same order id.
- **`routes/audit.js`** — `GET /api/audit?limit=20`, what the frontend's
  `AgentLedger` widget polls.
- **`GET /api/orders/stats/summary`** — aggregates the real `orders`
  table (revenue, discount totals, trending product) for the homepage
  hero and merchant dashboard. Every number is computed, not typed.
- **`GET /api/products/agent-catalog`** — machine-readable catalog for
  an AI *buyer* agent: product list plus the checkout endpoints it needs
  to actually transact.

## Running it

```bash
npm install
cp .env.example .env   # then fill in your Razorpay TEST keys
npm run dev
```

Without keys in `.env`, `/api/products`, `/api/orders`, and `/api/audit`
all still work — only the actual Razorpay order creation step degrades
with a clear 503 instead of crashing. Get test-mode keys from Razorpay
Dashboard → Settings → API Keys, and make sure you're in **Test Mode**.

## Testing the payment gate without opening the real Checkout UI

The signature-verification logic doesn't need a live Razorpay call — it's
pure HMAC. To sanity check it:

```bash
# 1. Create an order and note its id
curl -s -X POST localhost:4000/api/orders -H "Content-Type: application/json" \
  -d '{"cart":[{"id":1}]}'

# 2. Compute a signature the same way Razorpay does, using your test secret:
#    hmac_sha256(razorpay_order_id + "|" + razorpay_payment_id, key_secret)
# 3. POST it to /api/payments/verify — correct signature marks the order
#    paid, a wrong one is rejected and the order is marked failed.
```

## Not built yet (see project README for the full roadmap)

- Webhook endpoint (`payment.captured` from Razorpay directly, as a
  backup to the client-side `handler` callback — recommended for
  production, since the browser callback can be missed if the tab closes)
- Bound-enforcement beyond the coupon cap (e.g. per-customer discount
  history)
- Merchant auth (hash + login) backed by the `merchants` table — the
  frontend currently uses a `localStorage`-based demo login instead

## Recently wired up

- Merchant dashboard now reads real `/api/orders` and
  `/api/orders/stats/summary` data instead of a hardcoded array —
  place a test order and it shows up there within 5s.
