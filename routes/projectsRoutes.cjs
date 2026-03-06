// backend/routes/projectsRoutes.cjs
// Add this file and ensure server.cjs mounts it (your server already tries to mount /api/projects/upload)
const express = require("express");
const multer = require("multer");
const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");

module.exports = (db = {}, PG_POOL = null) => {
  const router = express.Router();
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB

  // Ensure in-memory arrays exist
  db.project_data = db.project_data || [];
  router.use((req, res, next) => next());

  // POST /api/projects/upload
  // Field name MUST be "file"
  router.post("/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ ok: false, message: "No file uploaded. Use field name 'file' in FormData" });
      }

      // Parse buffer with xlsx (works for csv/xls/xlsx)
      let rows = [];
      try {
        const wb = XLSX.read(req.file.buffer, { type: "buffer", cellDates: true });
        const firstSheetName = wb.SheetNames && wb.SheetNames[0];
        if (!firstSheetName) rows = [];
        else {
          const sheet = wb.Sheets[firstSheetName];
          rows = XLSX.utils.sheet_to_json(sheet, { defval: null });
        }
      } catch (e) {
        // fallback: try simple CSV parse by splitting lines (very small files)
        const txt = req.file.buffer.toString("utf8");
        const lines = txt.split(/\r?\n/).filter(Boolean);
        if (lines.length) {
          const headers = lines[0].split(/,|\t/).map(h => h.trim());
          rows = lines.slice(1).map(l => {
            const parts = l.split(/,|\t/);
            const obj = {};
            headers.forEach((h, i) => obj[h || `col${i+1}`] = parts[i] ?? null);
            return obj;
          });
        } else rows = [];
      }

      // Create dataset object and persist into in-memory DB
      const id = `proj-${Date.now()}`;
      const dataset = {
        id,
        filename: req.file.originalname || `upload-${id}`,
        uploaded_at: new Date().toISOString(),
        rows_count: Array.isArray(rows) ? rows.length : 0,
        // DO NOT store huge "rows" in short listing; keep rows separate but we will store for in-memory convenience
      };

      // Persist (in-memory)
      db.project_data = db.project_data || [];
      db.project_data.unshift({ id, filename: dataset.filename, uploaded_at: dataset.uploaded_at, rows_count: dataset.rows_count, rows });

      // Optional: also persist file to disk for debugging (safe path inside backend/uploads)
      try {
        const uploadsDir = path.join(process.cwd(), "uploads");
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
        const safeName = `${Date.now()}-${dataset.filename.replace(/[^\w.\-]/g, "_")}`;
        fs.writeFileSync(path.join(uploadsDir, safeName), req.file.buffer);
      } catch (e) { /* ignore disk write errors */ }

      return res.json({ ok: true, dataset: { id: dataset.id, filename: dataset.filename, uploaded_at: dataset.uploaded_at, rows_count: dataset.rows_count }, rows });
    } catch (err) {
      console.error("POST /projects/upload error", err);
      return res.status(500).json({ ok: false, message: "Upload failed", error: String(err?.message || err) });
    }
  });

  // GET /api/projects/data  -> list datasets (rows_count only)
  router.get("/data", (req, res) => {
    try {
      const list = (db.project_data || []).map(d => ({ id: d.id, filename: d.filename, uploaded_at: d.uploaded_at, rows_count: d.rows_count }));
      return res.json({ ok: true, datasets: list });
    } catch (err) {
      console.error("GET /projects/data error", err);
      return res.status(500).json({ ok: false, message: "Failed to list datasets" });
    }
  });

  // GET /api/projects/data/:id -> full dataset + rows
  router.get("/data/:id", (req, res) => {
    try {
      const id = String(req.params.id || "");
      const found = (db.project_data || []).find(d => String(d.id) === id);
      if (!found) return res.status(404).json({ ok: false, message: "Not found" });
      return res.json({ ok: true, dataset: { id: found.id, filename: found.filename, uploaded_at: found.uploaded_at, rows: found.rows, rows_count: found.rows_count } });
    } catch (err) {
      console.error("GET /projects/data/:id error", err);
      return res.status(500).json({ ok: false, message: "Failed" });
    }
  });

  // GET /api/projects  (USED BY ProjectUpload.jsx)
router.get("/", (req, res) => {
  const list = (db.project_data || []).map(d => ({
    id: d.id,
    filename: d.filename,
    uploaded_at: d.uploaded_at,
    rows_count: d.rows_count
  }));
  res.json({ ok: true, datasets: list });
});


  return router;
};
