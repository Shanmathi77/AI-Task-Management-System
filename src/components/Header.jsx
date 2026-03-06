// frontend/src/components/Header.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { useToast } from "./Toast";

export default function Header() {
  const navigate = useNavigate();
  const toast = useToast();

  const [pendingCount, setPendingCount] = useState(() => {
    try {
      return Number(localStorage.getItem("pendingInvitesCount") || "0");
    } catch {
      return 0;
    }
  });

  const [running, setRunning] = useState(false);

  // ✅ NEW: active team name
  const [teamName, setTeamName] = useState("");

  // derive current user role safely
  const getUser = () => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  const user = getUser();
  const role = user?.role ?? null;
  const isLead = role === "team_lead";

  const roleLabel =
    role === "team_lead"
      ? "Team Lead"
      : role === "team_member"
      ? "Team Member"
      : "User";

  // ✅ NEW: load active team name
  async function loadTeamName() {
    try {
      const activeTeamId = localStorage.getItem("active_team_id");
      if (!activeTeamId) {
        setTeamName("");
        return;
      }

      const res = await axiosClient.get("/teams");
      const team = res.data?.teams?.find(
        (t) => String(t.id) === String(activeTeamId)
      );
      setTeamName(team?.name || "");
    } catch {
      setTeamName("");
    }
  }

  useEffect(() => {
    function onPendingChanged() {
      try {
        setPendingCount(
          Number(localStorage.getItem("pendingInvitesCount") || "0")
        );
      } catch {
        setPendingCount(0);
      }
    }

    window.addEventListener("pendingInvitesChanged", onPendingChanged);
    return () =>
      window.removeEventListener("pendingInvitesChanged", onPendingChanged);
  }, []);

  // ✅ NEW: listen for team switch
  useEffect(() => {
    loadTeamName();

    function onTeamSwitched() {
      loadTeamName();
    }

    window.addEventListener("team:switched", onTeamSwitched);
    return () =>
      window.removeEventListener("team:switched", onTeamSwitched);
  }, []);

  async function handleRunAIBatch() {
    if (!isLead) return;
    if (
      !confirm(
        "Run AI scoring for current active team? This will update task scores."
      )
    )
      return;

    setRunning(true);
    try {
      const teamId =
        Number(localStorage.getItem("active_team_id") || 0) || undefined;

      const res = await axiosClient.post(
        "/ai/score-batch/run-and-summary",
        teamId ? { teamId } : {}
      );

      if (res?.data?.ok) {
        const summary = res.data.summary ?? {};
        toast?.show?.(
          `AI run complete — processed ${
            summary.processed ?? summary.totalTasks ?? 0
          } tasks`,
          { type: "success" }
        );

        try {
          const payload = {
            tasks: res.data.tasks ?? [],
            suggestions:
              res.data.suggestions ?? summary.suggestions ?? [],
            ts: Date.now(),
          };
          localStorage.setItem("lastAiRun", JSON.stringify(payload));
        } catch {/*error*/}

        window.dispatchEvent(new Event("ai:done"));
      } else {
        toast?.show?.(res?.data?.message || "AI run failed", {
          type: "error",
        });
      }
    } catch (err) {
      console.error("Run AI error", err);
      toast?.show?.(
        err?.response?.data?.message ||
          err?.message ||
          "Network error",
        { type: "error" }
      );
    } finally {
      setRunning(false);
    }
  }

  function handleInviteClick() {
    navigate("/invite-management");
  }

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 20px",
        background: "rgba(255,255,255,0.02)",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      {/* ✅ UPDATED TITLE ONLY (no layout change) */}
      <Link
        to="/"
        style={{
          color: "white",
          textDecoration: "none",
          fontWeight: 800,
          fontSize: 18,
        }}
      >
        🚀 Welcome back, {roleLabel}
        {teamName && (
          <span style={{ color: "#3b82f6" }}> — {teamName}</span>
        )}
      </Link>

      <nav style={{ display: "flex", gap: 10, marginLeft: 8 }}>
        <Link to="/dashboard" className="nav-link">
          Dashboard
        </Link>
        <Link to="/tasks" className="nav-link">
          Tasks
        </Link>
        <Link to="/analytics" className="nav-link">
          Analytics
        </Link>
      </nav>

      <div
        style={{
          marginLeft: "auto",
          display: "flex",
          gap: 10,
          alignItems: "center",
        }}
      >
        <button
          title="Pending invites"
          onClick={() => navigate("/dashboard")}
          style={{
            background: "transparent",
            border: "none",
            color: "white",
            cursor: "pointer",
          }}
        >
          Invites{" "}
          <span style={{ marginLeft: 6, fontWeight: 700 }}>
            {pendingCount}
          </span>
        </button>

        {isLead && (
          <button
            onClick={handleInviteClick}
            className="btn-small"
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Invite
          </button>
        )}

        {isLead && (
          <button
            onClick={handleRunAIBatch}
            disabled={running}
            title="Run AI scoring for all tasks in active team"
            className="btn-small"
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              fontWeight: 700,
              cursor: "pointer",
              background: running
                ? "rgba(255,255,255,0.06)"
                : undefined,
            }}
          >
            {running ? "Running AI…" : "Run AI Batch"}
          </button>
        )}

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
            {user?.name ?? user?.email ?? "Guest"}
          </div>
        </div>
      </div>
    </header>
  );
}
