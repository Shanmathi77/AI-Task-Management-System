// frontend/src/components/AcceptInviteDebug.jsx
import React, { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";

export default function AcceptInviteDebug() {
  const [invites, setInvites] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error("No local token - sign in first");
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.id;
      const res = await axiosClient.get(`/users/${userId}/invites`);
      if (res?.data?.ok) setInvites(res.data.invites || []);
      else { setInvites([]); setError(res?.data?.message || "No invites"); }
    } catch (e) {
      console.error(e);
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  async function accept(inv) {
    try {
      await axiosClient.post("/invites/accept", { token: inv.token, userId: JSON.parse(atob(localStorage.getItem('token').split('.')[1])).id });
      // refresh
      load();
    } catch (e) {
      alert("Accept failed — check console");
      console.error(e);
    }
  }

  if (loading) return <div className="glass-card" style={{ padding: 12, width: 320 }}>Checking invites…</div>;
  return (
    <div className="glass-card" style={{ padding: 12, width: 320 }}>
      <h3 style={{ marginTop: 0 }}>AcceptInviteDebug</h3>
      {error && <div style={{ color: "salmon" }}>{error}</div>}
      {!invites || invites.length === 0 ? (
        <div style={{ color: "var(--text-muted)" }}>No invites found.</div>
      ) : invites.map(inv => (
        <div key={inv.id} style={{ padding: 8, borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
          <div><strong>{inv.workspace_name ?? `Workspace #${inv.workspace_id}`}</strong></div>
          <div style={{ fontSize: 12 }}>{inv.email} • {inv.role}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Invited: {new Date(inv.created_at).toLocaleString()}</div>
          <div style={{ marginTop: 6, display: "flex", gap: 8 }}>
            <a href={inv.acceptUrl} target="_blank" rel="noopener noreferrer" className="btn-sm">Open acceptUrl</a>
            <button onClick={() => accept(inv)} className="btn-sm">Accept</button>
            <button onClick={() => { navigator.clipboard?.writeText(inv.acceptUrl); alert("URL copied"); }} className="btn-sm">Copy URL</button>
          </div>
        </div>
      ))}
    </div>
  );
}
