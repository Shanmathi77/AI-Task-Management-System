import React, { useEffect, useRef, useState } from "react";
import "./rocket.css";
import Starfield from "./Starfield";
import launchSound from "/assets/launch.mp3";

// Role-based messages
const ROLE_MESSAGES = {
  admin: [
    "Admin engine starting 🚀",
    "Syncing permissions ⚡",
    "Loading dashboard controls 🧰",
    "Almost ready… 🌌",
  ],
  user: [
    "Igniting AI engines 🚀",
    "Optimizing your workflow ⚡",
    "Aligning tasks 🧠",
    "Almost there… 🌌",
  ],
  guest: [
    "Welcome guest 🚀",
    "Preparing your experience ⚡",
    "Almost ready… 🌌",
  ],
};

export default function RocketIntro({ onFinish, role = "user" }) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  const [msgIndex, setMsgIndex] = useState(0);
  const [percent, setPercent] = useState(1);
  const [rocketHidden, setRocketHidden] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  const messages = ROLE_MESSAGES[role] || ROLE_MESSAGES["user"];

  useEffect(() => {
    videoRef.current?.play();

    const audio = audioRef.current;
    if (audio) {
      audio.volume = 0;
      audio.play().catch(() => {});
      const fade = setInterval(() => {
        audio.volume = Math.min(audio.volume + 0.06, 1);
      }, 70);
      setTimeout(() => clearInterval(fade), 900);
    }

    const msgTimer = setInterval(
      () => setMsgIndex((m) => (m + 1) % messages.length),
      800
    );

    const percentTimer = setInterval(() => {
      setPercent((p) => {
        if (p >= 100) {
          clearInterval(percentTimer);
          setRocketHidden(true);
          setTimeout(() => setShowDashboard(true), 700);
          setTimeout(() => { 
            onFinish();
         }, 2200);
          return 100;
        }
        return p + 2.5;
      });
    }, 30);

    return () => {
      clearInterval(msgTimer);
      clearInterval(percentTimer);
    };
  }, [onFinish, messages]);

  const x = percent * 0.9;
  const y = -Math.pow(percent, 1.05) * 1.1;

  const glowFactor = 1 + percent / 150;

  return (
    <>
      <div className="rocket-stage">
        <Starfield glowFactor={glowFactor} />

        {/* SPOTLIGHT TRAIL */}
        <div
          className="rocket-trail"
          style={{
            transform: rocketHidden
              ? `translate(${x + 50}vw, ${y - 50}vh) rotate(-55deg)`
              : `translate(${x - 30}vw, ${y + 15}vh) rotate(-55deg)`,
            opacity: rocketHidden ? 0 : percent > 3 && percent < 100 ? 1 : 0,
          }}
        />

        {/* ROCKET VIDEO */}
        <video
          ref={videoRef}
          src="/assets/rocket.webm"
          className="rocket-video"
          style={{
            transform: rocketHidden
              ? `translate(${x + 50}vw, ${y - 50}vh) rotate(-55deg)`
              : `translate(${x}vw, ${y}vh)`,
            opacity: rocketHidden ? 0 : 1,
          }}
          playsInline
          muted
        />

        {/* MASK */}
        <div
          className="rocket-mask"
          style={{ opacity: rocketHidden ? 0 : 1 }}
        />

        <audio ref={audioRef} src={launchSound} preload="auto" />

        {/* LOADING UI */}
        <div className="loading-panel">
          <h1>{messages[msgIndex]}</h1>
          <div className="progress">{Math.floor(percent)}%</div>
        </div>
      </div>

      {/* PAGE FLIP DASHBOARD */}
      <div className={`page-flip ${showDashboard ? "show" : ""}`}>
        {/* Replace this with your actual dashboard */}
        <h1>Dashboard Loaded!</h1>
      </div>
    </>
  );
}
