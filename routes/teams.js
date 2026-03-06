router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.id; // 🔥 THIS WAS MISSING

    const team = await db.query(
      `INSERT INTO teams (name, owner_id)
       VALUES ($1, $2) RETURNING *`,
      [name, userId]
    );

    res.json({ ok: true, team: team.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Create team failed" });
  }
});
