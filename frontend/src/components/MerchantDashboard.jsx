import { useEffect, useState } from "react";
import AgentLedger from "./AgentLedger";
import { getOrders, getOrderStats } from "../api";

function formatRupees(paise) {
  return `₹${Math.round((paise || 0) / 100).toLocaleString("en-IN")}`;
}

/**
 * Real merchant dashboard: orders and stats both come from the backend
 * (`GET /api/orders` and `GET /api/orders/stats/summary`), which read
 * the same SQLite `orders` table every checkout writes to. Nothing on
 * this page is a hardcoded array — place a real test-mode order and
 * it shows up here.
 */
function MerchantDashboard() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ok | offline

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [ordersRes, statsRes] = await Promise.all([
          getOrders(10),
          getOrderStats(),
        ]);
        if (cancelled) return;
        setOrders(ordersRes.orders);
        setStats(statsRes);
        setStatus("ok");
      } catch (err) {
        if (cancelled) return;
        setStatus("offline");
      }
    }

    load();
    const interval = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <section className="merchant-dashboard">
      {/* Header */}
      <div className="merchant-header">
        <div>
          <p className="merchant-tag">Merchant AI Dashboard</p>
          <h1>Welcome back, Merchant</h1>
        </div>
      </div>

      {status === "offline" && (
        <div className="ledger-offline-note">
          Can't reach the backend. Start it with{" "}
          <code>cd backend && npm run dev</code> to see real orders and
          stats here.
        </div>
      )}

      {/* Stats — computed server-side from actual orders, not typed copy */}
      <div className="dashboard-cards">
        <div className="dashboard-card revenue">
          <p>Verified revenue</p>
          <h2>{stats ? formatRupees(stats.totalRevenuePaise) : "—"}</h2>
          <span>
            {stats
              ? `${stats.paidOrders} paid order${stats.paidOrders === 1 ? "" : "s"}`
              : "Loading…"}
          </span>
        </div>

        <div className="dashboard-card orders">
          <p>Total orders</p>
          <h2>{stats ? stats.totalOrders : "—"}</h2>
          <span>
            {stats
              ? `${stats.failedOrders} failed / retried gracefully`
              : "Loading…"}
          </span>
        </div>

        <div className="dashboard-card upsell">
          <p>Discounts granted</p>
          <h2>{stats ? formatRupees(stats.totalDiscountPaise) : "—"}</h2>
          <span>Server-clamped to the ₹300/order cap</span>
        </div>

        <div className="dashboard-card customers">
          <p>Trending product</p>
          <h2 style={{ fontSize: 18 }}>
            {stats?.trendingProduct || "No orders yet"}
          </h2>
          <span>
            {stats?.trendingProduct
              ? `${stats.trendingCount} paid order(s)`
              : "Place a test order to populate this"}
          </span>
        </div>
      </div>

      {/* Audit trail — same signature widget shown on the buyer side,
          so a merchant can see exactly why the agent did what it did */}
      <AgentLedger title="Agent audit trail — this merchant" rows={8} />

      {/* Orders Table — real rows from /api/orders */}
      <div className="orders-table">
        <h2>Recent orders</h2>

        {orders.length === 0 ? (
          <p className="ledger-offline-note">
            No orders yet — place a test-mode order from the storefront to
            see it appear here in real time.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>
                    {order.cart_json.map((i) => i.name).join(", ")}
                  </td>
                  <td>{formatRupees(order.total_paise)}</td>
                  <td>
                    <span
                      className={
                        order.status === "paid"
                          ? "status paid"
                          : order.status === "failed"
                          ? "status failed"
                          : "status pending"
                      }
                    >
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

export default MerchantDashboard;
