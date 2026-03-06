const express = require("express");

module.exports = (pool) => {
  const router = express.Router();

  const getTaskId = (req, res) => {
    const taskId = Number(req.params.id);
    if (!Number.isInteger(taskId)) {
      res.status(400).json({ ok: false, error: "Invalid task id" });
      return null;
    }
    return taskId;
  };

  /* ================= GET TIME ================= */
  router.get("/:id/time", async (req, res) => {
    try {
      const taskId = getTaskId(req, res);
      if (!taskId) return;

      const r = await pool.query(
        `
        SELECT seconds, running, start_time
        FROM time_logs
        WHERE task_id = $1
        ORDER BY id DESC
        LIMIT 1
        `,
        [taskId]
      );

      if (!r.rows.length) {
        return res.json({ ok: true, seconds: 0, running: false });
      }

      let { seconds, running, start_time } = r.rows[0];
      let total = Number(seconds) || 0;

      if (running && start_time) {
        total += Math.floor((Date.now() - new Date(start_time)) / 1000);
      }

      res.json({ ok: true, seconds: total, running });
    } catch (e) {
      console.error("GET TIMER ERROR", e);
      res.status(500).json({ ok: false });
    }
  });

  /* ================= START ================= */
  router.post("/:id/time/start", async (req, res) => {
    try {
      const taskId = getTaskId(req, res);
      if (!taskId) return;

      await pool.query(
        `
        UPDATE time_logs
        SET seconds = seconds +
          CASE WHEN start_time IS NOT NULL
          THEN EXTRACT(EPOCH FROM (NOW() - start_time))::INT
          ELSE 0 END,
          running = false,
          start_time = NULL
        WHERE task_id = $1 AND running = true
        `,
        [taskId]
      );

      await pool.query(
        `
        INSERT INTO time_logs (task_id, seconds, running, start_time)
        VALUES ($1, 0, true, NOW())
        `,
        [taskId]
      );

      res.json({ ok: true });
    } catch (e) {
      console.error("START TIMER ERROR", e);
      res.status(500).json({ ok: false });
    }
  });

  /* ================= PAUSE ================= */
  router.post("/:id/time/pause", async (req, res) => {
    try {
      const taskId = getTaskId(req, res);
      if (!taskId) return;

      await pool.query(
        `
        UPDATE time_logs
        SET seconds = seconds + EXTRACT(EPOCH FROM (NOW() - start_time))::INT,
            running = false,
            start_time = NULL
        WHERE task_id = $1 AND running = true
        `,
        [taskId]
      );

      res.json({ ok: true });
    } catch (e) {
      console.error("PAUSE TIMER ERROR", e);
      res.status(500).json({ ok: false });
    }
  });

  /* ================= STOP ================= */
  router.post("/:id/time/stop", async (req, res) => {
    try {
      const taskId = getTaskId(req, res);
      if (!taskId) return;

      await pool.query(
        `
        UPDATE time_logs
        SET seconds = seconds +
          CASE WHEN start_time IS NOT NULL
          THEN EXTRACT(EPOCH FROM (NOW() - start_time))::INT
          ELSE 0 END,
          running = false,
          start_time = NULL
        WHERE task_id = $1 AND running = true
        `,
        [taskId]
      );

      res.json({ ok: true });
    } catch (e) {
      console.error("STOP TIMER ERROR", e);
      res.status(500).json({ ok: false });
    }
  });

  /* ================= DELETE TIME LOGS ================= */
  router.delete("/:id/time", async (req, res) => {
    try {
      const taskId = getTaskId(req, res);
      if (!taskId) return;

      await pool.query(
        `DELETE FROM time_logs WHERE task_id = $1`,
        [taskId]
      );

      res.json({ ok: true });
    } catch (e) {
      console.error("DELETE TIMER ERROR", e);
      res.status(500).json({ ok: false });
    }
  });

  return router;
};
