import { useEffect, useRef, useState } from "react";
import { fetchAuditLog } from "../api";

const TAG_LABEL = {
  explained: "Explained",
  bounded: "Bounded",
  gated: "Gated",
};

function formatAmount(paise) {
  if (paise === null || paise === undefined) return null;
  const rupees = paise / 100;
  const sign = rupees < 0 ? "-" : "";
  return `${sign}₹${Math.abs(rupees).toLocaleString("en-IN")}`;
}

function timeAgo(isoLike) {
  // SQLite gives "YYYY-MM-DD HH:MM:SS" in UTC — normalize for Date().
  const date = new Date(isoLike.replace(" ", "T") + "Z");
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

/**
 * Real audit trail, read from the backend. Every row here corresponds to
 * an actual decision a route made (see backend/routes/orders.js) — this
 * is not a mock feed cycling on a timer.
 */
function AgentLedger({ title = "Agent audit trail", rows = 5 }) {
  const [feed, setFeed] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ok | offline
  const lastIdRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const data = await fetchAuditLog(rows);
        if (cancelled) return;
        setFeed(data.rows);
        setStatus("ok");
        lastIdRef.current = data.rows[0]?.id ?? lastIdRef.current;
      } catch (err) {
        if (cancelled) return;
        setStatus("offline");
      }
    }

    poll();
    const interval = setInterval(poll, 4000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [rows]);

  return (
    <div className="ledger">
      <div className="ledger-head">
        <span
          className={`ledger-live-dot${status === "offline" ? " ledger-live-dot-offline" : ""}`}
          aria-hidden="true"
        />
        <span className="ledger-title">{title}</span>
        <span className="ledger-live-label">
          {status === "ok" ? "live" : status === "offline" ? "offline" : "…"}
        </span>
      </div>

      {status === "offline" && (
        <div className="ledger-offline-note">
          Can't reach the backend at <code>/api/audit</code>. Start it with{" "}
          <code>cd backend && npm run dev</code> to see real agent activity
          here.
        </div>
      )}

      {status !== "offline" && feed.length === 0 && (
        <div className="ledger-offline-note">No agent activity yet — place an order to generate the first entries.</div>
      )}

      <ul className="ledger-feed">
        {feed.map((row, i) => (
          <li
            className={`ledger-row${i === 0 ? " ledger-row-new" : ""}`}
            key={row.id}
          >
            <span className={`ledger-chip ledger-chip-${row.tag}`}>
              {TAG_LABEL[row.tag] || row.tag}
            </span>
            <span className="ledger-text">
              {row.reason}
              <span className="ledger-time"> · {timeAgo(row.created_at)}</span>
            </span>
            {formatAmount(row.amount_paise) && (
              <span className="ledger-amount">{formatAmount(row.amount_paise)}</span>
            )}
          </li>
        ))}
      </ul>

      <p className="ledger-foot">
        Every action a merchant or buyer can query — nothing moves money
        without a reason attached.
      </p>
    </div>
  );
}

export default AgentLedger;
