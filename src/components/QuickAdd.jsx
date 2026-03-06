// frontend/src/components/QuickAdd.jsx
import React, { useState } from "react";
import axiosClient from "../api/axiosClient";

export default function QuickAdd({ onCreated = () => {} }) {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const activeTeamId = Number(localStorage.getItem("active_team_id"));

  const handleCreate = async () => {
    if (!title.trim()) return;

    if (!activeTeamId) {
      alert("Select a team first");
      return;
    }

    setLoading(true);

    try {
      const res = await axiosClient.post("/tasks", {
        title: title.trim(),
        teamId: activeTeamId,   // ✅ FIXED (was team_id)
        status: "pending",
      });

      if (res.data?.ok && res.data.task) {
        onCreated(res.data.task); // instant UI update
        setTitle("");
      }
    } catch (err) {
      console.error("QuickAdd error", err);
      alert("Failed to add task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <input
        className="input-glass"
        placeholder="Quick add task title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        disabled={loading}
      />
      <button
        className="btn-primary"
        onClick={handleCreate}
        disabled={loading}
      >
        {loading ? "Adding..." : "Add"}
      </button>
    </div>
  );
}
