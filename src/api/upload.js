// frontend/src/api/upload.js
import axios from "axios";

/**
 * uploadFile(file, onProgress)
 * - file: File object from <input type="file">
 * - onProgress: optional callback(percent) for progress updates
 *
 * returns response.data from backend
 */
export async function uploadFile(file, onProgress) {
  if (!file) throw new Error("file required");
  const fd = new FormData();
  fd.append("file", file); // MUST be "file" (server expects this)

  const res = await axios.post("http://127.0.0.1:4000/api/projects/upload", fd, {
    headers: { "Content-Type": "multipart/form-data" },
    withCredentials: true,
    onUploadProgress: (ev) => {
      if (!onProgress) return;
      try {
        const pct = ev.total ? Math.round((ev.loaded / ev.total) * 100) : 0;
        onProgress(pct);
      } catch  { /* ignore */ }
    },
    timeout: 120000 // 2 minutes for large files
  });

  return res.data;
}
