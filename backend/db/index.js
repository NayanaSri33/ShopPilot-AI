import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, "shoppilot.db"));

db.pragma("journal_mode = WAL");

// ---------------------------------------------------------------
// Schema. Kept intentionally small: this is a buildathon backend,
// not a production one. Every table maps to something the judging
// bar actually checks for.
// ---------------------------------------------------------------
db.exec(`
  CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    actor TEXT NOT NULL,              -- 'agent' | 'system' | merchant/user id
    action TEXT NOT NULL,             -- short machine-readable action name
    tag TEXT NOT NULL,                -- 'explained' | 'bounded' | 'gated'
    reason TEXT NOT NULL,             -- human-readable "why"
    amount_paise INTEGER,             -- nullable, money impact if any
    order_id TEXT,                    -- nullable, links to an order
    metadata TEXT                     -- nullable JSON blob for extra context
  );

  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,              -- our own order id
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    status TEXT NOT NULL DEFAULT 'created', -- created | paid | failed | recovered
    subtotal_paise INTEGER NOT NULL,
    discount_paise INTEGER NOT NULL DEFAULT 0,
    gst_paise INTEGER NOT NULL DEFAULT 0,
    total_paise INTEGER NOT NULL,
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    cart_json TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS merchants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

export default db;
