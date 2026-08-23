import db from "./index.js";

const VALID_TAGS = new Set(["explained", "bounded", "gated"]);

const insertStmt = db.prepare(`
  INSERT INTO audit_log (actor, action, tag, reason, amount_paise, order_id, metadata)
  VALUES (@actor, @action, @tag, @reason, @amount_paise, @order_id, @metadata)
`);

/**
 * Write one row to the audit trail. This is the only way any route in
 * this backend is allowed to record an agent decision — no action that
 * touches money should happen without a call to this.
 */
export function logAction({
  actor = "agent",
  action,
  tag,
  reason,
  amountPaise = null,
  orderId = null,
  metadata = null,
}) {
  if (!action || !reason) {
    throw new Error("logAction requires at least `action` and `reason`");
  }
  if (!VALID_TAGS.has(tag)) {
    throw new Error(`logAction: tag must be one of ${[...VALID_TAGS].join(", ")}`);
  }

  const row = insertStmt.run({
    actor,
    action,
    tag,
    reason,
    amount_paise: amountPaise,
    order_id: orderId,
    metadata: metadata ? JSON.stringify(metadata) : null,
  });

  return row.lastInsertRowid;
}

export function getRecentAuditRows(limit = 20) {
  return db
    .prepare(`SELECT * FROM audit_log ORDER BY id DESC LIMIT ?`)
    .all(limit)
    .map((row) => ({
      ...row,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
    }));
}
