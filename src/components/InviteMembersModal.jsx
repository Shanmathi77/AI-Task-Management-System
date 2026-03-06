// frontend/src/components/InviteMembersModal.jsx
import React, { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";
import { useToast } from "./Toast";

/**
 * If `inline` prop is true -> render as inline card instead of overlay modal
 */
export default function InviteMembersModal({ workspaceId, open = false, onClose = () => {}, inline = false }) {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("team_member");
  const [busy, setBusy] = useState(false);
  const [invites, setInvites] = useState([]);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    if (open) {
      setError(""); setInfo(""); setEmail("");
      fetchInvites();
    }
    // eslint-disable-next-line
  }, [open, workspaceId]);

  async function fetchInvites() {
    if (!workspaceId) { setInvites([]); return; }
    try {
      const res = await axiosClient.get(`/workspaces/${workspaceId}/invites`);
      setInvites(res?.data?.invites ?? []);
    } catch (err) {
      console.error(err);
      setInvites([]);
    }
  }

  async function handleInvite(e) {
    e && e.preventDefault();
    setError(""); setInfo("");
    if (!workspaceId) { setError("Workspace not found"); return; }
    if (!email || !email.includes("@")) { setError("Please enter a valid email"); return; }

    setBusy(true);
    try {
      const res = await axiosClient.post(`/workspaces/${workspaceId}/invite`, { email: email.trim(), role });
      if (res?.data?.invite?.token) {
        const link = `${window.location.origin}/invite/${res.data.invite.token}`;
        setInfo(`Invite created. Link: ${link}`);
        toast.show("Invite created", { type: "success" });
      } else {
        toast.show("Invite created", { type: "success" });
      }
      setEmail("");
      await fetchInvites();
    } catch (err) {
      console.error("invite failed", err);
      setError(err?.response?.data?.message || err.message || "Invite failed");
      toast.show("Invite failed", { type: "error" });
    } finally { setBusy(false); }
  }

  async function handleRevoke(inv) {
    if (!workspaceId || !inv?.id) return;
    if (!confirm("Revoke this invite?")) return;
    try {
      await axiosClient.delete(`/workspaces/${workspaceId}/invite/${inv.id}`);
      toast.show("Invite revoked", { type: "success" });
      fetchInvites();
    } catch (err) {
      console.warn("revoke failed", err);
      toast.show("Revoke failed", { type: "error" });
    }
  }

  if (!open) return null;

  const card = (
    <div style={{
      width: "100%",
      background: "var(--glass-bg)",
      border: "1px solid var(--glass-border)",
      borderRadius: 12,
      padding: 16,
      boxShadow: "0 18px 50px rgba(0,0,0,0.6)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <h3 style={{ margin: 0 }}>Invite team members</h3>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Send invite links to add people to this workspace.</div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-small" onClick={onClose}>Close</button>
        </div>
      </div>

      <form onSubmit={handleInvite} style={{ marginTop: 12, display: "flex", gap: 12, alignItems: "center" }}>
        <input type="email" placeholder="team.member@company.com" value={email} onChange={(e) => setEmail(e.target.value)}
          style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", color: "white" }} required />
        <select value={role} onChange={(e) => setRole(e.target.value)} style={{ width: 170, padding: 10, borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", color: "white" }}>
          <option value="team_member">Team Member</option>
          <option value="team_lead">Team Lead</option>
          <option value="ai_module">AI Module</option>
        </select>

        <button type="submit" className="btn-primary" disabled={busy} style={{ padding: "10px 14px" }}>
          {busy ? "Inviting…" : "Invite"}
        </button>
      </form>

      {error && <div style={{ color: "#ff9b9b", marginTop: 10 }}>{error}</div>}
      {info && <div style={{ color: "#ffd66b", marginTop: 10 }}>{info}</div>}

      <div style={{ marginTop: 18 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Pending / Recent Invites</div>
        {invites.length === 0 ? (
          <div style={{ color: "var(--text-muted)" }}>No invites yet.</div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {invites.map(inv => (
              <div key={inv.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", padding: 10, borderRadius: 8, background: "rgba(255,255,255,0.02)" }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{inv.email}</div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{inv.role} • invited {inv.created_at ? new Date(inv.created_at).toLocaleString() : ""}</div>
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ fontSize: 13, color: inv.accepted ? "var(--text-muted)" : "#ffd66b" }}>{inv.accepted ? "Accepted" : "Pending"}</div>
                  {!inv.accepted && <button className="btn-small" onClick={() => handleRevoke(inv)}>Revoke</button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (inline) {
    return card;
  }

  // fallback modal overlay (kept for backward compatibility)
  return (
    <div style={{ position: "fixed", inset: 0, display: "grid", placeItems: "center", background: "rgba(0,0,0,0.45)", zIndex: 1200, padding: 16 }}>
      {card}
    </div>
  );
}
