//PendingInvites.jsx

import React, { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";
import { useToast } from "./Toast";
import { useNavigate } from "react-router-dom";

function getUserFromStorage() {
  try {
    const raw = localStorage.getItem("user");
    if (raw) return JSON.parse(raw);
  } catch { /* empty */ }
  return null;
}

export default function PendingInvites({ user: userProp, compact = false, onSelectInvite = null }) {
  const toast = useToast();
  const navigate = useNavigate();
  const [user] = useState(userProp || getUserFromStorage());
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  /* ================= LOAD INVITES ================= */
  useEffect(() => {
    if (!user?.email) return;

    let mounted = true;

    async function fetchInvites() {
      setLoading(true);
      try {
        const res = await axiosClient.get(`/invites/pending?email=${encodeURIComponent(user.email)}`);
        if (!mounted) return;

        const list = res.data?.invites || [];
        setInvites(list);

        localStorage.setItem("pendingInvitesCount", String(list.length));
        window.dispatchEvent(new Event("pendingInvitesChanged"));
      } catch (err) {
        console.error("Failed to load invites", err);
        toast?.show("Failed to load invites", { type: "error" });
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchInvites();
    const poll = setInterval(fetchInvites, 30000);
    return () => {
      mounted = false;
      clearInterval(poll);
    };
  }, [user, toast]);

  /* ================= ACCEPT INVITE ================= */
  async function acceptInvite(inv) {
    if (!inv?.id || !user?.id) return;

    setActionLoading(inv.id);
    try {
      await axiosClient.post(`/invites/${inv.id}/accept`, { userId: user.id });
      setInvites((prev) => prev.filter((i) => i.id !== inv.id));
      toast?.show("Invite accepted ✅", { type: "success" });

      const cur = Math.max(0, parseInt(localStorage.getItem("pendingInvitesCount") || "1") - 1);
      localStorage.setItem("pendingInvitesCount", String(cur));
      window.dispatchEvent(new Event("pendingInvitesChanged"));
    } catch (err) {
      console.error("Accept failed", err);
      toast?.show("Accept failed ❌", { type: "error" });
    } finally {
      setActionLoading(null);
    }
  }

  /* ================= REJECT INVITE ================= */
  async function rejectInvite(inv) {
    if (!inv?.id) return;

    setActionLoading(inv.id);
    try {
      await axiosClient.post(`/invites/${inv.id}/reject`);
      setInvites((prev) => prev.filter((i) => i.id !== inv.id));
      toast?.show("Invite rejected ❌", { type: "success" });

      const cur = Math.max(0, parseInt(localStorage.getItem("pendingInvitesCount") || "1") - 1);
      localStorage.setItem("pendingInvitesCount", String(cur));
      window.dispatchEvent(new Event("pendingInvitesChanged"));
    } catch (err) {
      console.error("Reject failed", err);
      toast?.show("Reject failed ❌", { type: "error" });
    } finally {
      setActionLoading(null);
    }
  }

  if (!user) return null;

  /* ================= COMPACT ================= */
  if (compact) {
    return (
      <div className="glass-card invite-popover dashboard-glass">
        <strong>Pending Invites</strong>

        {loading && <div>Loading…</div>}
        {!loading && invites.length === 0 && <div>No pending invites.</div>}

        {invites.map((inv) => (
          <div key={inv.id} className="invite-row dashboard-glass">
            <div>
              <div>{inv.team_name}</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                Role: {inv.role}
              </div>
            </div>

            <div style={{ display: "flex", gap: 6 }}>
              <button disabled={actionLoading === inv.id} onClick={() => acceptInvite(inv)}>
                Accept
              </button>

              <button
                disabled={actionLoading === inv.id}
                onClick={() => rejectInvite(inv)}
                style={{ background: "#ef4444" }}
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  /* ================= FULL VIEW ================= */
  return (
    <div className="glass-card dashboard-glass" style={{ padding: 16 }}>
      <h3>Pending Invites</h3>

      {loading && <p>Loading invites…</p>}
      {!loading && invites.length === 0 && <p>No pending invites.</p>}

      <div className="pending-invites-list">

        {invites.map((inv) => (
          <div key={inv.id} className="glass-card dashboard-glass" style={{ padding: 12 }}>
            <strong>{inv.team_name}</strong>
            <div style={{ fontSize: 12, opacity: 0.7 }}>Role: {inv.role}</div>
            <div style={{ fontSize: 12, opacity: 0.6 }}>
              Sent: {new Date(inv.created_at).toLocaleString()}
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button disabled={actionLoading === inv.id} onClick={() => acceptInvite(inv)}>
                Accept & Join
              </button>

              <button
                disabled={actionLoading === inv.id}
                onClick={() => rejectInvite(inv)}
                style={{ background: "#ef4444" }}
              >
                Reject
              </button>

              <button onClick={() => (onSelectInvite ? onSelectInvite(inv) : navigate("/invites"))}>
                Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
