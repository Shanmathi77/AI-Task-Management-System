const express = require("express");

module.exports = (db, PG_POOL) => {
  const router = express.Router();

  // GET /api/workspaces
  router.get("/", (_, res) => {
    res.json({ ok: true, workspaces: db.workspaces || [] });
  });

  // POST /api/workspaces
  router.post("/", (req, res) => {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Name required" });
    }

    db.workspaces = db.workspaces || [];
    const ws = { id: Date.now(), name };
    db.workspaces.push(ws);

    res.status(201).json({ ok: true, workspace: ws });
  });

  // GET /api/workspaces/:id/invites
  router.get("/:id/invites", async (req, res) => {
    const id = Number(req.params.id);

    if (PG_POOL) {
      const r = await PG_POOL.query(
        "SELECT * FROM invites WHERE team_id=$1 ORDER BY created_at DESC",
        [id]
      );
      return res.json({ ok: true, invites: r.rows });
    }

    const invites = (db.invites || []).filter(
      (i) => Number(i.team_id) === id
    );
    res.json({ ok: true, invites });
  });

  // POST /api/workspaces/:id/invite
  router.post("/:id/invite", (req, res) => {
    const team_id = Number(req.params.id);
    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({ message: "Missing email or role" });
    }

    db.invites = db.invites || [];

    const invite = {
      id: Date.now(),
      email,
      role,
      team_id,
      status: "pending",
      created_at: new Date(),
    };

    db.invites.push(invite);
    res.json({ ok: true, invite });
  });

  return router;
};
