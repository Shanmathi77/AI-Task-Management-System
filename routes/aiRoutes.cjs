// backend/routes/aiRoutes.cjs
const express = require("express");

function calculateTaskScore(task) {
  let score = 50;

  if (task.priority === "high") score += 25;
  if (task.priority === "low") score -= 10;

  if (task.due_date) {
    const diff = new Date(task.due_date) - new Date();
    if (diff < 0) score += 30;
    else if (diff < 86400000) score += 15;
  }

  if (task.status === "completed") score -= 20;
  return Math.max(0, Math.min(100, score));
}

module.exports = (db) => {
  const router = express.Router();
  db.tasks = db.tasks || [];

  router.post("/score-batch/run-and-summary", (req, res) => {
    // TEMP: allow all authenticated users
const role = req.headers["x-user-role"];
console.log("AI role:", role);


    const scored = db.tasks.map(t => ({
      ...t,
      ai_score: calculateTaskScore(t),
    }));

    const avg =
      scored.reduce((a, b) => a + b.ai_score, 0) /
      (scored.length || 1);

    res.json({
      ok: true,
      score: Math.round(avg),
      insight:
        avg < 40
          ? "Tasks are risky ⚠️"
          : avg < 70
          ? "Moderate workload 👍"
          : "High urgency 🚨",
      tasks: scored,
    });
  });

  router.post("/score-batch", (req, res, next) => {
    req.url = "/score-batch/run-and-summary";
    next();
  });

  return router;
};
