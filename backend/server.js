import cors from "cors";
import dotenv from "dotenv";
import express from "express";

dotenv.config({ override: true });
import chatRoutes from "./routes/chat.js";

import { getRecentAuditRows, logAction } from "./db/audit.js";
import auditRoutes from "./routes/audit.js";
import orderRoutes from "./routes/orders.js";
import paymentRoutes from "./routes/payments.js";
import productRoutes from "./routes/products.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "shoppilot-backend" });
});

app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/chat", chatRoutes);

app.listen(PORT, () => {
  // Seed one real audit row on boot, so the ledger is never empty and
  // never lying — everything after this comes from actual route calls.
  if (getRecentAuditRows(1).length === 0) {
    logAction({
      actor: "system",
      action: "server_started",
      tag: "explained",
      reason: "ShopPilot backend booted. Audit trail starts here.",
    });
  }

  console.log(`ShopPilot backend running on http://localhost:${PORT}`);
});
