// backend/routes/automationsRoutes.cjs
const express = require("express");

module.exports = (db = {}, PG_POOL = null) => {
  const router = express.Router();
  
 

  // GET all automations
  router.get("/", async (req, res) => {
    if (PG_POOL) {
      try {
        const { rows } = await PG_POOL.query(
          "SELECT id,name,enabled,last_run,schedule FROM automations ORDER BY id"
        );
        return res.json({ ok: true, automations: rows });
      } catch (pgErr) {
        console.warn("automations: PG query failed", pgErr?.message || pgErr);
      }
    }
    return res.json({ ok: true, automations: Array.isArray(db.automations) ? db.automations : [] });
  });

  // POST new automation
  router.post("/", async (req, res) => {
    const { name } = req.body || {};
    if (!name) return res.status(400).json({ ok: false, message: "Missing name" });

    if (PG_POOL) {
      try {
        const { rows } = await PG_POOL.query(
          "INSERT INTO automations (name,enabled,last_run) VALUES ($1,true,NULL) RETURNING id,name,enabled,last_run,schedule",
          [name]
        );
        return res.json({ ok: true, automation: rows[0] });
      } catch (pgErr) {
        console.warn("automations create PG failed", pgErr?.message || pgErr);
      }
    }

    db.automations = db.automations || [];
    const id = (db.automations.reduce((m, a) => Math.max(m, Number(a.id) || 0), 0) || 0) + 1;
    const a = { id, name, enabled: true, last_run: null, schedule: null };
    db.automations.push(a);
    return res.json({ ok: true, automation: a });
  });

  // PATCH toggle enabled
  router.patch("/:id/toggle", async (req, res) => {
    const id = Number(req.params.id);

    if (PG_POOL) {
      try {
        const { rows } = await PG_POOL.query(
          "UPDATE automations SET enabled = NOT enabled WHERE id=$1 RETURNING id,name,enabled,last_run,schedule",
          [id]
        );
        if (rows && rows[0]) return res.json({ ok: true, automation: rows[0] });
      } catch (pgErr) {
        console.warn("automations toggle PG failed", pgErr?.message || pgErr);
      }
    }

    db.automations = db.automations || [];
    const a = db.automations.find(x => Number(x.id) === id);
    if (!a) return res.status(404).json({ ok: false, message: "Not found" });
    a.enabled = !Boolean(a.enabled);
    return res.json({ ok: true, automation: a });
  });
  
  // POST run automation
  router.post("/:id/run", async (req, res) => {
    try {
      const { id } = req.params;

      // 🔥 CORRECT PLACE TO ACCESS IO
      const io = req.app.get("io");

      const result = {
        automationId: id,
        status: "success",
        message: "Automation executed",
        at: new Date().toISOString(),
      };

      if (io) {
        io.emit("automation-run", result);
      }

      res.json({ success: true, result });
    } catch (err) {
      console.error("Automation run failed", err);
      res.status(500).json({ error: "Run failed" });
    }
  });
  
  // PUT update automation (schedule)
  router.put("/:id", async (req, res) => {
    const id = Number(req.params.id);
    const { schedule } = req.body || {};

    if (PG_POOL) {
      try {
        const { rows } = await PG_POOL.query(
          "UPDATE automations SET schedule=$1 WHERE id=$2 RETURNING id,name,enabled,last_run,schedule",
          [schedule || null, id]
        );
        if (rows && rows[0]) return res.json({ ok: true, automation: rows[0] });
      } catch (pgErr) {
        console.warn("automations PUT PG failed", pgErr?.message || pgErr);
      }
    }

    db.automations = db.automations || [];
    const a = db.automations.find(x => Number(x.id) === id);
    if (!a) return res.status(404).json({ ok: false, message: "Not found" });
    a.schedule = schedule || null;
    return res.json({ ok: true, automation: a });
  });
  
 router.get("/automation-logs", async (req, res) => {
  const rows = await pool.query("SELECT * FROM automation_logs ORDER BY created_at DESC");
  res.json(rows.rows);
});


  return router;
};
