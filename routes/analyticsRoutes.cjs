// backend/routes/analyticsRoutes.cjs
const express = require("express");

module.exports = (db) => {
  const router = express.Router();

  db.tasks = db.tasks || [];

  /* -------- TEAM ANALYTICS -------- */
  router.get("/team", (_, res) => {
    const map = {};

    db.tasks.forEach(t => {
      const user = t.assigned_to || "Unassigned";
      map[user] ??= { user, total: 0, completed: 0, overdue: 0 };
      map[user].total++;

      if (t.status === "completed") map[user].completed++;
      else if (t.due_date && new Date(t.due_date) < new Date())
        map[user].overdue++;
    });

    res.json({ ok: true, team: Object.values(map) });
  });

  /* -------- STATUS ANALYTICS -------- */
  router.get("/status", (_, res) => {
    const s = { pending: 0, in_progress: 0, completed: 0, overdue: 0 };

    db.tasks.forEach(t => {
      if (t.status === "completed") s.completed++;
      else if (t.status === "in_progress") s.in_progress++;
      else s.pending++;

      if (t.due_date && new Date(t.due_date) < new Date() && t.status !== "completed")
        s.overdue++;
    });

    res.json({ ok: true, status: s });
  });

  return router;
};
