// frontend/src/components/AIInsights.jsx
import React, { useEffect, useState , useCallback} from "react";
import axiosClient from "../api/axiosClient";

/**
 * AIInsights
 * Props:
 *  - sprintId (optional) : number
 *  - className (optional)
 *  - onAction(action) optional callback invoked when user clicks an action button
 */
export default function AIInsights({ sprintId = null, className = "", onAction }) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  const loadSuggestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = sprintId ? `/ai/suggestions?sprintId=${sprintId}` : `/ai/suggestions`;
      const res = await axiosClient.get(url);
      if (res && res.data && res.data.ok) {
        setSuggestions(res.data.suggestions || []);
        setSummary(res.data.summary || null);
      } else {
        setError(res?.data?.message || "Failed to load insights");
      }
    } catch (err) {
      console.error("AIInsights load error", err);
      setError(err?.response?.data?.message || err.message || "Network error");
    } finally {
      setLoading(false);
    }
  },[sprintId]);

  useEffect(() => {
    loadSuggestions();
    // optional: refresh every X seconds — comment out if not desired
    // const id = setInterval(loadSuggestions, 30_000);
    // return () => clearInterval(id);
  }, [loadSuggestions]);

  function handleActionClick(action) {
    // Give calling page a chance to handle action (reassign modal, show focus list, etc.)
    if (onAction) return onAction(action);
    // fallback basic behaviors:
    if (action.kind === "focusList") {
      // open new window with filtered tasks? for now, alert
      alert(`Focus on tasks: ${action.taskIds.join(", ")}`);
    } else if (action.kind === "suggestReassign") {
      alert(`Suggest reassign from: ${action.from}`);
    } else if (action.kind === "assignList") {
      alert(`Assign tasks: ${action.taskIds.join(", ")}`);
    } else {
      console.log("AI action:", action);
    }
  }

  return (
    <aside className={`bg-white border rounded-lg p-3 shadow-sm ${className}`} aria-live="polite">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">AI Insights</h3>
        <div className="text-xs text-gray-500">{summary ? `${summary.total} tasks` : ""}</div>
      </div>

      {loading && <div className="text-xs text-gray-500">Loading insights…</div>}
      {error && (
        <div className="text-xs text-red-600">
          Error: {error}
          <button className="ml-2 text-indigo-600 underline" onClick={loadSuggestions}>Retry</button>
        </div>
      )}

      {!loading && !error && suggestions.length === 0 && (
        <div className="text-xs text-gray-500">No suggestions right now — sprint looks balanced.</div>
      )}

      <div className="space-y-2">
        {suggestions.map((s, i) => (
          <div key={i} className="p-3 border rounded-md bg-gray-50">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-medium">{s.type?.toUpperCase()}</div>
                <div className="text-xs text-gray-700 mt-1">{s.text}</div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {/* Primary action(s) */}
                {s.action && (
                  <button
                    onClick={() => handleActionClick(s.action)}
                    className="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    Take action
                  </button>
                )}
                <button onClick={() => navigator.clipboard && navigator.clipboard.writeText(s.text)}
                        className="text-xs text-gray-500 underline">Copy</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <button onClick={loadSuggestions} className="px-3 py-1 text-xs border rounded">Refresh</button>
        <div className="text-xs text-gray-400">Updated: {loading ? "…" : new Date().toLocaleTimeString()}</div>
      </div>
    </aside>
  );
}
