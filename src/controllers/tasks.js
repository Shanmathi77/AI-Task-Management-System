//src > controllers > tasks.js 

const pool = require("../db");
const { parseQuickAdd } = (() => {
  try { return require("../services/quickAdd"); } catch (e) { return { parseQuickAdd: (t) => ({ title: t }) }; }
})();

function mapTask(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    assigneeId: row.assignee_id || null,
    dueDate: row.due_date || null,
    estimatedHours: row.estimated_hours !== null && row.estimated_hours !== undefined ? Number(row.estimated_hours) : null,
    priorityScore: row.priority_score !== null && row.priority_score !== undefined ? Number(row.priority_score) : null,
    priority: row.priority !== undefined ? row.priority : null,
    status: row.status || null,
    sprintId: row.sprint_id || null,
    projectId: row.project_id || null,
    dependsOn: row.depends_on || null,
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  };
}

async function lookupUserIdByName(name) {
  if (!name || String(name).trim().length === 0) return null;
  try {
    const q = await pool.query("SELECT id FROM users WHERE name ILIKE $1 LIMIT 1", [name]);
    if (q.rows && q.rows.length) return q.rows[0].id;
    return null;
  } catch (e) {
    console.error("lookupUserIdByName error", e);
    return null;
  }
}

exports.createTask = async (req, res) => {
  try {
    const body = req.body || {};
    if (body.quickAddText && !body.title) {
      const parsed = parseQuickAdd(body.quickAddText || "");
      body.title = body.title || parsed.title;
      body.dueDate = body.dueDate || parsed.dueDate;
      body.estimatedHours = body.estimatedHours || parsed.estimated_hours;
      body.assignedToName = body.assignedToName || parsed.assignedToName;
    }

    const {
      title, description = "", assignedTo = null, assignedToName = null,
      dueDate = null, estimatedHours = null, priorityScore = null,
      priority = null, status = "todo", sprintId = null, projectId = null, dependsOn = null
    } = body;

    if (!title || String(title).trim().length === 0) return res.status(400).json({ ok:false, message: "title required" });

    let assigneeId = assignedTo || null;
    if (!assigneeId && assignedToName) assigneeId = await lookupUserIdByName(assignedToName);

    const result = await pool.query(
      `INSERT INTO tasks
       (project_id, sprint_id, title, description, assignee_id, due_date, estimated_hours, priority_score, priority, depends_on, status, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, now(), now())
       RETURNING *`,
      [projectId, sprintId, title, description, assigneeId, dueDate, estimatedHours, priorityScore, priority, dependsOn, status || "todo"]
    );

    return res.status(201).json({ ok: true, task: mapTask(result.rows[0]) });
  } catch (err) {
    console.error("createTask error", err);
    return res.status(500).json({ ok:false, message: "Server error", error: String(err) });
  }
};

exports.getTask = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM tasks WHERE id=$1", [id]);
    if (!result.rows.length) return res.status(404).json({ ok:false, message: "Task not found" });
    return res.json({ ok: true, task: mapTask(result.rows[0]) });
  } catch (err) {
    console.error("getTask error", err);
    return res.status(500).json({ ok:false, message: "Server error", error: String(err) });
  }
};

exports.listTasks = async (req, res) => {
  try {
    const sprintId = req.query.sprintId ? parseInt(req.query.sprintId, 10) : null;
    const q = sprintId ? "SELECT * FROM tasks WHERE sprint_id=$1 ORDER BY created_at DESC" : "SELECT * FROM tasks ORDER BY created_at DESC";
    const params = sprintId ? [sprintId] : [];
    const result = await pool.query(q, params);
    return res.json({ ok:true, tasks: result.rows.map(mapTask) });
  } catch (err) {
    console.error("listTasks error", err);
    return res.status(500).json({ ok:false, message: "Server error", error: String(err) });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const fields = Object.assign({}, req.body || {});
    if (!Object.keys(fields).length) return res.status(400).json({ ok:false, message: "no fields provided" });

    if (fields.assignedToName) {
      const uid = await lookupUserIdByName(fields.assignedToName);
      fields.assignee_id = uid;
      delete fields.assignedToName;
    }

    const keyMap = (k) => {
      if (k === "assignedTo") return "assignee_id";
      if (k === "estimatedHours") return "estimated_hours";
      if (k === "priorityScore") return "priority_score";
      if (k === "dueDate") return "due_date";
      if (k === "sprintId") return "sprint_id";
      if (k === "projectId") return "project_id";
      if (k === "dependsOn") return "depends_on";
      if (k === "assigneeId") return "assignee_id";
      return k;
    };

    const keys = Object.keys(fields);
    const cols = keys.map((k,i) => `${keyMap(k)}=$${i+1}`);
    const values = keys.map(k => fields[k]);
    const query = `UPDATE tasks SET ${cols.join(", ")}, updated_at=NOW() WHERE id=$${keys.length+1} RETURNING *`;
    const result = await pool.query(query, [...values, id]);
    if (!result.rows.length) return res.status(404).json({ ok:false, message: "Task not found" });
    return res.json({ ok:true, task: mapTask(result.rows[0]) });
  } catch (err) {
    console.error("updateTask error", err);
    return res.status(500).json({ ok:false, message: "Server error", error: String(err) });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM tasks WHERE id=$1 RETURNING id", [id]);
    if (!result.rows.length) return res.status(404).json({ ok:false, message: "Task not found" });
    return res.json({ ok:true, message: "Task deleted" });
  } catch (err) {
    console.error("deleteTask error", err);
    return res.status(500).json({ ok:false, message: "Server error", error: String(err) });
  }
};

exports.getTeamOverviewStats = async (req, res) => {
  try {
    const now = new Date();

    const totalQ = await pool.query(`SELECT COUNT(*) FROM tasks`);
    const completedQ = await pool.query(
      `SELECT COUNT(*) FROM tasks WHERE status = 'done'`
    );
    const runningQ = await pool.query(
      `SELECT COUNT(*) FROM tasks WHERE status = 'in_progress'`
    );
    const overdueQ = await pool.query(
      `SELECT COUNT(*) FROM tasks 
       WHERE due_date IS NOT NULL 
       AND due_date < $1 
       AND status <> 'done'`,
      [now]
    );

    return res.json({
      ok: true,
      total: Number(totalQ.rows[0].count),
      completed: Number(completedQ.rows[0].count),
      running: Number(runningQ.rows[0].count),
      overdue: Number(overdueQ.rows[0].count),
    });
  } catch (err) {
    console.error("getTeamOverviewStats error", err);
    return res.status(500).json({
      ok: false,
      message: "Failed to load overview stats",
    });
  }
};

