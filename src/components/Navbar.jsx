// src/components/Navbar.jsx
import React from "react";

export default function Navbar() {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 className="app-name">AI Task Manager</h1>
      </div>
      <div className="topbar-right">
        <button className="btn-small">Profile</button>
      </div>
    </header>
  );
}
