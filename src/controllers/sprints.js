//src > controllers > sprints.js 

const pool = require("../db");

function mapSprint(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    startDate: row.start_date,
    endDate: row.end_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

exports.listSprints = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM sprints ORDER BY id DESC");
    return res.json({ ok: true, sprints: result.rows.map(mapSprint) });
  } catch (err) {
    console.error("listSprints error", err);
    return res.status(500).json({ ok:false, message: "Server error", error: String(err) });
  }
};

exports.createSprint = async (req, res) => {
  try {
    const { name, startDate = null, endDate = null } = req.body;
    if (!name) return res.status(400).json({ ok:false, message: "name required" });
    const q = `INSERT INTO sprints (name, start_date, end_date) VALUES ($1,$2,$3) RETURNING *`;
    const result = await pool.query(q, [name, startDate, endDate]);
    return res.status(201).json({ ok:true, sprint: mapSprint(result.rows[0]) });
  } catch (err) {
    console.error("createSprint error", err);
    return res.status(500).json({ ok:false, message: "Server error", error: String(err) });
  }
};

exports.getSprint = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM sprints WHERE id=$1", [id]);
    if (!result.rows.length) return res.status(404).json({ ok:false, message: "Sprint not found" });
    return res.json({ ok:true, sprint: mapSprint(result.rows[0]) });
  } catch (err) {
    console.error("getSprint error", err);
    return res.status(500).json({ ok:false, message: "Server error", error: String(err) });
  }
};

exports.updateSprint = async (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body || {};
    const keys = Object.keys(fields);
    if (!keys.length) return res.status(400).json({ ok:false, message: "no fields provided" });

    const cols = keys.map((k,i) => `${k === "startDate" ? "start_date" : k === "endDate" ? "end_date" : k}=$${i+1}`);
    const values = keys.map(k => fields[k]);
    const query = `UPDATE sprints SET ${cols.join(", ")}, updated_at=NOW() WHERE id=$${keys.length+1} RETURNING *`;
    const result = await pool.query(query, [...values, id]);
    if (!result.rows.length) return res.status(404).json({ ok:false, message: "Sprint not found" });
    return res.json({ ok:true, sprint: mapSprint(result.rows[0]) });
  } catch (err) {
    console.error("updateSprint error", err);
    return res.status(500).json({ ok:false, message: "Server error", error: String(err) });
  }
};

exports.deleteSprint = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM sprints WHERE id=$1 RETURNING id", [id]);
    if (!result.rows.length) return res.status(404).json({ ok:false, message: "Sprint not found" });
    return res.json({ ok:true, message: "Sprint deleted" });
  } catch (err) {
    console.error("deleteSprint error", err);
    return res.status(500).json({ ok:false, message: "Server error", error: String(err) });
  }
};

exports.getSprintHealth = async (req, res) => {
  try {
    const { id } = req.params;
    const tasksQ = await pool.query("SELECT id, status, priority_score, due_date FROM tasks WHERE sprint_id=$1", [id]);
    const rows = tasksQ.rows;
    const total = rows.length;
    const done = rows.filter(r => r.status && r.status.toLowerCase() === "done").length;
    const avgPriority = total ? (rows.reduce((s,r) => s + (Number(r.priority_score) || 0), 0) / total) : 0;
    const now = new Date();
    const hasOverdue = rows.some(r => r.due_date && new Date(r.due_date) < now && (!r.status || r.status.toLowerCase() !== "done"));
    let suggestion = "Sprint looks OK";
    const percentDone = total ? Math.round((done/total) * 100) : 0;
    if (total === 0) suggestion = "No tasks yet — add tasks to the sprint";
    else if (hasOverdue) suggestion = "Some tasks are overdue — re-prioritize and reassign";
    else if (percentDone < 40) suggestion = "Less than 40% done — focus on high-priority items";
    else if (percentDone >= 40 && percentDone < 70) suggestion = "Progressing — focus on remaining high-impact tasks";
    else suggestion = "Sprint healthy — aim to close remaining tasks";

    return res.json({ ok:true, totalTasks: total, doneTasks: done, percentDone, avgPriority: Number(avgPriority.toFixed(2)), hasOverdue, suggestion });
  } catch (err) {
    console.error("getSprintHealth error", err);
    return res.status(500).json({ ok:false, message: "Server error", error: String(err) });
  }
};
