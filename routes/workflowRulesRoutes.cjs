// backend/routes/workflowRulesRoutes.cjs
const express = require("express");

module.exports = (db = {}, PG_POOL = null, io) => {
  const router = express.Router();

  // GET all workflow rules
  router.get("/", async (req, res) => {
    if (PG_POOL) {
      try {
        const { rows } = await PG_POOL.query(
          "SELECT id,name,enabled,last_run,schedule FROM workflow_rules ORDER BY id"
        );
        return res.json({ ok: true, rules: rows });
      } catch (pgErr) {
        console.warn("workflow_rules: PG query failed", pgErr?.message || pgErr);
      }
    }
    return res.json({ ok: true, rules: Array.isArray(db.workflowRules) ? db.workflowRules : [] });
  });

  // POST new workflow rule
  router.post("/", async (req, res) => {
    const { name } = req.body || {};
    if (!name) return res.status(400).json({ ok: false, message: "Missing name" });

    if (PG_POOL) {
      try {
        const { rows } = await PG_POOL.query(
          "INSERT INTO workflow_rules (name,enabled,last_run) VALUES ($1,true,NULL) RETURNING id,name,enabled,last_run,schedule",
          [name]
        );
        return res.json({ ok: true, rule: rows[0] });
      } catch (pgErr) {
        console.warn("workflow_rules create PG failed", pgErr?.message || pgErr);
      }
    }

    db.workflowRules = db.workflowRules || [];
    const id = (db.workflowRules.reduce((m, r) => Math.max(m, Number(r.id) || 0), 0) || 0) + 1;
    const r = { id, name, enabled: true, last_run: null, schedule: null };
    db.workflowRules.push(r);
    return res.json({ ok: true, rule: r });
  });

  // PATCH toggle enabled
  router.patch("/:id/toggle", async (req, res) => {
    const id = Number(req.params.id);

    if (PG_POOL) {
      try {
        const { rows } = await PG_POOL.query(
          "UPDATE workflow_rules SET enabled = NOT enabled WHERE id=$1 RETURNING id,name,enabled,last_run,schedule",
          [id]
        );
        if (rows && rows[0]) return res.json({ ok: true, rule: rows[0] });
      } catch (pgErr) {
        console.warn("workflow_rules toggle PG failed", pgErr?.message || pgErr);
      }
    }

    db.workflowRules = db.workflowRules || [];
    const r = db.workflowRules.find(x => Number(x.id) === id);
    if (!r) return res.status(404).json({ ok: false, message: "Not found" });
    r.enabled = !Boolean(r.enabled);
    return res.json({ ok: true, rule: r });
  });

  // POST run workflow rule
  router.post("/:id/run", (req, res) => {
    const id = Number(req.params.id);
    io?.emit("workflow-rule:run", { id });
    res.json({ ok: true, message: "Rule executed", id });
  });

  // PUT update workflow rule (schedule)
  router.put("/:id", async (req, res) => {
    const id = Number(req.params.id);
    const { schedule } = req.body || {};

    if (PG_POOL) {
      try {
        const { rows } = await PG_POOL.query(
          "UPDATE workflow_rules SET schedule=$1 WHERE id=$2 RETURNING id,name,enabled,last_run,schedule",
          [schedule || null, id]
        );
        if (rows && rows[0]) return res.json({ ok: true, rule: rows[0] });
      } catch (pgErr) {
        console.warn("workflow_rules PUT PG failed", pgErr?.message || pgErr);
      }
    }

    db.workflowRules = db.workflowRules || [];
    const r = db.workflowRules.find(x => Number(x.id) === id);
    if (!r) return res.status(404).json({ ok: false, message: "Not found" });
    r.schedule = schedule || null;
    return res.json({ ok: true, rule: r });
  });

  return router;
};
