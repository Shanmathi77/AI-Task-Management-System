// frontend/src/components/TopScoredPanel.jsx
import React, { useEffect, useState } from "react";

/**
 * TopScoredPanel
 * - Accepts `data` which may contain { tasks: [...], suggestions: [...], ts, ... }
 * - Very defensive: never renders raw objects as React children.
 * - onClose (optional) called when user closes the panel.
 */
export default function TopScoredPanel({ data, onClose: parentClose }) {
  const ts = data?.ts ?? null;
  const storageKey = "lastAiPanelClosedForTs";

  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!data) return;

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored && ts && Number(stored) === Number(ts)) {
        setVisible(false);
      } else {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, [ts, data]);

  // 🚨 SAFE early return AFTER hooks
  if (!data || !visible) return null;

  const tasks = Array.isArray(data.tasks) ? data.tasks : [];
  const suggestions = Array.isArray(data.suggestions) ? data.suggestions : [];

  const getScore = (t) => {
    const raw =
      t?.priority_score ??
      t?.priorityScore ??
      t?.score ??
      t?.value ??
      "—";
    if (raw === null || raw === undefined) return "—";
    return String(raw);
  };

  const dateLabel = ts ? new Date(ts).toLocaleString() : null;

  function close() {
    setVisible(false);
    try {
      if (ts) localStorage.setItem(storageKey, String(ts));
    } catch {/*error*/}
    if (parentClose) parentClose();
  }

  const renderSuggestion = (s, idx) => {
    if (s == null)
      return (
        <div key={idx} style={{ opacity: 0.7 }}>
          —
        </div>
      );

    if (typeof s === "string" || typeof s === "number") {
      return (
        <div key={idx} style={{ marginBottom: 6 }}>
          {String(s)}
        </div>
      );
    }

    try {
      const taskId = s.taskId ?? s.id ?? s.task_id ?? null;
      const taskTitle =
        s.taskTitle ?? s.title ?? s?.task?.title ?? null;
      const reason =
        s.reason ?? s.text ?? s.message ?? s.msg ?? "";
      const score =
        s.score ??
        s.priority_score ??
        s.priorityScore ??
        s.value ??
        null;

      return (
        <div
          key={idx}
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            marginBottom: 6,
          }}
        >
          <div style={{ fontWeight: 700 }}>
            {taskTitle || (taskId ? `Task #${taskId}` : "Suggestion")}
          </div>

          <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>
            {reason || "—"}
          </div>

          {score != null && (
            <div style={{ marginLeft: "auto", fontWeight: 700 }}>
              {typeof score === "number"
                ? score.toFixed(2)
                : String(score)}
            </div>
          )}
        </div>
      );
    } catch {
      return (
        <div key={idx} style={{ marginBottom: 6 }}>
          [Unsupported suggestion]
        </div>
      );
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        right: 18,
        bottom: 18,
        width: 340,
        maxHeight: "60vh",
        overflowY: "auto",
        zIndex: 9999,
        background: "rgba(6,10,15,0.95)",
        color: "white",
        borderRadius: 12,
        boxShadow: "0 8px 30px rgba(0,0,0,0.6)",
        padding: 12,
        fontSize: 13,
        lineHeight: 1.3,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <strong>Last AI Run</strong>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {dateLabel && <small>{dateLabel}</small>}
          <button
            onClick={close}
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "white",
              cursor: "pointer",
              padding: "4px 6px",
              borderRadius: 6,
            }}
          >
            ✕
          </button>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 6 }}>
          Top Scored Tasks
        </div>

        {tasks.length === 0 ? (
          <div style={{ opacity: 0.7 }}>No tasks returned</div>
        ) : (
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            {tasks
              .slice()
              .sort(
                (a, b) =>
                  Number(getScore(b)) - Number(getScore(a))
              )
              .slice(0, 5)
              .map((t) => (
                <li key={t.id ?? t.title}>
                  <div style={{ fontWeight: 600 }}>
                    {t.title ?? `Task #${t.id}`}
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>
                    Score: {getScore(t)}
                  </div>
                </li>
              ))}
          </ol>
        )}
      </div>

      {suggestions.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 6 }}>
            AI Suggestions
          </div>
          {suggestions.map((s, i) => (
            <div
              key={i}
              style={{
                borderBottom:
                  "1px solid rgba(255,255,255,0.03)",
                paddingBottom: 8,
              }}
            >
              {renderSuggestion(s, i)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
