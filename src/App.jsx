// App.jsx
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Landing from "./pages/Landing";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import DashboardPage from "./pages/DashboardPage";
import TasksPage from "./pages/TasksPage";
import Analytics from "./pages/Analytics";
import Automations from "./pages/Automations";
import ProjectUpload from "./pages/ProjectUpload";
import CreateTeam from "./pages/CreateTeam";
import Invites from "./pages/Invites";
import AcceptInvite from "./pages/AcceptInvite";
import TeamManager from "./pages/TeamManager";
import LeadInvites from "./components/LeadInvites";

import DashboardLayout from "./layouts/DashboardLayout";
import socket from "./socket";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const [activeTeamId] = useState(() => {
  const v = localStorage.getItem("active_team_id");
  return v ? Number(v) : null;
});


  // Socket listener for task refresh
  useEffect(() => {
    socket.on("task:refresh", () => {
      window.dispatchEvent(new Event("task:refresh"));
    });
    return () => socket.off("task:refresh");
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/invite/accept/:inviteId" element={<AcceptInvite />} />

        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardLayout>
              <DashboardPage activeTeamId={activeTeamId} />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/tasks" element={
          <ProtectedRoute>
            <DashboardLayout>
              <TasksPage activeTeamId={activeTeamId} />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/analytics" element={
          <ProtectedRoute>
            <DashboardLayout>
              <Analytics activeTeamId={activeTeamId} />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/invites" element={
          <ProtectedRoute>
            <DashboardLayout>
              <Invites />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/teams/manage" element={
          <ProtectedRoute>
            <DashboardLayout>
              <TeamManager />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/projects/upload" element={
          <ProtectedRoute>
            <DashboardLayout>
              <ProjectUpload />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/automations" element={
          <ProtectedRoute>
            <DashboardLayout>
              <Automations activeTeamId={activeTeamId} />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        <Route
  path="/lead-invites"
  element={
    <ProtectedRoute>
      <DashboardLayout>
        <LeadInvites workspaceId={activeTeamId} />
      </DashboardLayout>
    </ProtectedRoute>
  }
/>


        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
