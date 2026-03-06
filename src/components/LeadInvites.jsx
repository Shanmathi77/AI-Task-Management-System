//src/somponents/LeadInvites.jsx

import React, { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";

export default function LeadInvites({ workspaceId }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("team_member");
  const [invites, setInvites] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    if (workspaceId) loadSentInvites();
    // eslint-disable-next-line
  }, [workspaceId]);

  async function loadSentInvites() {
    const res = await axiosClient.get(
      `/invites/sent?team_id=${workspaceId}`
    );
    setInvites(res.data?.invites || []);
  }

  async function sendInvite(e) {
    e.preventDefault();
    if (!email) return;

    setBusy(true);
    try {
      await axiosClient.post("/invites", {
        email: email.trim(),
        team_id: workspaceId,
        role,
        invited_by: user.id,
      });

      setEmail("");
      setMsg("✅ Invite sent successfully");
      loadSentInvites();
      window.dispatchEvent(new Event("invite:new"));
    // eslint-disable-next-line no-unused-vars
    } catch (e) {
      setMsg("❌ Invite failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold mb-3">
        Lead: Invite Members
      </h3>

      {msg && <div className="mb-3 text-sm">{msg}</div>}

      <form
        onSubmit={sendInvite}
        className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-4"
      >
        <input
          className="input-glass md:col-span-2"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <select
          className="input-glass"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="team_member">Team Member</option>
          <option value="team_lead">Team Lead</option>
        </select>

        <button
          type="submit"
          className="btn-small"
          disabled={busy}
        >
          Invite
        </button>
      </form>

      {invites.length === 0 ? (
        <div className="text-white/60">No invites.</div>
      ) : (
        invites.map((inv) => (
          <div
            key={inv.id}
            className="flex justify-between items-center p-3 mb-2 rounded-lg bg-white/5"
          >
            <div>
              <div>{inv.email}</div>
              <div className="text-xs opacity-60">
                {inv.role} •{" "}
                {new Date(inv.created_at).toLocaleString()}
              </div>

              {inv.status === "accepted" && (
                <div className="text-xs text-green-400">
                  Accepted{" "}
                  {inv.accepted_at &&
                    `at ${new Date(inv.accepted_at).toLocaleString()}`}
                </div>
              )}
            </div>

            <span className="text-xs">{inv.status}</span>
          </div>
        ))
      )}
    </div>
  );
}
