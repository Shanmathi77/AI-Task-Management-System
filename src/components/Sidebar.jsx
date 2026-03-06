// frontend/src/components/Sidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import { FiGrid, FiList, FiClock, FiBarChart2, FiLogOut } from "react-icons/fi";

export default function Sidebar() {
  return (
    <aside className="sidebar" style={{ padding: 12 }}>
      <div className="brand" style={{ marginBottom: 12 }}>
        <div className="brand-title" style={{ fontWeight: 800 }}>ShaSy AI</div>
      </div>

      <nav className="sidebar-nav" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <NavLink to="/dashboard" className="nav-item" style={{ display: "flex", gap: 10, alignItems: "center", padding: 8 }}>
          <FiGrid size={18} /> <span>Dashboard</span>
        </NavLink>

        <NavLink to="/tasks" className="nav-item" style={{ display: "flex", gap: 10, alignItems: "center", padding: 8 }}>
          <FiList size={18} /> <span>Tasks</span>
        </NavLink>

        <a className="nav-item" href="#sprints" style={{ display: "flex", gap: 10, alignItems: "center", padding: 8 }}>
          <FiClock size={18} /> <span>Sprints</span>
        </a>

        <a className="nav-item" href="#analytics" style={{ display: "flex", gap: 10, alignItems: "center", padding: 8 }}>
          <FiBarChart2 size={18} /> <span>Analytics</span>
        </a>
      </nav>

      <div style={{ marginTop: 12 }}>
        <button className="logout-btn btn-small" style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <FiLogOut size={16} /> <span>Logout</span>
        </button>
        <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-muted)" }}>© {new Date().getFullYear()} ShaSy AI</div>
      </div>
    </aside>
  );
}
