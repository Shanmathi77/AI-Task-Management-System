const express = require("express");
const router = express.Router();

// Analytics
router.get("/analytics", (req, res) => {
  res.json({ ok: true, data: [] });
});

// Dashboard
router.get("/dashboard/summary", (req, res) => {
  res.json({
    ok: true,
    summary: {
      total: 0,
      completed: 0,
      running: 0,
      overdue: 0,
    }
  });
});

// AI
router.post("/ai/score-batch/run-and-summary", (req, res) => {
  res.json({
    ok: true,
    score: 0,
    insight: "No activity yet. Start completing tasks 🚀"
  });
});

// Automations
router.get("/automations", (req, res) => {
  res.json({ ok: true, automations: [] });
});

// Workflow rules
router.get("/workflow-rules", (req, res) => {
  res.json({ ok: true, rules: [] });
});
router.post("/workflow-rules", (req, res) => {
  res.json({ ok: true });
});

// Invites
router.get("/user-invites", (req, res) => {
  res.json({ ok: true, invites: [] });
});
router.get("/invites/list", (req, res) => {
  res.json({ ok: true, invites: [] });
});

// Teams
router.post("/teams", (req, res) => {
  res.json({ ok: true, team: { id: Date.now(), ...req.body } });
});
router.post("/user-teams", (req, res) => {
  res.json({ ok: true });
});

module.exports = router;
