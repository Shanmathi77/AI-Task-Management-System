//dashboardRoutes.cjs 

const express = require("express");

module.exports = (db, PG_POOL) => {
  const router = express.Router();

  router.get("/summary", async (req, res) => {
    try {
      if (!PG_POOL) {
        const tasks = db.tasks || [];
        return res.json({
          ok: true,
          summary: {
            total: tasks.length,
            completed: tasks.filter(t => t.status === "completed").length,
            overdue: tasks.filter(t => t.status === "overdue").length,
            running: tasks.filter(t => t.status === "running").length,
          },
        });
      }

      const { rows } = await PG_POOL.query(`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE status='done') AS completed,
          COUNT(*) FILTER (WHERE status='pending') AS overdue,
          COUNT(*) FILTER (WHERE status='in_progress') AS running
        FROM tasks
      `);

      res.json({
        ok: true,
        summary: {
          total: Number(rows[0].total),
          completed: Number(rows[0].completed),
          overdue: Number(rows[0].overdue),
          running: Number(rows[0].running),
        },
      });
    } catch (err) {
      console.error("dashboard summary error", err);
      res.status(500).json({ ok: false });
    }
  });

  return router;
};
