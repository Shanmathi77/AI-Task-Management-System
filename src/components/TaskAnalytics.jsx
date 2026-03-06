// TaskAnalytics.jsx

import React, { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#22c55e", "#ef4444", "#3b82f6"];

export default function TaskAnalytics({ teamId }) {
  const [data, setData] = useState(null);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const q = teamId ? `?teamId=${teamId}` : "";
        const res = await axiosClient.get(`/dashboard/summary${q}`);
        const s = res.data?.summary ?? res.data ?? {};

        const completed = Number(s.completed ?? 0);
        const overdue = Number(s.overdue ?? 0);
        const running = Number(s.myRunning ?? 0);

        const allZero = completed === 0 && overdue === 0 && running === 0;

        if (allZero) {
          // 👉 SAFE DEMO DATA (only when backend gives all zeros)
          setIsDemo(true);
          setData([
            { name: "Completed", value: 5 },
            { name: "Overdue", value: 2 },
            { name: "Running", value: 7 },
          ]);
        } else {
          // 👉 REAL DATA
          setIsDemo(false);
          setData([
            { name: "Completed", value: completed },
            { name: "Overdue", value: overdue },
            { name: "Running", value: running },
          ]);
        }
      } catch (err) {
        console.error("Analytics load failed", err);
        setData([
          { name: "Completed", value: 0 },
          { name: "Overdue", value: 0 },
          { name: "Running", value: 0 },
        ]);
      }
    };

    load();
  }, [teamId]);

  if (!data) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
      {/* PIE */}
      <div className="glass-card p-6">
        <h3 className="mb-2 text-white">Task Distribution</h3>

        {isDemo && (
          <p className="text-xs text-yellow-300 mb-2">
            ⚡ Sample insights shown until tasks are added
          </p>
        )}

        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* LINE */}
      <div className="glass-card p-6">
        <h3 className="mb-2 text-white">Task Trend</h3>

        {isDemo && (
          <p className="text-xs text-yellow-300 mb-2">
            📊 Demo trend based on typical team activity
          </p>
        )}

        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
