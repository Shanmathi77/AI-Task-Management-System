//TimerButton.jsx 

import { useEffect, useState, useRef } from "react";
import axiosClient from "../api/axiosClient";

export default function TimerButton({
  taskId,
  onStarted,
  onStopped,
}) {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);

  /* ================= LOAD TIMER ================= */
  useEffect(() => {
    axiosClient.safeGet(`/tasks/${taskId}/time`).then((res) => {
      setSeconds(res.data.seconds || 0);
      setRunning(res.data.running || false);
    });
  }, [taskId]);

  /* ================= LIVE TICK ================= */
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [running]);

  /* ================= ACTIONS ================= */
  const start = async () => {
  if (!taskId) return;

  try {
    await axiosClient.safePost(`/tasks/${taskId}/time/start`);
    setRunning(true);
    onStarted?.();
  } catch (err) {
    console.error("Start timer failed", err);
    setRunning(false);
  }
};


const pause = async () => {
  if (!taskId) return;
  await axiosClient.safePost(`/tasks/${taskId}/time/pause`);
  setRunning(false);
};

const stop = async () => {
  if (!taskId) return;
  await axiosClient.safePost(`/tasks/${taskId}/time/stop`);
  setRunning(false);
  onStopped?.();
};


  /* ================= UI ================= */
  return (
    <div className="timer-box">
      <span className="timer-text">
        {new Date(seconds * 1000).toISOString().substr(11, 8)}
      </span>

      {!running && (
        <button onClick={start} className="btn-start">
          Start
        </button>
      )}

      {running && (
        <button onClick={pause} className="btn-pause">
          Pause
        </button>
      )}

      <button onClick={stop} className="btn-stop">
        Stop
      </button>
    </div>
  );
}
