// frontend/src/components/ReassignModal.jsx
import React, { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";

/**
 * ReassignModal
 * Props:
 *  - open: boolean
 *  - onClose: () => void
 *  - task: object (the task to reassign)
 *  - onReassigned: (updatedTask) => void
 */
export default function ReassignModal({ open, onClose, task, onReassigned }) {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [freeTextName, setFreeTextName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setSelectedUserId(null);
    setFreeTextName("");
    setError(null);

    // Try fetch users list; if your API doesn't have /users, this will fail and we fallback
    (async () => {
      setLoadingUsers(true);
      try {
        const res = await axiosClient.get("/users");
        if (res && res.data && Array.isArray(res.data.users)) {
          setUsers(res.data.users);
        } else if (res && res.data && Array.isArray(res.data)) {
          setUsers(res.data);
        } else {
          setUsers([]);
        }
      } catch (err) {
        console.warn("ReassignModal: /users fetch failed, falling back to free-text", err);
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    })();
  }, [open]);

  useEffect(() => {
    // preselect current assignee if present
    if (task && users.length) {
      const match = users.find(u => u.id === task.assigneeId || u.id === task.assignee_id);
      if (match) setSelectedUserId(match.id);
    }
  }, [users, task]);

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      // prefer selectedUserId; otherwise send assignedToName via freeText
      if (selectedUserId) {
        //const payload = { assigneeId: selectedUserId };
        // adapt to your backend: it accepts assignee_id or assignedToName; we try both forms
        const res = await axiosClient.patch(`/tasks/${task.id}`, { assigneeId: selectedUserId });
        if (res && res.data && res.data.ok) {
          if (onReassigned) onReassigned(res.data.task);
          onClose();
          return;
        }
      }

      if (freeTextName) {
        // backend supports assignedToName on update per our controller
        const res2 = await axiosClient.patch(`/tasks/${task.id}`, { assignedToName: freeTextName });
        if (res2 && res2.data && res2.data.ok) {
          if (onReassigned) onReassigned(res2.data.task);
          onClose();
          return;
        }
      }

      throw new Error("No assignee selected or backend update failed");
    } catch (err) {
      console.error("Reassign save error", err);
      setError(err?.response?.data?.message || err.message || "Failed to reassign");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={() => onClose()} />
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md p-4 z-10">
        <h3 className="text-lg font-semibold mb-2">Reassign Task</h3>
        <div className="text-sm text-gray-700 mb-3">{task?.title}</div>

        {loadingUsers ? (
          <div className="text-sm text-gray-500">Loading users…</div>
        ) : (
          <>
            {users.length > 0 ? (
              <div className="mb-3">
                <label className="text-xs text-gray-600">Pick a team member</label>
                <select
                  value={selectedUserId || ""}
                  onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full mt-1 border rounded px-2 py-1"
                >
                  <option value="">— Select member —</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name} {u.email ? `(${u.email})` : ""}</option>)}
                </select>
              </div>
            ) : (
              <div className="mb-3">
                <label className="text-xs text-gray-600">Assignee name (free text)</label>
                <input value={freeTextName} onChange={e=>setFreeTextName(e.target.value)} className="w-full mt-1 border rounded px-2 py-1" placeholder="e.g. Syed" />
                <div className="text-xs text-gray-500 mt-1">No users endpoint — using name lookup on server.</div>
              </div>
            )}
          </>
        )}

        {error && <div className="text-sm text-red-600 mb-2">{error}</div>}

        <div className="flex justify-end gap-2 mt-3">
          <button onClick={() => onClose()} className="px-3 py-1 border rounded">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-3 py-1 bg-indigo-600 text-white rounded">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
