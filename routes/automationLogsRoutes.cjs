// backend/routes/automationLogsRoutes.cjs
const express = require("express");

module.exports = (db, PG_POOL) => {
  const router = express.Router();

  router.get("/", async (_req, res) => {
    try {
      if (PG_POOL) {
        const { rows } = await PG_POOL.query(
          "SELECT * FROM automation_logs ORDER BY created_at DESC"
        );
        return res.json(rows);
      }
      res.json(db.automation_logs || []);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to load automation logs" });
    }
  });

  return router;
};
