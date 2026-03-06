// frontend/src/components/DashboardStats.jsx
import React, { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const COLORS = ["#4f46e5", "#10b981", "#f97316", "#ef4444"]; // primary, success, orange, danger

export default function DashboardStats({ teamId }) {
  const [metrics, setMetrics] = useState({ total:0, completed:0, overdue:0, todo:0, inProgress:0, totalTime:0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const q = teamId ? `?teamId=${teamId}` : "";
        const res = await axiosClient.get(`/analytics${q}`).catch(() => null);
        const analytics = res?.data?.analytics ?? {};
        if (!mounted) return;
        setMetrics({
          total: analytics.total || 0,
          completed: analytics.completed || 0,
          overdue: analytics.overdue || 0,
          todo: analytics.todo || 0,
          inProgress: analytics.inProgress || 0,
          totalTime: analytics.totalTime || 0
        });
      } catch (e) {
        console.error("Load analytics failed", e);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted=false; };
  }, [teamId]);

  const pieData = [
    { name: "Completed", value: metrics.completed },
    { name: "In Progress", value: metrics.inProgress },
    { name: "Todo", value: metrics.todo },
    { name: "Overdue", value: metrics.overdue },
  ];

  const barData = [
    { name: "Tasks", Completed: metrics.completed, Todo: metrics.todo, "In Progress": metrics.inProgress, Overdue: metrics.overdue },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 16, alignItems: "start" }}>
      <div className="glass-card" style={{ padding: 14 }}>
        <div style={{ fontWeight: 800, fontSize: 18 }}>Overview</div>
        <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
          <div style={{ display:"flex", justifyContent:"space-between" }}><div style={{color:"var(--text-muted)"}}>Total Tasks</div><div style={{fontWeight:800}}>{metrics.total}</div></div>
          <div style={{ display:"flex", justifyContent:"space-between" }}><div style={{color:"var(--text-muted)"}}>Completed</div><div style={{fontWeight:800}}>{metrics.completed}</div></div>
          <div style={{ display:"flex", justifyContent:"space-between" }}><div style={{color:"var(--text-muted)"}}>Overdue</div><div style={{fontWeight:800}}>{metrics.overdue}</div></div>
          <div style={{ display:"flex", justifyContent:"space-between" }}><div style={{color:"var(--text-muted)"}}>My Running</div><div style={{fontWeight:800}}>{/* you can pass running value from time endpoint if needed */}0</div></div>
          <div style={{ marginTop: 8, color: "var(--text-muted)", fontSize: 13 }}>Total hours logged: <b>{metrics.totalTime}</b></div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 800 }}>Visuals</div>
          <div style={{ color: "var(--text-muted)", fontSize: 13 }}>{loading ? "Loading…" : "Updated"}</div>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <div style={{ width: 280, height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie dataKey="value" data={pieData} innerRadius={44} outerRadius={80} paddingAngle={4} label>
                  {pieData.map((entry, index) => <Cell key={`c-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={{ flex: 1, height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Completed" stackId="a" />
                <Bar dataKey="In Progress" stackId="a" />
                <Bar dataKey="Todo" stackId="a" />
                <Bar dataKey="Overdue" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
