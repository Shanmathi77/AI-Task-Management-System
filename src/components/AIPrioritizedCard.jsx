// frontend/src/components/AIPrioritizedCard.jsx
import React, { useEffect, useState , useCallback} from "react";
import axiosClient from "../api/axiosClient";

export default function AIPrioritizedCard({ limit = 5 }) {
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState(null);

  // Helper to normalize many possible response shapes
  function normalizeTasksResponse(res) {
    if (!res) return [];
    if (res.data && Array.isArray(res.data.tasks)) return res.data.tasks;
    if (res.data && res.data.data && Array.isArray(res.data.data.top)) {
      return res.data.data.top.map(t => ({
        id: t.id,
        title: t.title ?? t.name ?? t.summary ?? "Untitled",
        priority_score: t.priority_score ?? t.priorityScore ?? t.score ?? 0,
        estimated_hours: t.estimated_hours ?? t.estimatedHours ?? t.est,
      }));
    }
    if (Array.isArray(res.data?.top)) {
      return res.data.top.map(t => ({
        id: t.id,
        title: t.title,
        priority_score: t.priority_score ?? t.priorityScore ?? 0,
        estimated_hours: t.estimated_hours ?? t.estimatedHours,
      }));
    }
    if (Array.isArray(res)) return res;
    if (res.data && Array.isArray(res.data)) return res.data;
    return [];
  }

   const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let res = null;
      try {
        res = await axiosClient.post("/dashboard/ai-prioritize", {});
      } catch  {
        try {
          res = await axiosClient.post("/ai/score-batch/public", {});
        } catch  {
          res = await axiosClient.get("/ai/suggestions").catch(() => null);
        }
      }

      const items = normalizeTasksResponse(res);
      setTasks(Array.isArray(items) ? items.slice(0, limit) : []);
    } catch (err) {
      console.error("AIPrioritizedCard load error", err);
      setError(err?.message || "Failed to load prioritized tasks");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  },[limit]);

  useEffect(() => { load(); }, );

  return (
    <div className="p-4 rounded-2xl bg-white/5 border border-white/6 backdrop-blur-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-white/80 font-medium">AI Prioritized — Top {limit}</div>
          <div className="text-xs text-white/60 mt-1">Auto-ranked tasks by priority score</div>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="px-3 py-1 rounded bg-white/6 text-sm text-white hover:bg-white/10">Refresh</button>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {loading ? (
          <div className="text-sm text-white/70">Loading…</div>
        ) : error ? (
          <div className="text-sm text-red-300">{error}</div>
        ) : tasks.length === 0 ? (
          <div className="text-sm text-white/60">No tasks</div>
        ) : (
          tasks.map(t => (
            <div key={t.id} className="flex items-center justify-between p-2 rounded hover:bg-white/3">
              <div style={{ maxWidth: "70%" }}>
                <div className="text-sm font-medium text-white truncate">{t.title}</div>
                <div className="text-xs text-white/60">
                  {t.estimated_hours ? `${t.estimated_hours} hrs • ` : ""}
                  Score: {Number(t.priority_score ?? 0).toFixed(2)}
                </div>
              </div>
              <div style={{ textAlign: "right", marginLeft: 8 }}>
                <div className="text-xs text-white/50">#{t.id}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
