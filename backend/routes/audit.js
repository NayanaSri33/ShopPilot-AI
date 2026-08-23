import { Router } from "express";
import { getRecentAuditRows } from "../db/audit.js";

const router = Router();

// GET /api/audit?limit=5  -> most recent agent actions, for AgentLedger
router.get("/", (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const rows = getRecentAuditRows(limit);
  res.json({ rows });
});

export default router;
