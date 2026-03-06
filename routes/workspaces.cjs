// backend/routes/workspaces.cjs
const express = require("express");
const router = express.Router();
const { PG_POOL: pool, _inMemoryDB: db } = require("../db.cjs");
const { requireAuth } = require("../middleware/auth.cjs");

// helper: getUserWorkspaces (PG or in-memory)
async function getUserWorkspaces(userId) {
  if (pool) {
    const { rows } = await pool.query(`SELECT w.*, uw.role FROM workspaces w JOIN user_workspaces uw ON uw.workspace_id = w.id WHERE uw.user_id = $1`, [userId]);
    return rows;
  } else {
    const uw = (db.user_workspaces || []).filter(u => Number(u.user_id) === Number(userId));
    const ids = uw.map(u => Number(u.workspace_id));
    const list = (db.workspaces || []).filter(w => ids.includes(Number(w.id)));
    return list.map(w => {
      const meta = uw.find(x => Number(x.workspace_id) === Number(w.id)) || {};
      return { ...w, role: meta.role || null };
    });
  }
}

// create workspace
router.post("/", requireAuth, async (req, res) => {
  const { name, description } = req.body || {};
  const userId = req.user?.id ?? null;
  if (!name) return res.status(400).json({ ok: false, error: "Workspace name required" });
  try {
    if (pool) {
      const insertRes = await pool.query(`INSERT INTO workspaces (name,description,created_by) VALUES ($1,$2,$3) RETURNING *`, [name, description || "", userId]);
      const workspace = insertRes.rows[0];
      await pool.query(`INSERT INTO user_workspaces (user_id,workspace_id,role) VALUES ($1,$2,'team_lead')`, [userId, workspace.id]);
      return res.status(201).json({ ok: true, workspace });
    } else {
      db.workspaces = db.workspaces || [];
      const nextId = ((db.workspaces.reduce((m,it)=>Math.max(m,Number(it.id)||0),0) || 0) + 1);
      const ws = { id: nextId, name, description: description || "", created_by: userId, created_at: new Date().toISOString() };
      db.workspaces.push(ws);
      db.user_workspaces = db.user_workspaces || [];
      db.user_workspaces.push({ user_id: userId, workspace_id: nextId, role: "team_lead" });
      return res.status(201).json({ ok: true, workspace: ws });
    }
  } catch (err) {
    console.error("POST /workspaces error", err);
    return res.status(500).json({ ok: false, error: "Database error" });
  }
});

router.get("/", requireAuth, async (req, res) => {
  try {
    const list = await getUserWorkspaces(req.user.id);
    return res.json({ ok: true, workspaces: list });
  } catch (err) {
    console.error("GET /workspaces error", err);
    return res.status(500).json({ ok: false, error: "Database error" });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    if (pool) {
      const r = await pool.query("SELECT * FROM workspaces WHERE id=$1", [req.params.id]);
      if (!r.rows.length) return res.status(404).json({ ok: false, error: "Workspace not found" });
      return res.json({ ok: true, workspace: r.rows[0] });
    } else {
      const found = (db.workspaces || []).find(w => String(w.id) === String(req.params.id));
      if (!found) return res.status(404).json({ ok: false, error: "Workspace not found" });
      return res.json({ ok: true, workspace: found });
    }
  } catch (err) {
    console.error("GET /workspaces/:id error", err);
    return res.status(500).json({ ok: false, error: "Database error" });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  const { name, description } = req.body || {};
  try {
    if (pool) {
      const updateRes = await pool.query("UPDATE workspaces SET name = COALESCE($1,name), description = COALESCE($2,description) WHERE id = $3 RETURNING *", [name, description, req.params.id]);
      if (!updateRes.rows.length) return res.status(404).json({ ok: false, error: "Workspace not found" });
      return res.json({ ok: true, workspace: updateRes.rows[0] });
    } else {
      const idx = (db.workspaces || []).findIndex(w => String(w.id) === String(req.params.id));
      if (idx === -1) return res.status(404).json({ ok: false, error: "Workspace not found" });
      db.workspaces[idx].name = name ?? db.workspaces[idx].name;
      db.workspaces[idx].description = description ?? db.workspaces[idx].description;
      return res.json({ ok: true, workspace: db.workspaces[idx] });
    }
  } catch (err) {
    console.error("PUT /workspaces/:id error", err);
    return res.status(500).json({ ok: false, error: "Database error" });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    if (pool) {
      await pool.query("DELETE FROM workspaces WHERE id = $1", [req.params.id]);
      return res.json({ ok: true });
    } else {
      db.workspaces = (db.workspaces || []).filter(w => String(w.id) !== String(req.params.id));
      db.user_workspaces = (db.user_workspaces || []).filter(uw => String(uw.workspace_id) !== String(req.params.id));
      return res.json({ ok: true });
    }
  } catch (err) {
    console.error("DELETE /workspaces/:id error", err);
    return res.status(500).json({ ok: false, error: "Database error" });
  }
});

module.exports = router;
