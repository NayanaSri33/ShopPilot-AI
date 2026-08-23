# ShopPilot AI

**Razorpay AI Buildathon — Track 01: AI Growth & Agentic Commerce**

A shopping agent that explains every move it makes with a buyer's money.
ShopPilot AI recommends, bundles, and checks buyers out over Razorpay's
test-mode rails — and logs a *reason* for every decision that touches
money, so a merchant or a shopper can see exactly why the agent did
what it did.

It also exposes a machine-readable catalog (`/api/products/agent-catalog`)
so a *non-human* buyer — another AI agent — can query prices and place an
order the same way the React storefront does.

---

## The three claims this project makes, and where to check them

| Claim | Where it's actually enforced |
|---|---|
| **Explained** — every agent action has a human-readable reason | `backend/db/audit.js` → `logAction()`. Every route that touches money or a recommendation calls this. Read live in the app under **Agent audit trail**, or `GET /api/audit`. |
| **Bounded** — discounts and prices can't exceed a hard limit | `backend/routes/orders.js` — the ₹300/order coupon cap is a `Math.min`/clamp in code, not just copy. Try a coupon that would exceed it and watch the `coupon_clamped` row appear in the ledger. |
| **Gated** — nothing charges without server-side verification | `backend/routes/payments.js` — `/verify` recomputes the Razorpay HMAC-SHA256 signature server-side with the key secret. A tampered client response is rejected and logged, never marked paid. |

One failure path is handled end-to-end, not just detected: a declined or
dismissed Razorpay Checkout marks the order `failed` (no charge), logs
it, and lets the buyer retry the *same* order id from
`frontend/src/pages/Checkout.jsx` — see `POST /api/payments/retry`.

Every number shown on the homepage and merchant dashboard (`Verified
revenue`, `Total orders`, `Discounts granted`, `Trending product`) is
computed live from the `orders` table by `GET /api/orders/stats/summary`
— none of it is hand-typed marketing copy.

---

## Architecture

```
┌─────────────────────┐        ┌──────────────────────────────────┐
│   React frontend     │        │            Express backend        │
│   (Vite, :5173)       │        │            (:4000)                │
│                       │  fetch │                                    │
│  Products / Cart      │───────▶│  /api/products  (+ agent-catalog) │
│  AI chat copilot       │        │  /api/orders    (+ stats/summary) │
│  Checkout (Razorpay JS)│        │  /api/payments  (razorpay-order,  │
│  Agent audit ledger    │◀───────│                  verify, retry)   │
│  Merchant dashboard     │        │  /api/audit                       │
└─────────────────────┘        │  /api/chat (Gemini orchestrator)  │
                                 └───────────────┬────────────────────┘
                                                 │
                                   ┌─────────────▼─────────────┐
                                   │   SQLite (better-sqlite3)  │
                                   │   orders · audit_log        │
                                   │   · merchants                │
                                   └─────────────────────────────┘
                                                 │
                                       ┌─────────▼─────────┐
                                       │  Razorpay (test)   │
                                       │  Orders + Checkout  │
                                       └────────────────────┘
```

The AI shopping copilot (`/api/chat`) runs a three-agent pipeline
(`backend/orchestrator/shoppingOrchestrator.js`):

1. **Intent agent** (Gemini) — turns free text ("pimples, budget 600") into
   structured intent (category, concern, budget, brand).
2. **Retrieval agent** — pulls candidate products (currently via SerpAPI
   Google Shopping; the local catalog in `frontend/src/data/products.js`
   is the source of truth for anything a buyer can actually purchase).
3. **Recommendation agent** (Gemini) — ranks the retrieved products
   against intent and explains *why* each one was picked.

## Agent-readable catalog (Track 01: "make the merchant transactable by
an AI buyer")

`GET /api/products/agent-catalog` returns the full catalog in a
schema.org-flavored shape plus the exact endpoints an agent buyer needs
to transact: create an order, pay, verify. Prices are always re-verified
server-side against this same catalog before anything is charged — an
agent buyer can't pay a stale or hallucinated price any more than a
human can.

## Not built yet (honest roadmap, not hidden)

- Razorpay webhook (`payment.captured`) as a backup to the client-side
  `handler` callback, for the case where a browser tab closes mid-payment
- Merchant auth backed by the `merchants` table (currently a
  `localStorage`-based demo login on the frontend — clearly a stand-in,
  not a security claim)
- Bound-enforcement beyond the per-order coupon cap (e.g. per-customer
  discount history, velocity limits)

---

## Running it locally

Two servers, two terminals.

**Backend**

```bash
cd backend
npm install
cp .env.example .env   # then fill in your Razorpay TEST-mode keys
npm run dev
```

Get test-mode keys from Razorpay Dashboard → Settings → API Keys (make
sure you're in **Test Mode**). Without keys, `/api/products`,
`/api/orders`, and `/api/audit` still work — only Razorpay order
creation degrades to a clear 503 instead of crashing. `GEMINI_API_KEY`
and `SERP_API_KEY` are optional too — only `/api/chat` needs them.

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (typically `http://localhost:5173`).

---

## A 2-minute demo script

1. Open the storefront. The **Agent audit trail** panel on the right is
   already live — it's polling `/api/audit` every 4s.
2. Add a pair of sneakers to the cart → the **AI upsell** offers a real
   bundle (socks, cleaner, shoe bag — all real catalog items, not
   decorative copy). Add it.
3. Go to checkout, apply coupon `SHOP150`, pay with a Razorpay
   **test card**. Watch `cart_verified_against_catalog`,
   `coupon_applied`, `razorpay_order_created`, and `payment_verified`
   land in the ledger in order.
4. Dismiss a *second* checkout attempt without paying — watch
   `payment_attempt_failed` log with `retryable: true`, then hit
   **Retry payment** on the same order id.
5. Log in as a merchant (demo auth) and see the same order, the same
   audit trail, and honestly-computed revenue/discount stats.
6. Hit `GET /api/products/agent-catalog` directly in a browser tab to
   show the machine-readable side of the "agentic commerce" story.

---

## Project layout

```
backend/    Express API, SQLite, Razorpay integration, Gemini agents
  README.md   — backend-specific implementation notes
frontend/   React (Vite) storefront + merchant dashboard
```

See `backend/README.md` for route-by-route detail.
