//teamsRoutes.cjs
const express = require("express");

module.exports = (db, PG_POOL, io) => {
  const router = express.Router();

  db.teams = db.teams || [];

  /* GET ALL TEAMS */
  router.get("/", async (_, res) => {
    try {
      if (PG_POOL) {
        const r = await PG_POOL.query(
          "SELECT id, name, description FROM teams ORDER BY id"
        );
        return res.json({ ok: true, teams: r.rows });
      }
      res.json({ ok: true, teams: db.teams });
    } catch (err) {
      console.error("Fetch teams failed:", err);
      res.status(500).json({ message: "Fetch teams failed" });
    }
  });

  /* CREATE NEW TEAM */
  router.post("/", async (req, res) => {
    try {
      const { name, description = "" } = req.body;
      if (!name?.trim()) {
        return res.status(400).json({ message: "Team name required" });
      }

      let team;

      if (PG_POOL) {
        const r = await PG_POOL.query(
          `INSERT INTO teams (name, description, created_at)
           VALUES ($1,$2,NOW())
           RETURNING id, name, description`,
          [name.trim(), description]
        );
        team = r.rows[0];
      } else {
        team = { id: Date.now(), name: name.trim(), description };
        db.teams.push(team);
      }

      res.json({ ok: true, team });
    } catch (err) {
      console.error("Create team failed:", err);
      res.status(500).json({ message: "Server error" });
    }
  });

  /* SWITCH ACTIVE TEAM */
  router.post("/:teamId/switch", async (req, res) => {
    const teamId = Number(req.params.teamId);

    let team;

    if (PG_POOL) {
      // ✅ Check Postgres for team
      const r = await PG_POOL.query(
        "SELECT id, name, description FROM teams WHERE id=$1",
        [teamId]
      );
      team = r.rows[0];
      if (!team) {
        return res.status(404).json({ ok: false, message: "Team not found" });
      }
    } else {
      // Fallback to in-memory
      team = db.teams.find(t => Number(t.id) === teamId);
      if (!team) {
        return res.status(404).json({ ok: false, message: "Team not found" });
      }
    }

    // Notify all clients
    io?.emit("team:switched", { teamId });

    res.json({
      ok: true,
      active_team_id: teamId,
      team,
    });
  });

  return router;
};
