// backend/routes/userTeamsRoutes.cjs
const express = require("express");

module.exports = (db, PG_POOL) => {
  const router = express.Router();

  /* =====================================
     GET teams for a user
     /api/user-teams?userId=1
  ===================================== */
  router.get("/", async (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.json({ ok: true, teams: [] });

    try {
      // ✅ Postgres
      if (PG_POOL) {
        const q = `
          SELECT t.id, t.name, ut.role
          FROM user_teams ut
          JOIN teams t ON t.id = ut.team_id
          WHERE ut.user_id = $1
        `;
        const r = await PG_POOL.query(q, [userId]);
        return res.json({ ok: true, teams: r.rows });
      }

      // ✅ In-memory fallback
      const teams = (db.user_teams || [])
        .filter((ut) => String(ut.user_id) === String(userId))
        .map((ut) => {
          const t = (db.teams || []).find((tt) => tt.id === ut.team_id);
          return t ? { id: t.id, name: t.name, role: ut.role || "team_member" } : null;
        })
        .filter(Boolean);

      res.json({ ok: true, teams });
    } catch (err) {
      console.error("user-teams error", err);
      res.status(500).json({ ok: false });
    }
  });

  /* =====================================
     POST link user to team
     /api/user-teams
  ===================================== */
  router.post("/", async (req, res) => {
    const { userId, teamId, role = "team_member" } = req.body;
    if (!userId || !teamId)
      return res.status(400).json({ ok: false, message: "Missing fields" });

    try {
      if (PG_POOL) {
        await PG_POOL.query(
          `INSERT INTO user_teams (user_id, team_id, role)
           VALUES ($1,$2,$3)
           ON CONFLICT DO NOTHING`,
          [userId, teamId, role]
        );
        return res.json({ ok: true });
      }

      db.user_teams = db.user_teams || [];
      db.user_teams.push({
        id: Date.now(),
        user_id: userId,
        team_id: teamId,
        role,
      });

      res.json({ ok: true });
    } catch (err) {
      console.error("user-teams insert error", err);
      res.status(500).json({ ok: false });
    }
  });

  return router;
};
