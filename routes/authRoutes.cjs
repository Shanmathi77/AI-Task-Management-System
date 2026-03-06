const express = require("express");
const bcrypt = require("bcryptjs");

module.exports = (db = {}, PG_POOL = null) => {
  // 🔒 SAFETY: detect swapped arguments
  if (db && typeof db.query === "function" && !PG_POOL) {
    PG_POOL = db;
  }

  const router = express.Router();

  const normalize = (e) => (e || "").toLowerCase().trim();

  router.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body || {};
      if (!email || !password)
        return res.status(400).json({ ok: false, message: "Missing credentials" });

      const normalizedEmail = normalize(email);

      // Fetch user from DB
      if (!PG_POOL || typeof PG_POOL.query !== "function") {
        console.error("PG_POOL INVALID:", PG_POOL);
        return res.status(500).json({ ok: false, message: "Database not connected" });
      }

      const result = await PG_POOL.query(
        "SELECT id, email, role, password, name, active_team_id FROM users WHERE lower(email)=$1",
        [normalizedEmail]
      );

      if (!result.rows.length)
        return res.status(400).json({ ok: false, message: "Invalid email or password" });

      const user = result.rows[0];

      // Compare password
      const isValid = await bcrypt.compare(password, user.password);
      console.log("LOGIN:", normalizedEmail);
      console.log("HASH IN DB:", user.password);
      console.log("COMPARE RESULT:", isValid);

      if (!isValid)
        return res.status(400).json({ ok: false, message: "Invalid email or password" });

      // Success
      const token = `dev-token-${user.id}-${Date.now()}`;
      return res.json({
        ok: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          active_team_id: user.active_team_id || null,
        },
      });
    } catch (err) {
      console.error("LOGIN ERROR:", err);
      res.status(500).json({ ok: false, message: "Login failed" });
    }
  });

  return router;
};
