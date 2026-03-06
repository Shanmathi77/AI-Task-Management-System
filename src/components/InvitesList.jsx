import React, { useEffect, useState } from "react";

export default function InvitesList() {
  const [invites, setInvites] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) return;

    const fetchInvites = async () => {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const userId = payload.id;

      try {
        const res = await fetch(`/api/users/${userId}/invites`, {
          headers: { Authorization: "Bearer " + token },
        });
        const data = await res.json();
        setInvites(data.invites || []);
      } catch (err) {
        console.error("Error fetching invites:", err);
      }
    };

    fetchInvites();
  }, [token]);

  const acceptInvite = async (inviteToken) => {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const userId = payload.id;

    try {
      const res = await fetch("/api/invites/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ token: inviteToken, userId }),
      });
      const data = await res.json();
      alert(data.message || "Invite accepted!");
      setInvites((prev) =>
        prev.map((inv) =>
          inv.token === inviteToken ? { ...inv, accepted: true } : inv
        )
      );
    } catch (err) {
      console.error("Error accepting invite:", err);
      alert("Failed to accept invite");
    }
  };

  if (!invites.length) return null;

  return (
    <div
      style={{
        padding: "20px",
        background: "#141414",
        borderRadius: "12px",
        marginBottom: "20px",
      }}
    >
      <h2 style={{ marginBottom: "10px" }}>Pending Invites</h2>
      {invites.map((inv) => (
        <div
          key={inv.token}
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "8px",
          }}
        >
          <span>
            {inv.workspace_name || `Workspace #${inv.workspace_id}`}
          </span>
          {!inv.accepted ? (
            <button
              style={{
                marginLeft: "12px",
                padding: "4px 10px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                background: "#ff6f00",
                color: "#0b0b0b",
                fontWeight: 600,
              }}
              onClick={() => acceptInvite(inv.token)}
            >
              Accept
            </button>
          ) : (
            <span
              style={{
                marginLeft: "12px",
                color: "green",
                fontWeight: 600,
              }}
            >
              Accepted
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
