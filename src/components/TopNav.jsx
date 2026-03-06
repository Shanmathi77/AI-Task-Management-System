// frontend/src/components/TopNav.jsx
import React from "react";
import { FiRefreshCw, FiLogOut } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

export default function TopNav({ summary = {}, onRefresh = () => {} }) {
  const nav = useNavigate();

  function handleLogout() {
    localStorage.removeItem("token");
    // optional: clear other saved state
    nav("/login");
  }

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "10px 12px",
      borderRadius: 12,
      background: "linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))",
      border: "1px solid var(--glass-border)"
    }}>
      <div style={{ fontWeight: 800, fontSize: 16 }}>AI Sprint Manager</div>

      <div style={{ display: "flex", gap: 10, marginLeft: 12, alignItems: "center" }}>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Total: <strong style={{ marginLeft: 6 }}>{summary?.total_tasks ?? "—"}</strong></div>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Completed: <strong style={{ marginLeft: 6 }}>{summary?.completed_tasks ?? "—"}</strong></div>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Overdue: <strong style={{ marginLeft: 6, color: "var(--accent-yellow)" }}>{summary?.overdue_tasks ?? "—"}</strong></div>
      </div>

      <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
        <button className="btn-small" onClick={onRefresh} title="Refresh summary">
          <FiRefreshCw size={16} />
        </button>

        <button className="btn-primary" onClick={() => window.location.href = "/tasks"} style={{ minWidth: 110 }}>
          Open Tasks
        </button>

        <button className="btn-small" onClick={handleLogout} title="Sign out" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <FiLogOut size={16} />
          <span style={{ fontSize: 13 }}>Sign out</span>
        </button>
      </div>
    </div>
  );
}
