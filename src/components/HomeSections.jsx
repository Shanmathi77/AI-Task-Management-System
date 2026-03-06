import React, { useMemo } from "react";
import "./HomeSections.css";

export default function HomeSections() {
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const teamId = localStorage.getItem("active_team_id") || "N/A";
  const role = user?.role || "team_member";

  const roleMessages = {
    admin: "You manage teams and workflows. Keep your organization thriving!",
    team_lead: "You’re leading tasks and tracking progress. Lead your team to success!",
    team_member: "Here are your assigned tasks and priorities. Let's achieve more today!",
  };

  const motivationalQuotes = {
    admin: "Manage, inspire, and innovate — your team counts on you!",
    team_lead: "Lead with clarity, delegate smartly, and watch your team shine!",
    team_member: "Focus, collaborate, and complete tasks to boost your productivity!",
  };

  return (
    <div className="home-sections space-y-10">

      {/* ================= WELCOME HERO ================= */}
      <section className="glass-card p-8 dashboard-glass home-welcome">
        <h1 className="text-3xl font-bold mb-4">
          🚀 Welcome back, <span className="capitalize">{role.replace("_", " ")}</span>!
        </h1>
        <p className="text-white/70 mb-4">
          You’re working in <strong>Team {teamId}</strong>. {roleMessages[role]}
        </p>

        <div className="motivational-box p-4 rounded-xl border border-white/10 bg-gradient-to-r from-blue-500/20 to-purple-500/20">
          <p className="text-white/80 font-medium">{motivationalQuotes[role]}</p>
          <p className="text-xs text-white/50 mt-2">
            AI insights and tips will update as your tasks progress.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="tip-card">📌 Review pending tasks</div>
          <div className="tip-card">⚡ Prioritize high-impact items</div>
          <div className="tip-card">🚀 Check team analytics</div>
        </div>

        <div className="flex gap-3 flex-wrap mt-4">
          <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-sm">🏢 Team {teamId}</span>
          <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 text-sm">Role: {role}</span>
          <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-300 border border-green-400/30 text-sm">✅ Tasks assigned: {user?.assignedTasks || 0}</span>
        </div>
      </section>

      {/* ================= WHY CHOOSE US ================= */}
      {/* Will add interactive cards next */}

      {/* ================= PROBLEMS & FAQ ================= */}
      {/* Will add after "Why Choose Us" */}
    </div>
  );
}
