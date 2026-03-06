// frontend/src/components/TimeTracker.jsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import axiosClient from "../api/axiosClient";

/**
 * TimeTracker component
 * Props:
 *  - taskId (number)
 *  - initialHours (number)
 *  - runningTaskId (number|null)
 *  - onStarted(taskId)
 *  - onStopped(taskId)
 */
export default function TimeTracker({
  taskId,
  initialHours = 0,
  runningTaskId = null,
  onStarted = () => {},
  onStopped = () => {}
}) {
  const [busy, setBusy] = useState(false);
  const [trackedSeconds, setTrackedSeconds] = useState(
    Math.round(Number(initialHours || 0) * 3600)
  );
  const [runningLog, setRunningLog] = useState(null);

  const tickRef = useRef(null);
  const mountedRef = useRef(false);
  const loadingRef = useRef(false);

  // safe axios helpers


  const safePost = axiosClient.safePost
    ? axiosClient.safePost
    : (p, b) => axiosClient.post(axiosClient.normalizePath ? axiosClient.normalizePath(p) : p, b);

  // format seconds
  const fmtSec = (sec) => {
    sec = Math.max(0, Math.round(sec || 0));
    const hh = Math.floor(sec / 3600);
    const mm = Math.floor((sec % 3600) / 60);
    const ss = sec % 60;
    return `${hh}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  };

  // load logs
  const load = useCallback(async () => {
  if (!taskId || loadingRef.current) return {};
  loadingRef.current = true;

  const safeGet = axiosClient.safeGet
    ? axiosClient.safeGet
    : (p) =>
        axiosClient.get(
          axiosClient.normalizePath ? axiosClient.normalizePath(p) : p
        );

  try {
    const res = await safeGet(`/tasks/${encodeURIComponent(taskId)}/time`);
    const payload = res?.data ?? {};

    const logs = Array.isArray(payload.logs)
      ? payload.logs
      : Array.isArray(payload.time_logs)
      ? payload.time_logs
      : [];

    const open = logs.find(l => l.end_time === null || l.endTime === null);
    if (mountedRef.current) setRunningLog(open || null);

    let totalSec = 0;
    for (const l of logs) {
      if (l.duration_minutes != null) {
        totalSec += Number(l.duration_minutes) * 60;
      } else if (l.start_time && l.end_time) {
        totalSec += (new Date(l.end_time) - new Date(l.start_time)) / 1000;
      }
    }

    if (open?.start_time) {
      totalSec += (Date.now() - new Date(open.start_time)) / 1000;
    }

    if (mountedRef.current) setTrackedSeconds(Math.round(totalSec));
  } catch (err) {
    console.warn("TimeTracker.load failed", err);
  } finally {
    loadingRef.current = false;
  }
}, [taskId]);


  // initial load + cleanup
  useEffect(() => {
    mountedRef.current = true;
    load();

    return () => {
      mountedRef.current = false;
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [taskId, load]);

  // start timer
  async function handleStart() {
    if (!taskId || busy) return;
    if (runningTaskId && runningTaskId !== taskId) {
      alert("Another timer is already running");
      return;
    }

    setBusy(true);
    try {
      const res = await safePost(`/tasks/${taskId}/time/start`, {});
      const payload = res?.data;

      if (payload?.ok) {
        onStarted(taskId);
        await load();
        tickRef.current = setInterval(
          () => setTrackedSeconds(prev => prev + 1),
          1000
        );
      }
    } catch  {
      alert("Start failed");
    } finally {
      setBusy(false);
    }
  }

  // stop timer
  async function handleStop() {
    if (!taskId || busy) return;

    setBusy(true);
    try {
      const res = await safePost(`/tasks/${taskId}/time/stop`, {});
      const payload = res?.data;

      if (payload?.ok) {
        if (tickRef.current) {
          clearInterval(tickRef.current);
          tickRef.current = null;
        }
        onStopped(taskId);
        await load();
      }
    } catch  {
      alert("Stop failed");
    } finally {
      setBusy(false);
    }
  }

  // react to external runningTaskId
  useEffect(() => {
    if (runningTaskId && runningTaskId !== taskId) {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
      setRunningLog(null);
      load();
    }
  }, [runningTaskId, taskId, load]);

  const isRunning = !!runningLog;

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
      <div style={{ fontSize: 13 }}>
        Tracked: {fmtSec(trackedSeconds)}
      </div>

      {isRunning ? (
        <button className="cta-secondary" onClick={handleStop} disabled={busy}>
          {busy ? "Stopping..." : "Stop"}
        </button>
      ) : (
        <button
          className="btn-primary"
          onClick={handleStart}
          disabled={busy || (runningTaskId && runningTaskId !== taskId)}
        >
          {busy ? "Starting..." : "Start"}
        </button>
      )}
    </div>
  );
}
