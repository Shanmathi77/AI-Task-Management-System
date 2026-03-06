// frontend/src/components/TasksSummaryPanel.jsx
import React, { useEffect, useState, useRef } from "react";
import axiosClient from "../api/axiosClient";

/**
 * TasksSummaryPanel
 * - fetches /api/dashboard/summary (handles shapes like { ok:true, data:{...} } and { ok:true, summary: {...} })
 * - normalizes fields and shows numeric values (no hyphens)
 * - listens for 'ai:done' to refresh after AI runs
 */

function normalizeSummary(payload) {
  // Accept many response shapes: { ok:true, data: {...} }, { ok:true, summary: {...} }, or plain {...}
  const p = payload?.data?.data ?? payload?.data ?? payload?.summary ?? payload ?? {};
  return {
    totalTasks: Number(p.totalTasks ?? p.total_tasks ?? p.total_tasks_count ?? p.total ?? 0),
    completed: Number(p.completed ?? p.completed_tasks ?? p.completedTasks ?? 0),
    overdue: Number(p.overdue ?? p.overdue_tasks ?? p.overdueTasks ?? 0),
    myRunning: Number(p.myRunning ?? p.my_running_timers ?? p.my_running ?? 0),
  };
}

export default function TasksSummaryPanel({ onRefetch } = {}) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  async function load() {
    setLoading(true);
    try {
      const res = await axiosClient.get("/dashboard/summary");
      // axiosClient interceptor may return resp or resp.data shape; handle both
      const payload = res?.data ?? res ?? {};
      const s = normalizeSummary(payload);
      if (mounted.current) setSummary(s);
    } catch (err) {
      console.error("TasksSummaryPanel load failed", err?.response?.data ?? err?.message ?? err);
      if (mounted.current) setSummary(null);
    } finally {
      setLoading(false);
      if (typeof onRefetch === "function") onRefetch();
    }
  }

  useEffect(() => {
    mounted.current = true;
    load();

    // Refresh automatically after AI run events
    const onAIDone = () => { load(); };
    window.addEventListener("ai:done", onAIDone);

    return () => {
      mounted.current = false;
      window.removeEventListener("ai:done", onAIDone);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <div className="text-sm text-white/70">Loading…</div>;
  if (!summary) return <div className="text-sm text-white/60">Summary not available</div>;

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <div style={{ minWidth: 110 }}>
        <div className="text-xs text-white/60">Total Tasks</div>
        <div className="text-lg font-semibold">{summary.totalTasks}</div>
      </div>

      <div style={{ minWidth: 110 }}>
        <div className="text-xs text-white/60">Completed</div>
        <div className="text-lg font-semibold">{summary.completed}</div>
      </div>

      <div style={{ minWidth: 110 }}>
        <div className="text-xs text-white/60">Overdue</div>
        <div className="text-lg font-semibold">{summary.overdue}</div>
      </div>

      <div style={{ minWidth: 110 }}>
        <div className="text-xs text-white/60">My Running</div>
        <div className="text-lg font-semibold">{summary.myRunning}</div>
      </div>
    </div>
  );
}
