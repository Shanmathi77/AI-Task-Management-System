// frontend/src/components/RunAiButton.jsx
import React, { useState } from "react";
import axiosClient from "../api/axiosClient";

export default function RunAiButton({ sprintId = null, onSuccess = () => {}, className = "" }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const safePost = axiosClient.safePost ? axiosClient.safePost : (p, b) =>
    axiosClient.post(axiosClient.normalizePath ? axiosClient.normalizePath(p) : p, b);

  async function runBatch() {
    setError("");
    if (loading) return;
    setLoading(true);
    try {
      const body = sprintId ? { sprintId, persist: true } : { persist: true };

      // Try common endpoints in fallbacks
      let res = null;
      try {
        res = await safePost("/ai/score-batch", body);
      } catch  {
        try {
          res = await safePost("/ai/score-batch/run-and-summary", body);
        } catch (e2) {
          // Try alternative endpoint
          res = await safePost("/ai/score-batch/run-and-summary", body).catch(() => { throw e2; });
        }
      }

      const payload = (res && res.data) ? res.data : res;
      onSuccess(payload);
    } catch (err) {
      console.error("Run AI batch failed:", err);
      const msg = err?.response?.data?.message ?? err?.message ?? "Failed to run AI batch";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`run-ai-button ${className}`} style={{ display: "inline-block" }}>
      <button onClick={runBatch} className="btn-primary" disabled={loading} style={{ minWidth: 160 }}>
        {loading ? "Running AI..." : "Run AI Score Batch"}
      </button>
      {error && <div style={{ marginTop: 8, color: "#ff8b8b" }}>{error}</div>}
    </div>
  );
}
