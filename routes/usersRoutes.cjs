// backend/routes/usersRoutes.cjs
const express = require("express");

module.exports = (db, PG_POOL) => {
  const router = express.Router();

  /* ================= USER TEAMS ================= */
  router.get("/:id/teams", async (req, res) => {
    const userId = Number(req.params.id);

    if (PG_POOL) {
      const q = `
        SELECT t.*, ut.role
        FROM user_teams ut
        JOIN teams t ON t.id = ut.team_id
        WHERE ut.user_id = $1
      `;
      const r = await PG_POOL.query(q, [userId]);
      return res.json({ ok: true, teams: r.rows });
    }

    const teams = (db.user_teams || [])
      .filter(u => u.user_id === userId)
      .map(ut => ({
        ...db.teams.find(t => t.id === ut.team_id),
        role: ut.role
      }));

    res.json({ ok: true, teams });
  });

  /* ================= USER INVITES (🔥 FIX) ================= */
  router.get("/:id/invites", async (req, res) => {
    const userId = Number(req.params.id);

    if (PG_POOL) {
      const q = `
        SELECT i.*, t.name AS team_name
        FROM invites i
        JOIN teams t ON t.id = i.team_id
        JOIN users u ON u.email = i.email
        WHERE u.id = $1 AND i.status = 'pending'
      `;
      const r = await PG_POOL.query(q, [userId]);
      return res.json({ ok: true, invites: r.rows });
    }

    const user = db.users.find(u => u.id === userId);
    const invites = (db.invites || [])
      .filter(i => i.email === user?.email && i.status === "pending")
      .map(i => ({
        ...i,
        team_name: db.teams.find(t => t.id === i.team_id)?.name
      }));

    res.json({ ok: true, invites });
  });

  /* ================= SWITCH TEAM ================= */
  router.post("/:id/switch-team", async (req, res) => {
    const userId = Number(req.params.id);
    const teamId = Number(req.body.teamId);

    if (PG_POOL) {
      await PG_POOL.query(
        `UPDATE users SET active_team_id=$1 WHERE id=$2`,
        [teamId, userId]
      );

      const r = await PG_POOL.query(
        `SELECT t.name FROM teams t WHERE t.id=$1`,
        [teamId]
      );

      return res.json({
        ok: true,
        active_team: { id: teamId, name: r.rows[0]?.name }
      });
    }

    res.json({ ok: true });
  });

  return router;
};
