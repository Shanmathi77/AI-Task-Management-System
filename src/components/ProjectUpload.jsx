// frontend/src/pages/ProjectUpload.jsx
import React, { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";

export default function ProjectUpload() {
  const [file, setFile] = useState(null);
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [selectedId, setSelectedId] = useState(localStorage.getItem("selected_project_dataset") || "");

  async function fetchDatasets() {
    try {
      const res = await axiosClient.get("/projects/data");
      const ds = res?.data?.datasets ?? [];
      setDatasets(ds);
      if (!selectedId && ds.length) {
        setSelectedId(String(ds[0].id));
        try { localStorage.setItem("selected_project_dataset", String(ds[0].id)); } catch {/* empty */}
        window.dispatchEvent(new CustomEvent("dataset:changed", { detail: { id: ds[0].id } }));
      }
    } catch (err) {
      console.error("fetchDatasets failed", err);
      setDatasets([]);
    }
  }
    
  useEffect(() => { fetchDatasets(); }, );

  function onFileChange(e) {
    setFile(e.target.files?.[0] ?? null);
    setMsg(null);
  }
  
  async function upload() {
    if (!file) return setMsg({ type: "error", text: "Choose a file first" });
    setLoading(true); setMsg(null);

    try {
      const form = new FormData();
      // IMPORTANT: server expects field name "file"
      form.append("file", file);

      // Use axiosClient which should already have baseURL set; include credentials if needed
      const res = await axiosClient.post("/projects/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true
      });

      if (res?.data?.ok) {
        setMsg({ type: "success", text: `Upload success — ${res.data.dataset.rows_count} rows` });
        // update dataset list and auto-select
        await fetchDatasets();
        const newId = res.data.dataset.id;
        setSelectedId(newId);
        try { localStorage.setItem("selected_project_dataset", newId); } catch {/* empty */}
        // inform analytics & other parts
        window.dispatchEvent(new CustomEvent("projects:uploaded", { detail: { id: newId } }));
        window.dispatchEvent(new CustomEvent("dataset:changed", { detail: { id: newId } }));
      } else {
        setMsg({ type: "error", text: res?.data?.message || "Upload failed" });
      }
    } catch (err) {
      console.error("upload failed", err);
      const text = err?.response?.data?.message || err?.message || "Upload failed";
      setMsg({ type: "error", text });
    } finally {
      setLoading(false);
    }
  }

  async function chooseDataset(id) {
    setSelectedId(id);
    try { localStorage.setItem("selected_project_dataset", String(id)); } catch {/* empty */}
    window.dispatchEvent(new CustomEvent("dataset:changed", { detail: { id } }));
  }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: 18 }}>
      <h2>Upload Project Data</h2>

      <div className="glass-card" style={{ padding: 16, marginBottom: 12 }}>
        <div style={{ marginBottom: 8 }}>Select a CSV or Excel file (xls / xlsx)</div>
        <input type="file" name="file" accept=".csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={onFileChange} />
        <div style={{ marginTop: 12 }}>
          <button className="btn-primary" onClick={upload} disabled={loading || !file}>
            {loading ? "Uploading…" : "Upload"}
          </button>
          <span style={{ marginLeft: 12, color: msg?.type === "error" ? "#ff8b8b" : "#8bffb6" }}>{msg?.text}</span>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 12 }}>
        <h3 style={{ marginTop: 0 }}>Available datasets</h3>
        {datasets.length === 0 ? <div style={{ color: "var(--text-muted)" }}>No datasets uploaded yet.</div> : (
          <div style={{ display: "grid", gap: 8 }}>
            {datasets.map((d) => (
              <div key={d.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", padding: 8, borderRadius: 8 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{d.filename || d.id}</div>
                  <div style={{ color: "var(--text-muted)", fontSize: 13 }}>{new Date(d.uploaded_at).toLocaleString()} • {d.rows_count ?? 0} rows</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn-small" onClick={() => chooseDataset(d.id)}>{String(selectedId) === String(d.id) ? "Selected" : "Select"}</button>
                  <button className="btn-small" onClick={async () => {
                    try {
                      const res = await axiosClient.get(`/projects/data/${d.id}`);
                      alert(JSON.stringify(res.data.dataset.rows.slice(0,10), null, 2));
                    } catch (e) { console.error(e); alert("Failed to fetch dataset"); }
                  }}>Preview</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
