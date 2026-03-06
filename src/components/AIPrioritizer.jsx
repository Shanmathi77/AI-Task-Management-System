// frontend/src/components/AIPrioritizer.jsx
import React, { useState } from "react";
import axiosClient from "../api/axiosClient";

export default function AIPrioritizer({ onDone, onError, className = "" }) {
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("");

  const safePost = axiosClient.safePost ? axiosClient.safePost : (p, b) =>
    axiosClient.post(axiosClient.normalizePath ? axiosClient.normalizePath(p) : p, b);

  async function runPrioritizer() {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please sign in first");
        return;
      }

      setRunning(true);
      setMessage("Running AI prioritizer...");
      localStorage.setItem("aiRunning", "true");
      window.dispatchEvent(new CustomEvent("ai:running", { detail: { running: true } }));

      // Try the specific endpoint that backend stub supports first
      let res = null;
      try {
        res = await safePost("/ai/score-batch/run-and-summary", { persist: true });
      } catch (e) {
        // Fallback to older endpoint if present
        try {
          res = await safePost("/ai/score-batch", { persist: true });
        } catch  {
          throw e; // original error
        }
      }

      const payload = res?.data ?? res ?? {};
      const tasks = payload.tasks ?? payload.scored ?? [];
      const suggestions = payload.suggestions ?? payload.scores ?? [];
      const summary = payload.summary ?? payload;

      try {
        localStorage.setItem("lastAiRun", JSON.stringify({ tasks, suggestions, summary, ts: Date.now() }));
      } catch (err){
        console.warn("Failed to cache AT run", err);
      }

      window.dispatchEvent(new CustomEvent("ai:done", { detail: { running: false, payload } }));
      localStorage.removeItem("aiRunning");
      setMessage("AI prioritization complete.");

      if (onDone) onDone(summary, suggestions, tasks);
    } catch (err) {
      console.error("AI Prioritizer error", err);
      setMessage("AI run failed — check console");
      localStorage.removeItem("aiRunning");
      window.dispatchEvent(new CustomEvent("ai:done", { detail: { running: false, error: err } }));
      if (onError) onError(err);
    } finally {
      setRunning(false);
      setTimeout(() => setMessage(""), 2500);
    }
  }

  return (
    <div className={`ai-prioritizer ${className}`} style={{ display: "inline-block" }}>
      <button
        onClick={runPrioritizer}
        disabled={running}
        className={`btn-primary ${running ? "opacity-60 cursor-wait" : ""}`}
        style={{ padding: "8px 14px", borderRadius: 10, fontWeight: 700 }}
      >
        {running ? "Running…" : "Run AI Prioritizer"}
      </button>
      {message && <div style={{ marginTop: 8, fontSize: 13, color: "#dcdcdc" }}>{message}</div>}
    </div>
  );
}
