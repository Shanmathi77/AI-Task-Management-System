// routes/invitesRoutes.cjs
const express = require("express");

module.exports = (db, PG_POOL, io) => {
  const router = express.Router();

  /* ================= MEMBER: PENDING INVITES ================= */
  router.get("/pending", async (req, res) => {
    try {
      const { email } = req.query;
      if (!email) return res.json({ ok: true, invites: [] });

      const r = await PG_POOL.query(
        `SELECT i.*, t.name AS team_name
         FROM invites i
         JOIN teams t ON t.id = i.team_id
         WHERE i.email=$1 AND i.status='pending'
         ORDER BY i.created_at DESC`,
        [email]
      );

      res.json({ ok: true, invites: r.rows });
    } catch (e) {
      console.error("pending invites:", e.message);
      res.status(500).json({ ok: false });
    }
  });

  /* ================= LEAD: SENT INVITES ================= */
  router.get("/sent", async (req, res) => {
    try {
      const team_id = Number(req.query.team_id);
      if (!team_id) return res.json({ ok: true, invites: [] });

      const r = await PG_POOL.query(
        `SELECT
           i.*,
           u.email AS invited_by_email,
           au.email AS accepted_by_email
         FROM invites i
         LEFT JOIN users u ON u.id = i.invited_by
         LEFT JOIN users au ON au.id = i.accepted_by
         WHERE i.team_id=$1
         ORDER BY i.created_at DESC`,
        [team_id]
      );

      res.json({ ok: true, invites: r.rows });
    } catch (e) {
      console.error("sent invites:", e.message);
      res.status(500).json({ ok: false });
    }
  });

  /* ================= SEND INVITE ================= */
  /* ================= SEND INVITE ================= */
router.post("/", async (req, res) => {
  try {
    const { email, team_id, role = "team_member", invited_by } = req.body;
    if (!email || !team_id || !invited_by) {
      return res.status(400).json({ ok: false });
    }

    const r = await PG_POOL.query(
      `INSERT INTO invites (email, team_id, role, status, invited_by)
       VALUES ($1,$2,$3,'pending',$4)
       RETURNING *`,
      [email, team_id, role, invited_by]
    );

    io?.emit("invite:new", r.rows[0]); // ✅ SAFE
    res.json({ ok: true, invite: r.rows[0] });

  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false });
  }
});


  /* ================= ACCEPT INVITE ================= */
  router.post("/:id/accept", async (req, res) => {
  try {
    const inviteId = Number(req.params.id);
    const { userId } = req.body;

    if (!inviteId || !userId) {
      return res.status(400).json({ ok: false, error: "Missing parameters" });
    }

    const r = await PG_POOL.query(
      `UPDATE invites
       SET status='accepted', accepted_at=NOW(), accepted_by=$2
       WHERE id=$1 AND status='pending'
       RETURNING *`,
      [inviteId, userId]
    );

    if (!r.rows.length) {
      return res.status(404).json({ ok: false, error: "Invite not found or already processed" });
    }

    const inv = r.rows[0];

    await PG_POOL.query(
      `INSERT INTO user_teams (user_id, team_id, role)
       VALUES ($1,$2,$3)
       ON CONFLICT DO NOTHING`,
      [userId, inv.team_id, inv.role]
    );

    io?.emit("invite:accepted", inv);

    res.json({ ok: true, invite: inv });
  } catch (e) {
    console.error("accept invite error:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});


  /* ================= REJECT INVITE ================= */
  router.post("/:id/reject", async (req, res) => {
    try {
      const inviteId = Number(req.params.id);

      await PG_POOL.query(
        `UPDATE invites
         SET status='rejected'
         WHERE id=$1 AND status='pending'`,
        [inviteId]
      );

      io?.emit("invite:rejected", inviteId);
      res.json({ ok: true });
    } catch (e) {
      console.error("reject invite:", e.message);
      res.status(500).json({ ok: false });
    }
  });

  /* ================= REVOKE INVITE (LEAD) ================= */
  router.delete("/:id", async (req, res) => {
    try {
      const inviteId = Number(req.params.id);

      await PG_POOL.query(
        `UPDATE invites
         SET status='revoked'
         WHERE id=$1 AND status='pending'`,
        [inviteId]
      );

      io?.emit("invite:revoked", inviteId);
      res.json({ ok: true });
    } catch (e) {
      console.error("revoke invite:", e.message);
      res.status(500).json({ ok: false });
    }
  });

  return router;
};
