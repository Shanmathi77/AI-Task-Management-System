// backend/src/lib/ruleEngine.js
const db = require('../db');

/**
 * matchesCondition(conditionJson, eventPayload)
 * - Minimal evaluator. Returns true if condition empty or matches.
 * - conditionJson supports:
 *   { "field":"priority", "op":"gte", "value": 8 }
 *   { "field":"assignee_id", "op":"is_null" }
 *   { "field":"status", "op":"eq", "value":"done" }
 *   { "field":"id", "op":"in", "value": [1,2,3] }
 */
function matchesCondition(conditionJson = {}, eventPayload = {}) {
  if (!conditionJson || Object.keys(conditionJson).length === 0) return true;
  try {
    const { field, op, value } = conditionJson;
    const left = eventPayload[field];
    switch ((op || '').toString()) {
      case 'eq': return left === value;
      case 'ne': return left !== value;
      case 'gte': return Number(left) >= Number(value);
      case 'lte': return Number(left) <= Number(value);
      case 'gt': return Number(left) > Number(value);
      case 'lt': return Number(left) < Number(value);
      case 'is_null': return left === null || left === undefined;
      case 'in': return Array.isArray(value) && value.includes(left);
      default: return true;
    }
  } catch (e) {
    console.warn('matchesCondition error', e && (e.stack || e));
    return false;
  }
}

/**
 * runRule(ruleRow, eventKey, eventPayload)
 * - Executes actions (currently supports: create_task, assign_task).
 * - Writes an automation_logs entry with performed actions.
 */
async function runRule(ruleRow, eventKey, eventPayload = {}) {
  const actions = ruleRow.actions || [];
  const performed = [];
  let success = true;
  let error = null;

  // use DB client for transactional actions
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    for (const action of actions) {
      const kind = action.kind;
      const payload = action.payload || {};

      if (kind === 'create_task') {
        // support token interpolation like {{title}}
        let title = payload.title || 'Automated task';
        title = title.replace(/\{\{(.*?)\}\}/g, (_, k) => (eventPayload[k.trim()] ?? ''));

        let description = payload.description || '';
        description = description.replace(/\{\{(.*?)\}\}/g, (_, k) => (eventPayload[k.trim()] ?? ''));

        const assignee_id = payload.assignee_id || null;
        const due_in_days = payload.due_in_days ? Number(payload.due_in_days) : null;

        if (due_in_days) {
          const insertQ = `INSERT INTO tasks (title, description, assignee_id, due_date, created_at, updated_at)
                           VALUES ($1,$2,$3, now() + ($4 || ' days')::interval, now(), now()) RETURNING *`;
          const res = await client.query(insertQ, [title, description, assignee_id, due_in_days]);
          performed.push({ action: 'create_task', result: res.rows[0] });
        } else {
          const insertQ = `INSERT INTO tasks (title, description, assignee_id, created_at, updated_at)
                           VALUES ($1,$2,$3, now(), now()) RETURNING *`;
          const res = await client.query(insertQ, [title, description, assignee_id]);
          performed.push({ action: 'create_task', result: res.rows[0] });
        }

      } else if (kind === 'assign_task') {
        const taskId = payload.task_id || eventPayload.task_id;
        const assignee = payload.assignee_id;
        if (taskId && assignee) {
          await client.query('UPDATE tasks SET assignee_id=$1, updated_at=now() WHERE id=$2', [assignee, taskId]);
          performed.push({ action: 'assign_task', taskId, assignee });
        } else {
          performed.push({ action: 'assign_task', skipped: true, reason: 'taskId or assignee missing' });
        }

      } else if (kind === 'webhook') {
        // Not doing external calls here — just record intent
        performed.push({ action: 'webhook', payload });
      } else {
        performed.push({ action: 'unknown', kind });
      }
    }

    await client.query('COMMIT');
  } catch (e) {
    success = false;
    error = (e && e.message) || String(e);
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('runRule error', e && (e.stack || e));
  } finally {
    client.release();
    // log result (best-effort)
    try {
      await db.query(
        `INSERT INTO automation_logs (rule_id, event_key, event_payload, actions_performed, success, error, created_at)
         VALUES ($1,$2,$3,$4,$5,$6, now())`,
        [ruleRow.id, eventKey, eventPayload, JSON.stringify(performed), success, error]
      );
    } catch (logErr) {
      console.warn('Failed to write automation_logs:', logErr && (logErr.stack || logErr));
    }
  }

  return { success, performed, error };
}

module.exports = { matchesCondition, runRule };
