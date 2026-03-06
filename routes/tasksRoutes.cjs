// backend/routes/tasksRoutes.cjs
const express = require("express");

module.exports = (db, PG_POOL, io) => {
  const router = express.Router();

  if (!PG_POOL) {
    console.error("❌ PG_POOL missing in tasksRoutes");
  }

  /* ================= CREATE TASK ================= */
  // POST /api/tasks
  router.post("/", async (req, res) => {
    const { title, teamId, status = "pending" } = req.body;

    if (!title || !teamId) {
      return res.status(400).json({
        ok: false,
        error: "title & teamId required",
      });
    }

    try {
      const result = await PG_POOL.query(
        `
        INSERT INTO tasks (title, team_id, status, is_archived)
        VALUES ($1,$2,$3,false)
        RETURNING *
        `,
        [title, teamId, status]
      );

      io?.emit("task:refresh");
      res.json({ ok: true, task: result.rows[0] });
    } catch (err) {
      console.error("❌ TASK CREATE ERROR:", err);
      res.status(500).json({ ok: false });
    }
  });

  /* ================= GET TASKS ================= */
  // GET /api/tasks?teamId=1
  router.get("/", async (req, res) => {
    const teamId = Number(req.query.teamId);

    if (!teamId) {
      return res.status(400).json({ ok: false, error: "teamId required" });
    }

    try {
      const result = await PG_POOL.query(
        `
        SELECT *
        FROM tasks
        WHERE team_id = $1
        AND is_archived = false
        ORDER BY created_at DESC
        `,
        [teamId]
      );

      res.json({ ok: true, tasks: result.rows });
    } catch (err) {
      console.error("❌ TASK FETCH ERROR:", err);
      res.status(500).json({ ok: false });
    }
  });

  //router.get("/overview/stats", tasksController.getTeamOverviewStats);

  /* ================= UPDATE TASK ================= */
  // PATCH /api/tasks/:id
  router.patch("/:id", async (req, res) => {
    const taskId = Number(req.params.id);
    const { status, is_archived } = req.body;

    try {
      const userId = req.headers["x-user-id"];

const result = await PG_POOL.query(
  `
  UPDATE tasks
  SET
    status = COALESCE($1, status),
    is_archived = COALESCE($2, is_archived),
    completed_by = CASE
  WHEN $1 = 'done' THEN $4
  ELSE completed_by
END,
completed_at = CASE
  WHEN $1 = 'done' THEN NOW()
  ELSE completed_at
END
  WHERE id = $3
  RETURNING *
  `,
  [status, is_archived, taskId, userId]
);

      io?.emit("task:refresh");
      res.json({ ok: true, task: result.rows[0] });
    } catch (err) {
      console.error("❌ TASK UPDATE ERROR:", err);
      res.status(500).json({ ok: false });
    }
  });

  /* ================= DELETE TASK ================= */
// DELETE /api/tasks/:id
router.delete("/:id", async (req, res) => {
  const taskId = Number(req.params.id);

  try {
    // 1️⃣ stop all running timers
    await PG_POOL.query(
      `UPDATE time_logs
       SET running = false,
           end_time = NOW()
       WHERE task_id = $1`,
      [taskId]
    );

    // 2️⃣ delete all time logs
    await PG_POOL.query(
      `DELETE FROM time_logs WHERE task_id = $1`,
      [taskId]
    );

    // 3️⃣ delete task
    await PG_POOL.query(
      `DELETE FROM tasks WHERE id = $1`,
      [taskId]
    );

    io?.emit("task:refresh");
    res.json({ ok: true });
  } catch (err) {
    console.error("❌ TASK DELETE ERROR:", err);
    res.status(500).json({ ok: false });
  }
});



  return router;
};
