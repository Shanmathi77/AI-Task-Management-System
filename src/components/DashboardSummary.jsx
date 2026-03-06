//DashboardSummary.jsx

import React, { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";

function Card({ title, value, color, hint }) {
  return (
    <div className="glass-card relative overflow-hidden p-6">
      <div className={`absolute top-0 left-0 h-1 w-full ${color}`} />

      <p className="text-sm text-white/60">{title}</p>

      <div className="text-3xl font-bold mt-2">
        {value}
      </div>

      {hint && (
        <p className="text-xs mt-2 text-white/50">
          {hint}
        </p>
      )}
    </div>
  );
}

export default function DashboardSummary({ teamId }) {
  const [s, setS] = useState(null);

  useEffect(() => {
    async function load() {
      const q = teamId ? `?teamId=${teamId}` : "";
      const res = await axiosClient.get(`/dashboard/summary${q}`);
      const d = res.data?.summary ?? res.data ?? {};
      setS({
        total: d.totalTasks ?? 0,
        completed: d.completed ?? 0,
        running: d.myRunning ?? 0,
        overdue: d.overdue ?? 0,
      });
    }
    load();
  }, [teamId]);

  if (!s) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card title="Total Tasks" value={s.total} color="bg-white"
        hint="All assigned tasks" />
      <Card title="Completed" value={s.completed}
        color="bg-green-400"
        hint="Finished successfully" />
      <Card title="Running" value={s.running}
        color="bg-blue-400"
        hint="In progress" />
      <Card title="Overdue" value={s.overdue}
        color="bg-red-400"
        hint="Needs attention" />
    </div>
  );
}
