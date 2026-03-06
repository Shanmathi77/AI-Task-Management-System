// backend/src/controllers/aiController.js

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const runBatch = async (req, res) => {
  try {
    const { taskIds = null, meta = {} } = req.body || {};

    if (taskIds !== null && !Array.isArray(taskIds)) {
      return res.status(400).json({
        ok: false,
        message: 'taskIds must be an array (or omit it to process defaults).',
      });
    }

    // Use given taskIds or mock a set
    const ids =
      taskIds && taskIds.length
        ? taskIds
        : Array.from({ length: 10 }, (_, i) => `task_${i + 1}`);

    // Simulate async processing
    await sleep(700);

    const processed = ids.map((id) => ({
      id,
      status: 'processed',
      outputs: {
        summary: `Processed ${id}`,
        score: Math.round((0.5 + Math.random() * 0.5) * 100) / 100,
      },
    }));

    const results = {
      runId: `${Date.now()}`,
      count: processed.length,
      processed,
      meta,
    };

    return res.json({ ok: true, results });
  } catch (err) {
    console.error('runBatch error', err);
    return res.status(500).json({ ok: false, message: 'Internal server error' });
  }
};

const runPrioritizer = async (req, res) => {
  try {
    const { filter = {} } = req.body || {};

    // Simulate AI prioritization
    await sleep(500);

    const topTasks = Array.from({ length: 5 }, (_, i) => ({
      id: `t${i + 1}`,
      title: `Task ${i + 1}`,
      score: Math.round((0.4 + Math.random() * 0.6) * 100) / 100,
    })).sort((a, b) => b.score - a.score);

    return res.json({ ok: true, topTasks, filter });
  } catch (err) {
    console.error('runPrioritizer error', err);
    return res.status(500).json({ ok: false, message: 'Internal server error' });
  }
};

module.exports = { runBatch, runPrioritizer };